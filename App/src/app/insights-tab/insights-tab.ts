import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, KPIData } from '../services/data.service';

@Component({
  selector: 'app-insights-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insights-tab.html',
  styleUrls: ['./insights-tab.css'],
})
export class InsightsTabComponent implements OnInit {
  kpiData: KPIData | null = null;
  Math = Math; // Expose Math to template

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.graphData$.subscribe(() => {
      this.kpiData = this.dataService.calculateKPIs();
    });
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'high': return '#f5576c';
      case 'medium': return '#f093fb';
      case 'low': return '#4facfe';
      default: return '#667eea';
    }
  }
}
