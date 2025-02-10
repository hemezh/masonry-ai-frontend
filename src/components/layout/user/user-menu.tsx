'use client';

import { UserIcon, Cog6ToothIcon, QuestionMarkCircleIcon, ArrowRightIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();

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
    );
} 