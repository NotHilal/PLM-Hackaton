import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { KPIs } from '../models/kpi.model';
import {
  AllKPIsResponse,
  ProcessMiningKPIs,
  OperationSummary,
  Bottleneck,
  AIInsights,
  ChartDataPoint,
  GroupedChartDataPoint
} from '../models/process-mining.model';

/**
 * Unified Backend API Service
 * Provides access to all Python backend endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class BackendApiService {
  private baseUrl = 'http://localhost:5000/api';

  // Caching subjects
  private allKpisSubject = new BehaviorSubject<AllKPIsResponse | null>(null);
  public allKpis$ = this.allKpisSubject.asObservable();

  private processMiningKpisSubject = new BehaviorSubject<ProcessMiningKPIs | null>(null);
  public processMiningKpis$ = this.processMiningKpisSubject.asObservable();

  private operationsSubject = new BehaviorSubject<OperationSummary[]>([]);
  public operations$ = this.operationsSubject.asObservable();

  private insightsSubject = new BehaviorSubject<AIInsights | null>(null);
  public insights$ = this.insightsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== KPI ENDPOINTS ====================

  /**
   * Get all KPIs (legacy endpoint - ERP, MES, PLM, CROSS, WORKFLOW only)
   */
  getKPIs(): Observable<KPIs> {
    return this.http.get<KPIs>(`${this.baseUrl}/kpi`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get ALL KPIs including process mining (NEW v2 endpoint)
   */
  getAllKPIs(): Observable<AllKPIsResponse> {
    return this.http.get<AllKPIsResponse>(`${this.baseUrl}/v2/kpis/all`).pipe(
      tap(data => this.allKpisSubject.next(data)),
      shareReplay(1)
    );
  }

  /**
   * Get ERP KPIs only
   */
  getERPKPIs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v2/kpis/erp`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get MES KPIs only
   */
  getMESKPIs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v2/kpis/mes`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get PLM KPIs only
   */
  getPLMKPIs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v2/kpis/plm`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get Process Mining KPIs (WIP, Lead Time, etc.)
   */
  getProcessMiningKPIs(): Observable<ProcessMiningKPIs> {
    return this.http.get<ProcessMiningKPIs>(`${this.baseUrl}/v2/kpis/process-mining`).pipe(
      tap(data => this.processMiningKpisSubject.next(data)),
      shareReplay(1)
    );
  }

  // ==================== OPERATION & BOTTLENECK ENDPOINTS ====================

  /**
   * Get operation summaries
   */
  getOperations(): Observable<OperationSummary[]> {
    return this.http.get<OperationSummary[]>(`${this.baseUrl}/v2/operations`).pipe(
      tap(data => this.operationsSubject.next(data)),
      shareReplay(1)
    );
  }

  /**
   * Get bottleneck analysis
   */
  getBottlenecks(): Observable<Bottleneck[]> {
    return this.http.get<Bottleneck[]>(`${this.baseUrl}/v2/bottlenecks`).pipe(
      shareReplay(1)
    );
  }

  // ==================== INSIGHTS ENDPOINT ====================

  /**
   * Get AI-generated insights and recommendations
   */
  getInsights(): Observable<AIInsights> {
    return this.http.get<AIInsights>(`${this.baseUrl}/v2/insights`).pipe(
      tap(data => this.insightsSubject.next(data)),
      shareReplay(1)
    );
  }

  // ==================== CHART DATA ENDPOINTS ====================

  /**
   * Get WIP by operation chart data
   */
  getWIPChartData(): Observable<ChartDataPoint[]> {
    return this.http.get<ChartDataPoint[]>(`${this.baseUrl}/v2/charts/wip-by-operation`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get Cycle vs Waiting time chart data
   */
  getCycleVsWaitingChartData(): Observable<GroupedChartDataPoint[]> {
    return this.http.get<GroupedChartDataPoint[]>(`${this.baseUrl}/v2/charts/cycle-vs-waiting`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get Rework rate chart data
   */
  getReworkRateChartData(): Observable<ChartDataPoint[]> {
    return this.http.get<ChartDataPoint[]>(`${this.baseUrl}/v2/charts/rework-rate`).pipe(
      shareReplay(1)
    );
  }

  // ==================== RESOURCE ANALYTICS ENDPOINTS ====================

  /**
   * Get Resource (HR) KPIs from ERP data
   */
  getResourceKPIs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v2/analytics/resource-kpis`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get Supply Chain KPIs from PLM data
   */
  getSupplyChainKPIs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v2/analytics/supply-chain-kpis`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get Cost by Qualification chart data
   */
  getCostByQualificationChart(): Observable<ChartDataPoint[]> {
    return this.http.get<ChartDataPoint[]>(`${this.baseUrl}/v2/analytics/cost-by-qualification`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get Experience Distribution chart data
   */
  getExperienceDistributionChart(): Observable<ChartDataPoint[]> {
    return this.http.get<ChartDataPoint[]>(`${this.baseUrl}/v2/analytics/experience-distribution`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get Supplier Distribution chart data
   */
  getSupplierDistributionChart(): Observable<ChartDataPoint[]> {
    return this.http.get<ChartDataPoint[]>(`${this.baseUrl}/v2/analytics/supplier-distribution`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get Criticality Distribution chart data
   */
  getCriticalityDistributionChart(): Observable<ChartDataPoint[]> {
    return this.http.get<ChartDataPoint[]>(`${this.baseUrl}/v2/analytics/criticality-distribution`).pipe(
      shareReplay(1)
    );
  }

  // ==================== FILE UPLOAD ENDPOINTS ====================

  /**
   * Upload MES/ERP/PLM Excel file
   * @param file - The Excel file to upload
   * @param type - File type: 'mes', 'erp', or 'plm'
   */
  uploadFile(file: File, type: 'mes' | 'erp' | 'plm'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.http.post(`${this.baseUrl}/v2/upload`, formData);
  }

  /**
   * Get information about currently loaded data files
   */
  getCurrentFiles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v2/current-files`);
  }

  // ==================== EVENT LOG ENDPOINTS ====================

  /**
   * Get structured event log (case_id, activity, timestamps, station_id, result, rework_flag)
   */
  getEventLog(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v2/event-log`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Get process metrics calculated from event log
   */
  getEventLogMetrics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/v2/event-log/metrics`).pipe(
      shareReplay(1)
    );
  }

  /**
   * Download event log as CSV
   */
  downloadEventLogCSV(): void {
    window.open(`${this.baseUrl}/v2/event-log/export`, '_blank');
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Health check
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  /**
   * Reload data from Excel files
   */
  reloadData(): Observable<any> {
    return this.http.post(`${this.baseUrl}/reload-data`, {});
  }

  /**
   * List all available endpoints
   */
  listEndpoints(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/endpoints`);
  }

  /**
   * Get current cached KPIs (synchronous)
   */
  getCurrentAllKPIs(): AllKPIsResponse | null {
    return this.allKpisSubject.value;
  }

  /**
   * Get current cached process mining KPIs (synchronous)
   */
  getCurrentProcessMiningKPIs(): ProcessMiningKPIs | null {
    return this.processMiningKpisSubject.value;
  }

  /**
   * Get current cached operations (synchronous)
   */
  getCurrentOperations(): OperationSummary[] {
    return this.operationsSubject.value;
  }

  /**
   * Get current cached insights (synchronous)
   */
  getCurrentInsights(): AIInsights | null {
    return this.insightsSubject.value;
  }

  // ==================== CHAT ENDPOINT ====================

  /**
   * Chat with AI using Groq
   */
  chatWithAI(message: string, insights?: AIInsights): Observable<{ response: string; model: string }> {
    return this.http.post<{ response: string; model: string }>(`${this.baseUrl}/v2/chat`, {
      message,
      insights
    });
  }
}
