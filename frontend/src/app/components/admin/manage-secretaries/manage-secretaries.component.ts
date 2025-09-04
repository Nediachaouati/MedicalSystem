import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../../models/user';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { UserService } from '../../../services/user-service';

@Component({
  standalone: true,
  selector: 'app-manage-secretaries',
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './manage-secretaries.component.html',
  styleUrls: ['./manage-secretaries.component.css'],
})
export class ManageSecretariesComponent implements OnInit {
  secretaries: User[] = [];
  doctors: User[] = [];
  selectedMedecinId: number | null = null;
  errorMessage: string | null = null;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.fetchDoctors();
    this.fetchAllSecretaries(); // Charger tous les secrétaires par défaut
  }

  fetchDoctors() {
    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
      },
      error: (error) => {
        console.error('Erreur récupération médecins:', error);
        this.errorMessage = 'Erreur lors de la récupération des médecins.';
      },
    });
  }

  fetchAllSecretaries() {
    this.userService.getAllSecretaries().subscribe({
      next: (secretaries) => {
        this.secretaries = secretaries;
        this.errorMessage = null;
      },
      error: (error) => {
        console.error('Erreur récupération secrétaires:', error);
        this.errorMessage = 'Erreur lors de la récupération des secrétaires.';
      },
    });
  }

  fetchSecretariesByMedecin() {
    if (this.selectedMedecinId) {
      this.userService.getSecretariesByMedecin(this.selectedMedecinId).subscribe({
        next: (secretaries) => {
          this.secretaries = secretaries;
          this.errorMessage = null;
        },
        error: (error) => {
          console.error('Erreur récupération secrétaires:', error);
          this.errorMessage = 'Erreur lors de la récupération des secrétaires.';
        },
      });
    } else {
      this.fetchAllSecretaries(); // Revenir à tous les secrétaires si aucun médecin n'est sélectionné
    }
  }

  onMedecinChange() {
    this.fetchSecretariesByMedecin();
  }

  addSecretaire() {
    this.router.navigate(['/admin/add-secretaire']);
  }

  deleteSecretaire(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce secrétaire ?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.secretaries = this.secretaries.filter((s) => s.id !== id);
          alert('Secrétaire supprimé avec succès.');
        },
        error: (error) => {
          console.error('Erreur suppression secrétaire:', error);
          this.errorMessage = 'Erreur lors de la suppression du secrétaire.';
        },
      });
    }
  }
}