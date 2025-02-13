import { useState } from 'react';
import { tablesApi, Table } from '@/lib/api/tables';
import { useWorkspace } from '@/contexts/workspace-context';
import { toast } from 'sonner';

interface UseTableOptions {
  onError?: (error: Error) => void;
}

export function useTable(options: UseTableOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { currentWorkspace } = useWorkspace();

  const listTables = async () => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    setIsLoading(true);
    try {
      const tables = await tablesApi.listTables(currentWorkspace.id);
      return tables;
    } catch (error) {
      const err = error as Error;
      options.onError?.(err);
      toast.error('Failed to load tables: ' + err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    setIsLoading(true);
    try {
      await tablesApi.deleteTable(currentWorkspace.id, tableId);
      toast.success('Table deleted successfully');
      return true;
    } catch (error) {
      const err = error as Error;
      options.onError?.(err);
      toast.error('Failed to delete table: ' + err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTable = async (tableId: string, data: { name: string; description?: string }) => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    setIsLoading(true);
    try {
      const updatedTable = await tablesApi.updateTable(currentWorkspace.id, tableId, data);
      toast.success('Table updated successfully');
      return updatedTable;
    } catch (error) {
      const err = error as Error;
      options.onError?.(err);
      toast.error('Failed to update table: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createTableFromCSV = async (formData: FormData) => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    setIsLoading(true);
    try {
      const table = await tablesApi.createTableFromCSV(currentWorkspace.id, formData);
      toast.success('CSV imported successfully');
      return table;
    } catch (error) {
      const err = error as Error;
      options.onError?.(err);
      toast.error('Failed to import CSV: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const archiveTable = async (tableId: string) => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    setIsLoading(true);
    try {
      const updatedTable = await tablesApi.archiveTable(currentWorkspace.id, tableId);
      toast.success('Table archived successfully');
      return updatedTable;
    } catch (error) {
      const err = error as Error;
      options.onError?.(err);
      toast.error('Failed to archive table: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const unarchiveTable = async (tableId: string) => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    setIsLoading(true);
    try {
      const updatedTable = await tablesApi.unarchiveTable(currentWorkspace.id, tableId);
      toast.success('Table unarchived successfully');
      return updatedTable;
    } catch (error) {
      const err = error as Error;
      options.onError?.(err);
      toast.error('Failed to unarchive table: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    listTables,
    deleteTable,
    updateTable,
    createTableFromCSV,
    archiveTable,
    unarchiveTable,
  };
} 