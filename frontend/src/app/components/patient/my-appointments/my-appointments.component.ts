import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { User } from '../../../models/user';
import { Appointment } from '../../../models/appointment';
import { UserService } from '../../../services/user-service';
import { AppointmentService } from '../../../services/appointment.service';
import { saveAs } from 'file-saver';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './my-appointments.component.html',
  styleUrls: ['./my-appointments.component.css'],
})
export class MyAppointmentsComponent implements OnInit {
  currentPatient: User | null = null;
  appointments: Appointment[] = [];
  errorMessage: string | null = null;

  // Modal avis
  selectedAppointment: Appointment | null = null;
  showReviewModal = false;
  reviewForm = { rating: 5, comment: '' };

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

  downloadPrescriptionPdf(appointmentId: number) {
    this.appointmentService.generatePrescriptionPdf(appointmentId).subscribe({
      next: (blob) => {
        saveAs(blob, `ordonnance_${appointmentId}.pdf`);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement de l\'ordonnance:', error);
        this.errorMessage = 'Erreur lors du téléchargement de l\'ordonnance.';
      },
    });
  }

  openReviewModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.reviewForm = { rating: 5, comment: '' };
    this.showReviewModal = true;
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.selectedAppointment = null;
  }

  submitReview() {
    if (!this.selectedAppointment || this.reviewForm.rating < 1) return;

    this.appointmentService.addReview(
      this.selectedAppointment.id,
      this.reviewForm.rating,
      this.reviewForm.comment || undefined
    ).subscribe({
      next: () => {
        Swal.fire('Merci !', 'Votre avis a été enregistré', 'success');
        this.loadAppointments(this.currentPatient!.id);
        this.closeReviewModal();
      },
      error: (err) => {
        Swal.fire('Erreur', err.error?.message || 'Impossible d\'enregistrer l\'avis', 'error');
      }
    });
  }

}