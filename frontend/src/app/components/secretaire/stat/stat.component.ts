import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { NavbarComponent } from "../../../navbar/navbar.component";
import { SidebarComponent } from "../../../sidebar/sidebar.component";
import { CommonModule } from '@angular/common';

interface SecretaryStats {
  patientsCount: number;
  approvedAppointments: number;
  canceledAppointments: number;
  monthlyAppointments: { month: string; count: number }[];
}

@Component({
  selector: 'app-secretaire-stat',
  templateUrl: './stat.component.html',
  styleUrls: ['./stat.component.css'],
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent]
})
export class StatComponent implements OnInit, AfterViewInit {
  stats: SecretaryStats = {
    patientsCount: 0,
    approvedAppointments: 0,
    canceledAppointments: 0,
    monthlyAppointments: []
  };

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart!: Chart;

  private apiUrl = 'http://localhost:3000/appointments/stats';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    // Le canvas existe maintenant
    if (this.stats.monthlyAppointments.length > 0) {
      this.initChart();
    }
  }

  loadStats() {
    const token = localStorage.getItem('access_token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : {};

    this.http.get<SecretaryStats>(this.apiUrl, { headers }).subscribe({
      next: (res) => {
        this.stats = res;
        console.log('Données reçues:', this.stats); // VÉRIFIE ICI

        // Si le canvas est déjà chargé
        if (this.chartCanvas) {
          this.initChart();
        }
      },
      error: (err) => console.error('Erreur stats:', err)
    });
  }

  initChart() {
    if (!this.chartCanvas?.nativeElement) {
      console.error('Canvas non trouvé !');
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Détruit l’ancien graphique
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.stats.monthlyAppointments.map(d => d.month);
    const data = this.stats.monthlyAppointments.map(d => d.count);

    console.log('Labels:', labels, 'Data:', data); // VÉRIFIE

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'RDV par mois',
          data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}