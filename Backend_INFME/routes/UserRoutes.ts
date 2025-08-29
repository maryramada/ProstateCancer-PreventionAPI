import express = require('express');
import mongoose = require('mongoose');
import jwt = require('jsonwebtoken');
import bcrypt = require('bcryptjs');
import bodyParser = require("body-parser");
import cors from 'cors';
import { Request, Response, Router } from 'express';

var userModel = require("../models/user");
var patientModel = require("../models/patient");
var physicianModel = require("../models/physician");
var VerifyToken = require("../auth/VerifyToken");

import { FormAnswers } from "../models/patient";

var router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');

interface Alert {
  alertNumber: number;
  message: string;
  patientId?: mongoose.Types.ObjectId;
}

// rota para testar - GET http://localhost:8080/med)
router.get('/', function (req, res) {
  res.json({ message: 'Bem vindo ao BlueCheck!!' });
});

// Rota para registar um utilizador - POST http://localhost:8080/med/Register/User
router.post('/Register/User', async function (req, res) {
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
    await newUser.save();

    res.status(201).json({ message: 'Utilizador registado com sucesso!', utilizador: newUser });
  } catch (err) {
    res.status(500).json({ error: 'Erro do servidor' });
  }
});


// Rota para registar um médico - POST http://localhost:8080/med/Register/Physician
router.post('/Register/Physician', async function (req, res) {
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
    await newPhisycian.save();

    res.status(201).json({ message: 'Médico registado com sucesso!', physician: newPhisycian });
  } catch (err) {
    res.status(500).json({ error: 'Erro do servidor' });
  }
});

// Rota para registar um paciente - POST http://localhost:8080/med/Register/Patient
router.post('/Register/Patient', async function (req, res) {

  try {
    const { physician, user, formAnswers } = req.body;

    // Criar uma nova instância do paciente recorrendo ao modelo
    var newPatient = new patientModel({
      physician,
      user,
      formAnswers
    });

    // Gravar o novo paciente na base de dados
    await newPatient.save();

    res.status(201).json({ message: 'Paciente registado com sucesso!', patient: newPatient });
  } catch (err) {
    res.status(500).json({ error: 'Erro do servidor' });
  }
});


