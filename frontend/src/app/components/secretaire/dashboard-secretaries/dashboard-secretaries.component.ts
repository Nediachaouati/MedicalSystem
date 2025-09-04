import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { User } from '../../../models/user';
import { Appointment } from '../../../models/appointment';
import { UserService } from '../../../services/user-service';
import { AppointmentService } from '../../../services/appointment.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard-secretaries',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './dashboard-secretaries.component.html',
  styleUrls: ['./dashboard-secretaries.component.css'],
})
export class DashboardSecretariesComponent implements OnInit {
  currentSecretary: User | null = null;
  doctorId: number | undefined;
  appointments: Appointment[] = [];
  errorMessage: string | null = null;

  constructor(
    private userService: UserService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.currentSecretary = user;
        this.doctorId = user.medecinId;
        if (this.doctorId) {
          this.loadAppointments();
        } else {
          this.errorMessage = 'Aucun médecin assigné à ce secrétaire.';
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.errorMessage = 'Erreur lors de la récupération des informations du secrétaire.';
      },
    });
  }

  loadAppointments() {
    if (!this.doctorId) return;
    this.appointmentService.getAppointmentsByDoctor(this.doctorId).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        this.errorMessage = `Erreur lors de la récupération des rendez-vous: ${error.message}`;
      },
    });
  }

  confirmAppointment(appointmentId: number) {
    this.appointmentService.updateAppointmentStatus(appointmentId, 'confirmé').subscribe({
      next: () => {
        this.appointments = this.appointments.map((app) =>
          app.id === appointmentId ? { ...app, status: 'confirmé' } : app
        );
        this.errorMessage = null;
        Swal.fire({
          title: 'Succès !',
          text: 'Le rendez-vous a été approuvé et un e-mail de confirmation a été envoyé au patient.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      },
      error: (error) => {
        console.error('Erreur lors de la confirmation du rendez-vous:', error);
        this.errorMessage = 'Erreur lors de la confirmation du rendez-vous.';
        Swal.fire({
          title: 'Erreur',
          text: 'Une erreur s\'est produite lors de la confirmation du rendez-vous.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      },
    });
  }

  refuseAppointment(appointmentId: number) {
    this.appointmentService.updateAppointmentStatus(appointmentId, 'refusé').subscribe({
      next: () => {
        this.appointments = this.appointments.map((app) =>
          app.id === appointmentId ? { ...app, status: 'refusé' } : app
        );
        this.errorMessage = null;
        Swal.fire({
          title: 'Succès !',
          text: 'Le rendez-vous a été refusé.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      },
      error: (error) => {
        console.error('Erreur lors du refus du rendez-vous:', error);
        this.errorMessage = 'Erreur lors du refus du rendez-vous.';
        Swal.fire({
          title: 'Erreur',
          text: 'Une erreur s\'est produite lors du refus du rendez-vous.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      },
    });
  }
}