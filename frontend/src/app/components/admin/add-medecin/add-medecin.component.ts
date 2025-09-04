import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { UserService } from '../../../services/user-service';

@Component({
  standalone: true,
  selector: 'app-add-medecin',
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './add-medecin.component.html',
  styleUrls: ['./add-medecin.component.css'],
})
export class AddMedecinComponent {
  addMedecinForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.addMedecinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: ['', Validators.required],
      speciality: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.addMedecinForm.valid) {
      const formData = { ...this.addMedecinForm.value, role: 'MEDECIN' };
      this.userService.addMedecin(formData).subscribe({
        next: () => {
          alert('Médecin ajouté avec succès !');
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          console.error('Erreur ajout médecin:', error);
          alert('Échec ajout médecin: ' + (error.message || 'Erreur inconnue'));
        },
      });
    } else {
      alert('Remplissez tous les champs correctement.');
    }
  }
}