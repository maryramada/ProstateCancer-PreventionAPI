export interface PersonalInfo {
  age: number | null;
  gender: string | null;
  maritalStatus: string | null;
}

export interface MedicalHistory {
  comorbidities: string[];
  priorCancerDiagnosis: boolean | null;
  prostateIssuesHistory: boolean | null;
  lastPSATestDate: Date | null;
}

export interface Lifestyle {
  exercisesRegularly: boolean | null;
  smokes: boolean | null;
  drinksAlcohol: boolean | null;
  dietQuality: string | null;
}

export interface FamilyHistory {
  cancer: boolean | null;
  prostateCancer: boolean | null;
  heartDisease: boolean | null;
}

export interface FormAnswers {
  personalInfo: PersonalInfo;
  medicalHistory: MedicalHistory;
  lifestyle: Lifestyle;
  familyHistory: FamilyHistory;
}

export interface Alert {
  alertNumber: number;
  message: string[];
}

export interface RiskAssessment {
  riskLevel: 'Low' | 'Moderate' | 'High' | null;
}

export interface Patient {
  _id: string;
  physician: string;
  user: {
    name: string;
    email: string;
  };
  formAnswers: FormAnswers;
  alerts: Alert[];
  riskAssessment: RiskAssessment;
  lastCheckup: Date | null;
}