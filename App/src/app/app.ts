import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { OverviewTabComponent } from './overview-tab/overview-tab';
import { AnalyticsTabComponent } from './analytics-tab/analytics-tab';
import { InsightsTabComponent } from './insights-tab/insights-tab';
import { DataUploadTabComponent } from './data-upload-tab/data-upload';
import { TestBackendComponent } from './test-backend/test-backend.component';
import { PythonOverviewComponent } from './python-overview/python-overview.component';
import { PythonInsightsComponent } from './python-insights/python-insights.component';
import { EventLogComponent } from './event-log/event-log.component';
import { FileVersionsModalComponent } from './file-versions-modal/file-versions-modal.component';

type RouteType = 'overview' | 'analytics' | 'insights' | 'data' | 'test' | 'python-overview' | 'python-insights' | 'event-log';

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
    PythonInsightsComponent,
    EventLogComponent,
    FileVersionsModalComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  activeRoute: RouteType = 'python-overview'; // Start with Python version
  sidenavOpen = true;
  fileVersionsModalOpen = false;

  // ViewChild references to components for refreshing
  @ViewChild(PythonOverviewComponent) pythonOverviewComponent?: PythonOverviewComponent;
  @ViewChild(PythonInsightsComponent) pythonInsightsComponent?: PythonInsightsComponent;
  @ViewChild(EventLogComponent) eventLogComponent?: EventLogComponent;

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

  /**
   * Open file versions modal
   */
  openFileVersionsModal(): void {
    console.log('📁 Opening file versions modal...');
    this.fileVersionsModalOpen = true;
    console.log('📁 Modal state:', this.fileVersionsModalOpen);
  }

  /**
   * Close file versions modal
   */
  closeFileVersionsModal(): void {
    this.fileVersionsModalOpen = false;
  }

  /**
   * Handle files switched event - refresh all data displays
   */
  onFilesSwitched(): void {
    console.log('📊 Files switched - refreshing all pages...');

    // Refresh Python Overview if it's loaded
    if (this.pythonOverviewComponent) {
      console.log('🔄 Refreshing Python Overview component');
      this.pythonOverviewComponent.refresh();
    }

    // Refresh Python Insights if it's loaded
    if (this.pythonInsightsComponent) {
      console.log('🔄 Refreshing Python Insights component');
      this.pythonInsightsComponent.refresh();
    }

    // Refresh Event Log if it's loaded
    if (this.eventLogComponent) {
      console.log('🔄 Refreshing Event Log component');
      this.eventLogComponent.refresh();
    }

    console.log('✅ All components refreshed');
  }
}
