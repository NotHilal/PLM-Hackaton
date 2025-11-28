import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface UploadedFile {
  file: File;
  name: string;
  type: string;
  size: number;
  preview: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  data: {
    avgDelay: number;
    wip: number;
    cycleTime: number;
    waitingTime: number;
    reworkRate: number;
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Bottleneck {
  id: string;
  label: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  wip: number;
  waitingTime: number;
}

export interface OptimizationAction {
  title: string;
  description: string;
  estimatedImpact: string;
  priority: number;
}

export interface KPIData {
  totalOperations: number;
  averageDelay: number;
  totalWIP: number;
  averageLeadTime: number;
  deltaWIP: number; // % change in WIP
  deltaLeadTime: number; // % change in Lead Time
  criticalStations: { id: string; label: string; avgDelay: number }[];
  totalNodes: number;
  bottlenecks: Bottleneck[];
  optimizationActions: OptimizationAction[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  employees = signal<any[]>([]);
  tasks = signal<any[]>([]);
  components = signal<any[]>([]);

  private documentsSubject = new BehaviorSubject<UploadedFile[]>([]);
  private selectedDocumentSubject = new BehaviorSubject<UploadedFile | null>(null);
  private graphDataSubject = new BehaviorSubject<GraphData>(this.getMockGraphData());

  public documents$ = this.documentsSubject.asObservable();
  public selectedDocument$ = this.selectedDocumentSubject.asObservable();
  public graphData$ = this.graphDataSubject.asObservable();

  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {
    // Load employees on service initialization
    this.loadEmployees();
  }

  /**
   * Load employee data from backend ERP
   */
  loadEmployees(): void {
    this.http.get<any>(`${this.baseUrl}/v2/data/erp`).subscribe({
      next: (data) => {
        console.log('📊 ERP data loaded:', data);
        if (data.employees && Array.isArray(data.employees)) {
          this.employees.set(data.employees);
          console.log(`✅ Loaded ${data.employees.length} employees`);
        } else {
          console.log('⚠️ No employees found in response');
          this.employees.set([]);
        }
      },
      error: (err) => {
        console.error('❌ Error loading ERP data:', err);
        console.log('⚠️ Using empty employee list');
        this.employees.set([]);
      }
    });
  }

  /**
   * Reload employees (useful after upload)
   */
  reloadEmployees(): void {
    this.loadEmployees();
  }

  private getMockGraphData(): GraphData {
    return {
      nodes: [
        {
          id: 'cutting',
          label: 'Cutting',
          data: {
            avgDelay: 3,
            wip: 45,
            cycleTime: 8,
            waitingTime: 2,
            reworkRate: 2.1
          }
        },
        {
          id: 'drilling',
          label: 'Drilling',
          data: {
            avgDelay: 15,
            wip: 120,
            cycleTime: 12,
            waitingTime: 18,
            reworkRate: 8.5
          }
        },
        {
          id: 'painting',
          label: 'Painting',
          data: {
            avgDelay: 8,
            wip: 75,
            cycleTime: 20,
            waitingTime: 5,
            reworkRate: 3.2
          }
        },
        {
          id: 'assembly',
          label: 'Assembly',
          data: {
            avgDelay: 22,
            wip: 180,
            cycleTime: 15,
            waitingTime: 25,
            reworkRate: 12.3
          }
        },
        {
          id: 'inspection',
          label: 'Inspection',
          data: {
            avgDelay: 5,
            wip: 30,
            cycleTime: 10,
            waitingTime: 3,
            reworkRate: 1.8
          }
        }
      ],
      edges: [
        { source: 'cutting', target: 'drilling', label: '250 ops' },
        { source: 'drilling', target: 'painting', label: '220 ops' },
        { source: 'painting', target: 'assembly', label: '210 ops' },
        { source: 'assembly', target: 'inspection', label: '180 ops' }
      ]
    };
  }

  addDocument(file: File): void {
    const uploadedFile: UploadedFile = {
      file: file,
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      preview: this.generatePreview(file)
    };

    const currentDocs = this.documentsSubject.value;
    this.documentsSubject.next([...currentDocs, uploadedFile]);

    // Auto-select the first uploaded document
    if (currentDocs.length === 0) {
      this.selectDocument(uploadedFile);
    }
  }

  selectDocument(doc: UploadedFile): void {
    this.selectedDocumentSubject.next(doc);
  }

  private generatePreview(file: File): string[] {
    // For now, return hardcoded preview
    // Later, this will parse the actual file content
    return [
      'Preview: First 5 lines/columns',
      'Column 1: Process Step',
      'Column 2: Timestamp',
      'Column 3: Delay (ms)',
      'Column 4: Operation Count'
    ];
  }

  getGraphData(): GraphData {
    return this.graphDataSubject.value;
  }

  calculateKPIs(): KPIData {
    const graphData = this.graphDataSubject.value;

    // Total operations: sum of all edge operations
    const totalOperations = graphData.edges.reduce((sum, edge) => {
      const opsMatch = edge.label.match(/(\d+)\s*ops/);
      return sum + (opsMatch ? parseInt(opsMatch[1]) : 0);
    }, 0);

    // Average delay: average of all node delays
    const delays = graphData.nodes.map(n => n.data.avgDelay);
    const averageDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;

    // Total WIP: sum of all WIP
    const totalWIP = graphData.nodes.reduce((sum, node) => sum + node.data.wip, 0);

    // Average Lead Time: sum of cycle times + waiting times
    const averageLeadTime = graphData.nodes.reduce(
      (sum, node) => sum + node.data.cycleTime + node.data.waitingTime,
      0
    ) / graphData.nodes.length;

    // Delta WIP (simulated improvement: -15%)
    const deltaWIP = -15.0;

    // Delta Lead Time (simulated improvement: -22%)
    const deltaLeadTime = -22.0;

    // Critical stations: nodes with highest delays (top 3)
    const criticalStations = [...graphData.nodes]
      .sort((a, b) => b.data.avgDelay - a.data.avgDelay)
      .slice(0, 3)
      .map(n => ({
        id: n.id,
        label: n.label,
        avgDelay: n.data.avgDelay
      }));

    // Identify bottlenecks (waiting > cycle time)
    const bottlenecks: Bottleneck[] = graphData.nodes
      .filter(node => node.data.waitingTime > node.data.cycleTime)
      .map(node => ({
        id: node.id,
        label: node.label,
        reason: node.data.reworkRate > 10
          ? 'High rework rate causing persistent queue'
          : 'Waiting time exceeds cycle time',
        severity: (node.data.waitingTime > node.data.cycleTime * 2 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
        wip: node.data.wip,
        waitingTime: node.data.waitingTime
      }))
      .sort((a, b) => b.waitingTime - a.waitingTime);

    // Top 3 optimization actions
    const optimizationActions: OptimizationAction[] = [
      {
        title: 'Optimize Assembly Station Capacity',
        description: 'Add parallel processing lines to reduce WIP buildup at assembly',
        estimatedImpact: 'Reduce lead time by 18-25%, decrease WIP by 30 units',
        priority: 1
      },
      {
        title: 'Implement Quality Gates at Drilling',
        description: 'Add automated inspection to reduce 8.5% rework rate',
        estimatedImpact: 'Reduce rework by 60%, save 12 hours/week',
        priority: 2
      },
      {
        title: 'Balance Workload Distribution',
        description: 'Redistribute work between painting and drilling to smooth flow',
        estimatedImpact: 'Reduce average delay by 15%, improve throughput by 10%',
        priority: 3
      }
    ];

    // Total nodes
    const totalNodes = graphData.nodes.length;

    return {
      totalOperations,
      averageDelay,
      totalWIP,
      averageLeadTime,
      deltaWIP,
      deltaLeadTime,
      criticalStations,
      totalNodes,
      bottlenecks,
      optimizationActions
    };
  }
}
