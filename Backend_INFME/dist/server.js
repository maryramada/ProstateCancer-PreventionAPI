"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Importações
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
var app = express(); // Definir a app através do express
app.use(cors({ origin: 'http://localhost:4200' }));
// Configurações para o uso do bodyParser()
// Permite a extraçao dos dados obtidos com o método POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 8080; // Definir a porta
var mongoose = require('mongoose'); // Conexão com a base de dados (MongoDB)
mongoose.connect('mongodb+srv://ms1510750:C3dFrJJvu50ZhKqs@bears.s0jws.mongodb.net/?retryWrites=true&w=majority&appName=bears');
// Registar as rotas (defininas no ficheiro UserRoutes)
var UserRoutes = require('./routes/UserRoutes');
app.use('/med', UserRoutes);
// Iniciar o servidor
app.listen(port);
console.log('Aplicação iniciada na porta ' + port);
