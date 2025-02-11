'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { sheetsApi } from '@/lib/api/sheets';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewSheetPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const createSheetMutation = useMutation({
    mutationFn: (data: FormValues) => sheetsApi.createSheet(data),
    onSuccess: (sheet) => {
      router.push(`/dashboard/sheets/${sheet.id}`);
    },
  });

  const onSubmit = (data: FormValues) => {
    createSheetMutation.mutate(data);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/sheets')}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Create New Sheet</h1>
          <p className="text-sm text-muted-foreground">
            Create a new sheet to organize your data
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sheet name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter sheet description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/sheets')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSheetMutation.isPending}
              >
                {createSheetMutation.isPending ? 'Creating...' : 'Create Sheet'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}