import { useState, useCallback } from 'react';
import { chatService } from '@/services/chat-service';
import { Chat, ChatMessage } from '@/types/chat-api';
import { useToast } from '@/hooks/use-toast';

interface UseChatOptions {
    onError?: (error: Error) => void;
}

export function useChat(options: UseChatOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const handleError = useCallback((error: Error) => {
        setError(error);
        options.onError?.(error);
        toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
        });
    }, [options, toast]);

    const createChat = useCallback(async (userId: string, message: string): Promise<Chat> => {
        setIsLoading(true);
        setError(null);
        try {
            return await chatService.createChat({ user_id: userId, message });
        } catch (err) {
            handleError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const listChats = useCallback(async (page?: number, limit?: number): Promise<{ chats: Chat[], meta: { total: number, total_pages: number, page: number } }> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await chatService.listChats(page, limit);
            return {
                chats: response.data,
                meta: response.meta
            };
        } catch (err) {
            handleError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const getChat = useCallback(async (id: number): Promise<Chat> => {
        setIsLoading(true);
        setError(null);
        try {
            return await chatService.getChat(id);
        } catch (err) {
            handleError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const getChatMessages = useCallback(async (chatId: number): Promise<ChatMessage[]> => {
        setIsLoading(true);
        setError(null);
        try {
            return await chatService.getChatMessages(chatId);
        } catch (err) {
            handleError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const sendMessage = useCallback(async (
        chatId: number,
        previousMessage: ChatMessage,
        message: string,
        onUpdate: (message: ChatMessage) => void
    ): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            return await chatService.sendMessage(chatId, { message }, previousMessage, onUpdate);
        } catch (err) {
            handleError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const deleteChat = useCallback(async (id: number): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            await chatService.deleteChat(id);
        } catch (err) {
            handleError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    return {
        isLoading,
        error,
        createChat,
        listChats,
        getChat,
        getChatMessages,
        sendMessage,
        deleteChat
    };
} 