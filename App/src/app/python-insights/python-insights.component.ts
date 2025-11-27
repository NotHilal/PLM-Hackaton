import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { BackendApiService } from '../services/backend-api.service';
import { AIInsights, Insight, Recommendation } from '../models/process-mining.model';

@Component({
  selector: 'app-python-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="insights-container">
      <!-- Header -->
      <div class="page-header mb-xl">
        <div class="header-content">
          <h2 class="page-title">💡 AI Insights & Recommendations</h2>
          <p class="page-subtitle">Recommandations intelligentes générées par l'IA</p>
        </div>
        <button class="btn btn-primary" (click)="refresh()" [disabled]="loading">
          {{ loading ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Génération des insights IA...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error && !loading" class="card error-card">
        <h3>❌ Erreur</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary mt-md" (click)="refresh()">Réessayer</button>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && !error && insights">
        <!-- Summary Card -->
        <div class="card mb-xl summary-card">
          <div class="card-header">
            <span class="icon">📊</span>
            Résumé de l'Analyse
          </div>
          <div class="card-body">
            <p class="summary-text">{{ insights.summary }}</p>
          </div>
        </div>

        <!-- Insights Grid -->
        <div class="grid grid-cols-2 mb-xl">
          <div class="insights-column">
            <h3 class="section-title">🔍 Insights Détectés</h3>
            <div class="insight-card" *ngFor="let insight of insights.insights"
                 [ngClass]="'insight-' + insight.type">
              <div class="insight-header">
                <span class="insight-icon">{{ getInsightIcon(insight.type) }}</span>
                <span class="insight-title">{{ insight.title }}</span>
                <span class="badge" [ngClass]="'badge-' + insight.impact">
                  Impact: {{ insight.impact }}
                </span>
              </div>
              <p class="insight-description">{{ insight.description }}</p>
            </div>

            <div *ngIf="insights.insights.length === 0" class="empty-state">
              <span class="empty-icon">✅</span>
              <p>Aucun problème détecté. Le système fonctionne de manière optimale.</p>
            </div>
          </div>

          <div class="recommendations-column">
            <h3 class="section-title">🎯 Recommandations</h3>
            <div class="recommendation-card" *ngFor="let rec of insights.recommendations; let i = index">
              <div class="rec-number">{{ i + 1 }}</div>
              <div class="rec-content">
                <h4 class="rec-action">{{ rec.action }}</h4>
                <p class="rec-impact">
                  <strong>Impact attendu:</strong> {{ rec.expectedImpact }}
                </p>
                <div class="rec-meta">
                  <span class="badge" [ngClass]="'badge-' + rec.priority">
                    Priorité: {{ rec.priority }}
                  </span>
                  <span class="badge badge-info">
                    Coût: {{ rec.cost }}
                  </span>
                </div>
              </div>
            </div>

            <div *ngIf="insights.recommendations.length === 0" class="empty-state">
              <span class="empty-icon">👍</span>
              <p>Aucune recommandation pour le moment.</p>
            </div>
          </div>
        </div>

        <!-- AI Attribution -->
        <div class="card ai-attribution">
          <div class="flex items-center gap-md">
            <span style="font-size: 2rem;">🤖</span>
            <div>
              <strong style="color: var(--accent-purple);">Généré par Intelligence Artificielle</strong>
              <p class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">
                Ces insights sont calculés en temps réel par notre backend Python avec des algorithmes d'analyse avancés.
                Intégration future possible avec GPT/Claude pour des insights encore plus puissants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .insights-container {
      padding: var(--spacing-xl);
      background: var(--bg-primary);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .summary-card {
      background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
      border-left: 4px solid var(--accent-cyan);
    }

    .summary-text {
      font-size: 1.1rem;
      line-height: 1.6;
      color: var(--text-primary);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: var(--spacing-lg);
      color: var(--text-primary);
    }

    .insights-column, .recommendations-column {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .insight-card {
      background: var(--bg-card);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      border-left: 4px solid;
      transition: all 0.2s ease;
    }

    .insight-card:hover {
      transform: translateX(4px);
      box-shadow: var(--shadow-lg);
    }

    .insight-success { border-color: var(--success); }
    .insight-info { border-color: var(--info); }
    .insight-warning { border-color: var(--warning); }
    .insight-error { border-color: var(--error); }

    .insight-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
    }

    .insight-icon {
      font-size: 1.5rem;
    }

    .insight-title {
      font-weight: 600;
      color: var(--text-primary);
      flex: 1;
    }

    .insight-description {
      color: var(--text-secondary);
      margin: 0;
    }

    .recommendation-card {
      display: flex;
      gap: var(--spacing-md);
      background: var(--bg-card);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
    }

    .recommendation-card:hover {
      border-color: var(--accent-purple);
      box-shadow: var(--shadow-lg);
    }

    .rec-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .rec-content {
      flex: 1;
    }

    .rec-action {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }

    .rec-impact {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-sm);
    }

    .rec-meta {
      display: flex;
      gap: var(--spacing-sm);
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-2xl);
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
      border: 2px dashed var(--border-color);
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: var(--spacing-md);
    }

    .ai-attribution {
      background: rgba(139, 92, 246, 0.1);
      border-color: var(--accent-purple);
    }

    .badge-low { background: rgba(59, 130, 246, 0.1); color: var(--info); }
    .badge-medium { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .badge-high { background: rgba(239, 68, 68, 0.1); color: var(--error); }

    @media (max-width: 1024px) {
      .grid-cols-2 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PythonInsightsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  insights: AIInsights | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private backendApi: BackendApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInsights();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInsights(): void {
    this.loading = true;
    this.error = null;

    this.backendApi.getInsights()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.insights = data;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('✅ Insights loaded:', data);
        },
        error: (err) => {
          this.error = 'Impossible de charger les insights depuis le backend Python.';
          this.loading = false;
          this.cdr.detectChanges();
          console.error('❌ Error loading insights:', err);
        }
      });
  }

  refresh(): void {
    this.loadInsights();
  }

  getInsightIcon(type: string): string {
    const icons: Record<string, string> = {
      'success': '✅',
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '❌'
    };
    return icons[type] || 'ℹ️';
  }
}
