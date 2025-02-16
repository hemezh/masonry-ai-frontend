import { useState, useCallback, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowPathIcon } from "@heroicons/react/24/outline"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const COLUMN_TYPE_OPTIONS = [
  { value: 's' as const, label: 'String' },
  { value: 'i' as const, label: 'Integer' },
  { value: 'f' as const, label: 'Float' },
  { value: 'd' as const, label: 'Date' },
] as const;

export interface CSVImportData {
  file: File;
  skipFirstRow: boolean;
  columnTypes: string[];
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
  types: string[];
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
  const [columnTypes, setColumnTypes] = useState<string[]>([]);
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
          preview: MAX_PREVIEW_ROWS + 1,
          error: reject,
          complete: resolve,
        });
      });

      if (result.data.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Generate numbered headers if no headers are present
      const firstRow = result.data[0];
      const headers = firstRow.map((_, idx) => `Column ${idx + 1}`);
      
      // For type inference, use all rows if no header, otherwise skip first row
      const dataRows = result.data;
      const samples = dataRows.map(row => 
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

      const inferenceResponse = await tablesApi.inferColumnTypes(workspaceId, inferenceRequests);

      setPreviewData({
        headers,
        rows: result.data.slice(0, MAX_PREVIEW_ROWS)
      });
      
      // Convert types object to array in the same order as headers
      const typesArray = headers.map(header => inferenceResponse.types[header] || 's');
      setColumnTypes(typesArray);
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
      // Log column types for debugging
      console.log('Submitting CSV import with column types:');
      previewData.headers.forEach((header, index) => {
        console.log(`Column ${index + 1} (${header}): ${columnTypes[index] || 's'}`);
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipFirstRow', skipFirstRow.toString());
      formData.append('columns', JSON.stringify(columnTypes));

      await onSubmit({
        file,
        skipFirstRow,
        columnTypes
      });
      
      setFile(null);
      setPreviewData(null);
      setSkipFirstRow(false);
      setColumnTypes([]);
      setInferenceReasoning('');
    } catch (error) {
      console.error('CSV Import Error:', error);
      let errorMessage = (error as Error).message;
      
      // Check if the error contains column information
      if (errorMessage.includes('column type mismatch') || 
          errorMessage.includes('invalid column type')) {
        // Format the error message for better readability
        errorMessage = errorMessage.split('\n').map(line => 
          line.trim()
        ).join('\n');
        
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">CSV Import Error:</p>
            <pre className="whitespace-pre-wrap text-sm bg-secondary/50 p-2 rounded">
              {errorMessage}
            </pre>
          </div>,
          {
            duration: 10000, // Show for 10 seconds due to longer message
          }
        );
      } else {
        toast.error('Error importing CSV: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background  max-w-[850px] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create a new table. We'll automatically detect column types.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="px-6 pt-2 pb-6  max-w-[800px]">
              <div className="grid gap-4 max-w-[800px]">
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
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
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
                      <Card className="max-w-[800px]">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm">Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{inferenceReasoning}</p>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="max-w-[800px]">
                      <CardHeader className="py-3">
                        <CardTitle>Column Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {previewData.headers.map((header, index) => (
                            <div key={index} className="flex flex-col gap-1.5">
                              <Label className="text-sm text-muted-foreground truncate" title={skipFirstRow ? header : `Column ${index + 1}`}>
                                {skipFirstRow ? header : `Column ${index + 1}`}
                              </Label>
                              <Select
                                value={columnTypes[index] || 's'}
                                onValueChange={(value) => {
                                  const newTypes = [...columnTypes];
                                  newTypes[index] = value;
                                  setColumnTypes(newTypes);
                                }}
                              >
                                <SelectTrigger className="bg-background h-8">
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
                      </CardContent>
                    </Card>

                    <Card className="max-w-[800px]">
                      <CardHeader className="py-3">
                        <CardTitle>Preview</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full divide-y divide-border min-w-full">
                              <thead className="sticky top-0 bg-background">
                                <tr className={skipFirstRow ? 'bg-muted/50' : ''}>
                                  {previewData.headers.map((header, i) => (
                                    <th key={i} className="px-4 py-2 text-left text-sm font-medium whitespace-nowrap">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {previewData.rows.map((row, i) => (
                                  <tr key={i} className={skipFirstRow && i === 0 ? 'bg-muted/50' : ''}>
                                    {row.map((cell, j) => (
                                      <td key={j} className="px-4 py-2 text-sm whitespace-nowrap">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 p-6 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !file}>
              {isLoading ? 'Importing...' : 'Import CSV'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 