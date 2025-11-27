import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiHttpService } from '../services/kpi-http.service';
import { KPIs } from '../models/kpi.model';

@Component({
  selector: 'app-test-backend',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <div class="card">
        <h2>🧪 Test Backend Connection</h2>

        <div class="button-group">
          <button class="btn btn-primary" (click)="testHealth()">
            Test Health
          </button>
          <button class="btn btn-primary" (click)="testKPIs()">
            Load KPIs
          </button>
        </div>

        <!-- Health Status -->
        <div *ngIf="healthStatus" class="result-box success">
          <h3>✅ Backend is Running!</h3>
          <pre>{{ healthStatus | json }}</pre>
        </div>

        <!-- Error -->
        <div *ngIf="error" class="result-box error">
          <h3>❌ Error</h3>
          <p>{{ error }}</p>
          <p class="hint">Assurez-vous que le backend Python tourne sur http://localhost:5000</p>
        </div>

        <!-- Loading -->
        <div *ngIf="loading || healthLoading" class="loading">
          <div class="spinner"></div>
          <p>{{ healthLoading ? 'Checking backend health...' : 'Loading KPIs...' }}</p>
        </div>

        <!-- KPIs -->
        <div *ngIf="kpis && !loading" class="result-box success">
          <h3>✅ KPIs Loaded Successfully!</h3>

          <div class="kpi-preview">
            <div class="kpi-section">
              <h4>🔵 ERP</h4>
              <ul>
                <li>Criticité Moyenne: {{ kpis.ERP.criticite_moyenne }}</li>
                <li>Coût Total: {{ kpis.ERP.cout_total }} €</li>
                <li>Masse Totale: {{ kpis.ERP.masse_totale }} kg</li>
              </ul>
            </div>

            <div class="kpi-section">
              <h4>🟠 MES</h4>
              <ul>
                <li>Taux Aléas: {{ kpis.MES.taux_aleas }}%</li>
                <li>Productivité: {{ kpis.MES.productivite_poste }} pcs/h</li>
              </ul>
            </div>

            <div class="kpi-section">
              <h4>🟢 PLM</h4>
              <ul>
                <li>Coût MO: {{ kpis.PLM.cout_mo_total }} €</li>
                <li>Score Compétence: {{ kpis.PLM.score_competence }}/10</li>
              </ul>
            </div>
          </div>

          <details>
            <summary>Voir JSON complet</summary>
            <pre>{{ kpis | json }}</pre>
          </details>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: var(--spacing-xl);
      max-width: 1000px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: var(--spacing-lg);
    }

    .button-group {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .result-box {
      margin-top: var(--spacing-lg);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      border: 2px solid;
    }

    .result-box.success {
      background: rgba(16, 185, 129, 0.1);
      border-color: var(--success);
    }

    .result-box.error {
      background: rgba(239, 68, 68, 0.1);
      border-color: var(--error);
    }

    .result-box h3 {
      margin-bottom: var(--spacing-md);
    }

    .hint {
      margin-top: var(--spacing-md);
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    pre {
      background: var(--bg-secondary);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      overflow-x: auto;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .kpi-preview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .kpi-section {
      background: var(--bg-secondary);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
    }

    .kpi-section h4 {
      margin-bottom: var(--spacing-sm);
      color: var(--text-primary);
    }

    .kpi-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .kpi-section li {
      padding: var(--spacing-xs) 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    details {
      margin-top: var(--spacing-md);
      cursor: pointer;
    }

    details summary {
      color: var(--primary-blue-light);
      font-weight: 600;
      padding: var(--spacing-sm);
      user-select: none;
    }

    details summary:hover {
      color: var(--accent-cyan);
    }
  `]
})
export class TestBackendComponent {
  healthStatus: any = null;
  kpis: KPIs | null = null;
  error: string | null = null;
  loading = false;
  healthLoading = false;

  constructor(
    private kpiService: KpiHttpService,
    private cdr: ChangeDetectorRef
  ) {}

  testHealth(): void {
    console.log('🔵 testHealth() called - resetting state');
    this.reset();
    this.healthLoading = true;
    this.cdr.detectChanges(); // Force UI update
    console.log('🔵 healthLoading set to:', this.healthLoading);

    this.kpiService.checkHealth().subscribe({
      next: (data) => {
        console.log('🟢 Health check SUCCESS - setting healthLoading to false');
        this.healthStatus = data;
        this.healthLoading = false;
        this.cdr.detectChanges(); // Force UI update
        console.log('✅ Health check passed:', data);
        console.log('🟢 healthLoading now:', this.healthLoading);
      },
      error: (err) => {
        console.log('🔴 Health check ERROR - setting healthLoading to false');
        this.error = `Impossible de se connecter au backend: ${err.message}`;
        this.healthLoading = false;
        this.cdr.detectChanges(); // Force UI update
        console.error('❌ Health check failed:', err);
        console.log('🔴 healthLoading now:', this.healthLoading);
      }
    });
  }

  testKPIs(): void {
    console.log('🔵 testKPIs() called - resetting state');
    this.reset();
    this.loading = true;
    this.cdr.detectChanges(); // Force UI update
    console.log('🔵 loading set to:', this.loading);

    this.kpiService.getKPIs().subscribe({
      next: (data) => {
        console.log('🟢 KPIs SUCCESS - setting loading to false');
        this.kpis = data;
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
        console.log('✅ KPIs loaded:', data);
        console.log('🟢 loading now:', this.loading);
      },
      error: (err) => {
        console.log('🔴 KPIs ERROR - setting loading to false');
        this.error = `Erreur lors du chargement des KPIs: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
        console.error('❌ KPIs loading failed:', err);
        console.log('🔴 loading now:', this.loading);
      }
    });
  }

  private reset(): void {
    this.healthStatus = null;
    this.kpis = null;
    this.error = null;
    this.loading = false;
    this.healthLoading = false;
  }
}
