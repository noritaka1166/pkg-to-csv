import * as fs from 'fs';
import { ResultRow } from '../types/index.js';

export function generateCsv(data: ResultRow[]): string {
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const rows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header as keyof ResultRow] ?? '';
      return escapeCsvValue(String(value));
    });
    rows.push(values.join(','));
  }

  return rows.join('\n');
}

export function writeCsvToFile(filePath: string, data: ResultRow[]): void {
  const csvContent = generateCsv(data);
  try {
    fs.writeFileSync(filePath, csvContent, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to write CSV file to ${filePath}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}