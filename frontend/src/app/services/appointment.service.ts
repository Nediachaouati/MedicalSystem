import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '../environments/environment';
import { Appointment } from '../models/appointment';
import { Symptom } from '../models/symptom';
import { Prescription } from '../models/Prescription';
import { User } from '../models/user';
import { UserService } from './user-service';


@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;
  private symptomsApiUrl = `${environment.apiUrl}/symptoms`;
  private prescriptionsApiUrl = `${environment.apiUrl}/prescriptions`;

  constructor(private http: HttpClient,
    private userService: UserService
  ) {}

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

  updateAppointmentStatus(appointmentId: number, appointmentStatus: string): Observable<Appointment> {
    return this.http.patch<Appointment>(
      `${this.apiUrl}/${appointmentId}/appointment-status`,
      { appointmentStatus },
      { headers: this.getAuthHeaders() }
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

  updateConsultationStatus(appointmentId: number, consultationStatus: string): Observable<Appointment> {
    return this.http.patch<Appointment>(
      `${this.apiUrl}/${appointmentId}/consultation-status`,
      { consultationStatus },
      { headers: this.getAuthHeaders() }
    );
  }

  createPrescription(prescription: Prescription): Observable<Prescription> {
  return this.http.post<Prescription>(this.prescriptionsApiUrl, prescription, {
    headers: this.getAuthHeaders(),
  });
}

  updatePrescription(id: number, prescription: Prescription): Observable<Prescription> {
    console.log('Updating prescription with ID:', id, 'to:', `${this.prescriptionsApiUrl}/${id}`);
    return this.http.patch<Prescription>(`${this.prescriptionsApiUrl}/${id}`, prescription, {
      headers: this.getAuthHeaders(),
    });
  }

  getPrescriptionsByAppointment(appointmentId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.prescriptionsApiUrl}/appointment/${appointmentId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  generatePrescriptionPdf(appointmentId: number): Observable<Blob> {
    console.log('Requesting PDF from:', `${this.prescriptionsApiUrl}/appointment/${appointmentId}/pdf`);
    return this.http.get(`${this.prescriptionsApiUrl}/appointment/${appointmentId}/pdf`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
    });
  }


}
  


