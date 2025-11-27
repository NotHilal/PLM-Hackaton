import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  EventLogRecord,
  Insight,
  OperationSummary,
  KpiSummary,
  Bottleneck
} from '../models/event-log.model';

/**
 * AI Insights Service
 * Provides AI-generated or rule-based insights and recommendations
 *
 * TODO: Plug in GenAI backend endpoint here
 * This service currently uses rule-based mock insights.
 * For production, replace generateRuleBasedInsights() with calls to:
 * - OpenAI API
 * - Azure OpenAI
 * - Custom LLM endpoint
 * - Claude API
 *
 * Example backend integration:
 * return this.http.post<Insight[]>('https://api.your-backend.com/ai/insights', {
 *   eventLog: eventLog,
 *   kpis: kpiSummary,
 *   bottlenecks: bottlenecks
 * });
 */
@Injectable({
  providedIn: 'root'
})
export class AiInsightService {
  // Backend endpoint configuration (to be configured in production)
  private readonly AI_ENDPOINT = 'https://api.your-backend.com/ai/insights';
  private readonly USE_MOCK_DATA = true; // Set to false when backend is ready

  constructor() {}

  /**
   * Get AI-generated insights from event log data
   *
   * @param eventLog - Array of process events
   * @param operationSummaries - Aggregated operation statistics
   * @param kpiSummary - Global KPI metrics
   * @param bottlenecks - Identified bottlenecks
   * @returns Observable of insights array
   */
  getAiInsights(
    eventLog: EventLogRecord[],
    operationSummaries: OperationSummary[],
    kpiSummary: KpiSummary,
    bottlenecks: Bottleneck[]
  ): Observable<Insight[]> {
    if (this.USE_MOCK_DATA) {
      // Generate rule-based insights (current implementation)
      return of(this.generateRuleBasedInsights(
        eventLog,
        operationSummaries,
        kpiSummary,
        bottlenecks
      )).pipe(delay(500)); // Simulate API delay
    } else {
      // TODO: Implement real GenAI API call
      // return this.http.post<Insight[]>(this.AI_ENDPOINT, {
      //   eventLog,
      //   operationSummaries,
      //   kpis: kpiSummary,
      //   bottlenecks
      // });
      return of([]);
    }
  }

  /**
   * Generate natural language summary of the process state
   */
  generateProcessSummary(
    kpiSummary: KpiSummary,
    bottlenecks: Bottleneck[],
    operationSummaries: OperationSummary[]
  ): string[] {
    const summaries: string[] = [];

    // Bottleneck summary
    if (bottlenecks.length > 0) {
      const mainBottleneck = bottlenecks[0];
      const ratio = mainBottleneck.waitingToCycleRatio.toFixed(1);
      summaries.push(
        `Main bottleneck: ${mainBottleneck.operation} (waiting time ${ratio}x higher than cycle time).`
      );
    } else {
      summaries.push('No significant bottlenecks detected in the current process flow.');
    }

    // Rework summary
    const highReworkOps = operationSummaries.filter(op => op.reworkRate > 10);
    if (highReworkOps.length > 0) {
      const topRework = highReworkOps.sort((a, b) => b.reworkRate - a.reworkRate)[0];
      summaries.push(
        `Rework concentrated in ${topRework.operation} (${topRework.reworkRate.toFixed(1)}% of cases).`
      );
    } else {
      summaries.push(`Overall rework rate is well-controlled at ${kpiSummary.reworkRate.toFixed(1)}%.`);
    }

    // Lead time improvement potential
    if (kpiSummary.deltaLeadTime < 0) {
      summaries.push(
        `Estimated lead time reduction potential: ${Math.abs(kpiSummary.deltaLeadTime).toFixed(0)}% if top bottlenecks are addressed.`
      );
    }

    // WIP summary
    if (kpiSummary.totalWIP > 200) {
      summaries.push(
        `High WIP detected (${kpiSummary.totalWIP} units). Consider capacity expansion or flow optimization.`
      );
    }

    return summaries;
  }

