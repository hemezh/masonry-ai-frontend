'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { ChatInput } from '@/components/chat/chat-input';
import { useChat } from '@/hooks/use-chat';
import { useRouter } from 'next/navigation';
import { ChatMessage as ChatMessageType } from '@/types/chat-api';

export default function CreateWorkflowPage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const { isChatLoading, createChat } = useChat();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        try {
            // Create new chat/workflow
            const chat = await createChat("current_user", '');

            // Redirect to the workflow chat page
            router.push(`/dashboard/chat/${chat.id}?prompt=${encodeURIComponent(prompt)}`);
        } catch (error) {
            console.error('Failed to create workflow:', error);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-8">
            <div className="mb-8 flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/chat">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Create Chat</h1>
                    <p className="text-sm text-muted-foreground">
                        Describe your workflow and I'll help you build it
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
                <div className="flex-1 flex flex-col justify-center -mt-20">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-medium text-foreground mb-4">
                            What would you like to chat about?
                        </h2>
                        <p className="text-muted-foreground">
                            Describe your workflow in natural language and I'll help you build it
                        </p>
                    </div>
                    <div className="max-w-2xl mx-auto w-full">
                        <ChatInput
                            prompt={prompt}
                            hasStarted={false}
                            onPromptChange={setPrompt}
                            onSubmit={handleSubmit}
                            isLoading={isChatLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

