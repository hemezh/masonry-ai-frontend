import { useQuery } from '@tanstack/react-query';
import { Table } from '@/types/tables';
import { tablesApi } from '@/lib/api/tables';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TablesListProps {
  workspaceId: string;
}

export function TablesList({ workspaceId }: TablesListProps) {
  const { data: tables, isLoading } = useQuery<Table[]>({
    queryKey: ['tables', workspaceId],
    queryFn: async () => {
      const result = await tablesApi.listTables(workspaceId);
      return result as Table[];
    },
  });

  if (isLoading) {
    return <div>Loading tables...</div>;
  }

  if (!tables?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No tables found. Import a CSV file or create a new table to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tables.map((table: Table) => (
        <Link key={table.id} href={`/${workspaceId}/tables/${table.id}`}>
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>{table.name}</CardTitle>
              {table.description && (
                <CardDescription>{table.description}</CardDescription>
              )}
              <div className="text-sm text-muted-foreground mt-2">
                {table.columns.columns.length} columns
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
} 