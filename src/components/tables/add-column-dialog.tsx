'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnType } from '@/lib/api/tables';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['s', 'i', 'f', 'd']).default('s'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddColumnDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
}

const columnTypes = [
  { value: 's', label: 'String' },
  { value: 'i', label: 'Integer' },
  { value: 'f', label: 'Float' },
  { value: 'd', label: 'DateTime' },
];

export function AddColumnDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: AddColumnDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 's',
      description: '',
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const handleSubmit = async (data: FormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error will be handled by the parent component
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading) {
        onOpenChange(open);
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Column</DialogTitle>
          <DialogDescription>
            Add a new column to your table. Choose a name and type for your column.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Column Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter column name" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>A descriptive name for your column</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Column Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a column type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {columnTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>The data type for this column</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter column description" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>A brief description of what this column is for</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Column'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 