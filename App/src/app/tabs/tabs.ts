import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TabType = 'overview' | 'analytics' | 'insights';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.html',
  styleUrls: ['./tabs.css'],
})
export class TabsComponent {
  activeTab: TabType = 'overview';

  tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'analytics' as TabType, label: 'Analytics', icon: '📈' },
    { id: 'insights' as TabType, label: 'Insights', icon: '💡' }
  ];

  selectTab(tabId: TabType): void {
    this.activeTab = tabId;
  }
}
