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
import { InformationCircleIcon } from "@heroicons/react/24/outline";
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
  const [filter, setFilter] = useState<TableFilter>('all');
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [tableToArchive, setTableToArchive] = useState<Table | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const { 
    isLoading,
    data: tables = [],
    deleteTable,
    updateTable,
    createTableFromCSV,
    archiveTable,
    unarchiveTable,
  } = useTable({
    onError: (error) => {
      log('Table operation error:', error);
    },
    filter: filter
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableToEdit) return;
    
    const updatedTable = await updateTable(tableToEdit.id, {
      name: editForm.name,
      description: editForm.description
    });

    if (updatedTable) {
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

      {filter === 'archived' && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
          <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />
          <p>
            Archived tables are automatically deleted after 30 days. To prevent deletion, unarchive a table before the 30-day period ends.
          </p>
        </div>
      )}

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
        onArchive={(table) => setTableToArchive(table)}
        onUnarchive={async (table) => {
          const updatedTable = await unarchiveTable(table.id);
          if (updatedTable) {
            setTableToEdit(null);
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

      <AlertDialog open={!!tableToArchive} onOpenChange={(open) => !open && setTableToArchive(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this table?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will archive the table &quot;{tableToArchive?.name}&quot;. Archived tables will be automatically deleted after 30 days.
              You can unarchive the table before then to prevent deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (tableToArchive) {
                  const updatedTable = await archiveTable(tableToArchive.id);
                  if (updatedTable) {
                    setTableToArchive(null);
                  }
                }
              }}
            >
              Archive
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
        onSuccess={() => {}}
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