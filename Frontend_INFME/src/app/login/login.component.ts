import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  // Variável para mostrar/ocultar a password
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  login(): void {
    this.errorMessage = ''; // limpa qualquer mensagem anterior

    if (!this.email || !this.password) {
      this.errorMessage = 'Preencha email e password.';
      return;
    }

    this.authService.login(this.email, this.password).subscribe(
      response => {
        if (response && response.token) {
          // Salva o token JWT no serviço para usar em chamadas futuras
          this.authService.setToken(response.token);
          
          // Guarda o tipo de utilizador no serviço também
          this.authService.userType = response.userType;

          // Se for médico, antes de navegar, busca os pacientes
          if (response.userType === 'physician') {
            const physicianId = response.physicianId;
            this.authService.listPatientByPhysicianId(physicianId).subscribe(
              patients => {
                console.log('Pacientes do médico:', patients);
                this.router.navigate(['physician']);
              },
              error => {
                console.error('Erro ao buscar pacientes:', error);
                this.router.navigate(['physician']);
              }
            );
          }
          else if (response.userType === 'admin') {
            this.router.navigate(['admin']);
          }
          else if (response.userType === 'patient') {
            this.router.navigate(['patient']);
          }
          else {
            this.router.navigate(['/']);
          }
        } else {
          this.errorMessage = response.message || 'Falha no login.';
        }
      },
      error => {
        this.errorMessage = error.error?.message || 'Erro de comunicação com o servidor.';
      }
    );
  }

  // Método para a ação de alterar palavra-passe: só navega para a página Change Password
  goToChangePassword() {
    this.router.navigate(['/change-password']);
  }  

  // Método para alterar password via serviço (podes manter ou remover, conforme necessidade)
  changePassword(oldPassword: string, newPassword: string): void {
    this.authService.changePassword(this.email, oldPassword, newPassword).subscribe(
      response => {
        alert('Password alterada com sucesso!');
        this.router.navigate(['/login']);
      },
      error => {
        this.errorMessage = error.error?.message || 'Erro ao alterar a password.';
      }
    );
  }
}