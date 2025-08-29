import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';

@Component({
  selector: 'app-patient-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-edit.component.html',
  styleUrls: ['./patient-edit.component.css']
})
export class PatientEditComponent implements OnInit {

  // Campos do formulário
  name: string = '';
  email: string = '';

  // ID e token
  userId: string | null = null;
  token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private patientService: PatientService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser;

    if (user) {
      this.name = user.name;
      this.email = user.email;
      this.userId = user._id;
    }

    this.token = localStorage.getItem('userToken');

    if (!this.token) {
      alert('Token não encontrado. Faça login novamente.');
      this.router.navigate(['/login']);
    }
  }

  get updatedData() {
    return {
      name: this.name,
      email: this.email,
    };
  }


  save(): void {
    console.log('Valores no save():', { name: this.name, email: this.email });
    console.log('Objeto enviado:', this.updatedData);

    if (!this.name || !this.email) {
      alert('Nome e email são obrigatórios.');
      return;
    }

    if (!this.userId || !this.token) {
      alert('Paciente ou token inválidos. Faça login novamente.');
      this.router.navigate(['/login']);
      return;
    }

    this.patientService.updatePatient(this.userId, this.updatedData, this.token).subscribe({
      next: (response) => {
        console.log('Resposta da API:', response);
        alert('Dados atualizados com sucesso!');

        // Atualiza o usuário atual no serviço de autenticação
        if (response.user) {
          this.authService.currentUser = response.user;
          // Se você usa localStorage para guardar o usuário, atualize também:
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }

        this.router.navigate(['/patient']);
      },
      error: (error) => {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao atualizar os dados. Veja o console para detalhes.');
      }
    });

  }


  cancel(): void {
    this.router.navigate(['/patient']);
  }
}
