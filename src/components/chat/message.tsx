import { CheckBadgeIcon, CheckIcon, UserIcon } from "@heroicons/react/24/solid"
import { cn } from "@/lib/utils"
import { WorkflowStep, WorkflowCreationMessage, WorkflowExecutionMessage, WorkflowModificationMessage } from "@/types/chat"
import { Loader2, CheckCircle, XCircle, RefreshCcw, ArrowRight, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChatMessage as ChatMessageType, Step, ContentBlock as ContentBlockType } from "@/types/chat-api"
import ReactMarkdown from 'react-markdown'
import { CheckCircleIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { useState } from "react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface ContentBlockProps {
    block: ContentBlockType;
    steps: Record<string, Step>;
}

function ContentBlock({ block, steps }: ContentBlockProps) {
    console.log("block", block);
    console.log("steps", steps);
    if (block.type === 'text') {
        return (
            <div className="prose prose-sm max-w-none text-zinc-600 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <div className="[&>h1]:mt-4 [&>h1]:mb-2 [&>h1]:text-base [&>h1]:font-bold [&>h2]:mt-3 [&>h2]:mb-2 [&>h2]:text-base [&>h3]:mt-3 [&>h3]:mb-1 [&>h3]:text-base 
                              [&>p]:my-1.5 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-0.5
                              [&>pre]:my-2 [&>pre]:p-0 [&>pre]:rounded-md [&>pre]:bg-transparent
                              [&>p>code]:bg-zinc-100 [&>p>code]:px-1.5 [&>p>code]:py-0.5 [&>p>code]:rounded-md
                              [&>p>code]:before:hidden [&>p>code]:after:hidden [&>p>code]:text-sm">
                    <ReactMarkdown
                        components={{
                            code({ node, className, children, ...props }) { 
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : '';
                                
                                if (language) {
                                    return (
                                        <SyntaxHighlighter
                                            style={oneDark}
                                            language={language}
                                            PreTag="div"
                                            customStyle={{
                                                margin: '0.5rem 0',
                                                borderRadius: '0.375rem'
                                            }}
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    );
                                }
                                return <code className={className} {...props}>{children}</code>;
                            }
                        }}
                    >
                        {block.content}
                    </ReactMarkdown>
                </div>
            </div>
        );
    }

    if (block.type === 'step' && block.stepId) {
        const step = steps[block.stepId];
        if (!step) return null;

        const [showDetails, setShowDetails] = useState(false);
        return (
            <div className="flex flex-col my-2 px-4 py-1 border bg-white border-zinc-200 rounded-md transition-all duration-300 text-sm">
                <div
                    className="flex items-center gap-3 py-1 "
                    onClick={() => setShowDetails(!showDetails)}
                >
                    <StepStatus status={step.status} />
                    <span className="flex-1">{step.content}</span>
                    {step.details && <ChevronDownIcon className={cn("h-4 w-4 text-zinc-500 transition-transform", showDetails && "rotate-180")} />}
                </div>
                {showDetails && step.details && (
                    <div className="max-w-none text-zinc-600 bg-zinc-50 rounded-md [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ml-6">
                        <ReactMarkdown
                            components={{
                                code({ node, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const language = match ? match[1] : '';

                                    if (language) {
                                    return (
                                        <SyntaxHighlighter
                                            style={oneDark}
                                            language={language}
                                            PreTag="div"
                                            customStyle={{
                                                maxWidth: '678px',
                                                borderRadius: '0.375rem',
                                                overflow: 'auto',
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: 'gray transparent'
                                            }}
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    );
                                }
                                return <code className={className} {...props}>{children}</code>;
                            }
                        }}
                    >
                        {step.details}
                    </ReactMarkdown>
                    </div>
                )}
            </div>
        );
    }

    return null;
}

function StepStatus({ status }: { status: Step['status'] }) {
    switch (status) {
        case 'running':
            return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
        case 'completed':
            return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        case 'failed':
            return <XCircle className="h-5 w-5 text-red-500" />;
        case 'skipped':
            return <SkipForward className="h-5 w-5 text-zinc-500" />;
        case 'pending':
        default:
            return <div className="h-5 w-5 rounded-full border-2 border-zinc-300" />;
    }
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
    return (
        <div className={cn(
            "flex gap-4",
            message.role === "assistant" && "bg-zinc-50 p-4 rounded-lg"
        )}>
            {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-5 w-5 text-zinc-600" />
                </div>
            )}
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900">
                        {message.role === "user" ? "You" : "Assistant"}
                    </p>
                    {message.status === "loading" && (
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                    )}
                    {message.status === "failed" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                    )}
                </div>
                <div className="mt-1 space-y-2">
                    {message.blocks.map((block: ContentBlockType, index: number) => (
                        <ContentBlock
                            key={`${block.type}-${index}`}
                            block={block}
                            steps={message.steps}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}