import { z } from 'zod';

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

export const SheetSchema = z.object({
  id: z.string().uuid(),
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

export const SheetDataSchema = z.object({
  id: z.number(),
  sheet_id: z.string().uuid(),
  data: z.record(z.string(), z.any()),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Sheet = z.infer<typeof SheetSchema>;
export type SheetData = z.infer<typeof SheetDataSchema>;

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/sheets`;

// Helper function for API calls
const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response;
};

export const sheetsApi = {
  // Create a new sheet
  createSheet: async (data: { name: string; description?: string }) => {
    const response = await fetchApi('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return SheetSchema.parse(await response.json());
  },

  // List all sheets
  listSheets: async () => {
    const response = await fetchApi('');
    return z.array(SheetSchema).parse(await response.json());
  },

  // Get a single sheet by ID
  getSheet: async (id: string) => {
    const response = await fetchApi(`/${id}`);
    return SheetSchema.parse(await response.json());
  },

  // Update a sheet
  updateSheet: async (id: string, data: { name?: string; description?: string }) => {
    const response = await fetchApi(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return SheetSchema.parse(await response.json());
  },

  // Delete a sheet
  deleteSheet: async (id: string) => {
    await fetchApi(`/${id}`, {
      method: 'DELETE',
    });
  },

  // Add a column to a sheet
  addColumn: async (sheetId: string, data: { name: string; type: ColumnType; description?: string }) => {
    const response = await fetchApi(`/${sheetId}/columns`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return SheetSchema.parse(await response.json());
  },

  // Update a column
  updateColumn: async (sheetId: string, typeKey: TypedColumnKey, data: { name?: string; description?: string; width?: number }) => {
    const response = await fetchApi(`/${sheetId}/columns/${typeKey}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return SheetSchema.parse(await response.json());
  },

  // Reorder columns
  reorderColumns: async (sheetId: string, typeKeys: TypedColumnKey[]) => {
    const response = await fetchApi(`/${sheetId}/columns/reorder`, {
      method: 'POST',
      body: JSON.stringify({ type_keys: typeKeys }),
    });
    
    return SheetSchema.parse(await response.json());
  },

  // Create sheet data
  createSheetData: async (sheetId: string, data: Record<string, any>) => {
    const response = await fetchApi(`/${sheetId}/data`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return SheetDataSchema.parse(await response.json());
  },

  // List sheet data
  listSheetData: async (sheetId: string) => {
    const response = await fetchApi(`/${sheetId}/data`);
    return z.array(SheetDataSchema).parse(await response.json());
  },

  // Update sheet data
  updateSheetData: async (sheetId: string, dataId: number, data: Record<string, any>) => {
    const response = await fetchApi(`/${sheetId}/data/${dataId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return SheetDataSchema.parse(await response.json());
  },

  // Delete sheet data
  deleteSheetData: async (sheetId: string, dataId: number) => {
    await fetchApi(`/${sheetId}/data/${dataId}`, {
      method: 'DELETE',
    });
  },

  // Move sheet data
  moveSheetData: async (sheetId: string, dataId: number, targetPosition: number) => {
    await fetchApi(`/${sheetId}/data/${dataId}/move`, {
      method: 'POST',
      body: JSON.stringify({ target_position: targetPosition }),
    });
  },
}; 