import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Appointment } from '../models/appointment';
import { Symptom } from '../models/symptom';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;
  private symptomsApiUrl = `${environment.apiUrl}/symptoms`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getAppointmentsByPatient(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAppointmentsByDoctor(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  createAppointment(appointment: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment, {
      headers: this.getAuthHeaders(),
    });
  }

  createSymptom(symptom: Symptom): Observable<Symptom> {
    return this.http.post<Symptom>(this.symptomsApiUrl, symptom, {
      headers: this.getAuthHeaders(),
    });
  }

  updateAppointmentStatus(appointmentId: number, status: string): Observable<Appointment> {
    return this.http.patch<Appointment>(
      `${this.apiUrl}/${appointmentId}/status`,
      { status },
      { headers: this.getAuthHeaders() },
    );
  }

  updateSymptomAppointmentId(symptomId: number, appointmentId: number): Observable<Symptom> {
    console.log('Updating symptom', symptomId, 'with appointmentId', appointmentId);
    return this.http.patch<Symptom>(
      `${this.symptomsApiUrl}/${symptomId}/appointment`,
      { appointmentId },
      { headers: this.getAuthHeaders() },
    );
  }
}