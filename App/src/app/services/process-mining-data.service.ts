import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  EventLogRecord,
  OperationSummary,
  AnalyticsFilter,
  UploadedFile,
  TimeSeriesDataPoint,
  Bottleneck
} from '../models/event-log.model';

/**
 * Central data management service for Process Mining
 * Manages event logs, filters, and provides reactive data streams
 */
@Injectable({
  providedIn: 'root'
})
export class ProcessMiningDataService {
  // Raw event log data
  private eventLogSubject = new BehaviorSubject<EventLogRecord[]>(this.getMockEventLog());

  // Active filter state
  private filterSubject = new BehaviorSubject<AnalyticsFilter>({
    dateFrom: null,
    dateTo: null,
    operations: [],
    stations: [],
    resultFilter: 'all',
    reworkOnly: false
  });

  // Uploaded file metadata
  private uploadedFileSubject = new BehaviorSubject<UploadedFile | null>(null);

  // Public observables
  public eventLog$ = this.eventLogSubject.asObservable();
  public filter$ = this.filterSubject.asObservable();
  public uploadedFile$ = this.uploadedFileSubject.asObservable();

  /**
   * Filtered event log based on current filter settings
   */
  public filteredEventLog$: Observable<EventLogRecord[]> = combineLatest([
    this.eventLog$,
    this.filter$
  ]).pipe(
    map(([events, filter]) => this.applyFilter(events, filter))
  );

  /**
   * Operation summaries computed from filtered event log
   */
  public operationSummaries$: Observable<OperationSummary[]> = this.filteredEventLog$.pipe(
    map(events => this.computeOperationSummaries(events))
  );

  constructor() {}

  /**
   * Set new event log data (called after Excel import)
   */
  setEventLog(events: EventLogRecord[]): void {
    this.eventLogSubject.next(events);
  }

  /**
   * Update filter criteria
   */
  updateFilter(filter: Partial<AnalyticsFilter>): void {
    const currentFilter = this.filterSubject.value;
    this.filterSubject.next({ ...currentFilter, ...filter });
  }

  /**
   * Reset filter to default
   */
  resetFilter(): void {
    this.filterSubject.next({
      dateFrom: null,
      dateTo: null,
      operations: [],
      stations: [],
      resultFilter: 'all',
      reworkOnly: false
    });
  }

  /**
   * Set uploaded file metadata
   */
  setUploadedFile(file: UploadedFile): void {
    this.uploadedFileSubject.next(file);
  }

  /**
   * Get list of unique operations from event log
   */
  getUniqueOperations(): string[] {
    const events = this.eventLogSubject.value;
    return [...new Set(events.map(e => e.operation))].sort();
  }

  /**
   * Get list of unique stations from event log
   */
  getUniqueStations(): string[] {
    const events = this.eventLogSubject.value;
    return [...new Set(events.map(e => e.station_id))].sort();
  }

  /**
   * Apply filter to event log
   */
  private applyFilter(events: EventLogRecord[], filter: AnalyticsFilter): EventLogRecord[] {
    let filtered = [...events];

    // Date range filter
    if (filter.dateFrom) {
      filtered = filtered.filter(e => e.timestamp_start >= filter.dateFrom!);
    }
    if (filter.dateTo) {
      filtered = filtered.filter(e => e.timestamp_end <= filter.dateTo!);
    }

    // Operation filter
    if (filter.operations.length > 0) {
      filtered = filtered.filter(e => filter.operations.includes(e.operation));
    }

    // Station filter
    if (filter.stations.length > 0) {
      filtered = filtered.filter(e => filter.stations.includes(e.station_id));
    }

    // Result filter
    if (filter.resultFilter !== 'all') {
      filtered = filtered.filter(e => e.result === filter.resultFilter);
    }

    // Rework only filter
    if (filter.reworkOnly) {
      filtered = filtered.filter(e => e.rework_flag);
    }

    return filtered;
  }

  /**
   * Compute operation summaries from event log
   */
  private computeOperationSummaries(events: EventLogRecord[]): OperationSummary[] {
    const operations = this.getUniqueOperations();

    return operations.map(operation => {
      const opEvents = events.filter(e => e.operation === operation);

      if (opEvents.length === 0) {
        return {
          operation,
          avgCycleTime: 0,
          avgWaitingTime: 0,
          currentWIP: 0,
          caseCount: 0,
          reworkRate: 0,
          throughput: 0,
          bottleneckSeverity: 'none'
        };
      }

      // Calculate cycle times (time from start to end)
      const cycleTimes = opEvents.map(e =>
        (e.timestamp_end.getTime() - e.timestamp_start.getTime()) / (1000 * 60) // minutes
      );
      const avgCycleTime = cycleTimes.reduce((sum, t) => sum + t, 0) / cycleTimes.length;

      // Calculate waiting times (simplified: time between end of previous and start of current)
      // For mock data, we'll use a simplified calculation
      const avgWaitingTime = this.calculateAvgWaitingTime(opEvents);

      // Current WIP: cases that have started but not completed (mock calculation)
      const currentWIP = Math.floor(opEvents.length * 0.15); // 15% of cases as WIP

      // Rework rate
      const reworkCount = opEvents.filter(e => e.rework_flag).length;
      const reworkRate = (reworkCount / opEvents.length) * 100;

      // Throughput (cases per day)
      const dateRange = this.getDateRangeInDays(events);
      const throughput = dateRange > 0 ? opEvents.length / dateRange : 0;

      // Bottleneck severity
      const waitingToCycleRatio = avgWaitingTime / avgCycleTime;
      let bottleneckSeverity: 'none' | 'low' | 'medium' | 'high' = 'none';
      if (waitingToCycleRatio > 2) bottleneckSeverity = 'high';
      else if (waitingToCycleRatio > 1.5) bottleneckSeverity = 'medium';
      else if (waitingToCycleRatio > 1) bottleneckSeverity = 'low';

      return {
        operation,
        avgCycleTime,
        avgWaitingTime,
        currentWIP,
        caseCount: opEvents.length,
        reworkRate,
        throughput,
        bottleneckSeverity
      };
    });
  }

