import { Component, OnInit } from '@angular/core';
import { Patient } from '../patient';
import { PatientService } from '../services/patient.service';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-questionnaire',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.css'
})
export class QuestionnaireComponent implements OnInit {

  patientID: string | null = null;
  patientToken: string | null = null;

    // Inicializar o construtor com estes parâmetros sempre que quisermos "injetar" serviços na componente e/ou acrescentar navegabilidade (classe Router)
  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router
  ) { }

  patient: Patient  = {
    physician: '', 
    user: {
      name: '',
      email: '',
    },
    formAnswers: {
        personalInfo: {
            age: null,
            gender: '',
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
            heartDisease: null,
            prostateCancer: null
        }
    },
    alerts: [
        {
            alertNumber: 0,
            message: []
        }
    ],
    riskAssessment: {
      riskLevel: "Low"
    },
    lastCheckup: null,
    _id: ''
};

 // Método invocado ao aceder a componente "questionnaire". É atribuído o id do paciente e o token (que vieram como parâmetros da requisição HTTP a partir da componente patient) e o paciente é atribuído ao paciente atual que fez o login (currentPatient)
  ngOnInit(): void {
    this.patientID = this.route.snapshot.paramMap.get('patientId');   
    this.patientToken = this.route.snapshot.paramMap.get('patientToken'); 
    this.patient = this.authService.currentPatient;
  }


  // Invoca o método updateQuestionnaire implementado em "patient.service", que por sua vez faz a requisição HTTP ao backend para enviar os dados, processá-los e gerar/enviar os alertas 
  saveQuestionnaire(): void {
    if (!this.patientID || !this.patientToken) {
      alert('Parâmetros inválidos para salvar questionário');
      return;
    }
  
    if (this.patient != null) {
      
      this.patientService.updateQuestionnaire(this.patientID, this.patient.formAnswers, this.patientToken).subscribe(
        (response: any) => {
          if (response.alerts && response.alerts.length > 0) {
            alert('Questionário registado com sucesso!\n\nAlertas:\n- ' + response.alerts.join('\n- '));
          } else {
            alert('Questionário registado com sucesso! Nenhum alerta gerado.');
          }
          this.router.navigate(['/patient']);
        },
        error => {
          alert('Erro ao gravar o questionário');
        }
      );      
      
    } else {
      alert('Falha ao obter os dados do paciente!');
      this.router.navigate(['/patient']);
    }
  }

  cancel(): void {
    this.router.navigate(['/patient']);
  }

  clearAlerts(): void {
    if (!this.patientID) {
      alert('ID do paciente não encontrado.');
      return;
    }
  
    if (confirm('Tem certeza que deseja apagar todos os alertas deste paciente?')) {
      this.patientService.clearAlerts(this.patientID).subscribe(
        response => {
          alert('Alertas apagados com sucesso.');
          this.patient.alerts = []; // limpa localmente também
        },
        error => {
          alert('Erro ao apagar alertas.');
        }
      );
    }
  }
  onSubmit(): void {
    this.authService.updatePatient(this.patient._id, this.patient).subscribe({
      next: updated => {
        alert('Dados atualizados com sucesso!');
        this.router.navigate(['/patient']);
      },
      error: err => alert('Erro ao atualizar paciente.')
    });
  }
  
  
}
