'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTable } from '@/hooks/use-table';
import { Table } from '@/lib/api/tables';
import { useWorkspace } from '@/contexts/workspace-context';
import { TableHeader } from '@/components/tables/table-header';
import { TableList } from '@/components/tables/table-list';
import { TableEmptyState } from '@/components/tables/table-empty-state';
import { TableFilters, TableFilter } from '@/components/tables/table-filters';
import { CreateTableDialog } from '@/components/tables/create-table-dialog';
import { CSVImportDialog, CSVImportData } from '@/components/tables/csv-import-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Debug logging utility
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[TablesPage ${timestamp}] ${message}`, data || '');
};

export default function TablesPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();
  const [tables, setTables] = useState<Table[]>([]);
  const [filter, setFilter] = useState<TableFilter>('all');
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fetchCount = useRef(0);
  const strictModeRender = useRef(false);

  const { 
    isLoading,
    listTables,
    deleteTable,
    updateTable,
    createTableFromCSV,
    archiveTable,
    unarchiveTable,
  } = useTable({
    onError: (error) => {
      log('Table operation error:', error);
    }
  });

  const fetchTables = useCallback(async () => {
    const currentFetchCount = ++fetchCount.current;
    log(`Starting fetch #${currentFetchCount}`);

    try {
      const fetchedTables = await listTables();
      if (currentFetchCount === fetchCount.current) {
        setTables(fetchedTables || []);
      }
    } catch (error) {
      log(`Fetch #${currentFetchCount} failed:`, error);
    }
  }, [listTables]);

  useEffect(() => {
    if (strictModeRender.current) {
      return;
    }
    strictModeRender.current = true;
    fetchTables();
  }, [fetchTables]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableToEdit) return;
    
    const updatedTable = await updateTable(tableToEdit.id, {
      name: editForm.name,
      description: editForm.description
    });

    if (updatedTable) {
      setTables(prevTables => 
        prevTables.map(t => t.id === updatedTable.id ? updatedTable : t)
      );
      setTableToEdit(null);
    }
  };

  if (isLoadingWorkspace) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  if (!currentWorkspace && !isLoadingWorkspace) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Please select a workspace to view tables.</div>
      </div>
    );
  }

  // Filter tables based on the current filter
  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true;
    if (filter === 'archived') return table.archived;
    return false;
  });

  return (
    <div className="container mx-auto p-6">
      <TableHeader
        onCreateTable={() => setIsCreateTableOpen(true)}
        onImportCSV={() => setIsImportDialogOpen(true)}
      />

      <TableFilters
        filter={filter}
        onFilterChange={setFilter}
      />

      <TableList
        tables={filteredTables}
        isLoading={isLoading}
        onEdit={(table) => {
          setTableToEdit(table);
          setEditForm({
            name: table.name,
            description: table.description || ''
          });
        }}
        onDelete={setTableToDelete}
        onArchive={async (table) => {
          const updatedTable = await archiveTable(table.id);
          if (updatedTable) {
            setTables(prevTables => 
              prevTables.map(t => t.id === updatedTable.id ? updatedTable : t)
            );
          }
        }}
        onUnarchive={async (table) => {
          const updatedTable = await unarchiveTable(table.id);
          if (updatedTable) {
            setTables(prevTables => 
              prevTables.map(t => t.id === updatedTable.id ? updatedTable : t)
            );
          }
        }}
      />

      {!isLoading && filteredTables.length === 0 && (
        <TableEmptyState
          onCreateTable={() => setIsCreateTableOpen(true)}
          onImportCSV={() => setIsImportDialogOpen(true)}
        />
      )}

      <AlertDialog open={!!tableToDelete} onOpenChange={(open) => !open && setTableToDelete(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the table &quot;{tableToDelete?.name}&quot; and all its data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:hover:bg-destructive/80"
              onClick={async () => {
                if (tableToDelete) {
                  const success = await deleteTable(tableToDelete.id);
                  if (success) {
                    setTables(prevTables => prevTables.filter(t => t.id !== tableToDelete.id));
                    setTableToDelete(null);
                  }
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!tableToEdit} onOpenChange={(open) => {
        if (!open) setTableToEdit(null);
      }}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a description..."
                  className="bg-background"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTableToEdit(null)}
                className="border-border"
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateTableDialog
        open={isCreateTableOpen}
        onOpenChange={setIsCreateTableOpen}
        workspaceId={currentWorkspace?.id || ''}
        onSuccess={fetchTables}
      />

      <CSVImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        workspaceId={currentWorkspace?.id || ''}
        onSubmit={async (data: CSVImportData) => {
          if (!currentWorkspace) throw new Error('No workspace selected');
          
          const formData = new FormData();
          formData.append('file', data.file);
          formData.append('skipFirstRow', data.skipFirstRow.toString());
          formData.append('columns', JSON.stringify(data.columnTypes));

          const table = await createTableFromCSV(formData);
          if (table) {
            setIsImportDialogOpen(false);
            // Wait a bit for the table to be created before navigating
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push(`/dashboard/tables/${table.id}`);
          }
        }}
      />
    </div>
  );
} 