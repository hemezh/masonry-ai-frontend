import { memo, useEffect, useRef, ReactNode } from 'react';
import { ChatMessageList } from '@/components/chat/message';
import { ChatMessage as ChatMessageType } from '@/types/chat-api';
import { cn } from '@/lib/utils';

interface MessageListContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isEmpty: boolean;
  chatInput?: ReactNode;
}

export const MessageListContainer = memo(({ messages, isLoading, isEmpty, chatInput }: MessageListContainerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={cn("flex flex-col h-full", isEmpty ? "justify-end" : "")}>
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      {chatInput && (
        <div className="sticky bottom-0">
            {chatInput}
        </div>
      )}
    </div>
  );
});

MessageListContainer.displayName = 'MessageListContainer';