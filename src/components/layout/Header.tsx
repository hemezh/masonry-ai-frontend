'use client';

import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRightIcon, ChevronUpDownIcon, PlusIcon } from '@heroicons/react/24/outline';

const workspaces = [
    { id: 1, name: 'Personal', slug: 'personal' },
    { id: 2, name: 'Team Alpha', slug: 'team-alpha' },
    { id: 3, name: 'Project X', slug: 'project-x' },
];

export default function Header() {
    const [currentWorkspace, setCurrentWorkspace] = useState(workspaces[0]);

    return (
        <header className="bg-zinc-50">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center ">
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <svg
                            className="h-8 w-auto text-zinc-900"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect x="3" y="3" width="8" height="8" rx="1" className="fill-current" />
                            <rect x="13" y="3" width="8" height="8" rx="1" className="fill-current" />
                            <rect x="3" y="13" width="8" height="8" rx="1" className="fill-current" />
                            <rect x="13" y="13" width="8" height="8" rx="1" className="fill-current" />
                        </svg>

                        {/* Workspace Switcher */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="w-40 flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-zinc-100 text-zinc-600 hover:bg-zinc-100 transition-colors duration-200">
                                <span className="truncate">{currentWorkspace.name}</span>
                                <ChevronUpDownIcon className="ml-2 h-4 w-4 text-zinc-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="text-xs">
                                {workspaces.map((workspace) => (
                                    <DropdownMenuItem
                                        key={workspace.id}
                                        onClick={() => setCurrentWorkspace(workspace)}
                                    >
                                        <span className="truncate">{workspace.name}</span>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <PlusIcon className="h-4 w-4" />
                                    Create New Workspace
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Right side content */}
                    <div className="flex items-center space-x-4 p-4">
                        {/* Add any right-side header content here */}
                        <nav className="flex" aria-label="Breadcrumb">
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
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
}