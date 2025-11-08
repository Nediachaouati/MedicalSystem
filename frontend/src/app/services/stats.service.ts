import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StatsResponse {
  doctors: number;
  secretaries: number;
  chartData: { month: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = 'http://localhost:3000/users/stats';

  constructor(private http: HttpClient) {}

  getStats(): Observable<StatsResponse> {
    const token = localStorage.getItem('access_token'); // ← Récupère le token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<StatsResponse>(this.apiUrl, { headers });
  }
}