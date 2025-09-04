import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { AppointmentService } from '../../../services/appointment.service';
import { UserService } from '../../../services/user-service';
import { Symptom } from '../../../models/symptom';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-symptoms-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './symptoms-form.component.html',
  styleUrls: ['./symptoms-form.component.css'],
})
export class SymptomsFormComponent implements OnInit {
  symptom: Symptom = { date: '', description: '', intensity: 1, patientId: 0, appointmentId: undefined };
  doctorId: number | undefined;
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
      if (doctorId) {
        this.doctorId = +doctorId;
      } else {
        this.errorMessage = 'Aucun médecin sélectionné.';
      }
      const appointmentId = this.route.snapshot.queryParamMap.get('appointmentId');
      this.symptom.appointmentId = appointmentId ? +appointmentId : undefined;
      console.log('Appointment ID from query params:', this.symptom.appointmentId);
    });

    this.userService.getProfile().subscribe({
      next: (user) => {
        this.symptom.patientId = user.id;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.errorMessage = 'Erreur lors de la récupération des informations du patient.';
      },
    });
  }

  onSubmit() {
    if (!this.symptom.date || !this.symptom.description || !this.symptom.intensity || !this.symptom.appointmentId) {
      this.errorMessage = 'Veuillez remplir tous les champs et associer un rendez-vous.';
      return;
    }

    this.appointmentService.createSymptom(this.symptom).subscribe({
      next: () => {
        alert('Symptôme enregistré avec succès.');
        this.router.navigate(['/patient/dashboard']);
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement du symptôme:', error);
        this.errorMessage = 'Erreur lors de l\'enregistrement du symptôme.';
      },
    });
  }
}