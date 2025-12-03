import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  status: 'disponible' | 'occupé';
}

interface Doctor {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.css'],
  providers: [DatePipe]
})
export class BookAppointmentComponent implements OnInit {
  medecinId!: number;
  medecinName: string = 'Chargement...';
  selectedDate: string = '';
  selectedSlot: TimeSlot | null = null;
  slots: TimeSlot[] = [];
  loading = false;

  private API = 'http://localhost:3000/availability/slots';
  private token = localStorage.getItem('access_token') || '';

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.medecinId = +this.route.snapshot.paramMap.get('medecinId')!;

    if (!this.medecinId || isNaN(this.medecinId)) {
      Swal.fire('Erreur', 'Médecin non trouvé', 'error');
      this.router.navigate(['/patient/doctors']);
      return;
    }

    this.loadDoctorName();
  }

  private loadDoctorName(): void {
    this.http.get<Doctor>(`http://localhost:3000/users/${this.medecinId}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: (doctor) => {
        this.medecinName = doctor.name ? `Dr. ${doctor.name}` : 'Médecin';
      },
      error: () => {
        this.medecinName = 'Médecin';
      }
    });
  }

  loadAvailableSlots(): void {
    if (!this.selectedDate) return;

    this.loading = true;
    this.selectedSlot = null;

    this.http.get<TimeSlot[]>(this.API, {
      params: { medecinId: this.medecinId, date: this.selectedDate },
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: (data) => {
        this.slots = data.filter(s => s.status === 'disponible');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Erreur', 'Impossible de charger les créneaux', 'error');
      }
    });
  }

  selectSlot(slot: TimeSlot): void {
    if (slot.status === 'occupé') return;
    this.selectedSlot = slot;
  }

  confirmAppointment(): void {
    if (!this.selectedSlot) return;

    const payload = { timeSlotId: this.selectedSlot.id };

    this.http.post<{ appointment: { id: number } }>('http://localhost:3000/appointments/book-slot', payload, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: (response) => {
        const appointmentId = response.appointment.id;

        Swal.fire({
          title: 'Rendez-vous confirmé !',
          html: `
            <p>avec <strong>${this.medecinName}</strong></p>
            <p>Le <strong>${this.formatDate(this.selectedDate)}</strong></p>
            <p>À <strong>${this.selectedSlot!.startTime.substring(0,5)}</strong></p>
            <br>
            <p><strong>Maintenant, décrivez vos symptômes</strong></p>
          `,
          icon: 'success',
          confirmButtonText: 'Aller aux symptômes'
        }).then(() => {
          // REDIRECTION VERS LE FORMULAIRE DES SYMPTÔMES
          this.router.navigate(
            [`/patient/symptoms/new/${this.medecinId}`],
            { queryParams: { appointmentId } }
          );
        });
      },
      error: () => {
        Swal.fire('Oups !', 'Ce créneau a été pris par un autre patient.', 'warning');
        this.loadAvailableSlots();
      }
    });
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}