import { Injectable } from '@angular/core';
import {
  EventLogRecord,
  KpiSummary,
  OperationSummary,
  Bottleneck
} from '../models/event-log.model';

/**
 * Service for calculating KPIs and metrics from event log data
 * Pure computation functions for process mining analytics
 */
@Injectable({
  providedIn: 'root'
})
export class KpiService {
  constructor() {}

  /**
   * Calculate comprehensive KPI summary from event log
   */
  calculateKpiSummary(
    events: EventLogRecord[],
    operationSummaries: OperationSummary[]
  ): KpiSummary {
    if (events.length === 0 || operationSummaries.length === 0) {
      return this.getEmptyKpiSummary();
    }

    // Total WIP across all operations
    const totalWIP = operationSummaries.reduce((sum, op) => sum + op.currentWIP, 0);

    // Average lead time: total time from first to last operation per case
    const avgLeadTime = this.calculateAverageLeadTime(events);

    // Overall rework rate
    const reworkCount = events.filter(e => e.rework_flag).length;
    const reworkRate = (reworkCount / events.length) * 100;

    // Throughput: total unique cases / time period
    const throughput = this.calculateThroughput(events);

    // Identify bottleneck operation (highest waiting time to cycle time ratio)
    const bottleneckOperation = this.identifyBottleneck(operationSummaries);

    // Calculate deltas (simulated as improvement potential)
    const deltaWIP = this.calculateDeltaWIP(operationSummaries);
    const deltaLeadTime = this.calculateDeltaLeadTime(operationSummaries);

    // Total unique cases
    const totalCases = new Set(events.map(e => e.case_id)).size;

    // Average cycle time across all operations
    const avgCycleTime = operationSummaries.reduce((sum, op) => sum + op.avgCycleTime, 0) / operationSummaries.length;

    return {
      totalWIP,
      avgLeadTime,
      reworkRate,
      throughput,
      bottleneckOperation,
      deltaWIP,
      deltaLeadTime,
      totalCases,
      avgCycleTime
    };
  }

  /**
   * Identify bottlenecks in the process
   */
  identifyBottlenecks(
    events: EventLogRecord[],
    operationSummaries: OperationSummary[]
  ): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    operationSummaries.forEach(op => {
      // A bottleneck is identified when waiting time exceeds cycle time
      const waitingToCycleRatio = op.avgWaitingTime / op.avgCycleTime;

      if (waitingToCycleRatio > 1) {
        // Get primary station for this operation
        const opEvents = events.filter(e => e.operation === op.operation);
        const stationCounts = new Map<string, number>();

        opEvents.forEach(e => {
          stationCounts.set(e.station_id, (stationCounts.get(e.station_id) || 0) + 1);
        });

        const primaryStation = [...stationCounts.entries()]
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'UNKNOWN';

        let severity: 'low' | 'medium' | 'high' = 'low';
        if (waitingToCycleRatio > 2) severity = 'high';
        else if (waitingToCycleRatio > 1.5) severity = 'medium';

        let reason = 'Waiting time exceeds cycle time';
        if (op.reworkRate > 10) {
          reason = `High rework rate (${op.reworkRate.toFixed(1)}%) causing queue buildup`;
        } else if (op.currentWIP > 100) {
          reason = 'High WIP indicating capacity constraint';
        }

        bottlenecks.push({
          operation: op.operation,
          station_id: primaryStation,
          avgWaitingTime: op.avgWaitingTime,
          avgCycleTime: op.avgCycleTime,
          waitingToCycleRatio,
          currentWIP: op.currentWIP,
          severity,
          reason
        });
      }
    });

