"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
function VerifyToken(req, res, next) {
    let token = req.headers['x-access-token'];
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    console.log('Token recebido:', token);
    if (!token) {
        console.warn('⚠ Token não fornecido.');
        return res.status(403).send({ auth: false, message: 'No token provided' });
    }
    jwt.verify(token, 'InfMed_20232024', function (err, decoded) {
        if (err) {
            console.error('❌ Falha na autenticação do token:', err.message);
            return res.status(401).send({ auth: false, message: 'Failed to authenticate token.' });
        }
        console.log('🧾 Token decodificado:', decoded);
        req.userId = decoded.userId;
        req.userEmail = decoded.user;
        req.user = decoded;
        next();
    });
}
module.exports = VerifyToken;
