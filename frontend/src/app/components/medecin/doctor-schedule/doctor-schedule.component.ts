// src/app/components/medecin/doctor-schedule/doctor-schedule.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

interface Availability {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './doctor-schedule.component.html',
  styleUrls: ['./doctor-schedule.component.css']
})
export class DoctorScheduleComponent implements OnInit {
  availabilities: Availability[] = [];
  private API = 'http://localhost:3000/availability';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMySchedule();
  }

  private getHeaders() {
    const token = localStorage.getItem('access_token') || '';
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  loadMySchedule(): void {
    this.http.get<Availability[]>(`${this.API}/my-schedule`, this.getHeaders())
      .subscribe({
        next: (data) => this.availabilities = data,
        error: () => alert('Erreur de chargement de vos horaires')
      });
  }

  formatTime(time: string): string {
    return time.substring(0, 5);
  }

  formatDate(date: string): string {
    const parsed = Date.parse(date);
    if (isNaN(parsed)) return date;

    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // AJOUT DE LA FONCTION MANQUANTE
  getDuration(start: string, end: string): string {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} h`;
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }
}