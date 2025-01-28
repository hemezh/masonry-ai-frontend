export type MessageStatus = "loading" | "success" | "failed";
export type WorkflowStepStatus = "pending" | "running" | "success" | "failed" | "retrying";

export interface BaseMessage {
    role: "user" | "assistant";
    type: "text" | "workflow_creation" | "workflow_execution" | "workflow_modification";
    content: string;
    status?: MessageStatus;
}

export interface WorkflowStep {
    id: string;
    name: string;
    description: string;
    status: WorkflowStepStatus;
    retryCount?: number;
}

export interface WorkflowCreationMessage extends BaseMessage {
    type: "workflow_creation";
    steps?: WorkflowStep[];
    workflowId?: string;
    workflowUrl?: string;
}

export interface WorkflowExecutionMessage extends BaseMessage {
    type: "workflow_execution";
    workflowId: string;
    executionId: string;
    steps?: WorkflowStep[];
}

export interface WorkflowModificationMessage extends BaseMessage {
    type: "workflow_modification";
    workflowId: string;
    steps?: WorkflowStep[];
    changes?: string[];
}

export interface TextMessage extends BaseMessage {
    type: "text";
}

export type Message = TextMessage | WorkflowCreationMessage | WorkflowExecutionMessage | WorkflowModificationMessage; 