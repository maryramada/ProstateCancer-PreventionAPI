"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var userModel = require("../models/user");
var patientModel = require("../models/patient");
var physicianModel = require("../models/physician");
var VerifyToken = require("../auth/VerifyToken");
var router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
// rota para testar - GET http://localhost:8080/med)
router.get('/', function (req, res) {
    res.json({ message: 'Bem vindo ao BlueCheck!!' });
});
// Rota para registar um utilizador - POST http://localhost:8080/med/Register/User
router.post('/Register/User', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, email, password, isAdmin } = req.body; // Extrair as variáveis do corpo da requisição
            // Criar uma nova instância do utilizador recorrendo ao modelo
            var newUser = new userModel({
                name,
                email,
                password,
                isAdmin
            });
            // Gravar o utilizador na base de dados
            yield newUser.save();
            res.status(201).json({ message: 'Utilizador registado com sucesso!', utilizador: newUser });
        }
        catch (err) {
            res.status(500).json({ error: 'Erro do servidor' });
        }
    });
});
// Rota para registar um médico - POST http://localhost:8080/med/Register/Physician
router.post('/Register/Physician', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { specialty, user, phone, availability } = req.body;
            // Criar uma nova instância do médico recorrendo ao modelo
            var newPhisycian = new physicianModel({
                specialty,
                user,
                phone,
                availability
            });
            // Gravar o novo médico na base de dados
            yield newPhisycian.save();
            res.status(201).json({ message: 'Médico registado com sucesso!', physician: newPhisycian });
        }
        catch (err) {
            res.status(500).json({ error: 'Erro do servidor' });
        }
    });
});
// Rota para registar um paciente - POST http://localhost:8080/med/Register/Patient
router.post('/Register/Patient', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { physician, user, formAnswers } = req.body;
            // Criar uma nova instância do paciente recorrendo ao modelo
            var newPatient = new patientModel({
                physician,
                user,
                formAnswers
            });
            // Gravar o novo paciente na base de dados
            yield newPatient.save();
            res.status(201).json({ message: 'Paciente registado com sucesso!', patient: newPatient });
        }
        catch (err) {
            res.status(500).json({ error: 'Erro do servidor' });
        }
    });
});
// Rota para realizar o login (todos os utilizadores) - POST http://localhost:8080/med/login
router.post('/login', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email e password são obrigatórios.' });
            }
            const user = yield userModel.findOne({ email, password }).exec();
            if (!user) {
                return res.status(401).json({ success: false, message: 'Email ou password incorretos.' });
            }
            const payload = { user: user.email, userId: user._id };
            const token = jwt.sign(payload, 'InfMed_20232024', { expiresIn: 86400 });
            let userType = 'unknown';
            let physicianId = null;
            if (user.isAdmin === true) {
                userType = 'admin';
            }
            else {
                const physicianEntry = yield physicianModel.findOne({ user: user._id }).exec();
                if (physicianEntry) {
                    userType = 'physician';
                    physicianId = physicianEntry._id;
                }
                else {
                    const patientEntry = yield patientModel.findOne({ user: user._id }).exec();
                    if (patientEntry) {
                        userType = 'patient';
                    }
                }
            }
            return res.json({
                success: true,
                message: 'Login efetuado com sucesso!',
                token: token,
                userId: user._id,
                userType: userType,
                physicianId: physicianId
            });
        }
        catch (error) {
            console.error('Erro ao efetuar login:', error);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
        }
    });
});
router.get('/physician/patients', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.userId;
    const physician = yield physicianModel.findOne({ user: userId });
    if (!physician)
        return res.status(404).json({ message: 'Médico não encontrado' });
    const patients = yield patientModel.find({ physician: physician._id })
        .populate('user', 'name email');
    return res.json({ patients });
}));
// Rota para alterar a palavra-passe do utilizador - PUT http://localhost:8080/med/change-password/:userId
router.put('/change-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, currentPassword, newPassword } = req.body;
        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Email, password atual e nova são obrigatórios.' });
        }
        const user = yield userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        // comparar direto, pois senha está em texto simples
        if (currentPassword !== user.password) {
            return res.status(401).json({ message: 'Password atual incorreta.' });
        }
        // atualizar senha (texto simples, sem hash)
        user.password = newPassword;
        yield user.save();
        res.json({ message: 'Password alterada com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao alterar password:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
}));
//Rota para obter os dados do user atual após login
// GET /med/user/:id
router.get('/user/:id', VerifyToken, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.params.id;
            const user = yield userModel.findById(userId).select('-password'); // nunca envies a password
            if (!user)
                return res.status(404).json({ message: 'Utilizador não encontrado' });
            res.json({ user });
        }
        catch (err) {
            console.error('Erro ao obter utilizador:', err);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
});
// Rota para obter o paciente pelo userId - GET /med/patients/user/:userId
router.get('/patients/user/:userId', VerifyToken, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.params.userId;
            const patient = yield patientModel.findOne({ user: userId })
                .populate('user', 'name email')
                .exec();
            if (!patient) {
                return res.status(404).json({ message: 'Paciente não encontrado' });
            }
            res.json({ patient });
        }
        catch (err) {
            console.error('Erro ao obter paciente por userId:', err);
            res.status(500).json({ message: 'Erro do servidor.' });
        }
    });
});
// Rota para obter o médico pelo userId - GET /med/physicians/user/:userId
router.get('/physicians/user/:userId', VerifyToken, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.params.userId;
            const physician = yield physicianModel.findOne({ user: userId }).exec();
            if (!physician) {
                return res.status(404).json({ message: 'Médico não encontrado' });
            }
            res.json({ physicianId: physician._id });
        }
        catch (err) {
            console.error('Erro ao obter médico por userId:', err);
            res.status(500).json({ message: 'Erro do servidor.' });
        }
    });
});
router.get('/physicians', VerifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const physicians = yield physicianModel.find().populate('user', 'name');
        res.json(physicians);
    }
    catch (err) {
        console.error('Erro ao obter médicos:', err);
        res.status(500).json({ message: 'Erro do servidor.' });
    }
}));
router.get('/physicians/specialty/:specialty', VerifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const specialty = decodeURIComponent(req.params.specialty); // ← garante que está correto
        const physicians = yield physicianModel.find({ specialty }).populate('user');
        res.json(physicians);
    }
    catch (err) {
        res.status(500).json({ message: 'Erro ao buscar médicos' });
    }
}));
// Rota para responder ao questionário - PUT http://localhost:8080/med/patients/questionnaire/:patient_id
router.put('/patients/questionnaire/:patient_id', VerifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patient = yield patientModel.findById(req.params.patient_id).exec();
        if (!patient)
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        // 1. Atualiza respostas
        patient.formAnswers = req.body.formAnswers;
        // 2. Limpa alertas antigos do paciente
        patient.alerts = [];
        // 3. Limpa alertas antigos do médico
        const physician = yield physicianModel.findById(patient.physician).exec();
        if (!physician)
            return res.status(404).json({ message: 'Médico não encontrado.' });
        physician.alerts = physician.alerts.filter((a) => String(a.patientId) !== String(patient._id));
        // 4. Gera NOVOS alertas (lista de *strings*)
        const novos = yield generateAlerts(patient.formAnswers);
        // 5. Adiciona sequencialmente
        novos.forEach((msg, idx) => {
            const alertObj = { alertNumber: idx + 1, message: msg };
            patient.alerts.push(alertObj);
            physician.alerts.push(Object.assign(Object.assign({}, alertObj), { patientId: patient._id }));
        });
        // 6. Persiste alterações
        yield patient.save();
        yield physician.save();
        return res.json({ message: 'Questionário e alertas atualizados.', alerts: novos });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro interno.' });
    }
}));
// Rota para remover utilizadores da base de dados (apenas o adminsitrador pode aceder a esta rota) - DELETE http://localhost:8080/med/DeleteUser/:user_id
router.delete('/DeleteUser/:userId', VerifyToken, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield hasRole(req.userEmail, 'administrator')) {
            try {
                const deletedUser = yield userModel.findByIdAndDelete(req.params.userId);
                console.log('User autenticado:', req.userEmail);
                if (!deletedUser) {
                    return res.status(404).json({ message: 'Utilizador não encontrado' });
                }
                res.json({ message: 'Utilizador removido com sucesso' });
            }
            catch (error) {
                console.error('Erro ao remover utilizador:', error);
                res.status(500).json({ message: 'Erro do servidor.' });
            }
        }
        else {
            return res.status(403).send({ auth: false, token: null, message: 'Não tem autorização!' });
        }
    });
});
// Rota para listar todos os utilizadores - GET http://localhost:8080/med/ListUsers
router.get('/ListUsers', VerifyToken, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const isAdmin = yield hasRole(req.userEmail, 'administrator');
        if (!isAdmin) {
            return res.status(405).json({ message: 'Não tem permissão!' });
        }
        try {
            const users = yield userModel.find().exec();
            console.log(users);
            if (users.length === 0) {
                return res.status(404).json({ message: 'Nenhum utilizador encontrado.' });
            }
            res.json(users);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro do servidor!' });
        }
    });
});
function hasRole(userEmail, role) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield userModel.findOne({ email: userEmail }).exec();
        if (!user) {
            return false;
        }
        console.log(user.isAdmin);
        if ((role === 'administrator' && user.isAdmin === true) || (role === 'physician' && user.isAdmin === false)) {
            return true;
        }
        return false;
    });
}
router.get('/ListPatients/:physicianId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const physId = req.params.physicianId;
        const patients = yield patientModel.find({ physician: physId })
            .populate('user', 'name email') // aqui faz o join com os dados do utilizador
            .exec();
        res.json({ patients });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pacientes' });
    }
}));
// Rota para obter o médico pelo userId - GET /med/physicians/user/:userId
router.get('/physicians/user/:userId', VerifyToken, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.params.userId;
            const physician = yield physicianModel.findOne({ user: userId }).exec();
            if (!physician) {
                return res.status(404).json({ message: 'Médico não encontrado' });
            }
            res.json({ physicianId: physician._id });
        }
        catch (err) {
            console.error('Erro ao obter médico por userId:', err);
            res.status(500).json({ message: 'Erro do servidor.' });
        }
    });
});
// Rota: GET /patients/:patientId
router.get('/patients/:patientId', VerifyToken, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const patientId = req.params.patientId;
            const patient = yield patientModel.findById(patientId)
                .populate('user', 'name email')
                .exec();
            if (!patient) {
                return res.status(404).json({ message: 'Paciente não encontrado' });
            }
            res.json({ patient });
        }
        catch (err) {
            console.error('Erro ao obter paciente por patientId:', err);
            res.status(500).json({ message: 'Erro do servidor.' });
        }
    });
});
router.get('/physicians/:physicianId', VerifyToken, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const physicianId = req.params.physicianId;
            const physician = yield physicianModel.findById(physicianId).exec();
            if (!physician)
                return res.status(404).json({ message: 'Médico não encontrado' });
            res.json({ physician });
        }
        catch (err) {
            res.status(500).json({ message: 'Erro do servidor.' });
        }
    });
});
// Rota para enviar os alertas para o médico e para os pacientes - POST http://localhost:8080/med/send/alerts
function normalizeMessage(msg) {
    return msg.trim().toLowerCase();
}
router.post('/send/alerts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { patientId } = req.body;
        if (!patientId) {
            return res.status(400).json({ message: 'patientId é obrigatório.' });
        }
        const patient = yield patientModel.findById(patientId).exec();
        if (!patient)
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        const physician = yield physicianModel.findById(patient.physician).exec();
        if (!physician)
            return res.status(404).json({ message: 'Médico não encontrado.' });
        const formAnswers = {
            personalInfo: ((_a = patient.formAnswers) === null || _a === void 0 ? void 0 : _a.personalInfo) || {},
            medicalHistory: ((_b = patient.formAnswers) === null || _b === void 0 ? void 0 : _b.medicalHistory) || { comorbidities: [] },
            lifestyle: ((_c = patient.formAnswers) === null || _c === void 0 ? void 0 : _c.lifestyle) || {},
            familyHistory: ((_d = patient.formAnswers) === null || _d === void 0 ? void 0 : _d.familyHistory) || {},
        };
        const novosAlertas = yield generateAlerts(formAnswers);
        // Remover duplicados antigos de patient.alerts (baseado em mensagem normalizada)
        const uniquePatientAlertsMap = new Map();
        patient.alerts.forEach((alert) => {
            const key = normalizeMessage(alert.message);
            if (!uniquePatientAlertsMap.has(key)) {
                uniquePatientAlertsMap.set(key, alert);
            }
        });
        patient.alerts = Array.from(uniquePatientAlertsMap.values());
        // Remover duplicados antigos de physician.alerts para esse paciente
        const uniquePhysicianAlertsMap = new Map();
        physician.alerts = physician.alerts.filter((alert) => String(alert.patientId) === String(patient._id)
            ? true
            : true // mantém alertas de outros pacientes, veja mais abaixo como lidar
        );
        physician.alerts.forEach((alert) => {
            if (String(alert.patientId) === String(patient._id)) {
                const key = normalizeMessage(alert.message);
                if (!uniquePhysicianAlertsMap.has(key)) {
                    uniquePhysicianAlertsMap.set(key, alert);
                }
            }
        });
        // Mantém alertas de outros pacientes + únicos para este paciente
        const outrosAlertas = physician.alerts.filter((alert) => String(alert.patientId) !== String(patient._id));
        physician.alerts = [...outrosAlertas, ...Array.from(uniquePhysicianAlertsMap.values())];
        // Criar sets normalizados para comparação
        const mensagensPacienteExistentes = new Set(patient.alerts.map((a) => normalizeMessage(a.message)));
        const mensagensMedicoExistentes = new Set(physician.alerts
            .filter((a) => String(a.patientId) === String(patient._id))
            .map((a) => normalizeMessage(a.message)));
        // Adicionar novos alertas apenas se forem inéditos
        const alertasAdicionados = [];
        novosAlertas.forEach((mensagem) => {
            const msgNorm = normalizeMessage(mensagem);
            if (!mensagensPacienteExistentes.has(msgNorm)) {
                patient.alerts.push({
                    alertNumber: patient.alerts.length + 1,
                    message: mensagem,
                });
                mensagensPacienteExistentes.add(msgNorm);
                alertasAdicionados.push(mensagem);
            }
            if (!mensagensMedicoExistentes.has(msgNorm)) {
                physician.alerts.push({
                    alertNumber: physician.alerts.length + 1,
                    patientId: patient._id,
                    message: mensagem,
                });
                mensagensMedicoExistentes.add(msgNorm);
            }
        });
        yield patient.save();
        yield physician.save();
        return res.json({
            message: 'Alertas atualizados com sucesso.',
            alertsGerados: novosAlertas,
        });
    }
    catch (error) {
        console.error('Erro ao enviar alertas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
}));
function generateAlerts(patient) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const alerts = [];
        const age = (_b = (_a = patient.personalInfo) === null || _a === void 0 ? void 0 : _a.age) !== null && _b !== void 0 ? _b : 0;
        const gender = (_d = (_c = patient.personalInfo) === null || _c === void 0 ? void 0 : _c.gender) !== null && _d !== void 0 ? _d : '';
        const comorbidities = (_f = (_e = patient.medicalHistory) === null || _e === void 0 ? void 0 : _e.comorbidities) !== null && _f !== void 0 ? _f : [];
        const exercisesRegularly = (_g = patient.lifestyle) === null || _g === void 0 ? void 0 : _g.exercisesRegularly;
        const smokes = (_h = patient.lifestyle) === null || _h === void 0 ? void 0 : _h.smokes;
        const familyCancer = (_j = patient.familyHistory) === null || _j === void 0 ? void 0 : _j.cancer;
        const familyHeart = (_k = patient.familyHistory) === null || _k === void 0 ? void 0 : _k.heartDisease;
        if (age > 65 && comorbidities.includes('diabetes')) {
            alerts.push('Recorrer ao programa de controle glicêmico em idosos.');
        }
        if (age > 50 && gender === 'Masculino' && familyHeart && !exercisesRegularly) {
            if (comorbidities.includes('diabetes') && comorbidities.includes('hipertensão')) {
                alerts.push('Risco cardiovascular muito elevado. Avaliação cardíaca prioritária!');
            }
            else if (comorbidities.includes('diabetes')) {
                alerts.push('Risco cardiovascular alto. Avaliação cardíaca recomendada.');
            }
            else if (comorbidities.length > 0) {
                alerts.push('Risco cardiovascular moderado. Avaliação cardíaca necessária.');
            }
            else {
                alerts.push('Sem comorbidades relacionadas a risco cardiovascular elevado.');
            }
        }
        if (age > 40 && familyCancer && smokes) {
            alerts.push('Realizar exames de rastreio para cancro frequentemente.');
        }
        if (age > 40 && !exercisesRegularly) {
            if (comorbidities.length === 0 && !familyHeart) {
                alerts.push('Iniciar programa de exercícios físicos moderados.');
            }
            else {
                alerts.push('Iniciar programa de exercícios prescritos após avaliação médica.');
            }
        }
        if (age > 50 && age <= 65 && comorbidities.length > 0) {
            alerts.push('Incluir o paciente na fila prioritária de vacinas contra gripe.');
        }
        if (comorbidities.includes('diabetes') && familyHeart) {
            alerts.push('Controle rígido de glicose e avaliações cardíacas regulares.');
        }
        if (age > 50 && familyCancer) {
            alerts.push('Recomenda-se dieta rica em fibras e antioxidantes.');
        }
        if (age > 50 && smokes && comorbidities.includes('DPOC')) {
            alerts.push('Avaliação pulmonar detalhada necessária.');
        }
        return alerts;
    });
}
router.delete('/alerts/clear/:patientId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const patient = yield patientModel.findById(patientId).exec();
        if (!patient)
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        const physician = yield physicianModel.findById(patient.physician).exec();
        if (!physician)
            return res.status(404).json({ message: 'Médico não encontrado.' });
        // Limpa alertas do paciente
        patient.alerts = [];
        // Remove alertas desse paciente da lista do médico
        physician.alerts = physician.alerts.filter((alert) => String(alert.patientId) !== String(patient._id));
        yield patient.save();
        yield physician.save();
        return res.json({ message: 'Alertas apagados com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao apagar alertas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
}));
// DELETE /med/patients/:id/alerts
router.delete('/patients/:id/alerts', VerifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🗑️  DELETE /patients/:id/alerts called for ID =', req.params.id);
    try {
        const patient = yield patientModel.findById(req.params.id).exec();
        if (!patient)
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        patient.alerts = [];
        yield patient.save();
        const physician = yield physicianModel.findById(patient.physician).exec();
        if (physician) {
            physician.alerts = physician.alerts.filter((a) => String(a.patientId) !== String(patient._id));
            yield physician.save();
        }
        return res.json({ message: 'Todos os alertas apagados.', patient });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao apagar alertas.' });
    }
}));
// ─── 3) APAGAR UM ALERTA ESPECÍFICO ─────────────────────────────────────────
router.delete('/patients/:id/alerts/:alertIndex', VerifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, alertIndex } = req.params;
        const patient = yield patientModel.findById(id).exec();
        if (!patient)
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        patient.alerts.splice(Number(alertIndex), 1);
        yield patient.save();
        const physician = yield physicianModel.findById(patient.physician).exec();
        if (physician) {
            physician.alerts = physician.alerts.filter((a) => !(String(a.patientId) === String(id) &&
                a.alertNumber === Number(alertIndex) + 1));
            yield physician.save();
        }
        return res.json({ message: 'Alerta apagado.', patient });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao apagar alerta.' });
    }
}));
// Rota para atualizar nome, email e password do paciente - PUT http://localhost:8080/med/patients/update/:user_id
router.put('/patients/update/:user_id', VerifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Update recebido para user_id:', req.params.user_id);
    console.log('Corpo recebido:', req.body);
    try {
        const data = req.body.updatedData;
        if (!data) {
            return res.status(400).json({ success: false, message: 'Dados para atualização não enviados.' });
        }
        const updateFields = {};
        if (data.name)
            updateFields.name = data.name;
        if (data.email)
            updateFields.email = data.email;
        if (data.password) {
            const hashedPassword = yield bcrypt.hash(data.password, 10);
            updateFields.password = hashedPassword;
        }
        console.log('Campos para atualizar:', updateFields);
        const updatedUser = yield userModel.findByIdAndUpdate(req.params.user_id, updateFields, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }
        console.log('Usuário atualizado:', updatedUser);
        res.json({ success: true, message: 'Dados do usuário atualizados com sucesso.', user: updatedUser });
    }
    catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ success: false, message: 'Erro do servidor.' });
    }
}));
// Rota para atualizar dados do médico
router.put('/physicians/:physician_id', VerifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Agora bate com o que está na URL:
        const physician = yield physicianModel.findById(req.params.physician_id);
        if (!physician) {
            return res.status(404).json({ success: false, message: 'Médico não encontrado' });
        }
        const { specialty, phone, availability, alerts } = req.body;
        if (specialty !== undefined)
            physician.specialty = specialty;
        if (phone !== undefined)
            physician.phone = phone;
        if (availability !== undefined)
            physician.availability = availability;
        yield physician.save();
        res.json({ success: true, physician });
    }
    catch (error) {
        console.error('Erro ao atualizar médico:', error);
        res.status(500).json({ success: false, message: 'Erro do servidor' });
    }
}));
module.exports = router;
