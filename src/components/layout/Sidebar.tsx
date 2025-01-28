'use client';

import { useState } from 'react';
import { HomeIcon, CpuChipIcon, PlayIcon, PuzzlePieceIcon, Cog6ToothIcon, QuestionMarkCircleIcon, UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
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

const navigation = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'Workflows', href: '/dashboard/workflows', icon: CpuChipIcon },
    { name: 'Runs', href: '/dashboard/runs', icon: PlayIcon },
    { name: 'Integrations', href: '/dashboard/integrations', icon: PuzzlePieceIcon },
];


export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex max-h-screen">
            <div className="w-64">
                <div className="flex h-full flex-col border-r border-zinc-100/10 bg-zinc-50">
                    <div className="flex flex-col overflow-y-auto h-full">

                        {/* Navigation */}
                        <nav className="mt-8 space-y-2 px-4">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`
                                            group flex items-center rounded-md px-2 py-1.5 text-sm font-medium
                                            transition-all duration-200 ease-in-out
                                            ${isActive
                                                ? 'bg-white border border-zinc-200 shadow-sm text-zinc-900'
                                                : 'hover:translate-x-0.5  border border-transparent hover:bg-zinc-100 text-zinc-600'
                                            }
                                        `}
                                    >
                                        <item.icon
                                            className={`
                                                mr-4 h-5 w-5 transition-transform duration-200
                                                ${isActive ? 'text-zinc-900' : 'text-zinc-600 group-hover:scale-105'}
                                            `}
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
                            <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-600 bg-white border border-zinc-100 hover:bg-zinc-100 shadow-sm transition-colors duration-200">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
                                        <span className="text-purple-600 font-medium">JD</span>
                                    </div>
                                    <div className="ml-3 flex flex-col text-left">
                                        <span className="font-medium">John Doe</span>
                                        <span className="text-xs text-zinc-500">john@example.com</span>
                                    </div>
                                </div>
                                <ChevronUpIcon className="h-5 w-5 text-zinc-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="start" side="top">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium text-zinc-900">Signed in as</p>
                                    <p className="text-xs text-zinc-500 truncate">john@example.com</p>
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
                                <DropdownMenuItem className="flex items-center text-red-600">
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