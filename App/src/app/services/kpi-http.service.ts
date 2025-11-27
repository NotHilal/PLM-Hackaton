import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { tap, shareReplay, switchMap } from 'rxjs/operators';
import { KPIs } from '../models/kpi.model';

@Injectable({
  providedIn: 'root'
})
export class KpiHttpService {
  private baseUrl = 'http://localhost:5000/api';

  // Cache the KPIs with BehaviorSubject for reactive updates
  private kpisSubject = new BehaviorSubject<KPIs | null>(null);
  public kpis$ = this.kpisSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Auto-refresh every 30 seconds
  private refreshInterval = 30000;
  private autoRefreshEnabled = false;

  constructor(private http: HttpClient) {
    // Don't auto-start - let components decide when to load
  }

  /**
   * Get KPIs from Python backend
   */
  getKPIs(): Observable<KPIs> {
    this.loadingSubject.next(true);

    return this.http.get<KPIs>(`${this.baseUrl}/kpi`).pipe(
      tap({
        next: (kpis) => {
          this.kpisSubject.next(kpis);
          this.loadingSubject.next(false);
          console.log('KPIs loaded from backend:', kpis);
        },
        error: (err) => {
          this.loadingSubject.next(false);
          console.error('Error loading KPIs:', err);
        }
      }),
      shareReplay(1) // Cache the result
    );
  }

  /**
   * Get current KPIs value (synchronous)
   */
  getCurrentKPIs(): KPIs | null {
    return this.kpisSubject.value;
  }

  /**
   * Refresh KPIs manually
   */
  refreshKPIs(): void {
    this.getKPIs().subscribe();
  }

  /**
   * Enable auto-refresh (optional)
   */
  enableAutoRefresh(): void {
    if (this.autoRefreshEnabled) return;

    this.autoRefreshEnabled = true;

    // Initial load
    this.getKPIs().subscribe();

    // Auto-refresh every 30 seconds
    timer(this.refreshInterval, this.refreshInterval)
      .pipe(switchMap(() => this.getKPIs()))
      .subscribe();
  }

  /**
   * Check if loading
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Health check
   */
  checkHealth(): Observable<{ status: string; timestamp: string }> {
    return this.http.get<{ status: string; timestamp: string }>(`${this.baseUrl}/health`);
  }
}
