import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Physician } from '../physician';

@Component({
    selector: 'app-physician-edit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './physician-edit.component.html',
    styleUrls: ['./physician-edit.component.css']
})
export class PhysicianEditComponent implements OnInit {
    physicianProfile?: Physician;
    daysOfWeek = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
    loading = true;
    error = '';
    location: any;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const pid = this.authService.physicianID;
        if (!pid) {
            this.error = 'Physician ID não definido.';
            return;
        }
        this.authService.getPhysicianById(pid).subscribe({
            next: profile => {
                this.physicianProfile = profile;
                this.loading = false;
            },
            error: err => {
                console.error('Erro ao carregar perfil', err);
                this.error = 'Erro ao carregar perfil';
                this.loading = false;
            }
        });
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
                this.router.navigate(['/physician']);
            },
            error: err => {
                console.error('Falha ao atualizar perfil', err);
                alert('Falha ao atualizar perfil');
            }
        });
    }

    addSlot(): void {
        this.physicianProfile!.availability = this.physicianProfile!.availability || [];
        this.physicianProfile!.availability.push({ dayOfWeek: '', from: '', to: '' });
    }

    removeSlot(i: number): void {
        this.physicianProfile!.availability.splice(i, 1);
    }

    goBack() {
        this.router.navigate(['/physician']);
    }

}