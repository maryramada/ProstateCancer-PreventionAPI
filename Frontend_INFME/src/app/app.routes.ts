import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { PhysicianComponent } from './physician/physician.component';
import { PatientComponent } from './patient/patient.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { AdminComponent } from './admin/admin.component';
import { ChangePasswordComponent } from './password/change-password.component';
import { HomePageComponent } from './home-page/home-page.component';
import { PatientEditComponent } from './patient-edit/patient-edit.component';
import { PhysicianEditComponent } from './physician-edit/physician-edit.component';



export const routes: Routes = [
  { path: '', component: HomePageComponent },
 { path: '', redirectTo: 'login', pathMatch: 'full' }, 
  { path: 'login', component: LoginComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: 'register', component: RegisterComponent },
  { path: 'physician', component: PhysicianComponent },
  { path: 'patient', component: PatientComponent },
  { path: 'questionnaire', component: QuestionnaireComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'patient-edit', component: PatientEditComponent },
  { path: 'physician', component: PhysicianComponent },
  { path: 'physician/edit', component: PhysicianEditComponent },
  { path: '**', redirectTo: 'physician' }
];
