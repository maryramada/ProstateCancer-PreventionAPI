import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormAnswers, Patient } from '../patient';
import { Observable, map } from 'rxjs';
import { User } from '../user';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private baseUrl = 'http://localhost:8080/med';

  // Necessário pois esta classe faz as requisições HTTP 
  constructor(private http: HttpClient) { }

  // Método para fazer POST de um novo paciente
  createPatient(newPatient: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.baseUrl + '/Register/Patient', newPatient);
  }

  // GET para carregar a lista de pacientes
  listPatients(physicianId: string): Observable<Patient[]> {
    const token = localStorage.getItem('userToken') || '';
    const headers = new HttpHeaders().set('x-access-token', token);
    const url = `${this.baseUrl}/ListPatients/${physicianId}`;
    return this.http.get<{ patients: Patient[] }>(url, { headers }).pipe(
      map(response => response.patients)
    );
  }




  // Obter o paciente através do seu ID de paciente
  getPatientbyID(PatientId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/patients/${PatientId}`);
  }

  // Método utilizado para enviar as respostas do questionário através de um PUT (para além de gerar e enviar os alertas gerados)
  updateQuestionnaire(
    PatientId: string | null,
    formAnswers: any,
    token: string | null
  ): Observable<{ message: string; alerts: string[] }> {
    if (!PatientId) {
      throw new Error('PatientId é obrigatório');
    }
  
    const url = `${this.baseUrl}/patients/questionnaire/${PatientId}`;
    const headers = new HttpHeaders({
      'x-access-token': token || '',
      'Content-Type': 'application/json'
    });
  
    // **Importante: retornar o Observable**
    return this.http.put<{ message: string; alerts: string[] }>(
      url,
      { formAnswers },
      { headers }
    );
  }

  getPatientById(patientId: string): Observable<Patient> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ patient: Patient }>(`http://localhost:8080/med/patients/${patientId}`, { headers })
      .pipe(map(response => response.patient));
  }

  // Vai buscar um paciente usando o userID
  getPatientByUserId(userId: string): Observable<Patient> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ patient: Patient }>(`http://localhost:8080/med/patients/user/${userId}`, { headers })
      .pipe(map(response => response.patient));
  }

  getAuthHeaders(): HttpHeaders {
    // Sempre pega do localStorage para garantir persistência
    const token = localStorage.getItem('userToken') || '';
    return new HttpHeaders().set('x-access-token', token);
  }

  updatePatient(userId: string, updatedData: any, token: string | null): Observable<any> {
    const url = `${this.baseUrl}/patients/update/${userId}`;

    const headers = new HttpHeaders({
      'x-access-token': token || '',
      'Content-Type': 'application/json'
    });

    // Envie direto o objeto, sem envolver em updatedData
    return this.http.put(url, { updatedData }, { headers });

  }


  // No PatientService:
  getUserById(userId: string): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ user: User }>(`http://localhost:8080/med/patients/user/${userId}`, { headers })
      .pipe(map(response => response.user));
  }

  clearAlerts(patientId: string) {
    return this.http.delete(`/api/users/alerts/clear/${patientId}`);
  }

  deleteAllAlerts(
    patientId: string,
    token: string
  ): Observable<{ message: string; patient: Patient }> {
    const url = `${this.baseUrl}/patients/${patientId}/alerts`;
    console.log(' Calling DELETE', url);
    const headers = new HttpHeaders({ 'x-access-token': token });
    return this.http.delete<{ message: string; patient: Patient }>(url, { headers });
  }

  deleteAlert(
    patientId: string,
    alertIndex: number,
    token: string
  ): Observable<{ message: string; patient: Patient }> {
    const url = `${this.baseUrl}/patients/${patientId}/alerts/${alertIndex}`;
    const headers = new HttpHeaders({ 'x-access-token': token });
    return this.http.delete<{ message: string; patient: Patient }>(url, { headers });
  }
}

