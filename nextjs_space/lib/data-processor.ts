
// Data Processing Utilities
// Handles CSV, Excel, JSON file parsing and analysis

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface DataStats {
  totalRows: number;
  totalColumns: number;
  columns: ColumnStats[];
  nullPercentage: number;
  duplicateRows: number;
  qualityScore: number;
  sampleData: any[];
  errors: string[];
  warnings: string[];
}

export interface ColumnStats {
  name: string;
  index: number;
  type: 'string' | 'number' | 'date' | 'boolean' | 'mixed' | 'unknown';
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: any[];
  min?: any;
  max?: any;
  detectedFormat?: string;
}

export interface ProcessingResult {
  success: boolean;
  data?: any[];
  stats?: DataStats;
  error?: string;
}

/**
 * Parse CSV file from buffer
 */
export async function parseCSV(buffer: Buffer): Promise<ProcessingResult> {
  try {
    const text = buffer.toString('utf-8');
    
    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: false, // Keep as strings for analysis
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            resolve({
              success: false,
              error: `CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`
            });
            return;
          }

          const stats = analyzeData(results.data as any[]);
          
          resolve({
            success: true,
            data: results.data as any[],
            stats
          });
        },
        error: (error: any) => {
          resolve({
            success: false,
            error: `CSV parsing failed: ${error.message}`
          });
        }
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse Excel file from buffer
 */
