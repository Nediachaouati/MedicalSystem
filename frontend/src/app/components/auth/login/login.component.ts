import { Component } from '@angular/core';
import { Router , RouterModule} from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { NavbarComponent } from '../../../navbar/navbar.component';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, NavbarComponent, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  login() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (response: any) => {
          console.log('Login successful', response);
          const { access_token: token, role: userRole } = response;

          this.authService.saveToken(token);

          // Redirection en fonction du rôle
          switch (userRole) {
            case 'ADMIN':
              this.router.navigate(['/admin/dashboard']);
              break;
            case 'MEDECIN':
              this.router.navigate(['/medecin/dashboard']);
              break;
            case 'PATIENT':
              this.router.navigate(['/patient/dashboard']);
              break;
              case 'SECRETAIRE':
              this.router.navigate(['/secretaire/stat']);
              break;
            default:
              this.router.navigate(['/home']);
              break;
          }
        },
        error: (error) => {
          console.error('Login error', error);
          alert('Login failed. Please check your credentials and try again.');
        },
      });
    } else {
      alert('Please fill in all required fields correctly.');
    }
  }
}
