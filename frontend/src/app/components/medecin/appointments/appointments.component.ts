import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { User } from '../../../models/user';
import { Appointment } from '../../../models/appointment';
import { UserService } from '../../../services/user-service';
import { AppointmentService } from '../../../services/appointment.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
})
export class AppointmentsComponent implements OnInit {
  currentDoctor: User | null = null;
  appointments: Appointment[] = [];
  errorMessage: string | null = null;

  constructor(
    private userService: UserService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.currentDoctor = user;
        if (user.id) {
          console.log('Fetching appointments for doctor ID:', user.id);
          this.loadAppointments(user.id);
        } else {
          this.errorMessage = 'Impossible de récupérer l\'identifiant du médecin.';
          console.error('No doctor ID found in user profile');
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.errorMessage = 'Erreur lors de la récupération des informations du médecin.';
      },
    });
  }

  loadAppointments(medecinId: number) {
    this.appointmentService.getAppointmentsByDoctor(medecinId).subscribe({
      next: (appointments) => {
        console.log('Appointments received:', appointments);
        this.appointments = appointments;
        this.errorMessage = null;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        this.errorMessage = `Erreur lors de la récupération des rendez-vous: ${error.message || 'Erreur inconnue'}`;
      },
    });
  }
}