export async function parseExcel(buffer: Buffer): Promise<ProcessingResult> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        error: 'No sheets found in Excel file'
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null
    }) as any[][];

    if (data.length === 0) {
      return {
        success: false,
        error: 'Excel file is empty'
      };
    }

    // Convert to object array with headers
    const headers = data[0] as string[];
    const rows = data.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx];
      });
      return obj;
    });

    const stats = analyzeData(rows);

    return {
      success: true,
      data: rows,
      stats
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Excel parsing failed: ${error.message}`
    };
  }
}

/**
 * Parse JSON file from buffer
 */
export async function parseJSON(buffer: Buffer): Promise<ProcessingResult> {
  try {
    const text = buffer.toString('utf-8');
    const data = JSON.parse(text);

    // Ensure data is array
    const arrayData = Array.isArray(data) ? data : [data];
    
    const stats = analyzeData(arrayData);

    return {
      success: true,
      data: arrayData,
      stats
    };
  } catch (error: any) {
    return {
      success: false,
      error: `JSON parsing failed: ${error.message}`
    };
  }
}

/**
 * Analyze data and generate statistics
 */
export function analyzeData(data: any[]): DataStats {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      columns: [],
      nullPercentage: 0,
      duplicateRows: 0,
      qualityScore: 0,
      sampleData: [],
      errors: ['Dataset is empty'],
      warnings: []
    };
  }

  // Get all column names
  const allKeys = new Set<string>();
  data.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });

  const columnNames = Array.from(allKeys);
  const totalRows = data.length;
  const totalColumns = columnNames.length;

  // Analyze each column
  const columns: ColumnStats[] = columnNames.map((colName, index) => {
    return analyzeColumn(colName, index, data);
  });

  // Calculate null percentage
  const totalCells = totalRows * totalColumns;
  const totalNulls = columns.reduce((sum, col) => sum + col.nullCount, 0);
  const nullPercentage = totalCells > 0 ? (totalNulls / totalCells) * 100 : 0;

  // Detect duplicate rows
  const duplicateRows = detectDuplicates(data);

  // Calculate quality score
  const qualityScore = calculateQualityScore({
    nullPercentage,
    duplicateRows,
    totalRows,
    columns
  });

  // Generate warnings
  if (nullPercentage > 10) {
    warnings.push(`High null percentage: ${nullPercentage.toFixed(2)}%`);
  }
  if (duplicateRows > 0) {
    warnings.push(`Found ${duplicateRows} duplicate rows`);
  }
  columns.forEach(col => {
    if (col.type === 'mixed') {
      warnings.push(`Column "${col.name}" has mixed data types`);
    }
  });

  // Sample data (first 100 rows)
  const sampleData = data.slice(0, 100);

  return {
    totalRows,
    totalColumns,
    columns,
    nullPercentage: parseFloat(nullPercentage.toFixed(2)),
    duplicateRows,
    qualityScore: parseFloat(qualityScore.toFixed(2)),
    sampleData,
    errors,
    warnings
  };
}

/**
 * Analyze individual column
 */
function analyzeColumn(columnName: string, index: number, data: any[]): ColumnStats {
  const values = data.map(row => row[columnName]);
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  const nullCount = values.length - nonNullValues.length;
  const nullPercentage = values.length > 0 ? (nullCount / values.length) * 100 : 0;
  
  const uniqueValues = new Set(nonNullValues.map(v => JSON.stringify(v)));
  const uniqueCount = uniqueValues.size;

  // Detect data type
  const type = detectDataType(nonNullValues);
  
  // Get sample values (first 5 unique)
  const sampleValues = Array.from(uniqueValues)
    .slice(0, 5)
    .map(v => JSON.parse(v));

  // Calculate min/max for numbers and dates
  let min, max;
  if (type === 'number') {
    const numbers = nonNullValues.filter(v => typeof v === 'number' || !isNaN(Number(v)));
    if (numbers.length > 0) {
      min = Math.min(...numbers.map(Number));
      max = Math.max(...numbers.map(Number));
    }
  }

  return {
    name: columnName,
    index,
    type,
    nullCount,
    nullPercentage: parseFloat(nullPercentage.toFixed(2)),
    uniqueCount,
    sampleValues,
    min,
    max
  };
}

/**
 * Detect data type of column values
 */
function detectDataType(values: any[]): ColumnStats['type'] {
  if (values.length === 0) return 'unknown';

  const types = new Set<string>();
  
  values.forEach(value => {
    if (typeof value === 'boolean') {
      types.add('boolean');
    } else if (typeof value === 'number') {
      types.add('number');
    } else if (typeof value === 'string') {
      // Check if it's a number string
      if (!isNaN(Number(value)) && value.trim() !== '') {
        types.add('number');
      }
      // Check if it's a date string
      else if (isDateString(value)) {
        types.add('date');
      }
      // Check if it's a boolean string
      else if (['true', 'false', 'yes', 'no', '1', '0'].includes(value.toLowerCase())) {
        types.add('boolean');
      }
      else {
        types.add('string');
      }
    } else {
      types.add('unknown');
    }
  });

  if (types.size === 0) return 'unknown';
  if (types.size > 1) return 'mixed';
  
  return types.values().next().value as ColumnStats['type'];
}

/**
 * Check if string is a valid date
 */
function isDateString(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.length > 5;
}

/**
 * Detect duplicate rows
 */
function detectDuplicates(data: any[]): number {
  const seen = new Set<string>();
  let duplicates = 0;

  data.forEach(row => {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  });

  return duplicates;
}

/**
 * Calculate overall quality score (0-100)
 */
function calculateQualityScore(params: {
  nullPercentage: number;
  duplicateRows: number;
  totalRows: number;
  columns: ColumnStats[];
}): number {
  let score = 100;

  // Deduct for null values
  score -= params.nullPercentage * 0.5;

  // Deduct for duplicates
  const duplicatePercentage = params.totalRows > 0 
    ? (params.duplicateRows / params.totalRows) * 100 
    : 0;
  score -= duplicatePercentage * 0.8;

  // Deduct for mixed type columns
  const mixedColumns = params.columns.filter(c => c.type === 'mixed').length;
  const mixedPercentage = params.columns.length > 0
    ? (mixedColumns / params.columns.length) * 100
    : 0;
  score -= mixedPercentage * 0.3;

  return Math.max(0, Math.min(100, score));
}

/**
 * Clean data by removing nulls and duplicates
 */
export function cleanData(data: any[], options: {
  removeNulls?: boolean;
  removeDuplicates?: boolean;
  fillNulls?: boolean;
  fillValue?: any;
} = {}): any[] {
  let cleaned = [...data];

  // Remove rows with all nulls
  if (options.removeNulls) {
    cleaned = cleaned.filter(row => {
      const values = Object.values(row);
      const nonNullCount = values.filter(v => v !== null && v !== undefined && v !== '').length;
      return nonNullCount > 0;
    });
  }

  // Fill null values
  if (options.fillNulls && options.fillValue !== undefined) {
    cleaned = cleaned.map(row => {
      const newRow = { ...row };
      Object.keys(newRow).forEach(key => {
        if (newRow[key] === null || newRow[key] === undefined || newRow[key] === '') {
          newRow[key] = options.fillValue;
        }
      });
      return newRow;
    });
  }

  // Remove duplicates
  if (options.removeDuplicates) {
    const seen = new Set<string>();
    cleaned = cleaned.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  return cleaned;
}

/**
 * Parse file based on extension
 */
export async function parseFile(buffer: Buffer, filename: string): Promise<ProcessingResult> {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'csv':
      return parseCSV(buffer);
    case 'xlsx':
    case 'xls':
      return parseExcel(buffer);
    case 'json':
      return parseJSON(buffer);
    default:
      return {
        success: false,
        error: `Unsupported file format: ${ext}`
      };
  }
}
