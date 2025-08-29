import mongoose = require("mongoose");

var Schema = mongoose.Schema;

  const physicianSchema = new Schema({

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O campo "user" é obrigatório']
    },

    specialty: {
      type: String,
      required: [true, 'Especialidade é obrigatória'],
      trim: true,
      minlength: [3, 'Especialidade deve ter pelo menos 3 caracteres'],
      maxlength: [100, 'Especialidade deve ter no máximo 100 caracteres']
    },

    phone: { 
      type: String,
      required: [true, 'O número de telemóvel é obrigatório'],
      validate: {
        validator: (v: string) => v.length === 9 && /^\d+$/.test(v),
        message: 'O número de telemóvel deve conter exatamente 9 dígitos numéricos'
      }
    },   

    availability: [{
      dayOfWeek: { 
        type: String,
        required: [true, 'Dia da semana é obrigatório'],
        enum: {
          values: [
            'segunda-feira', 'terça-feira', 'quarta-feira',
            'quinta-feira', 'sexta-feira', 'sábado', 'domingo'
          ],
          message: 'Dia da semana inválido'
        }
      },
      from: { 
        type: String,
        required: [true, 'Horário de início é obrigatório'],
        validate: {
          validator: function(v: string) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
          },
          message: 'Horário de início deve estar no formato HH:mm'
        }
      },
      to: { 
        type: String,
        required: [true, 'Horário de término é obrigatório'],
        validate: {
          validator: function(v: string) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
          },
          message: 'Horário de término deve estar no formato HH:mm'
        }
      }
    }],
    
    alerts: [{
      alertNumber: { 
        type: Number, 
        default: 0,
        min: [0, 'Número de alertas não pode ser negativo']
      },
      patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Patient' 
      },
      message: [{
        type: String,
        trim: true,
        maxlength: [300, 'A mensagem do alerta não pode exceder 300 caracteres']
      }]
    }],
    
})

const physicianModel = mongoose.model('Physician', physicianSchema);

module.exports = physicianModel;

