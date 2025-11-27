import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DataService, KPIData, GraphData } from '../services/data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  kpiData: KPIData | null = null;
  graphData: GraphData | null = null;
  Math = Math; // Expose Math to template

  // Chart data
  wipChartData: any[] = [];
  bottleneckChartData: any[] = [];

  // Chart options
  view: [number, number] = [350, 220];
  showLegend = false;
  showLabels = true;
  colorScheme: any = {
    domain: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b']
  };

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.graphData$.subscribe((data) => {
      this.graphData = data;
      this.kpiData = this.dataService.calculateKPIs();
      this.prepareChartData();
    });
  }

  private prepareChartData(): void {
    if (!this.kpiData || !this.graphData) return;

    // Prepare WIP by station chart data
    this.wipChartData = this.graphData.nodes.map(node => ({
      name: node.label,
      value: node.data.wip
    }));

    // Prepare bottleneck chart data (waiting time)
    this.bottleneckChartData = this.graphData.nodes
      .map(node => ({
        name: node.label,
        value: node.data.waitingTime
      }))
      .sort((a, b) => b.value - a.value);
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
