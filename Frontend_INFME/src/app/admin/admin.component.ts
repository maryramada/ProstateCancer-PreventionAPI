import { Component } from '@angular/core';
import { User } from '../user';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-admin',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  currentUser: any;
  users: any[] = [];
  loading = true;
  error: string | null = null;

  selectedUser?: User = {
    name: '',
    password: '',
    email: '',
    isAdmin: false,
    _id: ''
  };

  // Variáveis de paginação
  currentPage = 1;
  pageSize = 6;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  userType?: string;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.userType = this.currentUser?.userType;

    this.loadUsers();
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Carrega utilizadores do backend
  loadUsers(): void {
    this.loading = true;
    this.authService.getUsers().subscribe(
      data => {
        this.users = Array.isArray(data) ? data as any[] : [];
        this.currentPage = 1;
        this.loading = false;

        this.users.forEach(user => {
          if (user.isAdmin) {
            user.role = 'Administrador';

          } else {
            // 1º – tenta fetchPhysicianId
            this.authService.fetchPhysicianId(user._id).subscribe(
              physicianId => {
                // encontrou physicianId
                user.role = 'Médico';
              },
              err1 => {
                // 2º – não é médico, tenta fetchPatientById
                this.authService.fetchPatientById(user._id).subscribe(
                  patientObj => {
                    // encontrou paciente
                    user.role = 'Paciente';
                  },
                  err2 => {
                    // não é paciente nem médico
                    user.role = 'Utilizador';
                  }
                );
              }
            );
          }
        });
      },
      err => {
        this.error = err?.error?.message || err.message || 'Erro ao carregar utilizadores';
        this.loading = false;
      }
    );
  }

  

  // Calcula número total de páginas
  get totalPages(): number {
    return Math.ceil(this.users.length / this.pageSize);
  }

  // Obtém os utilizadores da página atual
  get paginatedUsers(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.users.slice(startIndex, startIndex + this.pageSize);
  }

  // Vai para a próxima página
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Vai para a página anterior
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Seleciona utilizador (visualizar ou apagar)
  selectUser(user: User): void {
    this.selectedUser = user;
  }

  // Apaga utilizador selecionado
  deleteUser(): void {
    if (confirm('Tem certeza de que deseja excluir este utilizador?')) {
      if (this.selectedUser) {
        this.authService.deleteUser(this.selectedUser._id).subscribe(
          (response) => {
            console.log(response.message);
            this.loadUsers(); // Atualiza lista
          },
          () => {
            alert('Erro ao excluir o utilizador');
          }
        );
      }
    }
  }

  getRoleDescription(user: any): string {
    if (user.isAdmin) return 'administrador';

    switch (user.userType) {
      case 'physician': return 'médico';
      case 'patient': return 'paciente';
      default: return 'utilizador';
    }
  }

}

