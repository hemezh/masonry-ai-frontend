import { Table } from '@/lib/api/tables';
import { CSVImportData } from '@/components/data/csv-import-dialog';
import { CreateTableDialog } from '@/components/data/create-table-dialog';
import { CSVImportDialog } from '@/components/data/csv-import-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';

interface TableDialogsProps {
  workspaceId: string;
  tableToDelete: Table | null;
  tableToEdit: Table | null;
  tableToArchive: Table | null;
  editForm: { name: string; description: string };
  isCreateTableOpen: boolean;
  isImportDialogOpen: boolean;
  onEditFormChange: (field: 'name' | 'description', value: string) => void;
  onEditSubmit: (e: React.FormEvent) => void;
  onDeleteTable: (table: Table) => Promise<void>;
  onArchiveTable: (table: Table) => Promise<void>;
  onUnarchiveTable: (table: Table) => Promise<void>;
  onCreateTableClose: () => void;
  onImportDialogClose: () => void;
  createTableFromCSV: (formData: FormData) => Promise<{ id: string }>;
}

export function TableDialogs({
  workspaceId,
  tableToDelete,
  tableToEdit,
  tableToArchive,
  editForm,
  isCreateTableOpen,
  isImportDialogOpen,
  onEditFormChange,
  onEditSubmit,
  onDeleteTable,
  onArchiveTable,
  onUnarchiveTable,
  onCreateTableClose,
  onImportDialogClose,
  createTableFromCSV,
}: TableDialogsProps) {
  const router = useRouter();

  return (
    <>
      <AlertDialog 
        open={!!tableToDelete} 
        onOpenChange={(open) => !open && onCreateTableClose()}
      >
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
              onClick={() => tableToDelete && onDeleteTable(tableToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={!!tableToArchive} 
        onOpenChange={(open) => !open && onCreateTableClose()}
      >
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
              onClick={() => tableToArchive && onArchiveTable(tableToArchive)}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog 
        open={!!tableToEdit} 
        onOpenChange={(open) => !open && onCreateTableClose()}
      >
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => onEditFormChange('name', e.target.value)}
                  className="bg-background"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => onEditFormChange('description', e.target.value)}
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
                onClick={() => onCreateTableClose()}
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
        onOpenChange={onCreateTableClose}
        workspaceId={workspaceId}
        onSuccess={() => {}}
      />

      <CSVImportDialog
        open={isImportDialogOpen}
        onOpenChange={onImportDialogClose}
        workspaceId={workspaceId}
        onSubmit={async (data: CSVImportData) => {
          const formData = new FormData();
          formData.append('file', data.file);
          formData.append('skipFirstRow', data.skipFirstRow.toString());
          formData.append('columns', JSON.stringify(data.columnTypes));

          const table = await createTableFromCSV(formData);
          if (table) {
            onImportDialogClose();
            // Wait a bit for the table to be created before navigating
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push(`/dashboard/tables/${table.id}`);
          }
        }}
      />
    </>
  );
} 