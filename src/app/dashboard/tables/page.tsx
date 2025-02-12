'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, TableCellsIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { tablesApi, type Table } from '@/lib/api/tables';
import { useWorkspace } from '@/contexts/workspace-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CreateTableDialog } from '@/components/tables/create-table-dialog';

export default function TablesPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  
  const { data: tables, isLoading: isLoadingTables, error } = useQuery({
    queryKey: ['tables', currentWorkspace?.id],
    queryFn: () => currentWorkspace ? tablesApi.listTables(currentWorkspace.id) : Promise.resolve([]),
    enabled: !!currentWorkspace,
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      if (!currentWorkspace) throw new Error('No workspace selected');
      await tablesApi.deleteTable(currentWorkspace.id, tableId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', currentWorkspace?.id] });
      toast.success('Table deleted successfully');
      setTableToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete table: ' + error.message);
      setTableToDelete(null);
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ tableId, data }: { tableId: string; data: { name: string; description?: string } }) => {
      if (!currentWorkspace) throw new Error('No workspace selected');
      return tablesApi.updateTable(currentWorkspace.id, tableId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', currentWorkspace?.id] });
      toast.success('Table updated successfully');
      setTableToEdit(null);
    },
    onError: (error) => {
      toast.error('Failed to update table: ' + error.message);
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableToEdit) return;
    
    updateTableMutation.mutate({
      tableId: tableToEdit.id,
      data: {
        name: editForm.name,
        description: editForm.description
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">Error loading tables: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tables</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* New Table Card */}
        <button
          onClick={() => setIsCreateTableOpen(true)}
          className="h-[240px] rounded-lg border border-dashed border-border hover:border-primary/50 bg-card p-6 flex flex-col items-center justify-center gap-4 transition-all group dark:bg-white/[.08] dark:hover:bg-white/[.12] dark:hover:border-primary/30 dark:shadow-lg"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors dark:bg-primary/30 dark:group-hover:bg-primary/40">
            <PlusIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-medium text-foreground dark:text-slate-100">Create New Table</h3>
            <p className="text-sm text-muted-foreground dark:text-slate-300">Start with a blank table</p>
          </div>
        </button>

        {/* Loading State */}
        {isLoadingTables && (
          <div className="h-[240px] rounded-lg border bg-card p-6 flex items-center justify-center dark:bg-white/[.08] dark:shadow-lg">
            <div className="animate-pulse text-muted-foreground dark:text-slate-300">Loading...</div>
          </div>
        )}

        {/* Existing Tables */}
        {tables?.map((table: Table) => (
          <div key={table.id} className="group relative h-[240px] rounded-lg border border-border/40 bg-card p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-border/80 dark:bg-white/[.08] dark:hover:bg-white/[.12] dark:shadow-lg dark:hover:border-border/80 flex flex-col dark:hover:shadow-xl">
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center dark:bg-primary/30">
                  <TableCellsIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center text-xs dark:text-slate-300">
                  <span className="font-medium">{table.columns?.columns?.length || 0}</span>
                  <span className="ml-1">columns</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 dark:text-slate-100" onClick={(e) => e.stopPropagation()}>
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setTableToEdit(table);
                      setEditForm({
                        name: table.name,
                        description: table.description || ''
                      });
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTableToDelete(table);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <button
              onClick={() => router.push(`/dashboard/tables/${table.id}`)}
              className="absolute inset-0 z-0"
            >
              <span className="sr-only">View table {table.name}</span>
            </button>
            <div className="mt-3 relative z-10 pointer-events-none flex-1">
              <h3 className="font-medium text-foreground dark:text-slate-100">
                {table.name}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground dark:text-slate-300 line-clamp-2">
                {table.description || 'No description'}
              </p>
            </div>
            <div className="text-xs text-muted-foreground dark:text-slate-400 border-t border-border/40 dark:border-slate-600 pt-2 mt-auto relative z-10 pointer-events-none">
              Updated {formatDate(table.updated_at)}
            </div>
          </div>
        ))}
      </div>

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
              onClick={() => tableToDelete && deleteTableMutation.mutate(tableToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Modal */}
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

      {/* Create Table Dialog */}
      <CreateTableDialog
        isOpen={isCreateTableOpen}
        onOpenChange={setIsCreateTableOpen}
      />
    </div>
  );
} 