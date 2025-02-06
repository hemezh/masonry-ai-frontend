'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarIcon, EllipsisVerticalIcon, PlayIcon, TrashIcon, UserIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { chatService } from '@/services/chat-service';
import { Chat } from '@/types/chat-api';
import { useChat } from '@/hooks/use-chat';

export default function WorkflowsPage() {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const { deleteChat } = useChat();

    useEffect(() => {
        const fetchChats = async () => {
            setIsLoadingChats(true);
            try {
                const response = await chatService.listChats();
                setChats(response.data);
            } catch (error) {
                console.error('Failed to fetch chats:', error);
            } finally {
                setIsLoadingChats(false);
            }
        };

        fetchChats();
    }, []);

    const handleDelete = async (id: string) => {
        await deleteChat(id);
        setChats(chats.filter(chat => chat.id !== id));
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900">Workflows</h1>
                    <p className="text-sm text-zinc-500">Manage your automation workflows</p>
                </div>
                <Button
                    variant="default"
                    asChild
                >
                    <Link href="/dashboard/workflows/new">
                        Create Workflow
                    </Link>
                </Button>
            </div>
            <div className="bg-white rounded-lg border border-zinc-200">
                {/* Search and Filter Bar */}
                <div className="p-4 border-b border-zinc-200">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search workflows..."
                                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Runs</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Created By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Created On</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {chats.map((chat) => (
                                <tr key={chat.id} className="hover:bg-zinc-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/dashboard/workflows/${chat.id}`}
                                            className="text-sm font-medium text-zinc-900 hover:text-purple-600"
                                        >
                                            {chat.title || 'Untitled'}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-zinc-500 line-clamp-1">
                                            {chat.messages?.length > 0 ? chat.messages[0].content : 'No description'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-zinc-600 flex items-center gap-1">
                                            <PlayIcon className="h-4 w-4" />
                                            {chat.messages?.length}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-zinc-600 flex items-center gap-1">
                                            <UserIcon className="h-4 w-4" />
                                            {chat.user_id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-zinc-600 flex items-center gap-1">
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
                                                <DropdownMenuItem onClick={() => handleDelete(chat.id.toString())} className="flex items-center gap-2 text-red-600 focus:text-red-500">
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
        </div >
    );
}
