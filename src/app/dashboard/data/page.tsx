'use client';
// Tables page, in UI it's represented as the "Data" tab
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTable } from '@/hooks/use-table';
import { Table } from '@/lib/api/tables';
import { useWorkspace } from '@/contexts/workspace-context';
import { TableHeader } from '@/components/data/table-header';
import { TableList } from '@/components/data/table-list';
import { TableEmptyState } from '@/components/data/table-empty-state';
import { TableFilters, TableFilter } from '@/components/data/table-filters';
import { TableDialogs } from '@/components/data/table-dialogs';
import { ArchiveWarning } from '@/components/data/archive-warning';
import { LoadingState } from '@/components/data/loading-state';
import { WorkspaceWarning } from '@/components/data/workspace-warning';
import { Separator } from "@/components/ui/separator";

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

  const handleEditFormChange = (field: 'name' | 'description', value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteTable = async (table: Table) => {
    const success = await deleteTable(table.id);
    if (success) {
      setTableToDelete(null);
    }
  };

  const handleArchiveTable = async (table: Table) => {
    const updatedTable = await archiveTable(table.id);
    if (updatedTable) {
      setTableToArchive(null);
    }
  };

  const handleUnarchiveTable = async (table: Table) => {
    const updatedTable = await unarchiveTable(table.id);
    if (updatedTable) {
      setTableToEdit(null);
    }
  };

  if (isLoadingWorkspace) {
    return <LoadingState />;
  }

  if (!currentWorkspace && !isLoadingWorkspace) {
    return <WorkspaceWarning />;
  }

  // Filter tables based on the current filter
  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true;
    if (filter === 'archived') return table.archived;
    return false;
  });

  return (
    <div className="h-full flex-1 flex flex-col p-8">
      <div className="flex flex-col gap-4">
        <TableHeader
          onCreateTable={() => setIsCreateTableOpen(true)}
          onImportCSV={() => setIsImportDialogOpen(true)}
        />
        <div className="flex items-center justify-between">
          <TableFilters
            filter={filter}
            onFilterChange={setFilter}
          />
          <div className="text-sm text-muted-foreground">
            {filteredTables.length} {filteredTables.length === 1 ? 'table' : 'tables'}
          </div>
        </div>
      </div>

      {filter === 'archived' && <ArchiveWarning />}

      <div className="flex-1">
        {isLoading ? (
          <LoadingState />
        ) : filteredTables.length > 0 ? (
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
            onUnarchive={handleUnarchiveTable}
          />
        ) : (
          <TableEmptyState
            onCreateTable={() => setIsCreateTableOpen(true)}
            onImportCSV={() => setIsImportDialogOpen(true)}
          />
        )}
      </div>

      <TableDialogs
        workspaceId={currentWorkspace?.id || ''}
        tableToDelete={tableToDelete}
        tableToEdit={tableToEdit}
        tableToArchive={tableToArchive}
        editForm={editForm}
        isCreateTableOpen={isCreateTableOpen}
        isImportDialogOpen={isImportDialogOpen}
        onEditFormChange={handleEditFormChange}
        onEditSubmit={handleEditSubmit}
        onDeleteTable={handleDeleteTable}
        onArchiveTable={handleArchiveTable}
        onUnarchiveTable={handleUnarchiveTable}
        onCreateTableClose={() => setIsCreateTableOpen(false)}
        onImportDialogClose={() => setIsImportDialogOpen(false)}
        createTableFromCSV={createTableFromCSV}
      />
    </div>
  );
} 