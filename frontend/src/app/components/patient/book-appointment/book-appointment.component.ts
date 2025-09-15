import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { AppointmentService } from '../../../services/appointment.service';
import { UserService } from '../../../services/user-service';
import { Appointment } from '../../../models/appointment';
import { User } from '../../../models/user';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.css'],
})
export class BookAppointmentComponent implements OnInit {
  currentPatient: User | null = null;
  appointment: Appointment = {
    id: 0,
    patientId: 0,
    medecinId: 0,
    date: '',
    time: '',
    appointmentStatus: 'en_attente',
    consultationStatus: null,
  };
  errorMessage: string | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.currentPatient = user;
        this.appointment.patientId = user.id;
        const medecinId = this.route.snapshot.paramMap.get('medecinId');
        if (medecinId) {
          this.appointment.medecinId = +medecinId;
        } else {
          this.errorMessage = 'Aucun médecin sélectionné.';
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.errorMessage = 'Erreur lors de la récupération des informations du patient.';
      },
    });
  }

  bookAppointment() {
    if (!this.appointment.medecinId) {
      this.errorMessage = 'Aucun médecin sélectionné.';
      Swal.fire({
        title: 'Erreur',
        text: 'Veuillez sélectionner un médecin.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }
    this.appointmentService.createAppointment(this.appointment).subscribe({
      next: (createdAppointment) => {
        this.errorMessage = null;
        Swal.fire({
          title: 'Succès !',
          text: 'Votre rendez-vous a été soumis pour approbation. Veuillez ajouter vos symptômes.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        console.log('Created Appointment ID:', createdAppointment.id);
        this.router.navigate([`/patient/symptoms/new/${this.appointment.medecinId}`], {
          queryParams: { appointmentId: createdAppointment.id },
        });
        this.appointment = {
          id: 0,
          patientId: this.currentPatient?.id || 0,
          medecinId: this.appointment.medecinId,
          date: '',
          time: '',
          appointmentStatus: 'en_attente',
          consultationStatus: null,
        };
      },
      error: (error) => {
        console.error('Erreur lors de la création du rendez-vous:', error);
        this.errorMessage = 'Erreur lors de la création du rendez-vous.';
        Swal.fire({
          title: 'Erreur',
          text: 'Une erreur s\'est produite lors de la création du rendez-vous.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      },
    });
  }
}