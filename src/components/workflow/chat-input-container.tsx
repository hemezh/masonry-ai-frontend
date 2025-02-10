import { memo, useCallback, useState } from 'react';
import { ChatInput } from '@/components/chat/chat-input';

interface ChatInputContainerProps {
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatInputContainer = memo(({ onSendMessage, isLoading }: ChatInputContainerProps) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    await onSendMessage(prompt);
    setPrompt('');
  }, [prompt, onSendMessage, isLoading]);

  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
  }, []);

  return (
    <div className="py-4 bg-card">
      <ChatInput
        prompt={prompt}
        hasStarted={true}
        onPromptChange={handlePromptChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
});

ChatInputContainer.displayName = 'ChatInputContainer'; 