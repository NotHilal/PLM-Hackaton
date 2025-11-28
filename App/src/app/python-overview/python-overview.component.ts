import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { BackendApiService } from '../services/backend-api.service';
import {
  ProcessMiningKPIs,
  OperationSummary,
  ChartDataPoint,
  GroupedChartDataPoint
} from '../models/process-mining.model';

@Component({
  selector: 'app-python-overview',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './python-overview.component.html',
  styleUrls: ['./python-overview.component.css']
})
export class PythonOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data from backend
  processMiningKPIs: ProcessMiningKPIs | null = null;
  operations: OperationSummary[] = [];

  // Chart data
  wipChartData: ChartDataPoint[] = [];
  cycleWaitingChartData: GroupedChartDataPoint[] = [];
  reworkChartData: ChartDataPoint[] = [];

  // Loading state
  loading = true;
  error: string | null = null;

  // Chart options
  colorScheme: any = {
    domain: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
  };
  showXAxis = true;
  showYAxis = true;
  showLegend = false;
  animations = true;

  @ViewChildren('chartWrapper') chartWrappers!: QueryList<ElementRef>;  // Reference to chart divs
  view1: [number, number] = [0, 0];  // For first chart (Cycle vs Waiting)
  view2: [number, number] = [0, 0];  // For second chart (Rework Rate)

  // Calculate sizes based on actual container dimensions
  updateChartSizes() {
    if (this.chartWrappers) {
      const wrappers = this.chartWrappers.toArray();
      if (wrappers.length >= 2) {
        this.view1 = [wrappers[0].nativeElement.offsetWidth, wrappers[0].nativeElement.offsetHeight];
        this.view2 = [wrappers[1].nativeElement.offsetWidth, wrappers[1].nativeElement.offsetHeight];
        this.cdr.detectChanges();
      }
    }
  }
  
  @HostListener('window:resize')
  onResize() {
    this.updateChartSizes();
  }

  constructor(
    private backendApi: BackendApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    this.updateChartSizes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all data from Python backend
   */
  loadAllData(): void {
    this.loading = true;
    this.error = null;

    // Load multiple endpoints in parallel
    forkJoin({
      kpis: this.backendApi.getProcessMiningKPIs(),
      operations: this.backendApi.getOperations(),
      wipChart: this.backendApi.getWIPChartData(),
      cycleWaitingChart: this.backendApi.getCycleVsWaitingChartData(),
      reworkChart: this.backendApi.getReworkRateChartData()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ All data loaded from Python backend:', data);
          this.processMiningKPIs = data.kpis;
          this.operations = data.operations;
          this.wipChartData = data.wipChart;
          this.cycleWaitingChartData = data.cycleWaitingChart;
          this.reworkChartData = data.reworkChart;
          this.loading = false;
          this.cdr.detectChanges();
          this.updateChartSizes();
        },
        error: (err) => {
          console.error('❌ Error loading data:', err);
          this.error = 'Impossible de charger les données depuis le backend Python. Vérifiez que le serveur tourne sur http://localhost:5000';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Refresh all data
   */
  refresh(): void {
    this.loadAllData();
  }

  /**
   * Get delta class for styling
   */
  getDeltaClass(delta: number): string {
    return delta < 0 ? 'positive' : 'negative';
  }

  /**
   * Format delta value
   */
  formatDelta(delta: number): string {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}%`;
  }

  /**
   * Get bottleneck severity color
   */
  getBottleneckColor(severity: string): string {
    const colors: Record<string, string> = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#3b82f6',
      'none': '#10b981'
    };
    return colors[severity] || colors['none'];
  }

  /**
   * Get severity badge class
   */
  getSeverityBadgeClass(severity: string): string {
    const classes: Record<string, string> = {
      'high': 'badge-error',
      'medium': 'badge-warning',
      'low': 'badge-info',
      'none': 'badge-success'
    };
    return classes[severity] || classes['none'];
  }
}
