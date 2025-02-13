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

// Schema for column addition response
export const AddColumnResponseSchema = z.object({
  name: z.string(),
  type_key: z.string(),
  type: ColumnTypeSchema,
  description: z.string().optional(),
}).or(TableSchema);

export const TableDataSchema = z.object({
  id: z.number(),
  table_id: z.string().uuid(),
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
  // Create a new table
  createTable: async (workspaceId: string, data: { name: string; description?: string }) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return TableSchema.parse(await response.json());
  },

  // List all tables in a workspace
  listTables: async (workspaceId: string) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables`);
    return z.array(TableSchema).parse(await response.json());
  },

  // Get a single table by ID
  getTable: async (workspaceId: string, id: string) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${id}`);
    return TableSchema.parse(await response.json());
  },

  // Update a table
  updateTable: async (workspaceId: string, id: string, data: { name?: string; description?: string }) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return TableSchema.parse(await response.json());
  },

  // Delete a table
  deleteTable: async (workspaceId: string, id: string) => {
    await fetchApi(`/workspaces/${workspaceId}/tables/${id}`, {
      method: 'DELETE',
    });
  },

  // Add a column to a table
  addColumn: async (workspaceId: string, tableId: string, data: { name: string; type: ColumnType; description?: string }) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${tableId}/columns`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    try {
      const responseData = await response.json();
      return AddColumnResponseSchema.parse(responseData);
    } catch (error) {
      console.error('Error parsing add column response:', error);
      // If parsing fails, just return the raw response
      return response.json();
    }
  },

  // Update a column
  updateColumn: async (workspaceId: string, tableId: string, typeKey: TypedColumnKey, data: { name?: string; description?: string; width?: number }) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${tableId}/columns/${typeKey}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return TableSchema.parse(await response.json());
  },

  // Reorder columns
  reorderColumns: async (workspaceId: string, tableId: string, typeKeys: TypedColumnKey[]) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${tableId}/columns/reorder`, {
      method: 'POST',
      body: JSON.stringify({ type_keys: typeKeys }),
    });
    
    return TableSchema.parse(await response.json());
  },

  // Create table data
  createTableData: async (workspaceId: string, tableId: string, data: Record<string, any>) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${tableId}/data`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return TableDataSchema.parse(await response.json());
  },

  // List table data
  listTableData: async (workspaceId: string, tableId: string) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${tableId}/data`);
    return z.array(TableDataSchema).parse(await response.json());
  },

  // Update table data
  updateTableData: async (workspaceId: string, tableId: string, dataId: number, data: Record<string, any>) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/${tableId}/data/${dataId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return TableDataSchema.parse(await response.json());
  },

  // Delete table data
  deleteTableData: async (workspaceId: string, tableId: string, dataId: number) => {
    await fetchApi(`/workspaces/${workspaceId}/tables/${tableId}/data/${dataId}`, {
      method: 'DELETE',
    });
  },

  // Move table data
  moveTableData: async (workspaceId: string, tableId: string, dataId: number, targetPosition: number) => {
    await fetchApi(`/workspaces/${workspaceId}/tables/${tableId}/data/${dataId}/move`, {
      method: 'POST',
      body: JSON.stringify({ target_position: targetPosition }),
    });
  },

  importCSV: async (workspaceId: string, tableId: string, formData: FormData) => {
    const response = await fetch(
      `${API_BASE}/workspaces/${workspaceId}/tables/${tableId}/import-csv`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import CSV');
    }

    return response.json();
  },

  createTableFromCSV: async (workspaceId: string, formData: FormData) => {
    const response = await fetchApi(`/workspaces/${workspaceId}/tables/import-csv`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
} as const; 