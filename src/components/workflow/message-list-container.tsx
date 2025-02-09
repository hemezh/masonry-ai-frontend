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
    <div className={cn("h-full flex flex-col", isEmpty ? "justify-end" : "")}>
      <div className="flex-1">
        <ChatMessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      {chatInput && (
        <div className="sticky bottom-0 bg-secondary border-border">
            {chatInput}
        </div>
      )}
    </div>
  );
});

MessageListContainer.displayName = 'MessageListContainer';