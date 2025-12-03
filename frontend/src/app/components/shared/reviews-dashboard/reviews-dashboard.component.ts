// src/app/components/shared/reviews-dashboard/reviews-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../services/appointment.service';
import Swal from 'sweetalert2';
import { NavbarComponent } from "../../../navbar/navbar.component";
import { SidebarComponent } from "../../../sidebar/sidebar.component";

interface Review {
  id: number;
  date: string;
  time: string;
  patientName: string;
  rating: number;
  review: string;
}

@Component({
  selector: 'app-reviews-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './reviews-dashboard.component.html',
  styleUrls: ['./reviews-dashboard.component.css']
})
export class ReviewsDashboardComponent implements OnInit {
  reviews: Review[] = [];
  averageRating = 0;
  loading = true;

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.appointmentService.getDoctorReviews().subscribe({
      next: (data) => {
        this.reviews = data;
        this.calculateAverage();
        this.loading = false;
      },
      error: () => {
        Swal.fire('Erreur', 'Impossible de charger les avis', 'error');
        this.loading = false;
      }
    });
  }

  calculateAverage() {
    if (this.reviews.length === 0) {
      this.averageRating = 0;
      return;
    }
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
  }

  // MÉTHODE AJOUTÉE POUR LE TEMPLATE
  getRoundedRating(): number {
    return Math.round(this.averageRating);
  }

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}