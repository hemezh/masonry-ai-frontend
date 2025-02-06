'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpOnSquareIcon, ChevronRightIcon, PlayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useWorkflowContext } from '@/contexts/workflow-context';

export default function Header() {
    const pathname = usePathname();
    const isWorkflowDetailPage = pathname?.match(/^\/dashboard\/workflows\/[^/]+$/);
    const isNewWorkflowPage = pathname === '/dashboard/workflows/new';
    const { workflow } = useWorkflowContext();
    console.log(isWorkflowDetailPage, isNewWorkflowPage);

    // Don't render header on dashboard home
    if (isNewWorkflowPage || !isWorkflowDetailPage) {
        return null;
    }

    // Get workflow name from context instead of URL
    const workflowName = isWorkflowDetailPage ? workflow?.name || 'Untitled Workflow' : '';
    const workflowId = isWorkflowDetailPage ? workflow?.id : '';

    return (
        <header className="bg-white shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.1)] rounded-tl-2xl sticky top-0 z-50">
            <div className="flex h-16 items-center px-4">
                {/* Back button - show on detail and new pages */}
                {(isWorkflowDetailPage) && (
                    <Button variant="ghost" size="icon" asChild className="mr-4">
                        <Link href="/dashboard/workflows">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                    </Button>
                )}

                {/* Breadcrumbs - only show on detail and new pages */}
                {(isWorkflowDetailPage) && (
                    <nav className="flex flex-1" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2">
                            <li>
                                <div className="flex items-center">
                                    <Link href="/dashboard" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                                        Dashboard
                                    </Link>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                                    <Link href="/dashboard/workflows" className="ml-2 text-sm font-medium text-zinc-700 hover:text-zinc-900">
                                        Workflows
                                    </Link>
                                </div>
                            </li>
                            {isWorkflowDetailPage && (
                                <li>
                                    <div className="flex items-center">
                                        <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                                        <span className="ml-2 text-sm font-medium text-zinc-700">
                                            {workflowName || 'Untitled Workflow'}
                                        </span>
                                    </div>
                                </li>
                            )}
                            {isNewWorkflowPage && (
                                <li>
                                    <div className="flex items-center">
                                        <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                                        <span className="ml-2 text-sm font-medium text-zinc-700">
                                            New Workflow
                                        </span>
                                    </div>
                                </li>
                            )}
                        </ol>
                    </nav>
                )}

                {/* Action buttons - only show on detail pages */}
                {isWorkflowDetailPage && (
                    <div className="flex items-center gap-2">
                        <Button variant="default" asChild>
                            <Link href={`/dashboard/workflows/${workflowId}/run`}>
                                <PlayIcon className="h-5 w-5 mr-2" /> Run Workflow
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/dashboard/workflows/${workflowId}/share`}>
                                <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" /> Share Workflow
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
}