import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { EventLogRecord, ColumnMapping, UploadedFile } from '../models/event-log.model';

/**
 * Service for parsing Excel/CSV files
 * Handles file reading, column mapping, and data transformation
 */
@Injectable({
  providedIn: 'root'
})
export class FileParserService {
  constructor() {}

  /**
   * Parse Excel or CSV file and extract raw data
   * @param file - The uploaded file
   * @returns Promise with parsed data and metadata
   */
  async parseFile(file: File): Promise<{
    data: any[];
    columns: string[];
    metadata: UploadedFile;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = e.target.result;
          let workbook: XLSX.WorkBook;

          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const csvData = new TextDecoder().decode(data);
            workbook = XLSX.read(csvData, { type: 'string' });
          } else {
            // Parse Excel
            workbook = XLSX.read(data, { type: 'array' });
          }

          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            reject(new Error('File is empty or has no data'));
            return;
          }

          // Extract column names
          const columns = Object.keys(jsonData[0]);

          // Create metadata
          const metadata: UploadedFile = {
            name: file.name,
            type: file.type || this.getFileType(file.name),
            size: file.size,
            uploadDate: new Date(),
            rowCount: jsonData.length,
            columnNames: columns
          };

          resolve({
            data: jsonData,
            columns,
            metadata
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      // Read file based on type
      if (file.name.endsWith('.csv')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  /**
   * Transform raw data to EventLogRecord array using column mapping
   * @param rawData - Raw data from Excel/CSV
   * @param mapping - Column mapping configuration
   * @returns Array of EventLogRecord
   */
  transformToEventLog(rawData: any[], mapping: ColumnMapping): EventLogRecord[] {
    const eventLog: EventLogRecord[] = [];

    for (const row of rawData) {
      try {
        // Validate required fields
        if (!mapping.case_id || !mapping.operation || !mapping.timestamp_start ||
            !mapping.timestamp_end || !mapping.station_id || !mapping.result) {
          continue; // Skip if mapping is incomplete
        }

        const record: EventLogRecord = {
          case_id: this.extractValue(row, mapping.case_id),
          operation: this.extractValue(row, mapping.operation),
          timestamp_start: this.parseDate(this.extractValue(row, mapping.timestamp_start)),
          timestamp_end: this.parseDate(this.extractValue(row, mapping.timestamp_end)),
          station_id: this.extractValue(row, mapping.station_id),
          result: this.parseResult(this.extractValue(row, mapping.result)),
          rework_flag: mapping.rework_flag
            ? this.parseBoolean(this.extractValue(row, mapping.rework_flag))
            : false
        };

        // Validate record
        if (this.isValidRecord(record)) {
          eventLog.push(record);
        }
      } catch (error) {
        console.warn('Error parsing row:', row, error);
        // Continue with next row
      }
    }

    return eventLog;
  }

  /**
   * Auto-detect column mapping based on column names
   * Uses heuristics to match common column name patterns
   */
  autoDetectMapping(columns: string[]): ColumnMapping {
    const mapping: ColumnMapping = {
      case_id: null,
      operation: null,
      timestamp_start: null,
      timestamp_end: null,
      station_id: null,
      result: null,
      rework_flag: null
    };

    // Convert columns to lowercase for matching
    const lowerColumns = columns.map(c => c.toLowerCase());

    // Case ID patterns
    const caseIdPatterns = ['case_id', 'caseid', 'case', 'id', 'case_number', 'order_id'];
    mapping.case_id = this.findMatchingColumn(lowerColumns, columns, caseIdPatterns);

    // Operation patterns
    const operationPatterns = ['operation', 'activity', 'action', 'step', 'process', 'task'];
    mapping.operation = this.findMatchingColumn(lowerColumns, columns, operationPatterns);

    // Start timestamp patterns
    const startPatterns = ['timestamp_start', 'start_time', 'start', 'begin', 'start_date', 'date_start'];
    mapping.timestamp_start = this.findMatchingColumn(lowerColumns, columns, startPatterns);

    // End timestamp patterns
    const endPatterns = ['timestamp_end', 'end_time', 'end', 'finish', 'end_date', 'date_end', 'complete'];
    mapping.timestamp_end = this.findMatchingColumn(lowerColumns, columns, endPatterns);

    // Station ID patterns
    const stationPatterns = ['station_id', 'station', 'machine', 'resource', 'workstation', 'location'];
    mapping.station_id = this.findMatchingColumn(lowerColumns, columns, stationPatterns);

    // Result patterns
    const resultPatterns = ['result', 'status', 'outcome', 'state', 'quality'];
    mapping.result = this.findMatchingColumn(lowerColumns, columns, resultPatterns);

    // Rework flag patterns
    const reworkPatterns = ['rework_flag', 'rework', 'is_rework', 'reworked', 'defect'];
    mapping.rework_flag = this.findMatchingColumn(lowerColumns, columns, reworkPatterns);

    return mapping;
  }

  /**
   * Validate column mapping completeness
   */
  validateMapping(mapping: ColumnMapping): { valid: boolean; missing: string[] } {
    const required = ['case_id', 'operation', 'timestamp_start', 'timestamp_end', 'station_id', 'result'];
    const missing: string[] = [];

    for (const field of required) {
      if (!mapping[field as keyof ColumnMapping]) {
        missing.push(field);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Extract value from row using column name
   */
  private extractValue(row: any, columnName: string | null): string {
    if (!columnName || !row[columnName]) {
      return '';
    }
    return String(row[columnName]).trim();
  }

  /**
   * Parse date string to Date object
   * Handles multiple date formats
   */
  private parseDate(dateStr: string): Date {
    if (!dateStr) {
      return new Date();
    }

    // Try Excel serial date first
    if (!isNaN(Number(dateStr))) {
      const excelDate = Number(dateStr);
      if (excelDate > 40000 && excelDate < 60000) { // Reasonable Excel date range
        return this.excelDateToJSDate(excelDate);
      }
    }

    // Try standard date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Default to current date if parsing fails
    console.warn('Could not parse date:', dateStr);
    return new Date();
  }

  /**
   * Convert Excel serial date to JavaScript Date
   */
  private excelDateToJSDate(serial: number): Date {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);

    const fractionalDay = serial - Math.floor(serial) + 0.0000001;
    let totalSeconds = Math.floor(86400 * fractionalDay);
    const seconds = totalSeconds % 60;
    totalSeconds -= seconds;
    const hours = Math.floor(totalSeconds / (60 * 60));
    const minutes = Math.floor(totalSeconds / 60) % 60;

    return new Date(
      dateInfo.getFullYear(),
      dateInfo.getMonth(),
      dateInfo.getDate(),
      hours,
      minutes,
      seconds
    );
  }

  /**
   * Parse result field to OK/NOK
   */
  private parseResult(value: string): 'OK' | 'NOK' {
    const normalized = value.toLowerCase().trim();

    if (normalized === 'ok' || normalized === '1' || normalized === 'true' ||
        normalized === 'pass' || normalized === 'passed' || normalized === 'success') {
      return 'OK';
    }

    return 'NOK';
  }

  /**
   * Parse boolean value
   */
  private parseBoolean(value: string): boolean {
    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  /**
   * Validate EventLogRecord
   */
  private isValidRecord(record: EventLogRecord): boolean {
    return !!(
      record.case_id &&
      record.operation &&
      record.timestamp_start &&
      record.timestamp_end &&
      record.station_id &&
      record.result
    );
  }

  /**
   * Find matching column from patterns
   */
  private findMatchingColumn(
    lowerColumns: string[],
    originalColumns: string[],
    patterns: string[]
  ): string | null {
    for (const pattern of patterns) {
      const index = lowerColumns.findIndex(col => col.includes(pattern));
      if (index !== -1) {
        return originalColumns[index];
      }
    }
    return null;
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    if (filename.endsWith('.csv')) return 'text/csv';
    if (filename.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (filename.endsWith('.xls')) return 'application/vnd.ms-excel';
    return 'application/octet-stream';
  }
}
