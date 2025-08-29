import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Physician } from '../physician';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PhysicianService {

  private baseUrl = 'http://localhost:8080/med';  // URL base da aplicação backend

  constructor(private http: HttpClient) { }

    // Método para fazer POST de um novo médico
  createPhysician(newPhysician: Physician): Observable<Physician> {
    return this.http.post<Physician>( this.baseUrl + '/Register/Physician' , newPhysician);
   }
}
