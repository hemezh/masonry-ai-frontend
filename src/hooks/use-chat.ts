import { useState, useCallback } from 'react';
import { chatService } from '@/services/chat-service';
import { Chat, ChatMessage } from '@/types/chat-api';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/workspace-context';

interface UseChatOptions {
    onError?: (error: Error) => void;
}

export function useChat(options: UseChatOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();
    const { currentWorkspace } = useWorkspace();

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
        if (!currentWorkspace) {
            throw new Error('No workspace selected');
        }
        setIsLoading(true);
        setError(null);
        try {
            return await chatService.createChat(currentWorkspace.id, { user_id: userId, message });
        } catch (err) {
            handleError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleError, currentWorkspace]);

    const listChats = useCallback(async (page?: number, limit?: number): Promise<{ chats: Chat[], meta: { total: number, total_pages: number, page: number } }> => {
        if (!currentWorkspace) {
            throw new Error('No workspace selected');
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await chatService.listChats(currentWorkspace.id, page, limit);
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
    }, [handleError, currentWorkspace]);

    const getChat = useCallback(async (id: string): Promise<Chat> => {
        if (!currentWorkspace) {
            throw new Error('No workspace selected');
        }
        setIsLoading(true);
        setError(null);
        try {
            return await chatService.getChat(currentWorkspace.id, id);
        } catch (err) {
            handleError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleError, currentWorkspace]);

    const getChatMessages = useCallback(async (chatId: string): Promise<ChatMessage[]> => {
        if (!currentWorkspace) {
            throw new Error('No workspace selected');
        }
        setIsLoading(true);
        setError(null);
        try {
            return await chatService.getChatMessages(currentWorkspace.id, chatId);
        } catch (err) {
            handleError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleError, currentWorkspace]);

    const sendMessage = useCallback(async (
        chatId: string,
        previousMessage: ChatMessage,
        message: string,
        onUpdate: (message: ChatMessage) => void
    ): Promise<void> => {
        if (!currentWorkspace) {
            throw new Error('No workspace selected');
        }
        setIsLoading(true);
        setError(null);
        try {
            return await chatService.sendMessage(currentWorkspace.id, chatId, { message }, previousMessage, onUpdate);
        } catch (err) {
            handleError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleError, currentWorkspace]);

    const deleteChat = useCallback(async (id: string): Promise<void> => {
        if (!currentWorkspace) {
            throw new Error('No workspace selected');
        }
        setIsLoading(true);
        setError(null);
        try {
            await chatService.deleteChat(currentWorkspace.id, id);
        } catch (err) {
            handleError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [handleError, currentWorkspace]);

    return {
        isChatLoading: isLoading,
        error,
        createChat,
        listChats,
        getChat,
        getChatMessages,
        sendMessage,
        deleteChat,
        currentWorkspace
    };
} 