import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

import { User } from '../../../models/user';
import { UserService } from '../../../services/user-service';

@Component({
  standalone: true,
  selector: 'app-add-secretaire',
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './add-secretaire.component.html',
  styleUrls: ['./add-secretaire.component.css'],
})
export class AddSecretaireComponent implements OnInit {
  secretaireForm: FormGroup;
  doctors: User[] = [];
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.secretaireForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: ['', Validators.required],
      phoneNumber: [''],
      address: [''],
      birthDate: [''],
      medecinId: ['', Validators.required],
    });
  }

  ngOnInit() {
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

  onSubmit() {
    if (this.secretaireForm.valid) {
      const user: User = {
        email: this.secretaireForm.value.email,
        password: this.secretaireForm.value.password,
        name: this.secretaireForm.value.name,
        phoneNumber: this.secretaireForm.value.phoneNumber || undefined,
        address: this.secretaireForm.value.address || undefined,
        birthDate: this.secretaireForm.value.birthDate || undefined,
        medecinId: +this.secretaireForm.value.medecinId,
        role: 'SECRETAIRE',
        id: undefined, 
        photo: undefined, 
        created_at: undefined, 
        updated_at: undefined, 
   
      };

      this.userService.addSecretaire(user).subscribe({
        next: () => {
          alert('Secrétaire ajouté avec succès.');
          this.router.navigate(['/admin/secretaries']); // Redirection vers la liste des secrétaires
        },
        error: (error) => {
          console.error('Erreur ajout secrétaire:', error);
          this.errorMessage = error.status === 401
            ? 'Veuillez vous reconnecter (session expirée).'
            : `Échec ajout secrétaire: ${error.message || 'Erreur inconnue'}`;
        },
      });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs requis correctement.';
    }
  }

  cancel() {
    this.router.navigate(['/admin/secretaries']); // Redirection vers la liste des secrétaires
  }
}