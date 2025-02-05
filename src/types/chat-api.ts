export interface BaseEvent {
    id: string;
    timestamp: number;
    sequence: number;
}

// Step event data structure
export interface StepData {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    content?: string;
    details?: string;
    complete_time?: number;
}

// Message event data structure
export interface MessageData {
    content: string;
}

// Different types of events that can occur
export interface StepEvent extends BaseEvent {
    event: 'step';
    data: StepData;
}

export interface MessageEvent extends BaseEvent {
    event: 'message';
    data: MessageData;
}

export interface ErrorEvent extends BaseEvent {
    event: 'error';
    data: {
        content: string;
    };
}

// Union type for all possible events
export type SSEEvent = StepEvent | MessageEvent | ErrorEvent;

export interface Step {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    content?: string;
    details?: string;
}

// Each content block represents either text or a step
export interface ContentBlock {
    type: 'text' | 'step';
    content: string;
    stepId?: string;
    stepStatus?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    details?: string;
}

export interface ChatMessage {
    id?: string;
    chat_id?: string;
    role: 'user' | 'assistant';
    blocks: ContentBlock[];  // Using blocks instead of a single content string
    steps: Record<string, Step>;  // Steps indexed by ID for quick lookup/update
    status: 'loading' | 'success' | 'failed' | 'error';
    content?: string;
    created_at?: string;
    updated_at?: string;
    metadata?: {
        is_initial_message?: boolean;
        [key: string]: any;
    };
}

export interface Chat {
    id: string;
    user_id: string;
    title: string;
    messages: ChatMessage[];
    created_at: string;
    updated_at: string;
}

export interface PaginationMeta {
    total: number;
    total_pages: number;
    page: number;
}

export interface ChatResponse {
    data: Chat;
}

export interface ChatsListResponse {
    data: Chat[];
    meta: PaginationMeta;
}

export interface MessagesResponse {
    data: ChatMessage[];
}

export interface CreateChatRequest {
    user_id: string;
    message: string;
}

export interface AddMessageRequest {
    message: string;
}

export interface APIError {
    error: string;
} 