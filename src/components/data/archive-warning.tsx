import { Alert, AlertDescription } from "@/components/ui/alert";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export function ArchiveWarning() {
  return (
    <Alert className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200/50 dark:border-yellow-900/50">
      <InformationCircleIcon className="h-4 w-4" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        Archived tables are automatically deleted after 30 days. To prevent deletion, unarchive a table before the 30-day period ends.
      </AlertDescription>
    </Alert>
  );
} 