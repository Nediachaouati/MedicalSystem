import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user-service';
import { Role, User } from '../../models/user';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, SidebarComponent],
  templateUrl: './profile-component.component.html',
  styleUrls: ['./profile-component.component.css'],
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedFile: File | null = null;
  profileForm: Partial<User> = {};
  role = Role;

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm = {
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
          address: user.address,
          birthDate: user.birthDate,
          speciality: user.speciality,
          photo: user.photo ? `${environment.apiUrl}/Uploads/photos/${user.photo.split('/').pop()}` : null,
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.errorMessage = 'Erreur lors de la récupération des informations du profil.';
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.profileForm.photo = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  updateProfile() {
    if (!this.user) return;

    const formData = new FormData();
    formData.append('email', this.profileForm.email || '');
    formData.append('name', this.profileForm.name || '');
    if (this.profileForm.phoneNumber) formData.append('phoneNumber', this.profileForm.phoneNumber);
    if (this.profileForm.address) formData.append('address', this.profileForm.address);
    if (this.profileForm.birthDate) formData.append('birthDate', this.profileForm.birthDate);
    if (this.profileForm.speciality) formData.append('speciality', this.profileForm.speciality);
    if (this.selectedFile) formData.append('photo', this.selectedFile);

    this.userService.updateProfile(formData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.profileForm.photo = updatedUser.photo ? `${environment.apiUrl}/Uploads/photos/${updatedUser.photo.split('/').pop()}` : null;
        this.userService.setCurrentUser(updatedUser); // Update BehaviorSubject
        this.successMessage = 'Profil mis à jour avec succès.';
        this.errorMessage = null;
        this.selectedFile = null;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du profil:', error);
        this.errorMessage = 'Erreur lors de la mise à jour du profil.';
        this.successMessage = null;
      },
    });
  }

  getPhotoUrl(photoPath: string | null): string {
    if (!photoPath) return 'assets/images/default-profile.png';
    return `${environment.apiUrl}/Uploads/photos/${photoPath.split('/').pop()}`;
  }
}