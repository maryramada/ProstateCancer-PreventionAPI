import { Component, OnInit } from '@angular/core';
import { Patient } from '../patient';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Physician } from '../physician';
import { PhysicianService } from '../services/physician.service';



@Component({
  selector: 'app-physician',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './physician.component.html',
  styleUrls: ['./physician.component.css']
})
export class PhysicianComponent implements OnInit {

  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  selectedPatient: Patient | null = null;
  physicianName: string | null = '';
  editingProfile = false;
  physicianProfile?: Physician;
  daysOfWeek = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
  loading = true;
  searchTerm: string = '';
  currentPage = 1;
  pageSize = 4;
  error: string = '';

  constructor(
    private authService: AuthService,
    private patientService: PatientService,
    private physicianService: PhysicianService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.authService.userType !== 'physician') {
      alert('Acesso negado.');
      this.router.navigate(['/login']);
      return;
    }
    this.physicianName = this.authService.currentUser.name;

    const userId = this.authService.userId;
    if (!userId) {
      alert('Usuário não autenticado.');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.fetchPhysicianId(userId).subscribe({
      next: id => {
        this.authService.physicianID = id;
        localStorage.setItem('physicianID', id);
        this.loadMyProfile();
        this.loadPatients();
      },
      error: err => {
        console.error('Não foi possível obter Physician ID', err);
        alert('Erro ao buscar ID do médico.');
      }
    });
  }

  loadPatients(): void {
    const pid = this.authService.physicianID;
    if (!pid) {
      this.error = 'Physician ID não definido.';
      return;
    }
    this.loading = true;
    this.authService.listPatientByPhysicianId(pid).subscribe({
      next: list => {
        this.patients = list;
        this.filteredPatients = list;
        this.loading = false;
      },
      error: err => {
        console.error('Erro ao carregar pacientes', err);
        this.error = 'Erro ao carregar pacientes';
        this.loading = false;
      }
    });
  }
  selectPatient(p: Patient): void {
    if (this.selectedPatient?. _id === p._id) {
      this.selectedPatient = null;
    } else {
      this.selectedPatient = p;
      this.patientService.getPatientbyID(p._id).subscribe({
        next: detail => this.selectedPatient = detail,
        error: err => console.error('Erro detalhes paciente', err)
      });
    }
  }


  loadPatientDetails(id: string): void {
    this.patientService.getPatientbyID(id).subscribe(
      (response) => {
        if (this.selectedPatient) {
          this.selectedPatient.user.name = response.user.name;
          this.selectedPatient.user.email = response.user.email;
          this.selectedPatient.formAnswers = response.formAnswers;
        }
      },
      error => {
        console.error('Erro ao carregar os detalhes do paciente:', error);
      }
    );
  }

  filterPatients(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredPatients = term
      ? this.patients.filter(p => p.user.name?.toLowerCase().includes(term))
      : this.patients;
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.pageSize);
  }

  get paginatedPatients(): Patient[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPatients.slice(start, start + this.pageSize);
  }

  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  previousPage(): void { if (this.currentPage > 1) this.currentPage--; }

  
  toggleEditProfile(): void {
    if (!this.editingProfile) {
      // 1) quando entras em edição, faz reset e carrega o perfil
      this.physicianProfile = {
        _id: '',
        user: { _id: '', name: '' },
        specialty: '',
        phone: '',
        availability: [],
        alerts: []
      };
      this.loadMyProfile();
    }
    this.editingProfile = !this.editingProfile;
  }

  loadMyProfile(): void {
    const pid = this.authService.physicianID;
    if (!pid) return;
    this.physicianProfile = undefined;
    this.authService.getPhysicianById(pid).subscribe({
      next: profile => {
        this.physicianProfile = profile;
        if (!Array.isArray(this.physicianProfile.availability)) {
          this.physicianProfile.availability = [];
        }
      },
      error: err => console.error('Erro ao carregar perfil', err)
    });
  }

  goToEdit(): void {
    this.router.navigate(['/physician/edit']);
  }
  

  /*addSlot(): void {
    if (!this.physicianProfile) return;
    this.physicianProfile.availability = this.physicianProfile.availability || [];
    this.physicianProfile.availability.push({ dayOfWeek: '', from: '', to: '' });
  }

  removeSlot(i: number): void {
    this.physicianProfile?.availability.splice(i, 1);
  }

  saveProfile(): void {
    if (!this.physicianProfile) return;
    const pid = this.authService.physicianID!;
    this.authService.updatePhysician(pid, {
      specialty: this.physicianProfile.specialty,
      phone: this.physicianProfile.phone,
      availability: this.physicianProfile.availability,
      alerts: this.physicianProfile.alerts
    }).subscribe({
      next: () => {
        alert('Perfil atualizado com sucesso');
        this.editingProfile = false;
        this.physicianName = this.physicianProfile!.user.name;
      },
      error: err => {
        console.error('Falha ao atualizar perfil', err);
        alert('Falha ao atualizar perfil');
      }
    });
  }  */
  
}