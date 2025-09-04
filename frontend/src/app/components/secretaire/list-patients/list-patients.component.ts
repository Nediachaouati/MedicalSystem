import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { User } from '../../../models/user';
import { AppointmentService } from '../../../services/appointment.service';
import { UserService } from '../../../services/user-service';
import { NavbarComponent } from "../../../navbar/navbar.component";
import { SidebarComponent } from "../../../sidebar/sidebar.component";

@Component({
  selector: 'app-list-patients',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './list-patients.component.html',
  styleUrls: ['./list-patients.component.css'],
})
export class ListPatientsComponent implements OnInit {
  currentSecretary: User | null = null;
  doctorId: number | undefined;
  patients: User[] = [];
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
          this.loadPatients();
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

  loadPatients() {
    if (!this.doctorId) return;

    console.log('Doctor ID:', this.doctorId); // Log pour débogage

    this.appointmentService.getAppointmentsByDoctor(this.doctorId).subscribe({
      next: (appointments) => {
        console.log('Rendez-vous récupérés:', appointments); // Log pour débogage
        // Extraire les patientId uniques des rendez-vous
        const patientIds = [...new Set(
          appointments
            .filter((app) => app.patientId)
            .map((app) => app.patientId)
        )];
        console.log('Patient IDs:', patientIds); // Log pour débogage

        // Récupérer les patients associés aux patientId
        if (patientIds.length > 0) {
          this.userService.getUsersByIds(patientIds).subscribe({
            next: (users) => {
              console.log('Patients récupérés:', users); // Log pour débogage
              this.patients = users;
            },
            error: (error) => {
              console.error('Erreur lors de la récupération des patients:', error);
              this.errorMessage = `Erreur lors de la récupération des patients: ${error.message}`;
            },
          });
        } else {
          this.patients = []; // Aucun patient si aucun patientId
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        this.errorMessage = `Erreur lors de la récupération des rendez-vous: ${error.message}`;
      },
    });
  }
}