import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { User } from '../../../models/user';
import { Appointment } from '../../../models/appointment';
import { UserService } from '../../../services/user-service';
import { AppointmentService } from '../../../services/appointment.service';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './my-appointments.component.html',
  styleUrls: ['./my-appointments.component.css'],
})
export class MyAppointmentsComponent implements OnInit {
  currentPatient: User | null = null;
  appointments: Appointment[] = [];
  errorMessage: string | null = null;

  constructor(
    private userService: UserService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.currentPatient = user;
        if (user.id) {
          this.loadAppointments(user.id);
        } else {
          this.errorMessage = 'Impossible de récupérer l\'identifiant du patient.';
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.errorMessage = 'Erreur lors de la récupération des informations du patient.';
      },
    });
  }

  loadAppointments(patientId: number) {
    this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        this.errorMessage = `Erreur lors de la récupération des rendez-vous: ${error.message}`;
      },
    });
  }
}