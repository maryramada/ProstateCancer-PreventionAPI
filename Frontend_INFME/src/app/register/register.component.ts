import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { User } from '../user';
import { Physician } from '../physician';
import { Patient } from '../patient';
import { PatientService } from '../services/patient.service';
import { PhysicianService } from '../services/physician.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  newUser: User = {
    name: '',
    password: '',
    email: '',
    isAdmin: false,
    _id: ''
  };

  newPhysician: Physician = {
    _id: '',
    user: { _id: '', name: '' },
    specialty: '',
    phone: '',
    availability: [],
    alerts: [{ patientId: '', alertNumber: 0, message: [] }]
  };

  newPatient: Patient = {
    _id: '',
    physician: '',
    user: { name: '', email: '' },
    formAnswers: {
      personalInfo: { age: null, gender: null, maritalStatus: null },
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
    alerts: [{ alertNumber: 0, message: [] }],
    riskAssessment: { riskLevel: 'Low' },
    lastCheckup: null
  };

  userType: string = '';
  availabilitySlots = [{ dayOfWeek: '', from: '', to: '' }];
  specialties: string[] = [
    'Urologia', 'Oncologia Médica', 'Oncologia Radioterápica',
    'Radiologia / Imagiologia', 'Anatomia Patológica', 'Medicina Nuclear',
    'Psico-Oncologia'
  ];
  selectedSpecialty: string = '';
  filteredPhysicians: Physician[] = [];

  constructor(
    private authService: AuthService,
    private patientService: PatientService,
    private physicianService: PhysicianService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password || !this.userType) {
      alert('Preencha todos os campos antes de continuar.');
      return;
    }

    this.newUser.isAdmin = this.userType === 'admin';
    this.registerUser();
    this.router.navigate(['admin']);
  }

  registerUser() {
    this.authService.createUser(this.newUser).subscribe(
      (response: any) => {
        const userId = response.utilizador._id;

        if (this.userType === 'physician') {
          this.newPhysician.user = userId;

          // Guardar apenas blocos preenchidos
          this.newPhysician.availability = this.availabilitySlots.filter(slot =>
            slot.dayOfWeek && slot.from && slot.to
          );

          this.createPhysician();
        } else if (this.userType === 'patient') {
          this.newPatient.user = userId;
          this.createPatient();
        } else {
          alert('Administrador registado com sucesso!');
        }
      },
      error => {
        alert('Erro ao registar utilizador.');
      }
    );
  }

  createPhysician() {
    this.physicianService.createPhysician(this.newPhysician).subscribe(
      () => alert('Médico registado com sucesso!'),
      () => alert('Erro ao registar o médico.')
    );
  }

  createPatient() {
    this.patientService.createPatient(this.newPatient).subscribe(
      () => alert('Paciente registado com sucesso!'),
      () => alert('Erro ao registar paciente.')
    );
  }

  onSpecialtyChange() {
    if (!this.selectedSpecialty) {
      this.filteredPhysicians = [];
      this.newPatient.physician = '';
      return;
    }

    this.authService.getPhysiciansBySpecialty(this.selectedSpecialty).subscribe({
      next: (physicians: Physician[]) => {
        this.filteredPhysicians = physicians;
        this.newPatient.physician = '';
      },
      error: err => {
        console.error('Erro ao buscar médicos:', err);
        this.filteredPhysicians = [];
      }
    });
  }

  addAvailabilitySlot() {
    this.availabilitySlots.push({ dayOfWeek: '', from: '', to: '' });
  }

  removeSlot(index: number) {
    this.availabilitySlots.splice(index, 1);
  }
}