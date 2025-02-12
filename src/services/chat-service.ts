import { apiClient } from '@/lib/api-client';
import {
    Chat,
    ChatMessage,
    ChatResponse,
    ChatsListResponse,
    MessagesResponse,
    CreateChatRequest,
    AddMessageRequest,
    Step,
    SSEEvent
} from '@/types/chat-api';

class ChatService {
    private messageBuffer: Map<number, SSEEvent>;
    private nextSequence: number;

    constructor() {
        this.messageBuffer = new Map();
        this.nextSequence = 0;
    }

    async createChat(data: CreateChatRequest): Promise<Chat> {
        const response = await apiClient.post<ChatResponse>('/chats/', data);
        return response.data.data;
    }

    async listChats(page: number = 1, limit: number = 10): Promise<ChatsListResponse> {
        const response = await apiClient.get<ChatsListResponse>('/chats/', {
            params: { page, limit }
        });
        return response.data;
    }

    async getChat(id: string): Promise<Chat> {
        const response = await apiClient.get<ChatResponse>(`/chats/${id}`);
        response.data.data.messages = response.data.data.messages.map(message => {
            if (message.blocks) {
                message.steps = message.steps || {};
                message.blocks.forEach(block => {
                    if (block.type === 'step' && block.stepId) {
                        message.steps[block.stepId] = {
                            id: block.stepId,
                            status: block.stepStatus || 'pending',
                            content: block.content,
                            details: block.details
                        }
                    }
                });
                    
            }
            return message;
        });
        return response.data.data;
    }

    async getChatMessages(chatId: string): Promise<ChatMessage[]> {
        const response = await apiClient.get<MessagesResponse>(`/chats/${chatId}/messages`);
        response.data.data.forEach(message => {
            if (message.blocks) {
                message.steps = message.steps || {};
                message.blocks.forEach(block => {
                    if (block.type === 'step' && block.stepId) {
                        message.steps[block.stepId] = {
                            id: block.stepId,
                            status: block.stepStatus || 'pending',
                            content: block.content
                        }
                    }
                });
            }
        });
        return response.data.data;
    }

    private async processSSEStream(
        reader: ReadableStreamDefaultReader<Uint8Array>,
        onMessage: (message: ChatMessage) => void,
        previousMessage: ChatMessage
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
                        this.processLine(buffer, previousMessage, onMessage);
                    }
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Keep the last incomplete line in the buffer
                buffer = lines.pop() || '';

                // Process complete lines
                for (const line of lines) {
                    await this.processLine(line, previousMessage, onMessage);
                }
            }
        } catch (error) {
            reader.cancel();
            throw new Error(`Stream processing error: ${error}`);
        } finally {
            // Flush any remaining buffered messages in order
            this.flushBuffer(previousMessage, onMessage);
        }
    }

    private async processLine(
        line: string,
        previousMessage: ChatMessage,
        onMessage: (message: ChatMessage) => void
    ): Promise<void> {
        if (!line.startsWith('data:')) return;

        try {
            const data = line.slice(5);
            if (!data.trim()) return;

            try {
                const eventData = JSON.parse(data) as SSEEvent;

                if (eventData.event === 'error') {
                    const errorMessage: ChatMessage = {
                        role: "assistant",
                        blocks: [{ type: 'text', content: eventData.data.content || '' }],
                        steps: {},
                        status: "error"
                    };
                    onMessage(errorMessage);
                    return;
                }

                if (eventData.sequence !== undefined) {
                    this.messageBuffer.set(eventData.sequence, eventData);
                    this.flushBuffer(previousMessage, onMessage);
                } else {
                    this.processEvent(eventData, previousMessage, onMessage);
                }
            } catch (parseError) {
                this.processEvent({
                    event: 'message',
                    data: { content: data },
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    sequence: this.nextSequence
                } as SSEEvent, previousMessage, onMessage);
            }
        } catch (error) {
            console.error('Error processing SSE line:', error);
            throw error;
        }
    }


    private flushBuffer(previousMessage: ChatMessage, onMessage: (message: ChatMessage) => void): void {
        while (this.messageBuffer.has(this.nextSequence)) {
            const event = this.messageBuffer.get(this.nextSequence);
            this.messageBuffer.delete(this.nextSequence);
            if (event) {
                this.processEvent(event, previousMessage, onMessage);
            }
            this.nextSequence++;
        }
    }

    private processEvent(
        event: SSEEvent,
        previousMessage: ChatMessage,
        onMessage: (message: ChatMessage) => void
    ): void {
        if (event.event === 'message' && event.data.content?.includes('done')) {
            return;
        }

        const message: ChatMessage = previousMessage;

        if (event.event === 'message') {
            // Add new text block if there's content
            if (event.data.content?.trim()) {
                const lastBlock = message.blocks[message.blocks.length - 1];
                if (lastBlock?.type === 'text') {
                    lastBlock.content += event.data.content;
                } else {
                    message.blocks.push({
                        type: 'text',
                        content: event.data.content
                    });
                }
            }
        } else if (event.event === 'step' && event.data) {
            const step: Step = {
                id: event.data.id,
                status: event.data.status,
                content: event.data.content,
                details: event.data.details
            };

            const existingStepId = Object.keys(message.steps).find(id => id === step.id);

            if (existingStepId) {
                // Update existing step
                message.steps[step.id] = step;
            } else {
                // Add new step
                message.steps[step.id] = step;
                message.blocks.push({
                    type: 'step',
                    content: step.content || '',
                    stepId: step.id
                });
            }
        }

        onMessage(message);
    }

    async sendMessage(
        chatId: string,
        data: AddMessageRequest,
        previousMessage: ChatMessage,
        onMessage: (message: ChatMessage) => void
    ): Promise<void> {
        try {

            const token = localStorage.getItem('auth_token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(apiClient.defaults.headers.common as Record<string, string>)
            };

            const response = await fetch(`${apiClient.defaults.baseURL}/chats/${chatId}/messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            if (!response.body) {
                throw new Error('No response stream available');
            }

            const reader = response.body.getReader();
            await this.processSSEStream(reader, onMessage, previousMessage);
        } catch (error) {
            // Emit error message to client
            onMessage({
                role: "assistant",
                blocks: [{ type: 'text', content: "An error occurred while processing your message." }],
                steps: {},
                status: 'error'
            });
            throw error;
        }
    }

    async checkHealth(): Promise<{ status: string }> {
        const response = await apiClient.get<{ status: string }>('/health');
        return response.data;
    }

    async deleteChat(id: string): Promise<void> {
        await apiClient.delete(`/chats/${id}`);
    }
}

export const chatService = new ChatService();