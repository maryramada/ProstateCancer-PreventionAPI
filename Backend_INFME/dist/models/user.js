"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'O nome é obrigatório'],
        trim: true,
        minlength: [2, 'O nome deve ter no mínimo 2 caracteres'],
        maxlength: [100, 'O nome deve ter no máximo 100 caracteres']
    },
    password: {
        type: String,
        required: [true, 'A palavra-passe é obrigatória'],
        minlength: [6, 'A palavra-passe deve ter no mínimo 6 caracteres']
        // Nota: a validação de complexidade (como incluir números/letras) pode ser feita antes de salvar, via middleware
    },
    email: {
        type: String,
        required: [true, 'O email é obrigatório'],
        trim: true,
        lowercase: true,
        unique: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Formato de email inválido'
        ]
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});
const userModel = mongoose.model('User', userSchema);
module.exports = userModel;
