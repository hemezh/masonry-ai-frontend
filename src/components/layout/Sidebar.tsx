'use client';

import { useState } from 'react';
import { HomeIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon, QuestionMarkCircleIcon, UserIcon, ArrowRightIcon, PlusIcon, ChevronUpDownIcon, ClipboardDocumentListIcon, SunIcon, MoonIcon, TableCellsIcon } from '@heroicons/react/24/outline';
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
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'Chats', href: '/dashboard/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Tasks', href: '/dashboard/tasks', icon: ClipboardDocumentListIcon },
    {
        name: 'Sheets',
        href: '/dashboard/sheets',
        icon: TableCellsIcon,
        current: false,
    },
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
    const { user, signOut, loading } = useAuth();

    // Get user's initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="hidden md:flex max-h-screen">
            <div className="w-64">
                <div className="flex h-full flex-col border-border/10 bg-background">
                    <div className="flex flex-col overflow-y-auto overflow-x-hidden h-full">
                        <div className="flex items-center min-w-[16rem] px-4 py-4 gap-4">
                            {/* Logo */}
                            <svg
                                className="h-8 w-8 text-foreground"
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
                                <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                                    <span className="truncate">{currentWorkspace.name}</span>
                                    <ChevronUpDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
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
                                                ? "bg-muted shadow-sm text-foreground" 
                                                : "hover:translate-x-0.5 hover:bg-muted text-muted-foreground"
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
                            <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground bg-background border border-border hover:bg-muted/10 transition-colors">
                                <div className="flex items-center">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.photoURL || undefined} />
                                        <AvatarFallback className="bg-purple-200 dark:bg-purple-900">
                                            {user?.displayName ? getInitials(user.displayName) : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-3 flex flex-col text-left">
                                        <span className="font-medium text-foreground">
                                            {user?.displayName || 'User'}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                            {user?.email || ''}
                                        </span>
                                    </div>
                                </div>
                                <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="start" side="top">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium text-foreground">Signed in as</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user?.email}
                                    </p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>Edit Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings" className="flex items-center cursor-pointer">
                                        <Cog6ToothIcon className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/help" className="flex items-center cursor-pointer">
                                        <QuestionMarkCircleIcon className="mr-2 h-4 w-4" />
                                        <span>Help & Support</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        toggleTheme();
                                    }}
                                >
                                    {theme === 'dark' ? (
                                        <SunIcon className="mr-2 h-4 w-4" />
                                    ) : (
                                        <MoonIcon className="mr-2 h-4 w-4" />
                                    )}
                                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="text-red-600 dark:text-red-400"
                                    onClick={handleSignOut}
                                >
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