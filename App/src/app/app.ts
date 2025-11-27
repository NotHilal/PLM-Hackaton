import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { OverviewTabComponent } from './overview-tab/overview-tab';
import { AnalyticsTabComponent } from './analytics-tab/analytics-tab';
import { InsightsTabComponent } from './insights-tab/insights-tab';

type RouteType = 'overview' | 'analytics' | 'insights' | 'data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    OverviewTabComponent,
    AnalyticsTabComponent,
    InsightsTabComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  activeRoute: RouteType = 'overview';
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