    // Sort by severity and waiting time
    return bottlenecks.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.waitingToCycleRatio - a.waitingToCycleRatio;
    });
  }

  /**
   * Calculate average lead time (time from first to last operation per case)
   */
  private calculateAverageLeadTime(events: EventLogRecord[]): number {
    const caseGroups = new Map<string, EventLogRecord[]>();

    events.forEach(e => {
      if (!caseGroups.has(e.case_id)) {
        caseGroups.set(e.case_id, []);
      }
      caseGroups.get(e.case_id)!.push(e);
    });

    let totalLeadTime = 0;
    let caseCount = 0;

    caseGroups.forEach(caseEvents => {
      if (caseEvents.length > 0) {
        const startTimes = caseEvents.map(e => e.timestamp_start.getTime());
        const endTimes = caseEvents.map(e => e.timestamp_end.getTime());

        const caseStart = Math.min(...startTimes);
        const caseEnd = Math.max(...endTimes);

        const leadTime = (caseEnd - caseStart) / (1000 * 60 * 60); // hours
        totalLeadTime += leadTime;
        caseCount++;
      }
    });

    return caseCount > 0 ? totalLeadTime / caseCount : 0;
  }

  /**
   * Calculate throughput (cases per day)
   */
  private calculateThroughput(events: EventLogRecord[]): number {
    if (events.length === 0) return 0;

    const uniqueCases = new Set(events.map(e => e.case_id)).size;
    const dates = events.map(e => e.timestamp_start.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    const daysSpan = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    return daysSpan > 0 ? uniqueCases / daysSpan : 0;
  }

  /**
   * Identify the bottleneck operation
   */
  private identifyBottleneck(operationSummaries: OperationSummary[]): string {
    if (operationSummaries.length === 0) return 'N/A';

    // Find operation with highest waiting to cycle time ratio
    const bottleneck = operationSummaries.reduce((max, op) => {
      const ratio = op.avgWaitingTime / op.avgCycleTime;
      const maxRatio = max.avgWaitingTime / max.avgCycleTime;
      return ratio > maxRatio ? op : max;
    });

    return bottleneck.operation;
  }

  /**
   * Calculate delta WIP (potential improvement percentage)
   * Based on bottleneck analysis and optimization potential
   */
  private calculateDeltaWIP(operationSummaries: OperationSummary[]): number {
    // Identify high-severity bottlenecks
    const highBottlenecks = operationSummaries.filter(op => op.bottleneckSeverity === 'high');
    const mediumBottlenecks = operationSummaries.filter(op => op.bottleneckSeverity === 'medium');

    // Estimate WIP reduction potential
    let wipReductionPotential = 0;

    if (highBottlenecks.length > 0) {
      wipReductionPotential -= 20; // -20% if high bottlenecks exist
    } else if (mediumBottlenecks.length > 0) {
      wipReductionPotential -= 12; // -12% if medium bottlenecks exist
    } else {
      wipReductionPotential -= 5; // -5% baseline optimization
    }

    return wipReductionPotential;
  }

  /**
   * Calculate delta lead time (potential improvement percentage)
   */
  private calculateDeltaLeadTime(operationSummaries: OperationSummary[]): number {
    // Calculate weighted impact based on bottleneck severity
    const highBottlenecks = operationSummaries.filter(op => op.bottleneckSeverity === 'high');
    const mediumBottlenecks = operationSummaries.filter(op => op.bottleneckSeverity === 'medium');

    let leadTimeReductionPotential = 0;

    if (highBottlenecks.length > 0) {
      leadTimeReductionPotential -= 25; // -25% if high bottlenecks exist
    } else if (mediumBottlenecks.length > 0) {
      leadTimeReductionPotential -= 15; // -15% if medium bottlenecks exist
    } else {
      leadTimeReductionPotential -= 8; // -8% baseline optimization
    }

    return leadTimeReductionPotential;
  }

  /**
   * Get empty KPI summary (when no data is available)
   */
  private getEmptyKpiSummary(): KpiSummary {
    return {
      totalWIP: 0,
      avgLeadTime: 0,
      reworkRate: 0,
      throughput: 0,
      bottleneckOperation: 'N/A',
      deltaWIP: 0,
      deltaLeadTime: 0,
      totalCases: 0,
      avgCycleTime: 0
    };
  }

  /**
   * Format KPI values for display
   */
  formatKpiValue(value: number, type: 'time' | 'percentage' | 'count' | 'rate'): string {
    switch (type) {
      case 'time':
        return `${value.toFixed(1)} hrs`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'count':
        return Math.round(value).toString();
      case 'rate':
        return `${value.toFixed(1)}/day`;
      default:
        return value.toString();
    }
  }
}
