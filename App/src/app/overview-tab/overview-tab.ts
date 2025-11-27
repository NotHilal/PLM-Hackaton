import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { ProcessMiningDataService } from '../services/process-mining-data.service';
import { KpiService } from '../services/kpi.service';
import { KpiSummary, OperationSummary } from '../models/event-log.model';

interface NgxNode {
  id: string;
  label: string;
  data?: any;
}

interface NgxEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

@Component({
  selector: 'app-overview-tab',
  standalone: true,
  imports: [CommonModule, NgxGraphModule, NgxChartsModule],
  templateUrl: './overview-tab.html',
  styleUrls: ['./overview-tab.css'],
})
export class OverviewTabComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Graph data
  nodes: NgxNode[] = [];
  edges: NgxEdge[] = [];
  update$: Subject<boolean> = new Subject();
  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<any> = new Subject();

  // KPI data
  kpiSummary: KpiSummary | null = null;
  operationSummaries: OperationSummary[] = [];

  // Chart data for WIP by step
  wipChartData: any[] = [];
  leadTimeChartData: any[] = [];

  // Chart options
  view: [number, number] = [600, 300];
  colorScheme: any = {
    domain: ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']
  };
  showLegend = true;
  showLabels = true;
  showXAxis = true;
  showYAxis = true;
  xAxisLabel = 'Operation';
  yAxisLabel = 'WIP';

  constructor(
    private dataSvc: ProcessMiningDataService,
    private kpiSvc: KpiService
  ) {}

  ngOnInit(): void {
    // Subscribe to filtered event log and operation summaries
    combineLatest([
      this.dataSvc.filteredEventLog$,
      this.dataSvc.operationSummaries$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([events, opSummaries]) => {
        this.operationSummaries = opSummaries;
        this.kpiSummary = this.kpiSvc.calculateKpiSummary(events, opSummaries);

        // Build graph visualization
        this.buildGraphVisualization(opSummaries);

        // Prepare chart data
        this.prepareChartData(opSummaries);

        // Update graph
        this.update$.next(true);
        setTimeout(() => {
          this.center$.next(true);
          this.zoomToFit$.next(true);
        }, 100);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Build graph visualization from operation summaries
   */
  private buildGraphVisualization(opSummaries: OperationSummary[]): void {
    this.nodes = opSummaries.map(op => ({
      id: op.operation,
      label: `${op.operation}\n${op.avgCycleTime.toFixed(1)}m cycle\nWIP: ${op.currentWIP}`,
      data: op
    }));

    // Create edges connecting operations in sequence
    this.edges = [];
    for (let i = 0; i < opSummaries.length - 1; i++) {
      this.edges.push({
        id: `${opSummaries[i].operation}-${opSummaries[i + 1].operation}`,
        source: opSummaries[i].operation,
        target: opSummaries[i + 1].operation,
        label: `${opSummaries[i].caseCount} cases`
      });
    }
  }

  /**
   * Prepare chart data for visualization
   */
  private prepareChartData(opSummaries: OperationSummary[]): void {
    // WIP by operation
    this.wipChartData = opSummaries.map(op => ({
      name: op.operation,
      value: op.currentWIP
    }));

    // Lead time (cycle + waiting) by operation
    this.leadTimeChartData = opSummaries.map(op => ({
      name: op.operation,
      series: [
        { name: 'Cycle Time', value: op.avgCycleTime },
        { name: 'Waiting Time', value: op.avgWaitingTime }
      ]
    }));
  }

  /**
   * Get severity color for bottleneck badge
   */
  getBottleneckSeverityColor(severity: string): string {
    switch (severity) {
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--info)';
      default: return 'var(--text-muted)';
    }
  }

  /**
   * Format delta value with sign
   */
  formatDelta(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  /**
   * Get delta CSS class
   */
  getDeltaClass(value: number): string {
    return value < 0 ? 'positive' : 'negative';
  }
}
