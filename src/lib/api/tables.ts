import { z } from 'zod';
import { getAuth } from 'firebase/auth';

// Schema definitions
export const ColumnTypeSchema = z.enum(['s', 'i', 'f', 'd']).default('s');
export type ColumnType = z.infer<typeof ColumnTypeSchema>;

export const TypedColumnKeySchema = z.string();
export type TypedColumnKey = z.infer<typeof TypedColumnKeySchema>;

export interface Column {
  id: number;
  name: string;
  type: ColumnType;
  description?: string;
  width?: number;
}

export const ColumnSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: ColumnTypeSchema,
  description: z.string().optional(),
  width: z.number().optional(),
}).transform((data): Column => ({
  ...data,
  type: data.type || 's', // Default to string type if empty
}));

export const TableSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  columns: z.object({
    columns: z.array(ColumnSchema),
  }).default({ columns: [] }),
  created_at: z.string(),
  updated_at: z.string(),
}).transform((data) => ({
  ...data,
  columns: data.columns || { columns: [] },
}));

export const TableDataSchema = z.object({
  id: z.number(),
  sheet_id: z.string().uuid(),
  data: z.record(z.string(), z.any()),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Table = z.infer<typeof TableSchema>;
export type TableData = z.infer<typeof TableDataSchema>;

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

// Helper function for API calls
const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
  }

  return response;
};

export const tablesApi = {
  // Create a new sheet
  createTable: async (workspaceId: string, data: { name: string; description?: string }) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return TableSchema.parse(await response.json());
  },

  // List all sheets in a workspace
  listTables: async (workspaceId: string) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables`);
    return z.array(TableSchema).parse(await response.json());
  },

  // Get a single sheet by ID
  getTable: async (workspaceId: string, id: string) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${id}`);
    return TableSchema.parse(await response.json());
  },

  // Update a sheet
  updateTable: async (workspaceId: string, id: string, data: { name?: string; description?: string }) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return TableSchema.parse(await response.json());
  },

  // Delete a sheet
  deleteTable: async (workspaceId: string, id: string) => {
    await fetchApi(`/workspaces/${workspaceId}/tables/${id}`, {
      method: 'DELETE',
    });
  },

  // Add a column to a sheet
  addColumn: async (workspaceId: string, sheetId: string, data: { name: string; type: ColumnType; description?: string }) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${sheetId}/columns`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return TableSchema.parse(await response.json());
  },

  // Update a column
  updateColumn: async (workspaceId: string, sheetId: string, typeKey: TypedColumnKey, data: { name?: string; description?: string; width?: number }) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${sheetId}/columns/${typeKey}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return TableSchema.parse(await response.json());
  },

  // Reorder columns
  reorderColumns: async (workspaceId: string, sheetId: string, typeKeys: TypedColumnKey[]) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${sheetId}/columns/reorder`, {
      method: 'POST',
      body: JSON.stringify({ type_keys: typeKeys }),
    });
    
    return TableSchema.parse(await response.json());
  },

  // Create sheet data
  createTableData: async (workspaceId: string, sheetId: string, data: Record<string, any>) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${sheetId}/data`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return TableDataSchema.parse(await response.json());
  },

  // List sheet data
  listTableData: async (workspaceId: string, sheetId: string) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${sheetId}/data`);
    return z.array(TableDataSchema).parse(await response.json());
  },

  // Update sheet data
  updateTableData: async (workspaceId: string, sheetId: string, dataId: number, data: Record<string, any>) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${sheetId}/data/${dataId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return TableDataSchema.parse(await response.json());
  },

  // Delete sheet data
  deleteTableData: async (workspaceId: string, sheetId: string, dataId: number) => {
    await fetchApi(`/workspaces/${workspaceId}/tables/${sheetId}/data/${dataId}`, {
      method: 'DELETE',
    });
  },

  // Move sheet data
  moveTableData: async (workspaceId: string, sheetId: string, dataId: number, targetPosition: number) => {
    await fetchApi(`/workspaces/${workspaceId}/tables/${sheetId}/data/${dataId}/move`, {
      method: 'POST',
      body: JSON.stringify({ target_position: targetPosition }),
    });
  },
}; 