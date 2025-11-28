import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

  // Process graph data
  processGraphData: any = null;
  processSvgBase64: string | null = null;
  showSvgDiagram = false;

  // Chart options
  view: [number, number] = [1200, 400];
  colorScheme: any = {
    domain: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
  };
  showXAxis = true;
  showYAxis = true;
  showLegend = false;

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
      reworkChart: this.backendApi.getReworkRateChartData(),
      processGraph: this.backendApi.getProcessGraph()
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
          this.processGraphData = data.processGraph;
          console.log('📊 Process graph data:', this.processGraphData);
          this.loading = false;
          this.cdr.detectChanges();
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
   * Check if operation is a bottleneck
   */
  isBottleneck(operation: OperationSummary): boolean {
    if (!operation.avgWaitingTime || !operation.avgCycleTime) {
      return false;
    }
    return operation.avgWaitingTime > operation.avgCycleTime;
  }

  /**
   * Get operation icon based on index
   */
  getOperationIcon(index: number): string {
    const icons = ['🔪', '🔩', '🎨', '🔧', '✅'];
    return icons[index] || '⚙️';
  }

  /**
   * Load and display PM4PY-generated SVG diagram
   */
  loadSvgDiagram(): void {
    this.backendApi.getProcessBPMNSvg()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.processSvgBase64 = data.svg;
          this.showSvgDiagram = true;
          console.log('✅ BPMN SVG loaded');
        },
        error: (err) => {
          console.error('❌ Error loading BPMN SVG:', err);
          alert('Impossible de générer le diagramme BPMN. Assurez-vous que pm4py et graphviz sont installés sur le backend.');
        }
      });
  }

  /**
   * Toggle between custom HTML diagram and PM4PY SVG
   */
  toggleDiagramType(): void {
    if (this.showSvgDiagram) {
      this.showSvgDiagram = false;
    } else {
      if (!this.processSvgBase64) {
        this.loadSvgDiagram();
      } else {
        this.showSvgDiagram = true;
      }
    }
  }

  /**
   * Check if node/operation is a bottleneck from graph data
   */
  isBottleneckFromGraph(operationName: string): boolean {
    if (!this.processGraphData || !this.processGraphData.bottlenecks) {
      return false;
    }
    return this.processGraphData.bottlenecks[operationName] !== undefined;
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

  /**
   * Get top 10 WIP data for chart (to prevent overflow)
   */
  getTopWIPData(): ChartDataPoint[] {
    if (!this.wipChartData || this.wipChartData.length === 0) {
      return [];
    }
    // Sort by value descending and take top 10
    return [...this.wipChartData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  /**
   * Get top 10 cycle/waiting data for chart (to prevent overflow)
   * Converts hours to minutes for display
   */
  getTopCycleWaitingData(): GroupedChartDataPoint[] {
    if (!this.cycleWaitingChartData || this.cycleWaitingChartData.length === 0) {
      return [];
    }
    // Sort by total time (sum of cycle + waiting) and take top 10
    // Convert from hours to minutes by multiplying by 60
    return [...this.cycleWaitingChartData]
      .sort((a, b) => {
        const totalA = a.series.reduce((sum, item) => sum + item.value, 0);
        const totalB = b.series.reduce((sum, item) => sum + item.value, 0);
        return totalB - totalA;
      })
      .slice(0, 10)
      .map(item => ({
        name: item.name,
        series: item.series.map(s => ({
          name: s.name,
          value: s.value * 60  // Convert hours to minutes
        }))
      }));
  }
}
