import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiHttpService } from '../services/kpi-http.service';
import { KPIs } from '../models/kpi.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-dashboard.component.html',
  styleUrls: ['./kpi-dashboard.component.css']
})
export class KpiDashboardComponent implements OnInit, OnDestroy {
  kpis?: KPIs;
  loading = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private kpiService: KpiHttpService) {}

  ngOnInit(): void {
    // Subscribe to KPIs observable
    this.kpiService.kpis$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data) {
            this.kpis = data;
            this.loading = false;
            console.log('KPIs loaded:', this.kpis);
          }
        },
        error: (err) => {
          this.error = 'Failed to load KPIs. Is the Python backend running?';
          this.loading = false;
          console.error('Error loading KPIs:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshData(): void {
    this.loading = true;
    this.kpiService.refreshKPIs();
  }

  // Helper methods for display
  getDisponibiliteEntries(): Array<{ poste: string; value: number }> {
    if (!this.kpis?.WORKFLOW?.disponibilite_par_poste) return [];

    return Object.entries(this.kpis.WORKFLOW.disponibilite_par_poste).map(
      ([poste, value]) => ({ poste, value })
    );
  }

  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  formatCurrency(value: number): string {
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;
  }
}
