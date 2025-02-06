'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessage, ChatMessageList } from '@/components/chat/message';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessage as ChatMessageType, Chat as ChatType } from '@/types/chat-api';
import { useChat } from '@/hooks/use-chat';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import ReactFlow, { 
  Node, 
  Edge,
  Background,
  Controls,
  ConnectionMode,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflow } from '@/hooks/use-workflow';
import { WorkflowNode } from '@/components/workflow/workflow-node';
import { Workflow } from '@/types/workflow-api';
import { WorkflowProvider, useWorkflowContext } from '@/contexts/workflow-context';

// Constants
const NODE_STYLES = {
  start: { color: '#10b981' },
  end: { color: '#ef4444' },
  task: { color: '#3b82f6' },
  parallel: { color: '#f97316' },
  condition: { color: '#8b5cf6' }
} as const;

// Types
interface WorkflowViewProps {
  nodes: Node[];
  edges: Edge[];
}

interface ChatPageState {
  prompt: string;
  chat: ChatType | null;
  messages: ChatMessageType[];
  isInitialLoad: boolean;
  initialPrompt: string;
  hasHandledInitialPrompt: boolean;
  workflow: Workflow | null;
  nodes: Node[];
  edges: Edge[];
}

// Components
function WorkflowView({ nodes, edges }: WorkflowViewProps) {
  if (nodes.length === 0) return null;

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        connectionMode={ConnectionMode.Strict}
        fitView
        fitViewOptions={{ 
          padding: 0.2,
          includeHiddenNodes: true
        }}
        defaultEdgeOptions={{
          type: 'workflow-edge',
          animated: false
        }}
        className="h-full w-full bg-zinc-50"
        minZoom={1.5}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          className='bg-zinc-50'
          color='--var(--tw-gradient-stops)'
        />
        <Controls 
          className="bg-white/80 backdrop-blur-sm border border-zinc-200"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-white/80 !border-zinc-200"
          nodeColor={(node) => {
            const type = node.data.type as keyof typeof NODE_STYLES;
            return NODE_STYLES[type]?.color || '#94a3b8';
          }}
          maskColor="rgb(241 245 249 / 0.8)"
          nodeStrokeWidth={3}
        />
      </ReactFlow>
    </div>
  );  
}

// Main Component
export default function WorkflowChatPage() {
  return <WorkflowChatPageContent />;
}

function WorkflowChatPageContent() {
  // Hooks
  const params = useParams();
  const chatId = params?.id as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setWorkflow: setContextWorkflow } = useWorkflowContext();

  // State
  const [state, setState] = useState<ChatPageState>({
    prompt: '',
    chat: null,
    messages: [],
    isInitialLoad: true,
    initialPrompt: '',
    hasHandledInitialPrompt: false,
    workflow: null,
    nodes: [],
    edges: []
  });

  // Custom hooks
  const {
    isLoading: isChatLoading,
    sendMessage,
    getChat
  } = useChat({
    onError: handleChatError
  });

  const {
    isLoading: isWorkflowLoading,
    getWorkflow
  } = useWorkflow({
    onError: (error) => console.error('Failed to load workflow:', error)
  });

  // Handlers
  function handleChatError(error: Error) {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map((msg, idx) => 
        idx === prev.messages.length - 1 
          ? {
              ...msg,
              blocks: [{ type: 'text', content: error.message }],
              steps: {},
              status: "failed"
            }
          : msg
      )
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleMessageUpdate(state.prompt);
  }

  async function handleMessageUpdate(prompt: string) {
    if (!prompt.trim()) return;

    const userMessage: ChatMessageType = {
      role: "user",
      blocks: [{ type: 'text', content: prompt }],
      steps: {},
      status: "success"
    };

    const loadingMessage: ChatMessageType = {
      role: "assistant",
      blocks: [],
      steps: {},
      status: "loading"
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, loadingMessage],
      prompt: ''
    }));

    try {
      await sendMessage(
        chatId,
        loadingMessage,
        prompt,
        (message) => {
          setState(prev => ({
            ...prev,
            messages: prev.messages.map((msg, idx) => 
              idx === prev.messages.length - 1 ? message : msg
            )
          }));
        }
      );
    } catch (error) {
      console.error('Error in chat:', error);
    }
  }

  // Effects
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.messages]);

  useEffect(() => {
    async function loadWorkflow() {
      if (!state.isInitialLoad) return;

      try {
        const chat = await getChat(chatId);
        const { workflow, nodes, edges } = await getWorkflow(chatId);
        const promptParam = searchParams.get('prompt');

        if (workflow) {
          setContextWorkflow(workflow);
        }

        setState(prev => ({
          ...prev,
          chat,
          workflow,
          nodes,
          edges,
          messages: chat?.messages?.map(message => ({
            ...message,
            blocks: message.blocks?.length ? message.blocks : [{
              type: 'text',
              content: message.content || ''
            }],
            steps: message.steps || {},
          })) || [],
          initialPrompt: promptParam || '',
          isInitialLoad: false
        }));

        if (promptParam) {
          router.replace(`/dashboard/workflows/${chatId}`);
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
        setState(prev => ({ ...prev, isInitialLoad: false }));
      }
    }

    if (chatId) {
      loadWorkflow();
    }
  }, [chatId, getChat, getWorkflow, router, searchParams, state.isInitialLoad]);

  useEffect(() => {
    if (state.initialPrompt && !state.hasHandledInitialPrompt && !state.isInitialLoad) {
      handleMessageUpdate(state.initialPrompt);
      setState(prev => ({ ...prev, hasHandledInitialPrompt: true }));
    }
  }, [state.initialPrompt, state.hasHandledInitialPrompt, state.isInitialLoad]);

  // Render
  const showWorkflow = state.nodes.length > 0;
  
  return (
    <div className="flex h-full">
      <div className={`w-[calc(30vw-8rem)] ${showWorkflow ? '' : 'mx-auto'} h-full`}>
        <div className="px-4 mx-auto max-w-3xl h-full">
          <div className="flex flex-col">
            <ChatMessageList messages={state.messages} isLoading={state.isInitialLoad} />
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white py-4 sticky bottom-0 w-full">
            <ChatInput
              prompt={state.prompt}
              hasStarted={true}
              onPromptChange={(prompt) => setState(prev => ({ ...prev, prompt }))}
              onSubmit={handleSubmit}
              isLoading={isChatLoading}
            />
          </div>              
        </div>
      </div>

      {showWorkflow && (
        <div className="fixed right-0 bottom-0 w-[calc(70vw-9rem)] h-[calc(100vh-4.5rem)] mr-4">
          <ReactFlowProvider>
            <WorkflowView nodes={state.nodes} edges={state.edges} />
          </ReactFlowProvider>
        </div>
      )}
    </div>
  );
}