import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { z } from 'zod';
import { toast } from 'sonner';

const COLUMN_TYPE_OPTIONS = [
  { value: 's' as const, label: 'String' },
  { value: 'i' as const, label: 'Integer' },
  { value: 'f' as const, label: 'Float' },
  { value: 'd' as const, label: 'Date' },
] as const;

type ColumnType = (typeof COLUMN_TYPE_OPTIONS)[number]['value'];

interface CSVImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: {
    columnTypes: Record<string, ColumnType>;
    skipFirstRow: boolean;
    file: File;
  }) => Promise<void>;
  isLoading?: boolean;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
}

interface ParseResult {
  data: string[][];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

const MAX_PREVIEW_ROWS = 5;

export function CSVImportDialog({
  isOpen,
  onOpenChange,
  onImport,
  isLoading = false,
}: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [columnTypes, setColumnTypes] = useState<Record<string, ColumnType>>({});
  const [skipFirstRow, setSkipFirstRow] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);

    // Parse CSV for preview
    Papa.parse<string[]>(file, {
      preview: MAX_PREVIEW_ROWS + 1, // +1 for headers
      complete: (results: Papa.ParseResult<string[]>) => {
        if (results.data.length > 0) {
          const headers = results.data[0];
          const rows = results.data.slice(1);

          setPreviewData({ headers, rows });
          
          // Initialize column types as strings
          const initialColumnTypes: Record<string, ColumnType> = {};
          headers.forEach((header) => {
            initialColumnTypes[header] = 's';
          });
          setColumnTypes(initialColumnTypes);
        }
      },
      error: (error: Error) => {
        toast.error('Error parsing CSV file: ' + error.message);
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (!file || !previewData) return;

    try {
      await onImport({
        columnTypes,
        skipFirstRow,
        file,
      });
      onOpenChange(false);
      setFile(null);
      setPreviewData(null);
      setColumnTypes({});
      setSkipFirstRow(false);
    } catch (error) {
      toast.error('Failed to import CSV');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
        </DialogHeader>

        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            <p className="text-muted-foreground">
              {isDragActive
                ? 'Drop the CSV file here...'
                : 'Drag and drop a CSV file here, or click to select one'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="skip-first-row"
                checked={skipFirstRow}
                onCheckedChange={setSkipFirstRow}
              />
              <Label htmlFor="skip-first-row">Skip first row (headers)</Label>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[auto,1fr] gap-4 p-4 bg-muted/50">
                <div className="font-medium">File:</div>
                <div>{file.name}</div>
              </div>

              {previewData && (
                <div className="p-4 space-y-4">
                  <div className="font-medium">Column Types:</div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {previewData.headers.map((header, index) => (
                      <div key={index} className="space-y-2">
                        <Label>{header}</Label>
                        <Select
                          value={columnTypes[header]}
                          onValueChange={(value: ColumnType) =>
                            setColumnTypes(prev => ({
                              ...prev,
                              [header]: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLUMN_TYPE_OPTIONS.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Preview:</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr className="bg-muted/50">
                            {previewData.headers.map((header, i) => (
                              <th
                                key={i}
                                className="px-4 py-2 text-left text-sm font-medium text-muted-foreground"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {previewData.rows.slice(0, MAX_PREVIEW_ROWS).map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td
                                  key={j}
                                  className="px-4 py-2 text-sm whitespace-nowrap"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setPreviewData(null);
              setColumnTypes({});
              setSkipFirstRow(false);
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isLoading}
          >
            {isLoading ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 