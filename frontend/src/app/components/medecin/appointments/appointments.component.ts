import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { User } from '../../../models/user';
import { Appointment } from '../../../models/appointment';
import { UserService } from '../../../services/user-service';
import { AppointmentService } from '../../../services/appointment.service';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Prescription } from '../../../models/Prescription';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent, FormsModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
})
export class AppointmentsComponent implements OnInit {
  currentDoctor: User | null = null;
  appointments: Appointment[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedAppointment: Appointment | null = null;
  prescription: Prescription = {
  appointmentId: 0,
  medication: '',
  dosage: '',
  duration: '',
  additionalNotes: '',
  // id et createdAt PAS définis → pas envoyés
};
  isEditingPrescription: boolean = false;

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
        this.appointments = appointments.filter(app => app.appointmentStatus === 'approuvé');
        console.log('Filtered approved appointments:', this.appointments);
        this.errorMessage = null;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        this.errorMessage = `Erreur lors de la récupération des rendez-vous: ${error.message || 'Erreur inconnue'}`;
      },
    });
  }

  markAsTerminee(appointment: Appointment) {
    this.appointmentService.updateConsultationStatus(appointment.id, 'terminée').subscribe({
      next: (updatedAppointment) => {
        appointment.consultationStatus = updatedAppointment.consultationStatus;
        this.selectedAppointment = appointment;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut de consultation:', error);
        this.errorMessage = 'Erreur lors de la mise à jour du statut de consultation.';
      },
    });
  }

  selectAppointmentForPrescription(appointment: Appointment) {
  this.selectedAppointment = appointment;
  this.isEditingPrescription = false;
  this.prescription = {
    appointmentId: appointment.id,  // appointment.id EXISTE ?
    medication: '',
    dosage: '',
    duration: '',
    additionalNotes: '',
  };

  console.log('appointment.id:', appointment.id); // AJOUTE ÇA
  console.log('this.prescription:', this.prescription); // AJOUTE ÇA
}


  selectPrescriptionForEdit(appointment: Appointment, prescription: Prescription) {
    this.selectedAppointment = appointment;
    this.isEditingPrescription = true;
    this.prescription = { ...prescription };
  }

  submitPrescription() {
    if (!this.selectedAppointment) {
      this.errorMessage = 'Aucun rendez-vous sélectionné.';
      return;
    }
    if (!this.prescription.medication || !this.prescription.dosage || !this.prescription.duration) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (médicament, dosage, durée).';
      return;
    }
    if (this.isEditingPrescription) {
      console.log('Updating prescription:', this.prescription);
      this.appointmentService.updatePrescription(this.prescription.id, this.prescription).subscribe({
        next: (updatedPrescription) => {
          if (this.selectedAppointment!.prescriptions) {
            const index = this.selectedAppointment!.prescriptions.findIndex(p => p.id === updatedPrescription.id);
            if (index !== -1) {
              this.selectedAppointment!.prescriptions[index] = updatedPrescription;
            }
          }
          this.successMessage = 'Ordonnance modifiée avec succès';
          this.clearMessages();
          this.loadAppointments(this.currentDoctor!.id);
          this.selectedAppointment = null;
          this.isEditingPrescription = false;
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de l\'ordonnance:', error);
          this.errorMessage = `Erreur lors de la mise à jour de l'ordonnance: ${error.message || 'Erreur inconnue'}`;
          this.clearMessages();
        },
      });
    } else {
      console.log('Submitting prescription:', this.prescription);
      this.appointmentService.createPrescription(this.prescription).subscribe({
        next: (prescription) => {
          if (!this.selectedAppointment!.prescriptions) {
            this.selectedAppointment!.prescriptions = [];
          }
          this.selectedAppointment!.prescriptions.push(prescription);
          this.successMessage = 'Ordonnance créée avec succès';
          this.clearMessages();
          this.loadAppointments(this.currentDoctor!.id);
          this.selectedAppointment = null;
        },
        error: (error) => {
          console.error('Erreur lors de la création de l\'ordonnance:', error);
          this.errorMessage = `Erreur lors de la création de l'ordonnance: ${error.message || 'Erreur inconnue'}`;
          this.clearMessages();
        },
      });
    }
  }

  downloadPrescriptionPdf(appointmentId: number) {
    this.appointmentService.generatePrescriptionPdf(appointmentId).subscribe({
      next: (blob) => {
        saveAs(blob, `ordonnance_${appointmentId}.pdf`);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement de l\'ordonnance:', error);
        this.errorMessage = 'Erreur lors du téléchargement de l\'ordonnance.';
        this.clearMessages();
      },
    });
  }

  private clearMessages() {
    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
    }, 3000); // Efface les messages après 3 secondes
  }
}