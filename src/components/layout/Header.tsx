'use client';

import { usePathname } from 'next/navigation';
import { ArrowUpOnSquareIcon, ChevronRightIcon, PlayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useWorkflowContext } from '@/contexts/workflow-context';
import { cn } from '@/lib/utils';

export default function Header() {
    const pathname = usePathname();
    const isWorkflowDetailPage = pathname?.match(/^\/dashboard\/chat\/[^/]+$/);
    const isNewWorkflowPage = pathname === '/dashboard/chat/new';
    const { workflow } = useWorkflowContext();

    // Don't render header on dashboard home
    if (isNewWorkflowPage || !isWorkflowDetailPage) {
        return null;
    }

    // Get workflow name from context instead of URL
    const workflowName = isWorkflowDetailPage ? workflow?.name || 'Untitled Chat' : '';
    const workflowId = isWorkflowDetailPage ? workflow?.id : '';

    return (
        <header className={cn(
            "sticky top-0 z-50 flex items-center justify-between h-14 px-6",
            "transition-colors duration-200"
        )}>
            <div className="flex items-center gap-2">
                <Link
                    href="/dashboard/chat"
                    className={cn(
                        "group flex items-center gap-2 text-sm font-medium",
                        "text-zinc-500 dark:text-zinc-400",
                        "hover:text-zinc-800 dark:hover:text-zinc-100",
                        "transition-all duration-200"
                    )}
                >
                    <ArrowLeftIcon className={cn(
                        "h-4 w-4",
                        "group-hover:-translate-x-0.5 transition-transform duration-200"
                    )} />
                    <span>Back to Chats</span>
                </Link>
                <ChevronRightIcon className="h-4 w-4 text-zinc-400 dark:text-zinc-600" />
                <span className={cn(
                    "text-sm font-medium truncate max-w-[200px]",
                    "text-zinc-800 dark:text-zinc-200"
                )}>
                    {workflowName}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "text-zinc-600 dark:text-zinc-300",
                        "bg-card",
                        "border border-zinc-200 dark:border-zinc-800",
                        "hover:bg-muted",
                        "hover:text-zinc-900 dark:hover:text-white",
                        "hover:border-zinc-300 dark:hover:border-zinc-700",
                        "transition-all duration-200"
                    )}
                >
                    <ArrowUpOnSquareIcon className="h-4 w-4 mr-2" />
                    Share
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    className={cn(
                        "bg-primary",
                        "text-white dark:text-zinc-900",
                        "border border-zinc-900 dark:border-white",
                        "hover:bg-secondary",
                        "hover:border-zinc-800 dark:hover:border-zinc-100",
                        "transition-all duration-200",
                        "shadow-sm"
                    )}
                >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Run
                </Button>
            </div>
        </header>
    );
}