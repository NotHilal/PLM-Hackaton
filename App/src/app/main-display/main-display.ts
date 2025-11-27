import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { DataService, GraphData } from '../services/data.service';
import { Subject } from 'rxjs';

interface NgxNode {
  id: string;
  label: string;
  data?: any;
}

interface NgxEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

@Component({
  selector: 'app-main-display',
  standalone: true,
  imports: [CommonModule, NgxGraphModule],
  templateUrl: './main-display.html',
  styleUrls: ['./main-display.css'],
})
export class MainDisplayComponent implements OnInit {
  nodes: NgxNode[] = [];
  edges: NgxEdge[] = [];
  update$: Subject<boolean> = new Subject();
  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<any> = new Subject();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.graphData$.subscribe((graphData: GraphData) => {
      this.transformGraphData(graphData);
      this.update$.next(true);
      // Center and zoom to fit after a short delay
      setTimeout(() => {
        this.center$.next(true);
        this.zoomToFit$.next(true);
      }, 100);
    });
  }

  private transformGraphData(graphData: GraphData): void {
    // Transform nodes
    this.nodes = graphData.nodes.map(node => ({
      id: node.id,
      label: `${node.label}\n(${node.data.avgDelay}ms)`,
      data: node.data
    }));

    // Transform edges
    this.edges = graphData.edges.map(edge => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      label: edge.label
    }));
  }
}
