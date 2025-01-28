'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { ChatMessage } from '@/components/chat/message';
import { ChatInput } from '@/components/chat/chat-input';
import { Message, WorkflowStep } from '@/types/chat';

const INITIAL_MESSAGE: Message = {
    role: "assistant",
    type: "text",
    content: "Let's create your workflow. I'll guide you through the process step by step:\n\n1. First, describe the goal of your workflow\n2. We'll identify the triggers and actions\n3. Then we'll configure the specific steps\n4. Finally, we'll test and activate the workflow\n\nWhat would you like to automate?",
    status: "success"
};

// Dummy workflow steps for demonstration
const DUMMY_WORKFLOW_STEPS: WorkflowStep[] = [
    {
        id: "1",
        name: "GitHub Webhook Trigger",
        description: "Listens for new pull requests",
        status: "success"
    },
    {
        id: "2",
        name: "Filter Pull Requests",
        description: "Checks if PR is from main branch",
        status: "success"
    },
    {
        id: "3",
        name: "Run Tests",
        description: "Execute test suite",
        status: "running"
    }
];

export default function CreateWorkflowPage() {
    const [prompt, setPrompt] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const userMessage: Message = { role: "user", type: "text", content: prompt };

        // Determine message type based on content (dummy logic)
        const isCreatingWorkflow = prompt.toLowerCase().includes('create') || prompt.toLowerCase().includes('make');
        const isRunningWorkflow = prompt.toLowerCase().includes('run') || prompt.toLowerCase().includes('execute');
        const isModifyingWorkflow = prompt.toLowerCase().includes('change') || prompt.toLowerCase().includes('modify');

        let assistantMessage: Message;

        if (isCreatingWorkflow) {
            assistantMessage = {
                role: "assistant",
                type: "workflow_creation",
                content: "I'm creating a new workflow based on your requirements. Here's what I've set up:",
                status: "success",
                steps: DUMMY_WORKFLOW_STEPS,
                workflowId: "wf_123",
                workflowUrl: "/dashboard/workflows/wf_123"
            };
        } else if (isRunningWorkflow) {
            assistantMessage = {
                role: "assistant",
                type: "workflow_execution",
                content: "Executing the workflow with your specified parameters:",
                status: "success",
                workflowId: "wf_123",
                executionId: "exec_456",
                steps: DUMMY_WORKFLOW_STEPS
            };
        } else if (isModifyingWorkflow) {
            assistantMessage = {
                role: "assistant",
                type: "workflow_modification",
                content: "I'm modifying the workflow according to your requirements:",
                status: "success",
                workflowId: "wf_123",
                changes: [
                    "Updated trigger conditions",
                    "Added new action step",
                    "Modified error handling"
                ],
                steps: DUMMY_WORKFLOW_STEPS
            };
        } else {
            assistantMessage = {
                role: "assistant",
                type: "text",
                content: "I understand what you're looking for. Let's break down this workflow:\n\n1. Trigger: When should this workflow start?\n2. Conditions: What conditions need to be met?\n3. Actions: What should happen when triggered?\n\nCould you provide more details about the trigger event?",
                status: "success"
            };
        }

        if (!hasStarted) {
            setMessages([INITIAL_MESSAGE, userMessage, { ...assistantMessage, status: "loading" }]);
            setHasStarted(true);
        } else {
            setMessages([...messages, userMessage, { ...assistantMessage, status: "loading" }]);
        }

        setPrompt('');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = assistantMessage;
            return updated;
        });
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
                    <h1 className="text-2xl font-semibold text-zinc-900">Create Workflow</h1>
                    <p className="text-sm text-zinc-500">Describe your workflow and I'll help you build it</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
                {!hasStarted ? (
                    <div className="flex-1 flex flex-col justify-center -mt-20">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-medium text-zinc-900 mb-4">
                                What workflow would you like to create?
                            </h2>
                            <p className="text-zinc-500">
                                Describe your workflow in natural language and I'll help you build it
                            </p>
                        </div>
                        <div className="max-w-2xl mx-auto w-full">
                            <ChatInput
                                prompt={prompt}
                                hasStarted={hasStarted}
                                onPromptChange={setPrompt}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                ) : (
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
                                hasStarted={hasStarted}
                                onPromptChange={setPrompt}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

