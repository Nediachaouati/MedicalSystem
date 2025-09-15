import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/admin/AdminDashboard/dashboard.component';
import { PatientdashboardComponent } from './components/patient/patientdashboard/patientdashboard.component';
import { MedecindashboardComponent } from './components/medecin/medecindashboard/medecindashboard.component';
import { AddMedecinComponent } from './components/admin/add-medecin/add-medecin.component';
import { ManageMedecinsComponent } from './components/admin/manage-medecins/manage-medecins.component';
import { BookAppointmentComponent } from './components/patient/book-appointment/book-appointment.component';
import { ManageSecretariesComponent } from './components/admin/manage-secretaries/manage-secretaries.component';
import { AddSecretaireComponent } from './components/admin/add-secretaire/add-secretaire.component';
import { DashboardSecretariesComponent } from './components/secretaire/dashboard-secretaries/dashboard-secretaries.component';
import { ListPatientsComponent } from './components/secretaire/list-patients/list-patients.component';
import { OurServicesComponent } from './components/patient/our-services/our-services.component';
import { AppointmentsComponent } from './components/medecin/appointments/appointments.component';
import { ProfileComponent } from './components/profile-component/profile-component.component';
import { MyAppointmentsComponent } from './components/patient/my-appointments/my-appointments.component';
import { SymptomsFormComponent } from './components/patient/symptoms-form/symptoms-form.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },

  {
    path: 'register',
    component: RegisterComponent,
  },
  { path: 'admin/dashboard', component: DashboardComponent },
  { path: 'patient/dashboard', component: PatientdashboardComponent },
  { path: 'medecin/dashboard', component: MedecindashboardComponent },
  { path: 'medecin/appointments', component: AppointmentsComponent },
  { path: 'secretaire/dashboard', component: DashboardSecretariesComponent },
  { path: 'admin/users', component: ManageMedecinsComponent },
  { path: 'admin/add-medecin', component: AddMedecinComponent},
 
  { path: 'patient/appointments/new/:medecinId', component: BookAppointmentComponent},
  { path: 'admin/secretaries', component: ManageSecretariesComponent},
  { path: 'admin/add-secretaire', component: AddSecretaireComponent },
  { path: 'list-patients', component: ListPatientsComponent },
  { path: 'our-services', component: OurServicesComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'patient/appointments', component: MyAppointmentsComponent },
  { path: 'patient/symptoms/new/:doctorId', component: SymptomsFormComponent },


];



