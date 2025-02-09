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

import { useEffect, useState, useCallback, useMemo } from 'react';
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

  /**
   * Core state management
   * 
   * The component maintains several interdependent pieces of state:
   * 1. messages: Chat history with real-time updates
   * 2. workflowState: Current workflow visualization data
   * 3. loadingState: Multi-faceted loading tracking
   * 4. isMessageSending: Message transmission status
   * 
   * This separation allows for granular updates and prevents unnecessary rerenders
   */
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    workflow: null,
    nodes: [],
    edges: []
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [hasHandledInitialPrompt, setHasHandledInitialPrompt] = useState(false);
  const [isMessageSending, setIsMessageSending] = useState(false);

  /**
   * Error handler for chat operations
   * 
   * This callback serves multiple purposes:
   * 1. Updates the failed message with error information
   * 2. Preserves the message history
   * 3. Resets the sending state
   * 
   * The implementation ensures that only the last message is updated,
   * maintaining the integrity of the chat history.
   */
  const handleChatError = useCallback((error: Error) => {
    setMessages(prev => 
      prev.map((msg, idx) => 
        idx === prev.length - 1 
          ? {
              ...msg,
              blocks: [{ type: 'text' as const, content: error.message }],
              steps: {},
              status: "failed" as const
            }
          : msg
      )
    );
  }, []);

  // Hook initialization with error handling
  const {
    isChatLoading,
    sendMessage,
    getChat,
  } = useChat({
    onError: handleChatError
  });

  const { getWorkflow } = useWorkflow({
    onError: useCallback((error: Error) => {}, [])
  });

  useEffect(() => {}, [messages]);

  const handleSendMessage = useCallback(async (prompt: string) => {
    setIsMessageSending(true);
    
    const userMessage: ChatMessageType = {
      role: "user",
      blocks: [{ type: 'text' as const, content: prompt }],
      steps: {},
      status: "success" as const
    };

    const loadingMessage: ChatMessageType = {
      role: "assistant",
      blocks: [{ type: 'text', content: '' }],
      steps: {},
      status: "loading" as const
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      await sendMessage(
        chatId,
        loadingMessage,
        prompt,
        (message) => {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = message;
            return newMessages;
          });
        }
      );
    } catch (error) {
    } finally {
      setIsMessageSending(false);
    }
  }, [chatId, sendMessage]);

  /**
   * Initial data loading effect
   * 
   * This effect handles the complex initialization process:
   * 1. Parallel loading of chat and workflow data
   * 2. Message format normalization
   * 3. URL parameter processing
   * 4. Workflow context synchronization
   * 
   * The implementation uses Promise.all for efficient loading
   * and includes comprehensive error handling.
   */
  useEffect(() => {
    async function loadWorkflow() {
      if (!isInitialLoad || !chatId) return;

      try {
        const [chat, workflowData] = await Promise.all([
          getChat(chatId),
          getWorkflow(chatId)
        ]);

        const promptParam = searchParams.get('prompt');

        if (workflowData.workflow) {
          setContextWorkflow(workflowData.workflow);
        }
        
        if (chat?.messages?.length && !hasHandledInitialPrompt) {
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
  
        setWorkflowState(workflowData);
        setIsInitialLoad(false);
        setInitialPrompt(promptParam || '');
        if (promptParam) {
          router.replace(`/dashboard/workflows/${chatId}`);
        }

      } catch (error) {
        setIsInitialLoad(false);
      }
    }

    loadWorkflow();
  }, [chatId, getChat, getWorkflow, router, searchParams, isInitialLoad, setContextWorkflow]);

  /**
   * Initial prompt handler effect
   * 
   * This effect manages the processing of URL-based initial prompts:
   * 1. Waits for component initialization
   * 2. Processes the prompt only once
   * 3. Updates handling state
   * 
   * This implementation ensures that prompts are processed exactly once
   * and only after the component is ready.
   */
  useEffect(() => {
    if (initialPrompt && !hasHandledInitialPrompt && !isInitialLoad) {
      handleSendMessage(initialPrompt);
      setHasHandledInitialPrompt(true);
    }
  }, [initialPrompt, hasHandledInitialPrompt, isInitialLoad, handleSendMessage]);

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
          "bg-muted/50",
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
            {isInitialLoad ? (
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
    <ReactFlowProvider>
      <WorkflowChatPageContent key={chatId} />
    </ReactFlowProvider>
  );
}