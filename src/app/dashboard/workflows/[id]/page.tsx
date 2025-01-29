'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { ChatMessage } from '@/components/chat/message';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessage as ChatMessageType } from '@/types/chat-api';
import { useChat } from '@/hooks/use-chat';
import { useParams } from 'next/navigation';

export default function WorkflowChatPage() {
    const params = useParams();
    const chatId = params?.id as string;

    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const {
        isLoading,
        sendMessage,
        getChat
    } = useChat({
        onError: (error) => {
            // Update last message to show error
            setMessages(prev => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                updated[updated.length - 1] = {
                    ...lastMessage,
                    blocks: [{ type: 'text', content: error.message }],
                    steps: {},
                    status: "failed"
                };
                return updated;
            });
        }
    });

    // Scroll to bottom only when messages change
    useEffect(() => {
        if (messagesEndRef.current && messages.length > 0) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Load existing chat only once on initial mount
    useEffect(() => {
        const loadWorkflow = async () => {
            if (!isInitialLoad) return;

            try {
                const chat = await getChat(parseInt(chatId));
                if (chat && chat.messages && chat.messages.length > 0) {
                    // Convert old message format to new block format if needed
                    chat.messages = chat.messages.map(message => {
                        if (!message.blocks || message.blocks.length === 0) {
                            return {
                                ...message,
                                blocks: [{
                                    type: 'text',
                                    content: message.content || ''
                                }],
                                steps: message.steps || {}
                            };
                        }
                        return message;
                    });
                    setMessages(chat.messages);
                }
            } catch (error) {
                console.error('Failed to load workflow:', error);
            } finally {
                setIsInitialLoad(false);
            }
        };

        if (chatId) {
            loadWorkflow();
        }
    }, [chatId, getChat, isInitialLoad]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const userMessage: ChatMessageType = {
            role: "user",
            blocks: [{ type: 'text', content: prompt }],
            steps: {},
            status: "success"
        };

        setMessages(prev => [...prev, userMessage]);

        const loadingMessage: ChatMessageType = {
            role: "assistant",
            blocks: [],
            steps: {},
            status: "loading"
        };

        setMessages(prev => [...prev, loadingMessage]);

        try {
            await sendMessage(
                parseInt(chatId),
                loadingMessage,
                prompt,
                (message) => {
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = message;
                        return updated;
                    });
                }
            );
        } catch (error) {
            console.error('Error in chat:', error);
        }

        setPrompt('');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-8">
            <div className="mb-8 flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/workflows">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900">Edit Workflow</h1>
                    <p className="text-sm text-zinc-500">Modify your workflow using natural language</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
                <div className="flex-1 flex flex-col justify-end">
                    <div className="overflow-y-auto">
                        <div className="space-y-6">
                            {messages.map((message, index) => (
                                <ChatMessage key={index} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="sticky bottom-0 bg-white pt-4">
                        <ChatInput
                            prompt={prompt}
                            hasStarted={true}
                            onPromptChange={setPrompt}
                            onSubmit={handleSubmit}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