  /**
   * Calculate average waiting time for an operation
   * This is a simplified calculation; real implementation would track inter-operation delays
   */
  private calculateAvgWaitingTime(events: EventLogRecord[]): number {
    // Mock calculation: random waiting time based on operation characteristics
    if (events.length === 0) return 0;

    // Group by case_id to calculate waiting between operations
    const caseGroups = new Map<string, EventLogRecord[]>();
    events.forEach(e => {
      if (!caseGroups.has(e.case_id)) {
        caseGroups.set(e.case_id, []);
      }
      caseGroups.get(e.case_id)!.push(e);
    });

    let totalWaitingTime = 0;
    let waitingTimeCount = 0;

    // For mock data, use a simplified heuristic
    // In real implementation, you'd track the time gap between operations
    const avgCycleTime = events.reduce((sum, e) =>
      sum + (e.timestamp_end.getTime() - e.timestamp_start.getTime()), 0
    ) / events.length / (1000 * 60);

    // Simulate waiting time as a factor of cycle time (mock)
    return avgCycleTime * (0.5 + Math.random() * 1.5);
  }

  /**
   * Get date range in days from event log
   */
  private getDateRangeInDays(events: EventLogRecord[]): number {
    if (events.length === 0) return 0;

    const dates = events.map(e => e.timestamp_start.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    return (maxDate - minDate) / (1000 * 60 * 60 * 24);
  }

  /**
   * Generate mock event log for demonstration
   * This data simulates a manufacturing process with 5 operations
   */
  private getMockEventLog(): EventLogRecord[] {
    const operations = ['Découpe', 'Perçage', 'Peinture', 'Assemblage', 'Contrôle'];
    const stations = {
      'Découpe': ['CUT-01', 'CUT-02'],
      'Perçage': ['DRL-01', 'DRL-02', 'DRL-03'],
      'Peinture': ['PNT-01', 'PNT-02'],
      'Assemblage': ['ASM-01', 'ASM-02', 'ASM-03'],
      'Contrôle': ['QC-01', 'QC-02']
    };

    const events: EventLogRecord[] = [];
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Generate 500 cases
    for (let caseNum = 1; caseNum <= 500; caseNum++) {
      const case_id = `CASE-${String(caseNum).padStart(4, '0')}`;
      let currentTime = new Date(startDate.getTime() + Math.random() * 25 * 24 * 60 * 60 * 1000);

      // Each case goes through all operations
      operations.forEach((operation, idx) => {
        const stationList = stations[operation as keyof typeof stations];
        const station_id = stationList[Math.floor(Math.random() * stationList.length)];

        // Cycle time varies by operation
        const baseCycleTime = [15, 20, 30, 25, 18][idx]; // minutes
        const cycleTime = baseCycleTime + (Math.random() - 0.5) * 10;

        // Waiting time (queue time before operation starts)
        const baseWaitingTime = [5, 25, 10, 35, 8][idx]; // minutes (Assemblage has highest wait)
        const waitingTime = baseWaitingTime + (Math.random() - 0.5) * 15;

        const timestamp_start = new Date(currentTime.getTime() + waitingTime * 60 * 1000);
        const timestamp_end = new Date(timestamp_start.getTime() + cycleTime * 60 * 1000);

        // Result: 95% OK, 5% NOK (higher for certain operations)
        const nokProbability = operation === 'Peinture' ? 0.18 : operation === 'Perçage' ? 0.12 : 0.05;
        const result = Math.random() > nokProbability ? 'OK' : 'NOK';

        // Rework flag: NOK items + some OK items that needed rework
        const rework_flag = result === 'NOK' || (result === 'OK' && Math.random() < 0.03);

        events.push({
          case_id,
          operation,
          timestamp_start,
          timestamp_end,
          station_id,
          result: result as 'OK' | 'NOK',
          rework_flag
        });

        // Move time forward for next operation
        currentTime = timestamp_end;
      });
    }

    return events;
  }
}
