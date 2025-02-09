import { cn } from "@/lib/utils"
import { ChatMessage as ChatMessageType, Step, ContentBlock as ContentBlockType } from "@/types/chat-api"
import ReactMarkdown, { Components } from 'react-markdown'
import { CheckCircleIcon, ChevronDownIcon, UserIcon, ArrowPathIcon, XCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { useEffect, useRef, useState } from "react"
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs'

// Constants
const MARKDOWN_STYLES = {
    base: "prose prose-sm text-zinc-600 dark:text-zinc-300 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
    typography: "[&>h1]:mt-4 [&>h1]:mb-2 [&>h1]:text-base [&>h1]:font-bold [&>h2]:mt-3 [&>h2]:mb-2 [&>h2]:text-base [&>h3]:mt-3 [&>h3]:mb-1 [&>h3]:text-base [&>p]:my-1.5 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-0.5",
    code: "[&>pre]:my-2 [&>pre]:p-0 [&>pre]:rounded-md [&>pre]:bg-transparent [&>p>code]:bg-zinc-100 dark:[&>p>code]:bg-zinc-800 [&>p>code]:px-1.5 [&>p>code]:py-0.5 [&>p>code]:rounded-md [&>p>code]:before:hidden [&>p>code]:after:hidden [&>p>code]:text-sm",
    layout: "overflow-x-auto"
}

// Interfaces
interface CodeProps {
    node?: any;
    className?: string;
    children: string | string[];
    [key: string]: any;
}

interface StepContentProps {
    step: Step;
    showDetails: boolean;
    contentRef: React.RefObject<HTMLDivElement>;
}

// Components
const LoadingSpinner = () => (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-15rem)]">
        <div className="flex flex-col items-center gap-3">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-zinc-500 dark:text-zinc-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading messages...</p>
        </div>
    </div>
);

const CodeBlock: Components['code'] = ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    
    if (!match) {
        return <code className={className} {...props}>{children}</code>;
    }

    return (
        <SyntaxHighlighter
            language={match[1]}
            style={atomOneDark}
            className="rounded-md max-w-[32rem] overflow-x-auto my-2 mx-auto"
            wrapLongLines={true}
        >
            {String(children)}
        </SyntaxHighlighter>
    );
}

const StepContent = ({ step, showDetails, contentRef }: StepContentProps) => {
    const components: Components = {
        code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : (/^\s*[{[]/.test(String(children)) ? 'json' : 'text');
          

            return (
                <SyntaxHighlighter
                    language={language}
                    style={atomOneDark}
                    className="rounded-md max-w-[33rem] overflow-x-auto mt-2 mx-auto scrollbar"
                    wrapLongLines={true}
                >
                    {String(children)}
                </SyntaxHighlighter>
            );
        }
    };

    return (
        <div className="w-full max-w-full overflow-x-auto rounded-md bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300">
            <ReactMarkdown components={components}>
                {step.details || ''}
            </ReactMarkdown>
        </div>
    );
}

const StepStatus = ({ status }: { status: Step['status'] }) => {
    const statusIcons = {
        running: <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />,
        completed: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        failed: <XCircleIcon className="h-5 w-5 text-red-500" />,
        skipped: <ArrowRightIcon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />,
        pending: <div className="h-5 w-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
    };

    return statusIcons[status] || statusIcons.pending;
}

const ContentBlock = ({ block, steps }: { block: ContentBlockType; steps: Record<string, Step> }) => {
    if (block.type === 'text') {
        return (
            <div className={MARKDOWN_STYLES.base}>
                <div className={`${MARKDOWN_STYLES.typography} ${MARKDOWN_STYLES.code} ${MARKDOWN_STYLES.layout}`}>
                    <ReactMarkdown components={{ code: CodeBlock }}>
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
        const [contentHeight, setContentHeight] = useState(0);
        const contentRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (contentRef.current) {
                setContentHeight(contentRef.current.scrollHeight);
            }
        }, [step.details, showDetails]);

        return (
            <div className="flex flex-col my-2 py-1 border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-md text-sm">
                <div
                    className="flex items-center gap-2 px-2 py-1 cursor-pointer"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    <StepStatus status={step.status} />
                    <span className="flex-1 text-zinc-700 dark:text-zinc-300">{step.content}</span>
                    {step.details && (
                        <ChevronDownIcon 
                            className={cn(
                                "h-4 w-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-300",
                                showDetails && "rotate-180"
                            )}
                        />
                    )}
                </div>
                
                <div 
                    className={cn(
                        "overflow-hidden transition-[height] duration-300 ease-in-out",
                        !showDetails && "height-0"
                    )}
                    style={{ height: showDetails ? contentHeight : 0 }}
                >
                    <div ref={contentRef}>
                        {step.details && (
                            <StepContent 
                                step={step}
                                showDetails={showDetails}
                                contentRef={contentRef as React.RefObject<HTMLDivElement>}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

const ScrollToBottom = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'instant' });
        }
    });

    return <div ref={scrollRef} />;
};

interface ChatMessageListProps {
    messages: ChatMessageType[];
    isLoading?: boolean;
}

export function ChatMessageList({ messages, isLoading = false }: ChatMessageListProps) {
    return (
        <div className="flex flex-col min-h-0 h-full">
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="flex-1">
                    {messages.map((message, index) => (
                        <ChatMessage key={index} message={message} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
    return (
        <div className={cn(
            "flex gap-4 p-4 w-full",
            message.role === "assistant" && "bg-zinc-50 dark:bg-zinc-900/50 rounded-lg"
        )}>
            {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                </div>
            )}
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {message.role === "user" ? "You" : "Assistant"}
                    </p>
                    {message.status === "loading" && (
                        <ArrowPathIcon className="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-400" />
                    )}
                    {message.status === "failed" && (
                        <XCircleIcon className="h-4 w-4 text-red-500" />
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
                <ScrollToBottom />
            </div>
        </div>
    );
}