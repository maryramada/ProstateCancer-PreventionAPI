import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { User } from '../user';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Patient } from '../patient';
import { Physician } from '../physician';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:8080/med';  // URL base da API backend

  // Variáveis para armazenar dados do usuário e tokens na memória
  currentUser: User = {
    name: '',
    password: '',
    email: '',
    isAdmin: false,
    _id: ''
  };

  currentPatient: Patient = {
    physician: '', 
    user: {
      name: '',
      email: '',
    },
    formAnswers: {
      personalInfo: { age: null, gender: null, maritalStatus: null },
      medicalHistory: { comorbidities: [], priorCancerDiagnosis: null, prostateIssuesHistory: null, lastPSATestDate: null },
      lifestyle: { exercisesRegularly: null, smokes: null, drinksAlcohol: null, dietQuality: null },
      familyHistory: { cancer: null, prostateCancer: null, heartDisease: null }
    },
    alerts: [{ alertNumber: 0, message: [] }],
    riskAssessment: { riskLevel: 'Low' },
    lastCheckup: null,
    _id: ''
  };

  userId: string = '';
  userToken: string | null = null;
  userType: string | null = null;
  physicianID: string | null = null;
  patientID: string | null = null;

  constructor(private http: HttpClient, private router: Router) {
    // Ao inicializar o serviço, tenta carregar os dados do localStorage (se estiver no navegador)
    if (typeof window !== 'undefined') {
      this.userToken = localStorage.getItem('userToken');
      this.userId = localStorage.getItem('userId') || '';
      this.userType = localStorage.getItem('userType');
      this.physicianID = localStorage.getItem('physicianID');
      this.patientID = localStorage.getItem('patientID');
    }
  }

  /**
   * Realiza login no backend com email e senha.
   * Se bem sucedido, armazena token e dados no localStorage e memória.
   */
  login(email: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = JSON.stringify({ email, password });

    return this.http.post(`${this.baseUrl}/login`, body, { headers }).pipe(
      switchMap((response: any) => {
        if (response && response.token) {
          // Armazena token, userId e userType localmente e no localStorage
          this.setToken(response.token);
          this.setUserId(response.userId);
          this.setUserType(response.userType);

          // Após guardar o token, busca os dados completos do usuário
          return this.getCurrentUser().pipe(
            switchMap((user: User) => {
              this.currentUser = user;

              // Se for médico, busca o ID do physician 
              if (response.userType === 'physician') {
                return this.fetchPhysicianId(response.userId).pipe(
                  map((physicianId: string) => {
                    this.physicianID = physicianId;
                    localStorage.setItem('physicianID', physicianId);
                    return response;
                  })
                );
              }
              // Se for paciente, busca os dados do paciente
              else if (response.userType === 'patient') {
                return this.fetchPatientById(response.userId).pipe(
                  map((patient: Patient) => {
                    this.currentPatient = patient;
                    this.patientID = patient._id;  
                    localStorage.setItem('patientID', patient._id);
                    return response;
                  })
                );
              }
              // Caso contrário, apenas retorna a resposta
              else {
                return of(response);
              }
            })
          );
        }
        // Se não retornar token, retorna null
        return of(null);
      })
    );
  }

  /**
   * Cria um novo usuário
   */
  createUser(user: User): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Register/User`, user);
  }

  /**
   * Retorna a lista de usuários (requer token)
   */
  getUsers(): Observable<any> {
    const token = localStorage.getItem('userToken');
    console.log('Token no frontend:', token);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-access-token': token ?? ''
    });
  
    return this.http.get<any>(`${this.baseUrl}/ListUsers`, { headers }).pipe(
      catchError(error => {
        console.error('Erro ao buscar utilizadores', error);
        return throwError(() => error);
      })
    );
  }
  /**
   * Vai buscar um médico (Physician) pelo ID do usuário
   */
  fetchPhysician(userId: string | null): Observable<Physician | null> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/physicians/user/${userId}`;
    return this.http.get<{ physician: Physician | null }>(url, { headers }).pipe(
      map(response => response?.physician || null),
      catchError(error => {
        console.error('Erro ao buscar médico:', error);
        return of(null);
      })
    );
  }

  /**
   * Vai buscar o ID do médico pelo ID do usuário
   */
  public fetchPhysicianId(userId: string): Observable<string> {
    const token = localStorage.getItem('userToken');
  
    if (!token) {
      console.error('Token não encontrado no localStorage!');
      return throwError(() => new Error('Token ausente'));
    }
  
    const headers = new HttpHeaders({
      'x-access-token': token,
      'Content-Type': 'application/json'
    });
  
    const url = `${this.baseUrl}/physicians/user/${userId}`;
    console.log('GET:', url, '| Token:', token);
  
    return this.http.get<{ physicianId: string }>(url, { headers }).pipe(
      map(response => response.physicianId),
      catchError(err => {
        console.error(' Erro ao obter physicianId:', err);
        return throwError(() => err);
      })
    );
  }
  
  

  /**
   * Vai buscar paciente pelo ID do usuário
   */
  fetchPatientById(userId: string): Observable<Patient> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ patient: Patient }>(`${this.baseUrl}/patients/user/${userId}`, { headers }).pipe(
      map(response => response.patient)
    );
  }

  /**
   * Lista pacientes por ID do médico
   */
  listPatientByPhysicianId(physicianId: string): Observable<Patient[]> {
    const token = localStorage.getItem('token');
    const headers = this.getAuthHeaders();
    return this.http.get<{ patients: Patient[] }>(`${this.baseUrl}/ListPatients/${physicianId}`, { headers }).pipe(
      map(response => response.patients)
    );
  }
  
  

  /**
   * Vai buscar os dados do usuário atual
   */
  getCurrentUser(): Observable<User> {
    const headers = this.getAuthHeaders();
    const user_id = this.userId || '';
    return this.http.get<{ user: User }>(`${this.baseUrl}/user/${user_id}`, { headers }).pipe(
      map(response => response.user)
    );
  }

  /**
   * Deleta um usuário pelo ID
   */
  deleteUser(userId?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.baseUrl}/DeleteUser/${userId}`, { headers }).pipe(
      catchError(error => {
        throw 'Erro ao excluir o utilizador: ' + error.message;
      })
    );
  }

  /**
   * Retorna o token do usuário atual
   */
  getCurrentUserToken(): string | null {
    return this.userToken;
  }

  /**
   * Busca dados do paciente atual pelo ID salvo
   */
  getCurrentPatient(): Observable<Patient> {
    const patient_id = this.patientID || '';
    const headers = this.getAuthHeaders(); 
    console.log('DEBUG | getCurrentPatient() usando ID:', patient_id);
    return this.http.get<{ patient: Patient }>(`${this.baseUrl}/patients/${patient_id}`, { headers }).pipe(
      map(response => {
        console.log('✅ Resposta do backend (getCurrentPatient):', response);
        return response.patient;
      }),
      catchError(err => {
        console.error('❌ Erro no getCurrentPatient:', err);
        return throwError(err);
      })
    );
  }

  /**
   * Remove todos os dados armazenados e limpa localStorage ao fazer logout
   */
  logout(): void {
    this.userToken = null;
    this.userId = '';
    this.userType = null;
    this.physicianID = null;
    this.patientID = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userType');
      localStorage.removeItem('physicianID');
      localStorage.removeItem('patientID');
    }

    this.currentUser = {
      name: '',
      password: '',
      email: '',
      isAdmin: false,
      _id: ''
    };

    this.currentPatient = {
      physician: '', 
      user: {
        name: '',
        email: '',
      }, 
      formAnswers: {
        personalInfo: { age: null, gender: null, maritalStatus: null },
        medicalHistory: { comorbidities: [], priorCancerDiagnosis: null, prostateIssuesHistory: null, lastPSATestDate: null },
        lifestyle: { exercisesRegularly: null, smokes: null, drinksAlcohol: null, dietQuality: null },
        familyHistory: { cancer: null, prostateCancer: null, heartDisease: null }
      },
      alerts: [{ alertNumber: 0, message: [] }],
      riskAssessment: { riskLevel: null },
      lastCheckup: null,
      _id: ''
    };
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  /**
   * Define o token na memória e localStorage
   */
  setToken(token: string): void {
    this.userToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('userToken', token);
    }
  }

  /**
   * Define o tipo de usuário na memória e localStorage
   */
  setUserType(userType: string): void {
    this.userType = userType;
    if (typeof window !== 'undefined') {
      localStorage.setItem('userType', userType);
    }
  }

  /**
   * Define o ID do usuário na memória e localStorage
   */
  setUserId(userId: string): void {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('userId', userId);
    }
  }

  /**
   * Retorna os headers com o token de autenticação para requisições HTTP
   */
  getAuthHeaders(): HttpHeaders {
    // Sempre pega do localStorage para garantir persistência
    const token = localStorage.getItem('userToken') || '';
    return new HttpHeaders().set('x-access-token', token);
  }

  changePassword(email: string, oldPassword: string, newPassword: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.baseUrl}/change-password`, { email, oldPassword, newPassword }, { headers });
  }
  
  getUserTypeById(userId: string): Observable<{ userType: string }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ userType: string }>(`${this.baseUrl}/user/${userId}/type`, { headers });
  }

  getPhysiciansBySpecialty(specialty: string): Observable<Physician[]> {
    const headers = this.getAuthHeaders(); 
    return this.http.get<Physician[]>(
      `${this.baseUrl}/physicians/specialty/${encodeURIComponent(specialty)}`,
      { headers }
    );
  }
  public fetchPhysicianByPhysicianId(physicianId: string): Observable<Physician | null> {
    const token = localStorage.getItem('userToken');
    if (!token) {
      console.error('Token não encontrado no localStorage!');
      return throwError(() => new Error('Token ausente'));
    }
    const headers = new HttpHeaders({
      'x-access-token': token,
      'Content-Type': 'application/json'
    });
    const url = `${this.baseUrl}/physicians/${physicianId}`; // <--- Aqui mudou para physicianId
    console.log('GET:', url, '| Token:', token);
  
    return this.http.get<{ physician: Physician }>(url, { headers }).pipe(
      map(response => response.physician || null),
      catchError(err => {
        console.error('Erro ao obter physician:', err);
        return throwError(() => err);
      })
    );
  }


  getPatientById(patientId: string): Observable<Patient> {
    const url = `${this.baseUrl}/patients/${patientId}`;
    const headers = this.getAuthHeaders();
    return this.http.get<{ patient: Patient }>(url, { headers })
      .pipe(map(response => response.patient));
  }

  getPhysicianById(id: string): Observable<Physician> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/physicians/${id}`;
    return this.http.get<{ success: boolean; message: string; physician: Physician }>(url, { headers }).pipe(
      map(response => response.physician)
    );
  }

  updatePhysician(id: string, data: any): Observable<any> {
    const url = `${this.baseUrl}/physicians/${id}`;  
    const headers = this.getAuthHeaders();
    return this.http.put(url, data, { headers });
  }

  updatePatient(patientId: string, updatedData: any): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/patients/${patientId}`, updatedData);
  }
  
  
  
}