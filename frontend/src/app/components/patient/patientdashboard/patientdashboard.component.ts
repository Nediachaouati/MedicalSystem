import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { UserService } from '../../../services/user-service';
import { User } from '../../../models/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patientdashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './patientdashboard.component.html',
  styleUrls: ['./patientdashboard.component.css'],
})
export class PatientdashboardComponent implements OnInit {
  doctors: User[] = [];
  errorMessage: string | null = null;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.fetchDoctors();
  }

  fetchDoctors() {
    this.userService.getDoctors().subscribe({
      next: (response) => {
        console.log('Médecins récupérés:', response);
        this.doctors = response;
        this.errorMessage = null;
      },
      error: (error) => {
        console.error('Erreur récupération médecins:', error);
        this.errorMessage = error.status === 401
          ? 'Veuillez vous reconnecter (session expirée).'
          : `Échec récupération médecins: ${error.message || 'Erreur inconnue'}`;
      },
    });
  }

  bookAppointment(doctorId: number | undefined) {
    if (doctorId === undefined) {
      this.errorMessage = 'ID du médecin non défini.';
      return;
    }
    this.router.navigate([`/patient/appointments/new/${doctorId}`]);
  }
}