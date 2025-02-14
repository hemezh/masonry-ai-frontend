import { useState } from 'react';
import { tablesApi, Table } from '@/lib/api/tables';
import { useWorkspace } from '@/contexts/workspace-context';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UseTableOptions {
  onError?: (error: Error) => void;
  filter?: 'all' | 'archived';
}

export function useTable(options: UseTableOptions = {}) {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const filter = options.filter || 'all';

  // Use react-query for tables data
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', currentWorkspace?.id, filter],
    queryFn: async () => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }
      return tablesApi.listTables(currentWorkspace.id, filter === 'archived');
    },
    enabled: !!currentWorkspace,
  });

  // Delete table mutation
  const deleteMutation = useMutation({
    mutationFn: async (tableId: string) => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }
      await tablesApi.deleteTable(currentWorkspace.id, tableId);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', currentWorkspace?.id] });
      toast.success('Table deleted successfully');
    },
    onError: (error: Error) => {
      options.onError?.(error);
      toast.error('Failed to delete table: ' + error.message);
    },
  });

  // Update table mutation
  const updateMutation = useMutation({
    mutationFn: async ({ tableId, data }: { tableId: string; data: { name: string; description?: string } }) => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }
      return tablesApi.updateTable(currentWorkspace.id, tableId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', currentWorkspace?.id] });
      toast.success('Table updated successfully');
    },
    onError: (error: Error) => {
      options.onError?.(error);
      toast.error('Failed to update table: ' + error.message);
    },
  });

  // CSV import mutation
  const csvImportMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }
      return tablesApi.createTableFromCSV(currentWorkspace.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', currentWorkspace?.id] });
      toast.success('CSV imported successfully');
    },
    onError: (error: Error) => {
      options.onError?.(error);
      toast.error('Failed to import CSV: ' + error.message);
    },
  });

  // Archive table mutation
  const archiveMutation = useMutation({
    mutationFn: async (tableId: string) => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }
      return tablesApi.archiveTable(currentWorkspace.id, tableId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', currentWorkspace?.id] });
      toast.success('Table archived successfully');
    },
    onError: (error: Error) => {
      options.onError?.(error);
      toast.error('Failed to archive table: ' + error.message);
    },
  });

  // Unarchive table mutation
  const unarchiveMutation = useMutation({
    mutationFn: async (tableId: string) => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }
      return tablesApi.unarchiveTable(currentWorkspace.id, tableId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', currentWorkspace?.id] });
      toast.success('Table unarchived successfully');
    },
    onError: (error: Error) => {
      options.onError?.(error);
      toast.error('Failed to unarchive table: ' + error.message);
    },
  });

  return {
    isLoading,
    data: tables,
    listTables: () => tables,
    deleteTable: (tableId: string) => deleteMutation.mutateAsync(tableId),
    updateTable: (tableId: string, data: { name: string; description?: string }) => 
      updateMutation.mutateAsync({ tableId, data }),
    createTableFromCSV: (formData: FormData) => csvImportMutation.mutateAsync(formData),
    archiveTable: (tableId: string) => archiveMutation.mutateAsync(tableId),
    unarchiveTable: (tableId: string) => unarchiveMutation.mutateAsync(tableId),
  };
} 