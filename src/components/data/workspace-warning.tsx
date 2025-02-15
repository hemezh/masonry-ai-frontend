import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FolderIcon } from "@heroicons/react/24/outline";

export function WorkspaceWarning() {
  return (
    <div className="h-[calc(100vh-6rem)] flex items-center justify-center p-8">
      <Alert className="max-w-xl bg-background border-border/40">
        <FolderIcon className="h-5 w-5" />
        <AlertTitle>No Workspace Selected</AlertTitle>
        <AlertDescription className="mt-2 text-muted-foreground">
          Please select a workspace from the dropdown menu above to view and manage your tables.
        </AlertDescription>
      </Alert>
    </div>
  );
} 