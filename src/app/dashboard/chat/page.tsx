'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarIcon, EllipsisVerticalIcon, PlayIcon, TrashIcon, UserIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { chatService } from '@/services/chat-service';
import { Chat } from '@/types/chat-api';
import { useChat } from '@/hooks/use-chat';
import { LoadingState } from '@/components/data/loading-state';
import { WorkspaceWarning } from '@/components/data/workspace-warning';
import { useWorkspace } from '@/contexts/workspace-context';

export default function WorkflowsPage() {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const { deleteChat } = useChat();
    const { currentWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();

    useEffect(() => {
        const fetchChats = async () => {
            if (!currentWorkspace) return;
            setIsLoadingChats(true);
            try {
                const response = await chatService.listChats(currentWorkspace.id);
                setChats(response.data);
            } catch (error) {
                console.error('Failed to fetch chats:', error);
            } finally {
                setIsLoadingChats(false);
            }
        };

        fetchChats();
    }, [currentWorkspace]);

    const handleDelete = async (id: string) => {
        await deleteChat(id);
        setChats(chats.filter(chat => chat.id !== id));
    };

    if (isLoadingWorkspace) {
        return <LoadingState />;
    }

    if (!currentWorkspace && !isLoadingWorkspace) {
        return <WorkspaceWarning />;
    }

    return (
        <div className="p-8 ">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Chats</h1>
                    <p className="text-sm text-muted-foreground">Manage your chats</p>
                </div>
                <Button
                    variant="default"
                    asChild
                >
                    <Link href="/dashboard/chat/new">
                        Create Chat
                    </Link>
                </Button>
            </div>
            <div className="bg-background rounded-lg border border-border">
                {/* Search and Filter Bar */}
                <div className="p-4 border-b border-border">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search chats..."
                                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted">
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Runs</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created On</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {chats.map((chat) => (
                                <tr key={chat.id} className="hover:bg-muted/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/dashboard/chat/${chat.id}`}
                                            className="text-sm font-medium text-foreground hover:text-primary"
                                        >
                                            {chat.title || 'Untitled'}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {chat.messages?.length > 0 ? chat.messages[0].content : 'No description'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <PlayIcon className="h-4 w-4" />
                                            {chat.messages?.length}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <UserIcon className="h-4 w-4" />
                                            {chat.user_id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <CalendarIcon className="h-4 w-4" />
                                            {new Date(chat.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleDelete(chat.id.toString())} className="flex items-center gap-2 text-destructive focus:text-destructive">
                                                    <TrashIcon className="h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
