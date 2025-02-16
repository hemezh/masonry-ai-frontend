'use client';

/**
 * Workflow-enabled Chat Interface Implementation
 * 
 * This component implements a sophisticated chat interface that integrates with a workflow
 * visualization system. Key features include:
 * - Real-time chat messaging with loading states and error handling
 * - Dynamic workflow visualization that updates based on chat context
 * - URL-based initial prompt handling for deep linking
 * - Responsive layout that adapts to workflow presence
 * 
 * The architecture follows a unidirectional data flow pattern where:
 * 1. User actions trigger state changes via callbacks
 * 2. State updates cause re-renders of affected components
 * 3. Side effects (API calls, URL updates) are handled through useEffect
 * 
 * Performance optimizations include:
 * - Memoized layout classes
 * - Callback memoization for stable references
 * - Parallel data fetching for initial load
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat-api';
import { useChat } from '@/hooks/use-chat';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ReactFlowProvider, Node, Edge } from 'reactflow';
import { useWorkflow } from '@/hooks/use-workflow';
import { Workflow } from '@/types/workflow-api';
import { useWorkflowContext } from '@/contexts/workflow-context';
import { WorkflowView } from '@/components/workflow/workflow-view';
import { ChatInputContainer } from '@/components/workflow/chat-input-container';
import { MessageListContainer } from '@/components/workflow/message-list-container';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { timeStamp } from 'console';

/**
 * Represents the complete state of a workflow in the system.
 * This interface is crucial for maintaining synchronization between
 * the chat context and the visual representation of the workflow.
 * 
 * @property workflow - The raw workflow data from the API
 * @property nodes - Visual representation of workflow steps
 * @property edges - Connections between workflow nodes
 */
interface WorkflowState {
  workflow: Workflow | null;
  nodes: Node[];
  edges: Edge[];
}

/**
 * Core component implementing the workflow chat interface.
 * 
 * This component handles several complex responsibilities:
 * 1. Chat message management and real-time updates
 * 2. Workflow state synchronization
 * 3. URL parameter processing
 * 4. Loading states and error handling
 * 5. Responsive layout management
 * 
 * The component uses a multi-stage initialization process to ensure
 * proper loading of both chat and workflow data while maintaining
 * a smooth user experience.
 */
