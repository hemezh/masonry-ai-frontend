import { CheckBadgeIcon, CheckIcon, UserIcon } from "@heroicons/react/24/solid"
import { cn } from "@/lib/utils"
import { WorkflowStep, WorkflowCreationMessage, WorkflowExecutionMessage, WorkflowModificationMessage } from "@/types/chat"
import { Loader2, CheckCircle, XCircle, RefreshCcw, ArrowRight, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChatMessage as ChatMessageType, Step, ContentBlock as ContentBlockType } from "@/types/chat-api"
import ReactMarkdown from 'react-markdown'
import { CheckCircleIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline"

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
                              [&>pre]:my-2 [&>pre]:p-3 [&>pre]:rounded-md
                              [&>p>code]:bg-zinc-100 [&>p>code]:px-1.5 [&>p>code]:py-0.5 [&>p>code]:rounded-md
                              [&>p>code]:before:hidden [&>p>code]:after:hidden [&>p>code]:text-sm">
                    <ReactMarkdown>{block.content}</ReactMarkdown>
                </div>
            </div>
        );
    }

    if (block.type === 'step' && block.stepId) {
        const step = steps[block.stepId];
        if (!step) return null;

        return (
            <div className="flex items-center gap-3 text-sm my-2 px-4 py-2 border bg-white border-zinc-200 rounded-md transition-all duration-300">
                <StepStatus status={step.status} />
                <span className="flex-1">{step.content}</span>
                <ChevronDownIcon className="h-4 w-4 text-zinc-500" />
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