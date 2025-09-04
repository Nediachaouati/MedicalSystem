import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getNotifications(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/read/${id}`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
