'use client';

import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpOnSquareIcon, ChevronRightIcon, ChevronUpDownIcon, PlayIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';

import Link from 'next/link';

export default function Header() {

    return (
        <header className="bg-white shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.1)] rounded-tl-2xl sticky top-0">
            <div>
                <div className="flex h-16 items-center">
                    {/* Left section with fixed width */}

                    {/* Right side content */}
                    <div className="flex items-center justify-between flex-1 px-4">
                        <nav className="flex" aria-label="Breadcrumb">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/dashboard/workflows">
                                    <ArrowLeftIcon className="h-5 w-5" />
                                </Link>
                            </Button>
                            <ol className="flex items-center space-x-2">
                                <li>
                                    <div className="flex items-center">
                                        <span className="text-sm font-medium text-zinc-700">Dashboard</span>
                                    </div>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                                        <span className="ml-2 text-sm font-medium text-zinc-700">Automations</span>
                                    </div>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                                        <span className="ml-2 text-sm font-medium text-zinc-700">Random number generator</span>
                                    </div>
                                </li>
                            </ol>
                        </nav>

                        <div className="flex items-center gap-2">
                            <Button variant="default" asChild>
                                <Link href={`/dashboard/workflows/run`}>
                                    <PlayIcon className="h-5 w-5" /> Run Workflow
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/dashboard/workflows/share`}>
                                    <ArrowUpOnSquareIcon className="h-5 w-5" /> Share Workflow
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}