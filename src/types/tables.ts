export type ColumnType = 's' | 'i' | 'f' | 'd' | 'b';

export interface Column {
  id: number;
  name: string;
  type: ColumnType;
  description?: string;
  width?: number;
}

export interface Table {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  columns: {
    columns: Column[];
  };
  created_at: string;
  updated_at: string;
}

export interface TableData {
  id: number;
  table_id: string;
  data: Record<string, any>;
  position: number;
  created_at: string;
  updated_at: string;
} 