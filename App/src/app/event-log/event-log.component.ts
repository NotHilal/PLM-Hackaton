import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { BackendApiService } from '../services/backend-api.service';

@Component({
  selector: 'app-event-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-log.component.html',
  styleUrls: ['./event-log.component.css']
})
export class EventLogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  eventLog: any[] = [];
  metrics: any = null;
  totalEvents = 0;
  uniqueCases = 0;

  // UI State
  loading = true;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 20;

  // Filters
  selectedActivity: string | null = null;
  selectedResult: string | null = null;
  showReworkOnly = false;

  constructor(
    private backendApi: BackendApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEventLog();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEventLog(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      eventLog: this.backendApi.getEventLog(),
      metrics: this.backendApi.getEventLogMetrics()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.eventLog = data.eventLog.event_log || [];
          this.totalEvents = data.eventLog.total_events || 0;
          this.uniqueCases = data.eventLog.unique_cases || 0;
          this.metrics = data.metrics;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('✅ Event log loaded:', data);
        },
        error: (err) => {
          this.error = 'Impossible de charger l\'event log. Vérifiez que le backend tourne.';
          this.loading = false;
          this.cdr.detectChanges();
          console.error('❌ Error loading event log:', err);
        }
      });
  }

  get filteredEventLog(): any[] {
    let filtered = [...this.eventLog];

    if (this.selectedActivity) {
      filtered = filtered.filter(e => e.activity === this.selectedActivity);
    }

    if (this.selectedResult) {
      filtered = filtered.filter(e => e.result === this.selectedResult);
    }

    if (this.showReworkOnly) {
      filtered = filtered.filter(e => e.rework_flag === true);
    }

    return filtered;
  }

  get paginatedEventLog(): any[] {
    const filtered = this.filteredEventLog;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return filtered.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredEventLog.length / this.pageSize);
  }

  get uniqueActivities(): string[] {
    return [...new Set(this.eventLog.map(e => e.activity))];
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  resetFilters(): void {
    this.selectedActivity = null;
    this.selectedResult = null;
    this.showReworkOnly = false;
    this.currentPage = 1;
  }

  downloadCSV(): void {
    this.backendApi.downloadEventLogCSV();
  }

  refresh(): void {
    this.loadEventLog();
  }

  formatDuration(hours: number): string {
    if (!hours) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getResultClass(result: string): string {
    return result === 'Success' ? 'badge-success' : 'badge-error';
  }
}
