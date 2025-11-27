// Process Mining Models

export interface ProcessMiningKPIs {
  totalWIP: number;
  avgLeadTime: number;
  reworkRate: number;
  throughput: number;
  bottleneckOperation: string;
  deltaWIP: number;
  deltaLeadTime: number;
  totalCases: number;
  avgCycleTime: number;
}

export interface OperationSummary {
  operation: string;
  currentWIP: number;
  avgCycleTime: number;
  avgWaitingTime: number;
  caseCount: number;
  reworkRate: number;
  throughput: number;
  bottleneckSeverity: 'none' | 'low' | 'medium' | 'high';
}

export interface Bottleneck {
  operation: string;
  station_id: string;
  avgWaitingTime: number;
  avgCycleTime: number;
  waitingToCycleRatio: number;
  currentWIP: number;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

export interface Insight {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  action: string;
  expectedImpact: string;
  priority: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
}

export interface AIInsights {
  insights: Insight[];
  recommendations: Recommendation[];
  summary: string;
}

export interface AllKPIsResponse {
  ERP: any;
  MES: any;
  PLM: any;
  CROSS: any;
  WORKFLOW: any;
  PROCESS_MINING: {
    kpis: ProcessMiningKPIs;
    operations: OperationSummary[];
    bottlenecks: Bottleneck[];
  };
}

// Chart data models
export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface GroupedChartDataPoint {
  name: string;
  series: ChartDataPoint[];
}
