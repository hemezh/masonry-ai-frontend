import { ColumnType } from '@/lib/api/tables';

export interface Column {
  id: string;
  name?: string;
  header: string;
  width: number;
  type: ColumnType;
  minWidth?: number;
  color?: string;
  textColor?: string;
  text_color?: string;
}

export interface TableRow {
  id: number;
  data: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  convertedValue?: any;
}

export interface TableErrors {
  [rowIndex: string]: {
    [columnId: string]: string;
  };
}

// Predefined colors for columns
export const COLUMN_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#fca5a5' },
  { name: 'Orange', value: '#fdba74' },
  { name: 'Yellow', value: '#fde047' },
  { name: 'Green', value: '#86efac' },
  { name: 'Blue', value: '#93c5fd' },
  { name: 'Purple', value: '#d8b4fe' },
  { name: 'Pink', value: '#f9a8d4' },
] as const;

// Predefined text colors for columns
export const TEXT_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
] as const;

// Utility function to validate cell values
export const validateValue = (value: string, type: ColumnType): ValidationResult => {
  if (!value) return { isValid: true, convertedValue: null };

  switch (type) {
    case 'i': // integer
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num)) {
        return { isValid: false, error: 'Must be an integer' };
      }
      return { isValid: true, convertedValue: num };

    case 'f': // float
      const float = Number(value);
      if (isNaN(float)) {
        return { isValid: false, error: 'Must be a number' };
      }
      return { isValid: true, convertedValue: float };

    case 'd': // date
      const date = new Date(value);
      if (date.toString() === 'Invalid Date') {
        return { isValid: false, error: 'Must be a valid date' };
      }
      return { isValid: true, convertedValue: date.toISOString() };

    case 's': // string
    default:
      return { isValid: true, convertedValue: value };
  }
};
