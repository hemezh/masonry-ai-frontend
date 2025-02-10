'use client';

import { HomeIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon, TableCellsIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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

export function NavigationMenu() {
    const pathname = usePathname();
    const router = useRouter();

    return (
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
    );
} 