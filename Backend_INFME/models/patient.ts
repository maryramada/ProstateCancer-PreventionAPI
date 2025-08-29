import mongoose = require("mongoose");

var Schema = mongoose.Schema;

const patientSchema = new Schema({
    
  physician: { type: mongoose.Schema.Types.ObjectId, ref: 'Physician'},

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    
  formAnswers: {
    personalInfo: {
      age: { 
        type: Number, 
        default: null, 
        min: [0, 'Idade não pode ser negativa'], 
        max: [130, 'Idade inválida'] 
      },
      gender: { 
        type: String, 
        default: null, 
        enum: {
          values: ['Masculino', 'Feminino', 'Outro', null],
          message: 'Género inválido'
        }
      },
      maritalStatus: { 
        type: String, 
        default: null,
        enum: {
          values: ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', null],
          message: 'Estado civil inválido'
        }
      },
    },
    medicalHistory: {
      comorbidities: [{ type: String }],
      priorCancerDiagnosis: { type: Boolean, default: null },
      prostateIssuesHistory: { type: Boolean, default: null },
      lastPSATestDate: { 
        type: Date, 
        default: null,
        validate: {
          validator: function(value: Date) {
            return value === null || value <= new Date();
          },
          message: 'A data do último exame PSA não pode ser no futuro'
        }
      }
    },
    lifestyle: {
      exercisesRegularly: { type: Boolean, default: null },
      smokes: { type: Boolean, default: null },
      drinksAlcohol: { type: Boolean, default: null },
      dietQuality: { 
        type: String, 
        default: null,
        enum: {
          values: ['Mau', 'Regular', 'Boa', 'Excelente', null],
          message: 'Qualidade da dieta inválida'
        }
      }
    },
    familyHistory: {
      cancer: { type: Boolean, default: null },
      prostateCancer: { type: Boolean, default: null },
      heartDisease: { type: Boolean, default: null },
    },
  },

  alerts: [{
    alertNumber: { type: Number, default: 0 },
    message: [{ type: String }]
  }],

  riskAssessment: {
    riskLevel: { type: String, enum: ["Low", "Moderate", "High"], default: "Low" },
},

lastCheckup: { 
    type: Date, 
    default: null,
    validate: {
      validator: function(value: Date) {
        return value === null || value <= new Date();
      },
      message: 'A data do último check-up não pode ser no futuro'
    }
  },

});


// Interface para representar as respostas do formulário
export interface FormAnswers {
  personalInfo: {
    age?: number; 
    gender?: string; 
    maritalStatus?:string;
  };
  medicalHistory: {
    comorbidities?: string[]; 
    priorCancerDiagnosis?:boolean;
    prostateIssuesHistory?: boolean;
    lastPSATestDate?:Date;
  };
  lifestyle: {
    exercisesRegularly?: boolean; 
    smokes?: boolean; 
    drinksAlcohol?:boolean;
    dietQuality?:String; 
  };
  familyHistory: {
    cancer?: boolean; 
    heartDisease?: boolean; 
    prostateCancer?: boolean;
  };
}
   export default FormAnswers;

    const patientModel = mongoose.model('Patient', patientSchema);
    module.exports = patientModel;

