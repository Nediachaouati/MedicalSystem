// src/app/components/secretaire/doctor-availability/doctor-availability.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,NavbarComponent,SidebarComponent],
  templateUrl: './doctor-availability.component.html',
  styleUrls: ['./doctor-availability.component.css']
})
export class DoctorAvailabilityComponent implements OnInit {
  form: FormGroup;
  availabilities: Availability[] = [];
  editingId: number | null = null;
  editForm: FormGroup;

  private readonly API = 'http://localhost:3000/availability';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      date: [''],
      startTime: [''],
      endTime: ['']
    });

    this.editForm = this.fb.group({
      date: [''],
      startTime: [''],
      endTime: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailabilities();
  }

  // Utilise exactement la même logique que ton AppointmentService
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token') || '';
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  loadAvailabilities(): void {
    this.http.get<Availability[]>(`${this.API}/my-doctor`, this.getAuthHeaders())
      .subscribe({
        next: (data) => this.availabilities = data,
        error: () => this.showToast('Erreur de chargement. Reconnectez-vous.', 'error')
      });
  }

  addAvailability(): void {
    if (this.form.invalid) return;

    const payload = {
      date: this.form.value.date,
      startTime: this.form.value.startTime + ':00',
      endTime: this.form.value.endTime + ':00'
    };

    this.http.post(`${this.API}/add`, payload, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.form.reset();
          this.loadAvailabilities();
          this.showToast('Journée ajoutée avec succès !');
        },
        error: () => this.showToast('Erreur : date invalide ou déjà prise', 'error')
      });
  }

  deleteAvailability(id: number): void {
    if (!confirm('Supprimer cette journée ?')) return;

    this.http.delete(`${this.API}/${id}`, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.loadAvailabilities();
          this.showToast('Journée supprimée !');
        },
        error: () => this.showToast('Erreur lors de la suppression', 'error')
      });
  }

  startEdit(avail: Availability): void {
    this.editingId = avail.id;
    this.editForm.patchValue({
      date: avail.date,
      startTime: avail.startTime.substring(0, 5),
      endTime: avail.endTime.substring(0, 5)
    });
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editingId || this.editForm.invalid) return;

    const payload = {
      date: this.editForm.value.date,
      startTime: this.editForm.value.startTime + ':00',
      endTime: this.editForm.value.endTime + ':00'
    };

    this.http.put(`${this.API}/${this.editingId}`, payload, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.editingId = null;
          this.loadAvailabilities();
          this.showToast('Journée modifiée !');
        },
        error: () => this.showToast('Erreur lors de la modification', 'error')
      });
  }

  // Toast magnifique
  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      z-index: 10000;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      animation: slideUp 0.4s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  getSlotCount(start: string, end: string): number {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return Math.max(0, Math.floor(diff / 20));
  }
}