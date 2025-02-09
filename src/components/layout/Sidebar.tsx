'use client';

import { useState } from 'react';
import { HomeIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon, QuestionMarkCircleIcon, UserIcon, ArrowRightIcon, PlusIcon, ChevronUpDownIcon, ClipboardDocumentListIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'Chats', href: '/dashboard/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Tasks', href: '/dashboard/tasks', icon: ClipboardDocumentListIcon },
];

const workspaces = [
    { id: 1, name: 'Personal', slug: 'personal' },
    { id: 2, name: 'Team Alpha', slug: 'team-alpha' },
    { id: 3, name: 'Project X', slug: 'project-x' },
];


export default function Sidebar() {
    const pathname = usePathname();
    const [currentWorkspace, setCurrentWorkspace] = useState(workspaces[0]);
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="hidden md:flex max-h-screen">
            <div className="w-64">
                <div className="flex h-full flex-col border-zinc-100/10 bg-background">
                    <div className="flex flex-col overflow-y-auto overflow-x-hidden h-full">
                        <div className="flex items-center min-w-[16rem] px-4 py-4 gap-4">
                            {/* Logo */}
                            <svg
                                className="h-8 w-8 text-zinc-900 dark:text-white"
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
                                <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-200">
                                    <span className="truncate">{currentWorkspace.name}</span>
                                    <ChevronUpDownIcon className="ml-2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
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
                        {/* Navigation */}
                        <nav className="mt-8 space-y-1 px-4">
                            <div className="flex items-center justify-between mb-4">
                                <Button variant="default" size="sm" onClick={() => {
                                    router.push('/dashboard/chat/new');
                                }}>
                                    <PlusIcon className="h-4 w-4" />
                                    <span>New Chat</span>
                                </Button>
                            </div>
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out",
                                            isActive 
                                                ? "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-900 dark:text-white" 
                                                : "hover:translate-x-0.5 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "mr-4 h-5 w-5 transition-transform duration-200",
                                                isActive 
                                                    ? "text-zinc-900 dark:text-white" 
                                                    : "text-zinc-600 dark:text-zinc-400 group-hover:scale-105"
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    {/* Settings Menu */}
                    <div className="mt-auto p-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-sm transition-colors duration-200">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-purple-200 dark:bg-purple-900 flex items-center justify-center">
                                        <span className="text-purple-600 dark:text-purple-200 font-medium">JD</span>
                                    </div>
                                    <div className="ml-3 flex flex-col text-left">
                                        <span className="font-medium text-zinc-900 dark:text-white">John Doe</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">john@example.com</span>
                                    </div>
                                </div>
                                <ChevronUpIcon className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="start" side="top">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">Signed in as</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">john@example.com</p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex items-center">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Edit Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center">
                                    <Cog6ToothIcon className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center">
                                    <QuestionMarkCircleIcon className="mr-2 h-4 w-4" />
                                    <span>Help & Support</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => {
                                    e.preventDefault();
                                    toggleTheme();
                                }}>
                                    <div className="flex items-center">
                                        {theme === 'dark' ? (
                                            <SunIcon className="mr-2 h-4 w-4" />
                                        ) : (
                                            <MoonIcon className="mr-2 h-4 w-4" />
                                        )}
                                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex items-center text-red-600 dark:text-red-400">
                                    <ArrowRightIcon className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}