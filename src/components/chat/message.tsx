import { UserIcon } from "@heroicons/react/24/solid"
import { cn } from "@/lib/utils"
import { Message, WorkflowStep, WorkflowCreationMessage, WorkflowExecutionMessage, WorkflowModificationMessage } from "@/types/chat"
import { Loader2, CheckCircle, XCircle, RefreshCcw, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ChatMessageProps {
    message: Message
}

function WorkflowSteps({ steps }: { steps?: WorkflowStep[] }) {
    if (!steps?.length) return null;

    return (
        <div className="mt-4 space-y-3">
            {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 text-sm">
                    {step.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {step.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {step.status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                    {step.status === "retrying" && <RefreshCcw className="h-4 w-4 animate-spin text-orange-500" />}
                    {step.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-zinc-300" />}
                    <span className="flex-1">{step.name}</span>
                    <span className="text-zinc-500">{step.description}</span>
                </div>
            ))}
        </div>
    );
}

function WorkflowCreationContent({ message }: { message: WorkflowCreationMessage }) {
    return (
        <div>
            <p className="text-sm text-zinc-600">{message.content}</p>
            <WorkflowSteps steps={message.steps} />
            {message.workflowUrl && (
                <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href={message.workflowUrl}>
                            View Workflow <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

function WorkflowExecutionContent({ message }: { message: WorkflowExecutionMessage }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-zinc-600">Execution ID: {message.executionId}</p>
            </div>
            <p className="text-sm text-zinc-600">{message.content}</p>
            <WorkflowSteps steps={message.steps} />
        </div>
    );
}

function WorkflowModificationContent({ message }: { message: WorkflowModificationMessage }) {
    return (
        <div>
            <p className="text-sm text-zinc-600">{message.content}</p>
            {message.changes && (
                <div className="mt-2 space-y-1">
                    {message.changes.map((change, index) => (
                        <p key={index} className="text-sm text-zinc-500">• {change}</p>
                    ))}
                </div>
            )}
            <WorkflowSteps steps={message.steps} />
        </div>
    );
}

export function ChatMessage({ message }: ChatMessageProps) {
    return (
        <div
            className={cn(
                "flex gap-4",
                message.role === "assistant" && "bg-zinc-50 p-4 rounded-lg"
            )}
        >
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

                {message.type === "text" && (
                    <p className="text-sm text-zinc-600 mt-1">{message.content}</p>
                )}
                {message.type === "workflow_creation" && (
                    <WorkflowCreationContent message={message as WorkflowCreationMessage} />
                )}
                {message.type === "workflow_execution" && (
                    <WorkflowExecutionContent message={message as WorkflowExecutionMessage} />
                )}
                {message.type === "workflow_modification" && (
                    <WorkflowModificationContent message={message as WorkflowModificationMessage} />
                )}
            </div>
        </div>
    )
} 