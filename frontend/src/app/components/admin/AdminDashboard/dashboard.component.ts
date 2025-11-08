import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { StatsService, StatsResponse } from '../../../services/stats.service';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  stats = { doctors: 0, secretaries: 0 };
  chartData: { month: string; count: number }[] = [];
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  private chart!: Chart;

  constructor(private statsService: StatsService) {}

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    // Le canvas existe maintenant
    if (this.chartData.length > 0) {
      this.initChart(this.chartData);
    }
  }

  loadStats() {
    this.statsService.getStats().subscribe({
      next: (res: StatsResponse) => {
        this.stats = { doctors: res.doctors, secretaries: res.secretaries };
        this.chartData = res.chartData;

        // Si le canvas est déjà chargé
        if (this.chartCanvas) {
          this.initChart(this.chartData);
        }
      },
      error: (err) => console.error('Erreur stats:', err)
    });
  }

  initChart(data: { month: string; count: number }[]) {
    if (!this.chartCanvas) {
      console.error('Canvas non trouvé !');
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');

    // Détruit l’ancien graphique
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.month),
        datasets: [{
          label: 'Rendez-vous par mois',
          data: data.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 4
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