function WorkflowChatPageContent() {
  // URL and routing state management
  const params = useParams();
  const chatId = params?.id as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setWorkflow: setContextWorkflow } = useWorkflowContext();

  // Track initialization state with refs instead of state
  const hasOptimisticUpdate = useRef(false);
  const hasHandledInitialPrompt = useRef(false);
  const isInitialMount = useRef(true);

  /**
   * Core state management
   * Simplified to only essential state that affects rendering
   */
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    workflow: null,
    nodes: [],
    edges: []
  });
  const [isMessageSending, setIsMessageSending] = useState(false);

  // Add logging for state changes
  useEffect(() => {
    console.log('[State Change] Messages:', messages);
  }, [messages]);

  useEffect(() => {
    console.log('[State Change] WorkflowState:', workflowState);
  }, [workflowState]);

  useEffect(() => {
    console.log('[State Change] IsMessageSending:', isMessageSending);
  }, [isMessageSending]);

  const handleChatError = useCallback((error: Error) => {
    console.log('[Error Handler] Chat error:', error);
    setMessages(prev => {
      const updatedMessages = prev.map((msg, idx) => 
        idx === prev.length - 1 
          ? {
              ...msg,
              blocks: [{ type: 'text' as const, content: error.message }],
              steps: {},
              status: "failed" as const
            }
          : msg
      );
      console.log('[Error Handler] Updated messages:', updatedMessages);
      return updatedMessages;
    });
  }, []);

  // Hook initialization with error handling
  const {
    sendMessage,
    getChat,
  } = useChat({
    onError: handleChatError
  });

  const { getWorkflow } = useWorkflow({
    onError: useCallback((error: Error) => {
      console.error('Workflow error:', error);
    }, [])
  });

  const handleSendMessage = useCallback(async (prompt: string) => {
    console.log('[handleSendMessage] Starting with prompt:', prompt);
    console.log('[handleSendMessage] Current state:', {
      chatId,
      isMessageSending,
      messagesCount: messages.length
    });
    
    setIsMessageSending(true);
    hasOptimisticUpdate.current = true;
    
    const userMessage: ChatMessageType = {
      id: "user-" + Date.now(),
      role: "user", 
      blocks: [{ type: 'text' as const, content: prompt }],
      steps: {},
      status: "success" as const
    };

    const loadingMessage: ChatMessageType = {
      id: "assistant-" + Date.now(),
      role: "assistant",
      blocks: [{ type: 'text', content: '' }],
      steps: {},
      status: "loading" as const
    };

    console.log('[handleSendMessage] Adding messages:', {
      userMessage,
      loadingMessage
    });

    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      console.log('[handleSendMessage] Sending message to API');
      await sendMessage(
        chatId,
        loadingMessage,
        prompt,
        (message) => {
          console.log('[handleSendMessage] Message update callback:', message);
          setMessages(prev => {
            const updated = [...prev];
            // Preserve the message's content and update status if this is the final update
            updated[updated.length - 1] = {
              ...message,
              status: message.status === "loading" && !message.blocks[0].content.endsWith("...") 
                ? "success" 
                : message.status
            };
            console.log('[handleSendMessage] Updated messages:', updated);
            return updated;
          });
        }
      );
    } catch (error) {
      console.error('[handleSendMessage] Error:', error);
    } finally {
      // Set final message status to success if still loading
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.status === "loading") {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMessage,
            status: "success"
          };
          console.log('[handleSendMessage] Setting final message status to success');
          return updated;
        }
        return prev;
      });
      
      console.log('[handleSendMessage] Completed, setting isMessageSending to false');
      setIsMessageSending(false);
      hasOptimisticUpdate.current = false;
    }
  }, [chatId, sendMessage, isMessageSending, messages.length]);

  // Combined initialization and URL prompt handling
  useEffect(() => {
    async function initialize() {
      if (!isInitialMount.current || !chatId) return;
      
      console.log('[Initialize] Starting initialization');
      try {
        const [chat, workflowData] = await Promise.all([
          getChat(chatId),
          getWorkflow(chatId)
        ]);

        if (workflowData.workflow) {
          setContextWorkflow(workflowData.workflow);
          setWorkflowState(workflowData);
        }
        
        if (chat?.messages?.length && !hasOptimisticUpdate.current) {
          const formattedMessages = chat.messages.map(message => ({
            ...message,
            blocks: message.blocks?.length ? message.blocks : [{
              type: 'text' as const,
              content: message.content || ''
            }],
            steps: message.steps || {},
          }));
          setMessages(formattedMessages);
        }

        const promptParam = searchParams.get('prompt');
        if (promptParam && !hasHandledInitialPrompt.current) {
          hasHandledInitialPrompt.current = true;
          handleSendMessage(promptParam);
          router.replace(`/dashboard/chat/${chatId}`);
        }

        isInitialMount.current = false;
      } catch (error) {
        console.error('[Initialize] Error:', error);
        isInitialMount.current = false;
      }
    }

    initialize();
  }, [chatId, getChat, getWorkflow, router, searchParams, handleSendMessage, setContextWorkflow]);

  // Workflow visibility control
  const showWorkflow = workflowState.nodes.length > 0;

  /**
   * Layout class computation
   * 
   * Updated to support dark mode theming:
   * - Background colors now use theme-aware classes
   * - Text colors adapt to theme
   * - Borders and shadows adjusted for better dark mode visibility
   */
  const layoutClasses = useMemo(() => ({
    outerContainer: "h-full relative flex",
    contentWrapper: cn(
      "h-full w-full overflow-y-auto transition-all duration-200 ease-in-out",
      showWorkflow ? "flex gap-4 p-4" : "flex"
    ),
    chatSection: cn(
      "flex flex-col",
      showWorkflow ? "w-[40rem] shrink-0" : "w-full max-w-[40rem] mx-auto"
    ),
    messagesContainer: cn(
      "flex-1 min-h-0 relative",
      messages.length === 0 ? "flex items-end" : ""
    ),
    workflowSection: showWorkflow 
      ? cn(
          "flex-1 rounded-lg overflow-hidden shadow-sm",
          "bg-muted",
          "border border-border"
        )
      : "",
    loadingContainer: cn(
      "absolute inset-0 flex items-center justify-center",
    ),
    loadingIcon: "h-8 w-8 animate-spin text-muted-foreground",
    loadingText: "text-sm text-muted-foreground"
  }), [showWorkflow, messages.length]);

  return (
    <div className={layoutClasses.outerContainer}>
      <div className={layoutClasses.contentWrapper}>
        <div className={layoutClasses.chatSection}>
          <div className={layoutClasses.messagesContainer}>
            {isInitialMount.current ? (
              <div className={layoutClasses.loadingContainer}>
                <div className="flex flex-col items-center gap-3">
                  <ArrowPathIcon className={layoutClasses.loadingIcon} />
                  <p className={layoutClasses.loadingText}>Loading messages...</p>
                </div>
              </div>
            ) : (
              <MessageListContainer 
                messages={messages} 
                isLoading={false}
                isEmpty={messages.length === 0}
                chatInput={
                  <ChatInputContainer
                    onSendMessage={handleSendMessage}
                    isLoading={isMessageSending}
                  />
                }
              />
            )}
          </div>
        </div>

        {showWorkflow && (
          <div className={layoutClasses.workflowSection}>
            <WorkflowView 
              nodes={workflowState.nodes} 
              edges={workflowState.edges} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Root component wrapper
 * 
 * This component serves several important purposes:
 * 1. Provides ReactFlow context for workflow visualization
 * 2. Ensures proper mounting/unmounting of chat content
 * 3. Handles chat ID-based instance management
 * 
 * The key prop on WorkflowChatPageContent ensures proper
 * component recreation when the chat ID changes.
 */
export default function WorkflowChatPage() {
  const params = useParams();
  const chatId = params?.id as string;

  return (
    <div className="h-full w-full overflow-y-auto test">
      <ReactFlowProvider >
      <WorkflowChatPageContent key={chatId} />
      </ReactFlowProvider>
    </div>
  );
}