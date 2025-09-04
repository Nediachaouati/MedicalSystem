import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { User } from '../../../models/user';
import { UserService } from '../../../services/user-service';

@Component({
  standalone: true,
  selector: 'app-manage-medecins',
  imports: [CommonModule,  NavbarComponent, SidebarComponent],
  templateUrl: './manage-medecins.component.html',
  styleUrls: ['./manage-medecins.component.css'],
})
export class ManageMedecinsComponent implements OnInit {
  doctors: User[] = [];

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.fetchDoctors();
  }

  fetchDoctors() {
    this.userService.getDoctors().subscribe({
      next: (response) => {
        console.log('Médecins récupérés:', response);
        this.doctors = response;
      },
      error: (error) => {
        console.error('Erreur récupération médecins:', error);
        alert('Échec récupération médecins: ' + (error.message || 'Erreur inconnue'));
      },
    });
  }

  deleteDoctor(id: number | undefined) {
    if (id === undefined) {
      alert('ID du médecin non défini.');
      return;
    }
    if (confirm('Voulez-vous vraiment supprimer ce médecin ?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          alert('Médecin supprimé avec succès !');
          this.doctors = this.doctors.filter(doctor => doctor.id !== id);
        },
        error: (error) => {
          console.error('Erreur suppression médecin:', error);
          alert('Échec suppression médecin: ' + (error.message || 'Erreur inconnue'));
        },
      });
    }
  }
  navigateToAddMedecin() {
    this.router.navigate(['/admin/add-medecin']);
  }
}