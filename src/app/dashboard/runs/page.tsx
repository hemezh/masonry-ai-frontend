'use client';

import { useState } from 'react';
import { CalendarIcon, PlayIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ChevronUpDownIcon, ArrowPathIcon, CogIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

// Mock data - replace with actual data fetching
const runs = [
    {
        id: '123e4567-e89b-12d3-a456-426614174000',
        workflowName: 'Invoice Processing',
        status: 'completed',
        startTime: '2024-02-15T10:30:00',
        endTime: '2024-02-15T10:35:00',
        currentTask: null,
        output: 'Successfully processed 15 invoices',
    },
    {
        id: '123e4567-e89b-12d3-a456-426614174001',
        workflowName: 'Customer Onboarding',
        status: 'running',
        startTime: '2024-02-15T11:00:00',
        endTime: null,
        currentTask: 'Sending welcome email',
        output: 'Created customer profile',
    },
    {
        id: '123e4567-e89b-12d3-a456-426614174002',
        workflowName: 'Invoice Processing',
        status: 'failed',
        startTime: '2024-02-15T09:15:00',
        endTime: '2024-02-15T09:16:00',
        currentTask: null,
        output: 'Error: Invalid invoice format',
    },
];

const statusColors = {
    completed: 'text-green-600 ',
    running: 'text-blue-600',
    failed: 'text-red-600 ',
};

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'completed':
            return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
        case 'running':
            return <ArrowPathIcon className="h-4 w-4 text-blue-600 animate-spin" />;
        case 'failed':
            return <XCircleIcon className="h-4 w-4 text-red-600" />;
        default:
            return <ClockIcon className="h-4 w-4 text-muted-foreground" />;
    }
};

export default function RunsPage() {
    const [statusFilter, setStatusFilter] = useState('all');
    const [workflowFilter, setWorkflowFilter] = useState('all');

    const filteredRuns = runs.filter(run => {
        if (statusFilter !== 'all' && run.status !== statusFilter) return false;
        if (workflowFilter !== 'all' && run.workflowName !== workflowFilter) return false;
        return true;
    });

    const uniqueWorkflows = Array.from(new Set(runs.map(run => run.workflowName)));

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-foreground">Workflow Runs</h1>
                <p className="text-sm text-muted-foreground">Monitor and track your workflow executions</p>
            </div>

            <div className="bg-background rounded-lg border border-border">
                {/* Filters */}
                <div className="p-4 border-b border-border">
                    <div className="flex gap-4 items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <StatusIcon status={statusFilter} />
                                    Status: {statusFilter === 'all' ? 'All' : statusFilter}
                                    <ChevronUpDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('running')}>Running</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('failed')}>Failed</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <CogIcon className="h-5 w-5" />
                                    Workflow: {workflowFilter === 'all' ? 'All' : workflowFilter}
                                    <ChevronUpDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setWorkflowFilter('all')}>All</DropdownMenuItem>
                                {uniqueWorkflows.map(workflow => (
                                    <DropdownMenuItem key={workflow} onClick={() => setWorkflowFilter(workflow)}>
                                        {workflow}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Workflow</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Run ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Task</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Output</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredRuns.map((run) => (
                                <tr key={run.id} className="hover:bg-muted/50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col group">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-foreground group-hover:text-primary cursor-pointer transition-colors">
                                                    {run.workflowName}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-muted-foreground font-medium">
                                            {run.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium  ${statusColors[run.status as keyof typeof statusColors]}`}>
                                            <StatusIcon status={run.status} />
                                            {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground flex items-center gap-1.5 hover:text-primary transition-colors">
                                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />

                                                {new Intl.DateTimeFormat('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                }).format(new Date(run.startTime))}
                                                <span>·</span>
                                                {new Intl.DateTimeFormat('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                }).format(new Date(run.startTime))}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${
                                                run.status === 'completed' || run.status === 'failed'
                                                    ? 'bg-muted-foreground'
                                                    : 'bg-chart-2 animate-pulse'
                                            }`}></div>
                                            <span className="text-sm text-muted-foreground font-medium">
                                                {run.currentTask || 'No active task'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-md">
                                            <p className="text-sm text-muted-foreground line-clamp-2 hover:line-clamp-none transition-all cursor-pointer bg-muted/50 p-2 rounded-md">
                                                {run.output || 'No output available'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
