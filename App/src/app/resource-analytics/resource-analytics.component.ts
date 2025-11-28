import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { BackendApiService } from '../services/backend-api.service';
import { ChartDataPoint } from '../models/process-mining.model';

interface ResourceKPIs {
  totalEmployees: number;
  avgLaborCost: number;
  totalLaborCost: number;
  avgAge: number;
  avgExperience: number;
  rotationRate: number;
}

interface SupplyChainKPIs {
  totalParts: number;
  totalProcurementCost: number;
  avgLeadTime: number;
  criticalPartsCount: number;
  avgCriticality: number;
  totalWeight: number;
  totalCAOTime: number;
}

@Component({
  selector: 'app-resource-analytics',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './resource-analytics.component.html',
  styleUrls: ['./resource-analytics.component.css']
})
export class ResourceAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // KPIs
  resourceKPIs: ResourceKPIs | null = null;
  supplyChainKPIs: SupplyChainKPIs | null = null;

  // Chart data
  costByQualificationData: ChartDataPoint[] = [];
  experienceDistributionData: ChartDataPoint[] = [];
  supplierDistributionData: ChartDataPoint[] = [];
  criticalityDistributionData: ChartDataPoint[] = [];

  // Loading state
  loading = true;
  error: string | null = null;

  // Chart options
  view: [number, number] = [1200, 400];
  colorScheme: any = {
    domain: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
  };
  showXAxis = true;
  showYAxis = true;

  constructor(
    private backendApi: BackendApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      resourceKPIs: this.backendApi.getResourceKPIs(),
      supplyChainKPIs: this.backendApi.getSupplyChainKPIs(),
      costByQualification: this.backendApi.getCostByQualificationChart(),
      experienceDistribution: this.backendApi.getExperienceDistributionChart(),
      supplierDistribution: this.backendApi.getSupplierDistributionChart(),
      criticalityDistribution: this.backendApi.getCriticalityDistributionChart()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.resourceKPIs = data.resourceKPIs;
          this.supplyChainKPIs = data.supplyChainKPIs;
          this.costByQualificationData = data.costByQualification;
          this.experienceDistributionData = data.experienceDistribution;
          this.supplierDistributionData = data.supplierDistribution;
          this.criticalityDistributionData = data.criticalityDistribution;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error loading analytics:', err);
          this.error = 'Impossible de charger les données depuis le backend Python.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  refresh(): void {
    this.loadAllData();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }
}
