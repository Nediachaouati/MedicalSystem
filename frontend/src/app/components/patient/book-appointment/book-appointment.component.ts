import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../services/appointment.service';
import { Appointment } from '../../../models/appointment';
import { User } from '../../../models/user';
import { UserService } from '../../../services/user-service';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.css'],
})
export class BookAppointmentComponent implements OnInit {
  patientId: number | undefined;
  medecinId: number | undefined;
  appointmentData: Appointment = {
    patientId: 0,
    medecinId: 0,
    date: '',
    time: '',
    status: 'en_attente',
    patientName: '',
    doctorName: '',
    symptoms: [],
  };
  errorMessage: string | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const doctorId = params.get('doctorId');
      console.log('Doctor ID from URL:', doctorId);
      if (doctorId) {
        this.medecinId = +doctorId;
        this.appointmentData.medecinId = +doctorId;
      } else {
        this.errorMessage = 'Aucun médecin sélectionné.';
      }
    });

    this.userService.getProfile().subscribe({
      next: (user) => {
        this.patientId = user.id;
        this.appointmentData.patientId = user.id;
        this.appointmentData.patientName = user.name;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la récupération du profil.';
        console.error('Erreur récupération profil:', error);
      },
    });
  }

  submitAppointment() {
    if (!this.patientId || !this.medecinId) {
      this.errorMessage = 'Veuillez sélectionner un médecin.';
      return;
    }

    if (!this.appointmentData.date || !this.appointmentData.time) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        const doctor = doctors.find(d => d.id === this.medecinId);
        if (doctor) {
          this.appointmentData.doctorName = doctor.name;
          this.appointmentService.createAppointment(this.appointmentData).subscribe({
            next: (appointment) => {
              console.log('RDV pris avec succès:', appointment);
              this.errorMessage = null;
              alert('Rendez-vous enregistré. Veuillez ajouter vos symptômes.');
              this.router.navigate([`/patient/symptoms/new/${this.medecinId}`], {
                queryParams: { appointmentId: appointment.id },
              });
            },
            error: (error) => {
              this.errorMessage = 'Erreur lors de la création du RDV.';
              console.error('Erreur création RDV:', error);
            },
          });
        } else {
          this.errorMessage = 'Médecin non trouvé.';
        }
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la récupération du médecin.';
        console.error('Erreur récupération médecin:', error);
      },
    });
  }
}