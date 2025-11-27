/**
 * Core data model for Process Mining event logs
 * Represents individual events from MES/PLM/ERP systems
 */
export interface EventLogRecord {
  case_id: string;
  operation: string; // e.g., Découpe, Perçage, Peinture, Assemblage, Contrôle
  timestamp_start: Date;
  timestamp_end: Date;
  station_id: string;
  result: 'OK' | 'NOK';
  rework_flag: boolean;
}

/**
 * Aggregated statistics for each operation/activity
 */
export interface OperationSummary {
  operation: string;
  avgCycleTime: number; // in minutes
  avgWaitingTime: number; // in minutes
  currentWIP: number; // Work in Progress count
  caseCount: number; // Total number of cases
  reworkRate: number; // Percentage (0-100)
  throughput: number; // cases per day
  bottleneckSeverity: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Global KPIs and delta metrics
 */
export interface KpiSummary {
  totalWIP: number;
  avgLeadTime: number; // in hours
  reworkRate: number; // percentage
  throughput: number; // cases per day
  bottleneckOperation: string;
  deltaWIP: number; // % change (positive = increase, negative = decrease)
  deltaLeadTime: number; // % change
  totalCases: number;
  avgCycleTime: number; // in minutes
}

/**
 * AI-generated or rule-based insights
 */
export interface Insight {
  id: string;
  title: string;
  description: string;
  impactEstimate: string; // e.g., "Reduce lead time by 18-25%"
  priority: number; // 1 = highest
  severity: 'info' | 'warning' | 'critical';
  category: 'bottleneck' | 'rework' | 'efficiency' | 'quality';
  relatedOperation?: string;
}

/**
 * Bottleneck analysis result
 */
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

/**
 * Time series data point for charts
 */
export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  category?: string;
}

/**
 * Filter criteria for analytics
 */
export interface AnalyticsFilter {
  dateFrom: Date | null;
  dateTo: Date | null;
  operations: string[]; // selected operations
  stations: string[]; // selected stations
  resultFilter: 'all' | 'OK' | 'NOK';
  reworkOnly: boolean;
}

/**
 * Column mapping for Excel/CSV import
 */
export interface ColumnMapping {
  case_id: string | null;
  operation: string | null;
  timestamp_start: string | null;
  timestamp_end: string | null;
  station_id: string | null;
  result: string | null;
  rework_flag: string | null;
}

/**
 * Uploaded file metadata
 */
export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  rowCount: number;
  columnNames: string[];
}
