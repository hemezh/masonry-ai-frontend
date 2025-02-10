'use client';

import { ChevronUpDownIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Workspace } from '@/types/workspace';
import { useWorkspace } from '@/contexts/workspace-context';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkspaceSwitcherProps {
    currentWorkspace: Workspace | null;
    onCreateNew: () => void;
}

export function WorkspaceSwitcher({ currentWorkspace, onCreateNew }: WorkspaceSwitcherProps) {
    const { workspaces, setCurrentWorkspace } = useWorkspace();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                <span className="truncate">{currentWorkspace?.name || 'Select Workspace'}</span>
                <ChevronUpDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                {workspaces.map((workspace) => (
                    <DropdownMenuItem
                        key={workspace.id}
                        onClick={() => setCurrentWorkspace(workspace)}
                        className="cursor-pointer"
                    >
                        <span className="truncate">{workspace.name}</span>
                        {currentWorkspace?.id === workspace.id && (
                            <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onSelect={onCreateNew}
                    className="cursor-pointer"
                >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create New Workspace
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 