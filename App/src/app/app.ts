import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { OverviewTabComponent } from './overview-tab/overview-tab';
import { AnalyticsTabComponent } from './analytics-tab/analytics-tab';
import { InsightsTabComponent } from './insights-tab/insights-tab';
import { DataUploadTabComponent } from './data-upload-tab/data-upload';
import { TestBackendComponent } from './test-backend/test-backend.component';
import { PythonOverviewComponent } from './python-overview/python-overview.component';
import { PythonInsightsComponent } from './python-insights/python-insights.component';

type RouteType = 'overview' | 'analytics' | 'insights' | 'data' | 'test' | 'python-overview' | 'python-insights';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    OverviewTabComponent,
    AnalyticsTabComponent,
    InsightsTabComponent,
    DataUploadTabComponent,
    TestBackendComponent,
    PythonOverviewComponent,
    PythonInsightsComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  activeRoute: RouteType = 'python-overview'; // Start with Python version
  sidenavOpen = true;

  /**
   * Navigate to a different route
   */
  navigate(route: RouteType): void {
    this.activeRoute = route;

    // Close sidenav on mobile after navigation
    if (window.innerWidth < 1024) {
      this.sidenavOpen = false;
    }
  }

  /**
   * Toggle sidenav open/closed
   */
  toggleSidenav(): void {
    this.sidenavOpen = !this.sidenavOpen;
  }
}
