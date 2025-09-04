import { Component } from '@angular/core';
import { SidebarComponent } from "../../../sidebar/sidebar.component";
import { NavbarComponent } from '../../../navbar/navbar.component';


@Component({
  selector: 'app-medecindashboard',
  imports: [SidebarComponent,NavbarComponent],
  templateUrl: './medecindashboard.component.html',
  styleUrls: ['./medecindashboard.component.css'],
})
export class MedecindashboardComponent  {
 
}