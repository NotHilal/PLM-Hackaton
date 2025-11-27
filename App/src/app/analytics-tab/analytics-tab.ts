import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { ProcessMiningDataService } from '../services/process-mining-data.service';
import { KpiService } from '../services/kpi.service';
import { KpiSummary, OperationSummary, Bottleneck } from '../models/event-log.model';

@Component({
  selector: 'app-analytics-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxChartsModule],
  templateUrl: './analytics-tab.html',
  styleUrls: ['./analytics-tab.css'],
})
export class AnalyticsTabComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  kpiSummary: KpiSummary | null = null;
  operationSummaries: OperationSummary[] = [];
  bottlenecks: Bottleneck[] = [];

  // Filter state
  selectedOperations: string[] = [];
  allOperations: string[] = [];

  // Chart data
  wipChartData: any[] = [];
  bottleneckChartData: any[] = [];
  reworkChartData: any[] = [];
  cycleTimeChartData: any[] = [];
  cycleVsWaitingData: any[] = [];

  // Chart options
  view: [number, number] = [500, 300];
  showLegend = true;
  showLabels = true;
  showXAxis = true;
  showYAxis = true;
  colorScheme: any = {
    domain: ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
  };

  constructor(
    private dataSvc: ProcessMiningDataService,
    private kpiSvc: KpiService
  ) {}

  ngOnInit(): void {
    // Get all operations for filter
    this.allOperations = this.dataSvc.getUniqueOperations();
    this.selectedOperations = [...this.allOperations];

    // Subscribe to data changes
    combineLatest([
      this.dataSvc.filteredEventLog$,
      this.dataSvc.operationSummaries$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([events, opSummaries]) => {
        this.operationSummaries = opSummaries;
        this.kpiSummary = this.kpiSvc.calculateKpiSummary(events, opSummaries);
        this.bottlenecks = this.kpiSvc.identifyBottlenecks(events, opSummaries);

        this.prepareChartData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle operation selection for filtering
   */
  toggleOperationFilter(operation: string): void {
    const index = this.selectedOperations.indexOf(operation);
    if (index > -1) {
      this.selectedOperations.splice(index, 1);
    } else {
      this.selectedOperations.push(operation);
    }

    // Update filter in data service
    this.dataSvc.updateFilter({
      operations: this.selectedOperations
    });
  }

  /**
   * Check if operation is selected
   */
  isOperationSelected(operation: string): boolean {
    return this.selectedOperations.includes(operation);
  }

  /**
   * Select all operations
   */
  selectAllOperations(): void {
    this.selectedOperations = [...this.allOperations];
    this.dataSvc.updateFilter({ operations: [] }); // Empty array = all operations
  }

  /**
   * Clear all operation selections
   */
  clearAllOperations(): void {
    this.selectedOperations = [];
    this.dataSvc.updateFilter({ operations: [] });
  }

  /**
   * Prepare chart data from operation summaries
   */
  private prepareChartData(): void {
    // WIP by operation
    this.wipChartData = this.operationSummaries.map(op => ({
      name: op.operation,
      value: op.currentWIP
    }));

    // Bottleneck analysis (waiting time)
    this.bottleneckChartData = this.operationSummaries
      .map(op => ({
        name: op.operation,
        value: op.avgWaitingTime
      }))
      .sort((a, b) => b.value - a.value);

    // Rework rate
    this.reworkChartData = this.operationSummaries.map(op => ({
      name: op.operation,
      value: op.reworkRate
    }));

    // Cycle time
    this.cycleTimeChartData = this.operationSummaries.map(op => ({
      name: op.operation,
      value: op.avgCycleTime
    }));

    // Cycle time vs Waiting time (grouped bar chart)
    this.cycleVsWaitingData = this.operationSummaries.map(op => ({
      name: op.operation,
      series: [
        { name: 'Cycle Time', value: op.avgCycleTime },
        { name: 'Waiting Time', value: op.avgWaitingTime }
      ]
    }));
  }

  /**
   * Get severity badge class
   */
  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'high': return 'badge-error';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-info';
      default: return 'badge-success';
    }
  }
}
