import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { z } from 'zod';
import { toast } from 'sonner';
import { tablesApi, ColumnType } from '@/lib/api/tables';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const COLUMN_TYPE_OPTIONS = [
  { value: 's' as const, label: 'String' },
  { value: 'i' as const, label: 'Integer' },
  { value: 'f' as const, label: 'Float' },
  { value: 'd' as const, label: 'Date' },
] as const;

export interface CSVImportData {
  file: File;
  skipFirstRow: boolean;
  columnTypes: Record<string, string>;
}

export interface CSVImportDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CSVImportData) => Promise<void>;
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

interface TypeInferenceResponse {
  types: Record<string, string>;
  shouldSkipFirstRow: boolean;
  reasoning: string;
}

export function CSVImportDialog({
  workspaceId,
  open,
  onOpenChange,
  onSubmit,
}: CSVImportDialogProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [skipFirstRow, setSkipFirstRow] = useState(false);
  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [inferenceReasoning, setInferenceReasoning] = useState<string>('');
  const [isInferring, setIsInferring] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setIsInferring(true);
    try {
      // Read the first few rows of the CSV
      const text = await file.text();
      const result: ParseResult = await new Promise((resolve, reject) => {
        Papa.parse(text, {
          preview: MAX_PREVIEW_ROWS + 1, // +1 for header
          error: reject,
          complete: resolve,
        });
      });

      if (result.data.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Prepare data for type inference
      const headers = result.data[0];
      const samples = result.data.slice(1).map(row => 
        headers.reduce<Record<string, string>>((acc, header, idx) => ({
          ...acc,
          [header]: row[idx] || ''
        }), {})
      );

      // Call type inference API
      const inferenceRequests = headers.map(header => ({
        name: header,
        samples: samples.map(sample => sample[header] || '')
      }));

      const inferenceResponse = await tablesApi.inferColumnTypes(inferenceRequests);

      setPreviewData({
        headers,
        rows: result.data.slice(1, MAX_PREVIEW_ROWS + 1)
      });
      setColumnTypes(inferenceResponse.types);
      setSkipFirstRow(inferenceResponse.shouldSkipFirstRow);
      setInferenceReasoning(inferenceResponse.reasoning);
      setFile(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing CSV file: ' + (error as Error).message);
    } finally {
      setIsInferring(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await processFile(acceptedFiles[0]);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !previewData) return;

    setIsLoading(true);
    try {
      await onSubmit({
        file,
        skipFirstRow,
        columnTypes
      });
      setFile(null);
      setPreviewData(null);
      setSkipFirstRow(false);
      setColumnTypes({});
      setInferenceReasoning('');
    } catch (error) {
      toast.error('Error importing CSV: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create a new table. We'll automatically detect column types.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {!file && (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <input {...getInputProps()} />
                <p className="text-muted-foreground">
                  {isDragActive
                    ? "Drop the CSV file here"
                    : "Drag and drop a CSV file here, or click to select"}
                </p>
              </div>
            )}

            {isInferring && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing CSV structure...</span>
              </div>
            )}

            {previewData && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="skipHeader"
                    checked={skipFirstRow}
                    onCheckedChange={setSkipFirstRow}
                  />
                  <Label htmlFor="skipHeader">First row is header</Label>
                </div>

                {inferenceReasoning && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">{inferenceReasoning}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-medium">Column Types</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {previewData.headers.map((header, index) => (
                      <div key={index} className="space-y-2">
                        <Label>
                          {skipFirstRow ? header : `Column ${index + 1}`}
                        </Label>
                        <Select
                          value={columnTypes[header] || 's'}
                          onValueChange={(value) => 
                            setColumnTypes(prev => ({
                              ...prev,
                              [header]: value
                            }))
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLUMN_TYPE_OPTIONS.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className={skipFirstRow ? 'bg-muted/50' : ''}>
                          {previewData.headers.map((header, i) => (
                            <th key={i} className="px-4 py-2 text-left text-sm font-medium">
                              {skipFirstRow ? header : `Column ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewData.rows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-4 py-2 text-sm">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setFile(null);
                setPreviewData(null);
                setSkipFirstRow(false);
                setColumnTypes({});
                setInferenceReasoning('');
              }}
              className="border-border"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!file || isLoading || isInferring}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import CSV'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 