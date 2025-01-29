import { apiClient } from '@/lib/api-client';
import {
    Chat,
    ChatMessage,
    ChatResponse,
    ChatsListResponse,
    MessagesResponse,
    CreateChatRequest,
    AddMessageRequest
} from '@/types/chat-api';

interface SSEEvent {
    type: 'message' | 'error' | 'done';
    content: string;
    sequence?: number;  // Add sequence number for ordering
}

class ChatService {
    private messageBuffer: Map<number, string>;
    private nextSequence: number;

    constructor() {
        this.messageBuffer = new Map();
        this.nextSequence = 0;
    }

    async createChat(data: CreateChatRequest): Promise<Chat> {
        const response = await apiClient.post<ChatResponse>('/chats', data);
        return response.data.data;
    }

    async listChats(page: number = 1, limit: number = 10): Promise<ChatsListResponse> {
        const response = await apiClient.get<ChatsListResponse>('/chats', {
            params: { page, limit }
        });
        return response.data;
    }

    async getChat(id: number): Promise<Chat> {
        const response = await apiClient.get<ChatResponse>(`/chats/${id}`);
        return response.data.data;
    }

    async getChatMessages(chatId: number): Promise<ChatMessage[]> {
        const response = await apiClient.get<MessagesResponse>(`/chats/${chatId}/messages`);
        return response.data.data;
    }

    private async processSSEStream(
        reader: ReadableStreamDefaultReader<Uint8Array>,
        onMessage: (message: ChatMessage) => void
    ): Promise<void> {
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            // Reset sequence tracking for new stream
            this.messageBuffer.clear();
            this.nextSequence = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // Process any remaining buffered data
                    if (buffer.trim()) {
                        this.processLine(buffer, onMessage);
                    }
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Keep the last incomplete line in the buffer
                buffer = lines.pop() || '';

                // Process complete lines
                for (const line of lines) {
                    await this.processLine(line, onMessage);
                }
            }
        } catch (error) {
            reader.cancel();
            throw new Error(`Stream processing error: ${error}`);
        } finally {
            // Flush any remaining buffered messages in order
            this.flushBuffer(onMessage);
        }
    }

    private async processLine(line: string, onMessage: (message: ChatMessage) => void): Promise<void> {
        console.log(line, "line in processLine");
        if (!line.startsWith('data:')) return;

        try {
            const data = line.slice(5);
            if (!data.trim()) return;

            // Try to parse as JSON first
            try {
                const eventData = JSON.parse(data) as SSEEvent;

                if (eventData.type === 'error') {
                    throw new Error(eventData.content || 'Server error occurred');
                }

                // If we have a sequence number, use ordered processing
                if (eventData.sequence !== undefined) {
                    this.messageBuffer.set(eventData.sequence, eventData.content);
                    this.flushBuffer(onMessage);
                } else {
                    // Fall back to immediate processing for non-sequenced messages
                    this.emitMessage(eventData.content, onMessage);
                }
            } catch (parseError) {
                // If not valid JSON, treat as raw content
                this.emitMessage(data, onMessage);
            }
        } catch (error) {
            console.error('Error processing SSE line:', error);
            throw error;
        }
    }

    private flushBuffer(onMessage: (message: ChatMessage) => void): void {
        while (this.messageBuffer.has(this.nextSequence)) {
            const content = this.messageBuffer.get(this.nextSequence);
            this.messageBuffer.delete(this.nextSequence);
            this.emitMessage(content!, onMessage);
            this.nextSequence++;
        }
    }

    private emitMessage(content: string, onMessage: (message: ChatMessage) => void): void {
        if (content.includes('done')) {
            return;  // Don't emit 'done' markers as messages
        }

        onMessage({
            role: "assistant",
            type: "text",
            content: content,
            status: 'success'
        });
    }

    async addMessage(
        chatId: number,
        data: AddMessageRequest,
        onMessage: (message: ChatMessage) => void
    ): Promise<void> {
        try {
            const response = await fetch(`${apiClient.defaults.baseURL}/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...apiClient.defaults.headers.common  // Include any auth headers etc.
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            if (!response.body) {
                throw new Error('No response stream available');
            }

            const reader = response.body.getReader();
            await this.processSSEStream(reader, onMessage);
        } catch (error) {
            // Emit error message to client
            onMessage({
                role: "assistant",
                type: "text",
                content: "An error occurred while processing your message.",
                status: 'error'
            });
            throw error;
        }
    }

    async checkHealth(): Promise<{ status: string }> {
        const response = await apiClient.get<{ status: string }>('/health');
        return response.data;
    }

    async deleteChat(id: number): Promise<void> {
        await apiClient.delete(`/chats/${id}`);
    }
}

export const chatService = new ChatService();