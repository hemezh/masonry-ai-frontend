export interface ChatMessage {
    id?: number;
    chat_id?: number;
    role: 'user' | 'assistant';
    content: string;
    type: 'text' | 'workflow_creation' | 'workflow_execution' | 'workflow_modification';
    status: 'loading' | 'success' | 'failed' | 'error';
    created_at?: string;
    updated_at?: string;
}

export interface Chat {
    id: number;
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