import { Component } from '@angular/core';
import { Patient } from '../patient';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-patient',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './patient.component.html',
  styleUrl: './patient.component.css'
})
export class PatientComponent {

  patient: Patient = {
    physician: '',
    user: {
      name: '',
      email: '',
    }, formAnswers: {
      personalInfo: {
        age: null,
        gender: null,
        maritalStatus: null
      },
      medicalHistory: {
        comorbidities: [],
        priorCancerDiagnosis: null,
        prostateIssuesHistory: null,
        lastPSATestDate: null
      },
      lifestyle: {
        exercisesRegularly: null,
        smokes: null,
        drinksAlcohol: null,
        dietQuality: null
      },
      familyHistory: {
        cancer: null,
        prostateCancer: null,
        heartDisease: null
      }
    },
    alerts: [
      {
        alertNumber: 0,
        message: []
      }
    ],
    riskAssessment: {
      riskLevel: 'Low'
    },
    lastCheckup: null,
    _id: ''
  };


  name: string | null = '';
  email: string | null = '';
  showAlerts: boolean = false;


  // Inicializar o construtor com estes parâmetros sempre que quisermos "injetar" serviços na componente e/ou acrescentar navegabilidade (classe Router)
  constructor(private authService: AuthService, private patientService: PatientService, private router: Router) { }

  // Método executado ao aceder a componente. Portanto são listados os dados do paciente logo ao aceder esta componente (após login)
  ngOnInit(): void {
    if (this.authService.userType === 'patient') {
      this.loadPatientData();
    }
  }

  // Método para carregar os dados do paciente. Invoca o método getCurrentPatient implementado em "auth.service", que por sua vez envia a requisição HTTP para o backend
  loadPatientData(): void {

    console.log('DEBUG | patientID:', this.authService.patientID);
    console.log('DEBUG | currentPatient:', this.authService.currentPatient);
    console.log('DEBUG | currentUser:', this.authService.currentUser);

    if (this.authService.currentPatient) {
      this.authService.getCurrentPatient().subscribe(
        (patient: Patient) => {
          console.log('✅ Sucesso ao obter paciente:', patient);
          this.patient = patient;
        },
        (error) => {
          console.error('❌ Erro ao obter paciente:', error);
          alert('Erro ao obter paciente');
        }
      );

      this.name = this.authService.currentUser.name;
      this.email = this.authService.currentUser.email;
    } else {
      alert("Os dados do paciente não foram encontrados.");
    }
  }

  // Método que redireciona o paciente para a componente "questionnaire" sempre que este selecionar a opção para preencher ou atualizar o questionário
  redirectToQuestionnaire(): void {
    if (this.patient) {
      this.router.navigate(['/questionnaire', { patientId: this.patient._id, patientToken: this.authService.userToken }]);
    }
  }

  // Método esconde os alertas enquanto a variável showAlerts for false (valor default). A variável showAlerts é passada a true quando o paciente carrega no botão "Ver Alertas"
  toggleAlerts(): void {
    this.showAlerts = !this.showAlerts;
  }

  redirectToEdit(): void {
    if (this.patient) {
      this.router.navigate(['/patient-edit', { patientId: this.patient._id, patientToken: this.authService.userToken }]);
    }
  }


  // Apaga alerta individual
  deleteAllAlerts(): void {
    this.patientService
      .deleteAllAlerts(this.patient._id, this.authService.userToken!)
      .subscribe({
        next: res => this.patient = res.patient,
        error: err => alert('Erro ao apagar todos os alertas.')
      });
  }
  
  deleteAlert(idx: number): void {
    this.patientService
      .deleteAlert(this.patient._id, idx, this.authService.userToken!)
      .subscribe({
        next: res => this.patient = res.patient,
        error: err => alert('Erro ao apagar alerta.')
      });
  }
  
}