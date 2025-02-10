"use client"

import { Metadata } from 'next';
import { SheetContent } from './sheet-content';
import { useParams } from 'next/navigation';

const metadata: Metadata = {
  title: 'Sheet Details',
  description: 'View and edit sheet details',
};

export default function SheetPage() {
  const params = useParams();
  const id = params.id as string;

  if (!id) {
    return <div>No sheet ID provided</div>;
  }

  return <SheetContent id={id} />;
}