  /**
   * Generate rule-based insights from data analysis
   * This is the current mock implementation
   */
  private generateRuleBasedInsights(
    eventLog: EventLogRecord[],
    operationSummaries: OperationSummary[],
    kpiSummary: KpiSummary,
    bottlenecks: Bottleneck[]
  ): Insight[] {
    const insights: Insight[] = [];
    let insightId = 1;

    // Insight 1: Critical bottleneck
    if (bottlenecks.length > 0 && bottlenecks[0].severity === 'high') {
      const bottleneck = bottlenecks[0];
      insights.push({
        id: `insight-${insightId++}`,
        title: `Critical Bottleneck at ${bottleneck.operation}`,
        description: `${bottleneck.operation} has a waiting time ${bottleneck.waitingToCycleRatio.toFixed(1)}x higher than cycle time. Current WIP: ${bottleneck.currentWIP} units. ${bottleneck.reason}`,
        impactEstimate: 'Reduce lead time by 18-25%, decrease WIP by 30-40 units',
        priority: 1,
        severity: 'critical',
        category: 'bottleneck',
        relatedOperation: bottleneck.operation
      });
    }

    // Insight 2: High rework rate
    const highReworkOps = operationSummaries
      .filter(op => op.reworkRate > 10)
      .sort((a, b) => b.reworkRate - a.reworkRate);

    if (highReworkOps.length > 0) {
      const op = highReworkOps[0];
      insights.push({
        id: `insight-${insightId++}`,
        title: `High Rework Rate at ${op.operation}`,
        description: `${op.operation} has a ${op.reworkRate.toFixed(1)}% rework rate, significantly above target. This causes downstream delays and increases lead time.`,
        impactEstimate: `Reduce rework by 60%, save ${(op.reworkRate * 0.6 * 2).toFixed(0)} hours/week`,
        priority: 2,
        severity: 'warning',
        category: 'quality',
        relatedOperation: op.operation
      });
    }

    // Insight 3: WIP distribution imbalance
    const wipValues = operationSummaries.map(op => op.currentWIP);
    const avgWIP = wipValues.reduce((a, b) => a + b, 0) / wipValues.length;
    const maxWIP = Math.max(...wipValues);

    if (maxWIP > avgWIP * 2) {
      const imbalancedOp = operationSummaries.find(op => op.currentWIP === maxWIP);
      if (imbalancedOp) {
        insights.push({
          id: `insight-${insightId++}`,
          title: 'Unbalanced WIP Distribution',
          description: `${imbalancedOp.operation} holds ${((maxWIP / kpiSummary.totalWIP) * 100).toFixed(0)}% of total WIP, indicating capacity constraint. Consider load balancing or capacity expansion.`,
          impactEstimate: 'Reduce average delay by 12-15%, improve throughput by 8-10%',
          priority: 3,
          severity: 'warning',
          category: 'efficiency',
          relatedOperation: imbalancedOp.operation
        });
      }
    }

    // Insight 4: Throughput optimization
    if (kpiSummary.throughput < 15) {
      insights.push({
        id: `insight-${insightId++}`,
        title: 'Low Throughput Detected',
        description: `Current throughput is ${kpiSummary.throughput.toFixed(1)} cases/day. Bottleneck elimination and parallel processing could increase capacity.`,
        impactEstimate: 'Increase throughput by 20-30%, reduce lead time by 15%',
        priority: 2,
        severity: 'warning',
        category: 'efficiency'
      });
    }

    // Insight 5: Cycle time optimization for specific operations
    const slowOperations = operationSummaries
      .filter(op => op.avgCycleTime > 25)
      .sort((a, b) => b.avgCycleTime - a.avgCycleTime);

    if (slowOperations.length > 0) {
      const op = slowOperations[0];
      insights.push({
        id: `insight-${insightId++}`,
        title: `Long Cycle Time at ${op.operation}`,
        description: `${op.operation} has an average cycle time of ${op.avgCycleTime.toFixed(1)} minutes. Process automation or method improvement could reduce this.`,
        impactEstimate: 'Reduce cycle time by 20%, decrease overall lead time by 8-12%',
        priority: 3,
        severity: 'info',
        category: 'efficiency',
        relatedOperation: op.operation
      });
    }

    // Insight 6: Quality gate recommendation
    if (kpiSummary.reworkRate > 8) {
      insights.push({
        id: `insight-${insightId++}`,
        title: 'Implement Early Quality Gates',
        description: `Overall rework rate of ${kpiSummary.reworkRate.toFixed(1)}% indicates quality issues. Automated inspection after high-rework operations can catch defects earlier.`,
        impactEstimate: 'Reduce rework by 40-50%, save 10-15 hours/week',
        priority: 2,
        severity: 'warning',
        category: 'quality'
      });
    }

    // Sort by priority
    return insights.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get optimization actions based on insights
   */
  getOptimizationActions(insights: Insight[]): {
    title: string;
    description: string;
    estimatedImpact: string;
    priority: number;
  }[] {
    return insights.slice(0, 3).map(insight => ({
      title: insight.title,
      description: insight.description,
      estimatedImpact: insight.impactEstimate,
      priority: insight.priority
    }));
  }
}