// Rota para realizar o login (todos os utilizadores) - POST http://localhost:8080/med/login
router.post('/login', async function (req: any, res: any) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email e password são obrigatórios.' });
    }

    const user = await userModel.findOne({ email, password }).exec();
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou password incorretos.' });
    }

    const payload = { user: user.email, userId: user._id };
    const token = jwt.sign(payload, 'InfMed_20232024', { expiresIn: 86400 });

    let userType: string = 'unknown';
    let physicianId: string | null = null;

    if (user.isAdmin === true) {
      userType = 'admin';
    } else {
      const physicianEntry = await physicianModel.findOne({ user: user._id }).exec();
      if (physicianEntry) {
        userType = 'physician';
        physicianId = physicianEntry._id;
      } else {
        const patientEntry = await patientModel.findOne({ user: user._id }).exec();
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

  } catch (error) {
    console.error('Erro ao efetuar login:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});


router.get('/physician/patients', authenticateJWT, async (req: any, res: any) => {
  const userId = req.user.userId;

  const physician = await physicianModel.findOne({ user: userId });
  if (!physician) return res.status(404).json({ message: 'Médico não encontrado' });

  const patients = await patientModel.find({ physician: physician._id })
    .populate('user', 'name email');
  return res.json({ patients });
});


// Rota para alterar a palavra-passe do utilizador - PUT http://localhost:8080/med/change-password/:userId
router.put('/change-password', async (req: any, res: any) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Email, password atual e nova são obrigatórios.' });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    // comparar direto, pois senha está em texto simples
    if (currentPassword !== user.password) {
      return res.status(401).json({ message: 'Password atual incorreta.' });
    }

    // atualizar senha (texto simples, sem hash)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar password:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});


//Rota para obter os dados do user atual após login
// GET /med/user/:id
router.get('/user/:id', VerifyToken, async function (req: any, res: any) {
  try {
    const userId = req.params.id;

    const user = await userModel.findById(userId).select('-password'); // nunca envies a password
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });

    res.json({ user });
  } catch (err) {
    console.error('Erro ao obter utilizador:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});


// Rota para obter o paciente pelo userId - GET /med/patients/user/:userId
router.get('/patients/user/:userId', VerifyToken, async function (req: any, res: any) {
  try {
    const userId = req.params.userId;

    const patient = await patientModel.findOne({ user: userId })
      .populate('user', 'name email')
      .exec();

    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({ patient });
  } catch (err) {
    console.error('Erro ao obter paciente por userId:', err);
    res.status(500).json({ message: 'Erro do servidor.' });
  }
});

// Rota para obter o médico pelo userId - GET /med/physicians/user/:userId
router.get('/physicians/user/:userId', VerifyToken, async function (req: any, res: any) {
  try {
    const userId = req.params.userId;

    const physician = await physicianModel.findOne({ user: userId }).exec();

    if (!physician) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    res.json({ physicianId: physician._id });
  } catch (err) {
    console.error('Erro ao obter médico por userId:', err);
    res.status(500).json({ message: 'Erro do servidor.' });
  }
});

router.get('/physicians', VerifyToken, async (req, res) => {
  try {
    const physicians = await physicianModel.find().populate('user', 'name');
    res.json(physicians);
  } catch (err) {
    console.error('Erro ao obter médicos:', err);
    res.status(500).json({ message: 'Erro do servidor.' });
  }
});

router.get('/physicians/specialty/:specialty', VerifyToken, async (req, res) => {
  try {
    const specialty = decodeURIComponent(req.params.specialty); // ← garante que está correto
    const physicians = await physicianModel.find({ specialty }).populate('user');
    res.json(physicians);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar médicos' });
  }
});


// Rota para responder ao questionário - PUT http://localhost:8080/med/patients/questionnaire/:patient_id
router.put(
  '/patients/questionnaire/:patient_id',
  VerifyToken,
  async (req: any, res: any) => {
    try {
      const patient = await patientModel.findById(req.params.patient_id).exec();
      if (!patient) return res.status(404).json({ message: 'Paciente não encontrado.' });

      // 1. Atualiza respostas
      patient.formAnswers = req.body.formAnswers;

      // 2. Limpa alertas antigos do paciente
      patient.alerts = [];

      // 3. Limpa alertas antigos do médico
      const physician = await physicianModel.findById(patient.physician).exec();
      if (!physician) return res.status(404).json({ message: 'Médico não encontrado.' });
      physician.alerts = physician.alerts.filter(
        (a: any) => String(a.patientId) !== String(patient._id)
      );

      // 4. Gera NOVOS alertas (lista de *strings*)
      const novos = await generateAlerts(patient.formAnswers);

      // 5. Adiciona sequencialmente
      novos.forEach((msg: string, idx: number) => {
        const alertObj = { alertNumber: idx + 1, message: msg };
        patient.alerts.push(alertObj);
        physician.alerts.push({ ...alertObj, patientId: patient._id });
      });

      // 6. Persiste alterações
      await patient.save();
      await physician.save();

      return res.json({ message: 'Questionário e alertas atualizados.', alerts: novos });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro interno.' });
    }
  }
);

// Rota para remover utilizadores da base de dados (apenas o adminsitrador pode aceder a esta rota) - DELETE http://localhost:8080/med/DeleteUser/:user_id
router.delete('/DeleteUser/:userId', VerifyToken, async function (req: any, res: any) {
  if (await hasRole(req.userEmail, 'administrator')) {
    try {
      const deletedUser = await userModel.findByIdAndDelete(req.params.userId);

      console.log('User autenticado:', req.userEmail);

      if (!deletedUser) {
        return res.status(404).json({ message: 'Utilizador não encontrado' });
      }

      res.json({ message: 'Utilizador removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover utilizador:', error);
      res.status(500).json({ message: 'Erro do servidor.' });
    }
  } else {
    return res.status(403).send({ auth: false, token: null, message: 'Não tem autorização!' });
  }
});

// Rota para listar todos os utilizadores - GET http://localhost:8080/med/ListUsers
router.get('/ListUsers', VerifyToken, async function (req: any, res: any) {
  const isAdmin = await hasRole(req.userEmail, 'administrator');

  if (!isAdmin) {
    return res.status(405).json({ message: 'Não tem permissão!' });
  }

  try {
    const users = await userModel.find().exec();

    console.log(users);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Nenhum utilizador encontrado.' });
    }

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro do servidor!' });
  }
});

async function hasRole(userEmail: any, role: string): Promise<boolean> {
  const user = await userModel.findOne({ email: userEmail }).exec();

  if (!user) {
    return false;
  }

  console.log(user.isAdmin);

  if ((role === 'administrator' && user.isAdmin === true) || (role === 'physician' && user.isAdmin === false)) {
    return true;
  }

  return false;
}

router.get('/ListPatients/:physicianId', async (req, res) => {
  try {
    const physId = req.params.physicianId;

    const patients = await patientModel.find({ physician: physId })
      .populate('user', 'name email') // aqui faz o join com os dados do utilizador
      .exec();

    res.json({ patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar pacientes' });
  }
});


// Rota para obter o médico pelo userId - GET /med/physicians/user/:userId
router.get('/physicians/user/:userId', VerifyToken, async function (req: any, res: any) {
  try {
    const userId = req.params.userId;

    const physician = await physicianModel.findOne({ user: userId }).exec();

    if (!physician) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    res.json({ physicianId: physician._id });
  } catch (err) {
    console.error('Erro ao obter médico por userId:', err);
    res.status(500).json({ message: 'Erro do servidor.' });
  }
});

// Rota: GET /patients/:patientId
router.get('/patients/:patientId', VerifyToken, async function (req: any, res: any) {
  try {
    const patientId = req.params.patientId;
    const patient = await patientModel.findById(patientId)
      .populate('user', 'name email')
      .exec();

    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({ patient });
  } catch (err) {
    console.error('Erro ao obter paciente por patientId:', err);
    res.status(500).json({ message: 'Erro do servidor.' });
  }
});

router.get('/physicians/:physicianId', VerifyToken, async function (req: any, res: any) {
  try {
    const physicianId = req.params.physicianId;
    const physician = await physicianModel.findById(physicianId).exec();
    if (!physician) return res.status(404).json({ message: 'Médico não encontrado' });
    res.json({ physician });
  } catch (err) {
    res.status(500).json({ message: 'Erro do servidor.' });
  }
});


// Rota para enviar os alertas para o médico e para os pacientes - POST http://localhost:8080/med/send/alerts
function normalizeMessage(msg: string): string {
  return msg.trim().toLowerCase();
}

router.post('/send/alerts', async (req: any, res: any) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ message: 'patientId é obrigatório.' });
    }

    const patient = await patientModel.findById(patientId).exec();
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado.' });

    const physician = await physicianModel.findById(patient.physician).exec();
    if (!physician) return res.status(404).json({ message: 'Médico não encontrado.' });

    const formAnswers = {
      personalInfo: patient.formAnswers?.personalInfo || {},
      medicalHistory: patient.formAnswers?.medicalHistory || { comorbidities: [] },
      lifestyle: patient.formAnswers?.lifestyle || {},
      familyHistory: patient.formAnswers?.familyHistory || {},
    };

    const novosAlertas: string[] = await generateAlerts(formAnswers);

    // Remover duplicados antigos de patient.alerts (baseado em mensagem normalizada)
    const uniquePatientAlertsMap = new Map<string, any>();
    patient.alerts.forEach((alert: { message: string; alertNumber: number }) => {
      const key = normalizeMessage(alert.message);
      if (!uniquePatientAlertsMap.has(key)) {
        uniquePatientAlertsMap.set(key, alert);
      }
    });
    patient.alerts = Array.from(uniquePatientAlertsMap.values());

    // Remover duplicados antigos de physician.alerts para esse paciente
    const uniquePhysicianAlertsMap = new Map<string, any>();
    physician.alerts = physician.alerts.filter(
      (alert: { patientId?: string }) => String(alert.patientId) === String(patient._id)
        ? true
        : true // mantém alertas de outros pacientes, veja mais abaixo como lidar
    );
    physician.alerts.forEach((alert: { patientId?: string; message: string; alertNumber: number }) => {
      if (String(alert.patientId) === String(patient._id)) {
        const key = normalizeMessage(alert.message);
        if (!uniquePhysicianAlertsMap.has(key)) {
          uniquePhysicianAlertsMap.set(key, alert);
        }
      }
    });

    // Mantém alertas de outros pacientes + únicos para este paciente
    const outrosAlertas = physician.alerts.filter(
      (alert: { patientId?: string }) => String(alert.patientId) !== String(patient._id)
    );
    physician.alerts = [...outrosAlertas, ...Array.from(uniquePhysicianAlertsMap.values())];

    // Criar sets normalizados para comparação
    const mensagensPacienteExistentes = new Set(patient.alerts.map((a: { message: string }) => normalizeMessage(a.message)));
    const mensagensMedicoExistentes = new Set(
      physician.alerts
        .filter((a: { patientId?: string }) => String(a.patientId) === String(patient._id))
        .map((a: { message: string }) => normalizeMessage(a.message))
    );

    // Adicionar novos alertas apenas se forem inéditos
    const alertasAdicionados: string[] = [];

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


    await patient.save();
    await physician.save();

    return res.json({
      message: 'Alertas atualizados com sucesso.',
      alertsGerados: novosAlertas,
    });

  } catch (error) {
    console.error('Erro ao enviar alertas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});


async function generateAlerts(patient: FormAnswers): Promise<string[]> {
  const alerts: string[] = [];

  const age = patient.personalInfo?.age ?? 0;
  const gender = patient.personalInfo?.gender ?? '';
  const comorbidities = patient.medicalHistory?.comorbidities ?? [];
  const exercisesRegularly = patient.lifestyle?.exercisesRegularly;
  const smokes = patient.lifestyle?.smokes;
  const familyCancer = patient.familyHistory?.cancer;
  const familyHeart = patient.familyHistory?.heartDisease;

  if (age > 65 && comorbidities.includes('diabetes')) {
    alerts.push('Recorrer ao programa de controle glicêmico em idosos.');
  }

  if (age > 50 && gender === 'Masculino' && familyHeart && !exercisesRegularly) {
    if (comorbidities.includes('diabetes') && comorbidities.includes('hipertensão')) {
      alerts.push('Risco cardiovascular muito elevado. Avaliação cardíaca prioritária!');
    } else if (comorbidities.includes('diabetes')) {
      alerts.push('Risco cardiovascular alto. Avaliação cardíaca recomendada.');
    } else if (comorbidities.length > 0) {
      alerts.push('Risco cardiovascular moderado. Avaliação cardíaca necessária.');
    } else {
      alerts.push('Sem comorbidades relacionadas a risco cardiovascular elevado.');
    }
  }

  if (age > 40 && familyCancer && smokes) {
    alerts.push('Realizar exames de rastreio para cancro frequentemente.');
  }

  if (age > 40 && !exercisesRegularly) {
    if (comorbidities.length === 0 && !familyHeart) {
      alerts.push('Iniciar programa de exercícios físicos moderados.');
    } else {
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
}

router.delete('/alerts/clear/:patientId', async (req: any, res: any) => {
  try {
    const { patientId } = req.params;

    const patient = await patientModel.findById(patientId).exec();
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado.' });

    const physician = await physicianModel.findById(patient.physician).exec();
    if (!physician) return res.status(404).json({ message: 'Médico não encontrado.' });

    // Limpa alertas do paciente
    patient.alerts = [];

    // Remove alertas desse paciente da lista do médico
    physician.alerts = physician.alerts.filter(
      (alert: { patientId?: string }) => String(alert.patientId) !== String(patient._id)
    );

    await patient.save();
    await physician.save();

    return res.json({ message: 'Alertas apagados com sucesso.' });
  } catch (error) {
    console.error('Erro ao apagar alertas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// DELETE /med/patients/:id/alerts
router.delete(
  '/patients/:id/alerts',
  VerifyToken,
  async (req: any, res: any) => {
    console.log('🗑️  DELETE /patients/:id/alerts called for ID =', req.params.id);
    try {
      const patient = await patientModel.findById(req.params.id).exec();
      if (!patient) return res.status(404).json({ message: 'Paciente não encontrado.' });

      patient.alerts = [];
      await patient.save();

      const physician = await physicianModel.findById(patient.physician).exec();
      if (physician) {
        physician.alerts = physician.alerts.filter(
          (a: any) => String(a.patientId) !== String(patient._id)
        );
        await physician.save();
      }

      return res.json({ message: 'Todos os alertas apagados.', patient });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro ao apagar alertas.' });
    }
  }
);


// ─── 3) APAGAR UM ALERTA ESPECÍFICO ─────────────────────────────────────────
router.delete(
  '/patients/:id/alerts/:alertIndex',
  VerifyToken,
  async (req: any, res: any) => {
    try {
      const { id, alertIndex } = req.params;
      const patient = await patientModel.findById(id).exec();
      if (!patient) return res.status(404).json({ message: 'Paciente não encontrado.' });

      patient.alerts.splice(Number(alertIndex), 1);
      await patient.save();

      const physician = await physicianModel.findById(patient.physician).exec();
      if (physician) {
        physician.alerts = physician.alerts.filter(
          (a: any) =>
            !(
              String(a.patientId) === String(id) &&
              a.alertNumber === Number(alertIndex) + 1
            )
        );
        await physician.save();
      }

      return res.json({ message: 'Alerta apagado.', patient });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro ao apagar alerta.' });
    }
  }
);



// Rota para atualizar nome, email e password do paciente - PUT http://localhost:8080/med/patients/update/:user_id
router.put('/patients/update/:user_id', VerifyToken, async (req: any, res: any) => {
  console.log('Update recebido para user_id:', req.params.user_id);
  console.log('Corpo recebido:', req.body);

  try {
    interface UpdateFields {
      name?: string;
      email?: string;
      password?: string;
    }

    const data = req.body.updatedData;
    if (!data) {
      return res.status(400).json({ success: false, message: 'Dados para atualização não enviados.' });
    }

    const updateFields: UpdateFields = {};

    if (data.name) updateFields.name = data.name;
    if (data.email) updateFields.email = data.email;
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateFields.password = hashedPassword;
    }

    console.log('Campos para atualizar:', updateFields);

    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.user_id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    console.log('Usuário atualizado:', updatedUser);

    res.json({ success: true, message: 'Dados do usuário atualizados com sucesso.', user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ success: false, message: 'Erro do servidor.' });
  }
});

// Rota para atualizar dados do médico
router.put('/physicians/:physician_id', VerifyToken, async (req: any, res: any) => {
  try {
    // Agora bate com o que está na URL:
    const physician = await physicianModel.findById(req.params.physician_id);

    if (!physician) {
      return res.status(404).json({ success: false, message: 'Médico não encontrado' });
    }

    const { specialty, phone, availability, alerts } = req.body;
    if (specialty !== undefined) physician.specialty = specialty;
    if (phone !== undefined) physician.phone = phone;
    if (availability !== undefined) physician.availability = availability;

    await physician.save();
    res.json({ success: true, physician });

  } catch (error) {
    console.error('Erro ao atualizar médico:', error);
    res.status(500).json({ success: false, message: 'Erro do servidor' });
  }
});


module.exports = router;
