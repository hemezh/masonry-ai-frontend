'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import {
    DocumentIcon,
    TableCellsIcon,
    CodeBracketIcon,
    RocketLaunchIcon,
    ChatBubbleBottomCenterIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ChatInput } from '@/components/chat/chat-input';
import { useChat } from '@/hooks/use-chat';
import { useRouter } from 'next/navigation';
import { ChatMessage as ChatMessageType } from '@/types/chat-api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const CAPABILITIES = [
    {
        icon: DocumentIcon,
        title: 'Document Processing',
        description: 'Upload and parse documents, extract data, and analyze content',
    },
    {
        icon: TableCellsIcon,
        title: 'Table Management',
        description: 'Create, update, and manage data tables with ease',
    },
    {
        icon: CodeBracketIcon,
        title: 'Code Generation',
        description: 'Generate code, debug issues, and get programming help',
    },
    {
        icon: RocketLaunchIcon,
        title: 'Workflow Automation',
        description: 'Create automated workflows and integrate systems',
    },
    {
        icon: ChatBubbleBottomCenterIcon,
        title: 'Natural Conversation',
        description: 'Chat naturally about any topic or task',
    },
];


const CenteredGradientBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <style>
          {`
            @keyframes gradientAnimation {
              0% { background-position: 50% 50%; }
              20% { background-position: 60% 55%; }
              40% { background-position: 65% 65%; }
              60% { background-position: 65% 70%; }
              80% { background-position: 30% 75%; }
              100% { background-position: 50% 50%; }
            }
            
            .gradient-bg {
              background: radial-gradient(circle at center, rgba(255, 56, 21, 0.08), rgba(255, 185, 126, 0.12), transparent, transparent);
              background-size: 80% 80%;
              background-repeat: no-repeat;
              animation: gradientAnimation 10s ease-in-out infinite;
            }
          `}
        </style>
        
        <div className="w-full h-full gradient-bg" />
      </div>
    );
  };

  
export default function CreateWorkflowPage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const { isChatLoading, createChat } = useChat();
    const [attachments, setAttachments] = useState<File[]>([]);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        try {
            // Create new chat/workflow
            const chat = await createChat("current_user", '');

            // TODO: Handle file uploads and audio processing here

            // Redirect to the workflow chat page
            router.push(`/dashboard/chat/${chat.id}?prompt=${encodeURIComponent(prompt)}`);
        } catch (error) {
            console.error('Failed to create workflow:', error);
        }
    };

    const handleAttachmentUpload = (files: FileList) => {
        setAttachments(Array.from(files));
    };

    const handleAudioRecorded = (blob: Blob) => {
        setAudioBlob(blob);
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-1rem)] p-4 md:p-6 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                
                <CenteredGradientBackground />
            </div>
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full relative">
                <div className="flex-1 flex flex-col justify-center -mt-8 md:-mt-16">
                    <div className="text-center mb-8 space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground opacity-0 animate-fade-slide">
                            How can I help you today?
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground opacity-0 animate-fade-slide [animation-delay:100ms]">
                            I'm your AI assistant for document processing, data management, and automation
                        </p>
                    </div>
                    <div className="max-w-2xl mx-auto w-full opacity-0 animate-fade-slide mt-8 mb-8 [animation-delay:200ms]">
                    <div className="group relative">
                        {/* Glowing gradient background */}
                        {/* <div className="absolute -inset-2 bg-gradient-to-r from-orange-600 to-pink-600 rounded-xl blur-sm opacity-5 group-focus-within:opacity-25 transition duration-500 group-hover:duration-200"></div> */}
                        
                        {/* Chat input and its container */}
                        <div className="relative bg-card rounded-lg">
                            <ChatInput
                                prompt={prompt}
                                hasStarted={false}
                                onPromptChange={setPrompt}
                                onSubmit={handleSubmit}
                                isLoading={isChatLoading}
                                onAttachmentUpload={handleAttachmentUpload}
                                onAudioRecorded={handleAudioRecorded}
                                className="border-primary"
                            />
                            
                            {/* Attachments section */}
                            {(attachments.length > 0 || audioBlob) && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {attachments.map((file, index) => (
                                        <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full">
                                            <DocumentIcon className="h-3.5 w-3.5" />
                                            {file.name}
                                        </div>
                                    ))}
                                    {audioBlob && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full">
                                            <ChatBubbleBottomCenterIcon className="h-3.5 w-3.5" />
                                            Voice message
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mt-4 max-w-2xl mx-auto">
                        {CAPABILITIES.map((capability, index) => {
                            const row = Math.floor(index / 2);
                            const delay = 300 + (row * 100);
                            
                            return (
                                <Card key={capability.title} className={cn(
                                    "p-3 opacity-0 animate-fade-slide cursor-pointer group hover:shadow-sm transition-shadow duration-200 hover:border-border bg-card/40 backdrop-blur-sm shadow-none dark:border-primary/20",
                                    
                                )} style={{ animationDelay: `${delay}ms` }}>
                                    <div className="flex items-center gap-2">
                                        <capability.icon className={cn("h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors")} />
                                        <div>
                                            <h3 className="font-medium text-sm text-foreground">{capability.title}</h3>
                                            <p className="text-xs text-muted-foreground leading-tight">{capability.description}</p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                </div>
            </div>
        </div>
    );
}

