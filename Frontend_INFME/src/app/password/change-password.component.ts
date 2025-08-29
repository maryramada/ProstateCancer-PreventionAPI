import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  email = "";
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  submittedSuccessfully = false; // flag nova

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) { }

  changePassword() {
    this.errorMessage = '';
    this.successMessage = '';
    this.submittedSuccessfully = false;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'As novas palavras-passe não coincidem.';
      return;
    }

    const body = {
      email: this.email,
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    };

    this.http.put('http://localhost:8080/med/change-password', body)
      .subscribe({
        next: (res: any) => {
          this.successMessage = res.message;
          this.errorMessage = '';
          this.submittedSuccessfully = true;

          // Limpar campos
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erro ao alterar a palavra-passe.';
          this.successMessage = '';
          this.submittedSuccessfully = false;
        }
      });
  }

  goBackToLogin() {
    this.router.navigate(['/login']);
  }
}
