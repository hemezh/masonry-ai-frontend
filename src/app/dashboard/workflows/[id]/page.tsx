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

// Node styles for the minimap
const nodeStyles = {
  start: { color: '#10b981' },
  end: { color: '#ef4444' },
  task: { color: '#3b82f6' },
  parallel: { color: '#f97316' },
  condition: { color: '#8b5cf6' }
};

function WorkflowView({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  if (nodes.length === 0) {
    return null;
  }

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
          const type = node.data.type as keyof typeof nodeStyles;
          return nodeStyles[type]?.color || '#94a3b8';
        }}
        maskColor="rgb(241 245 249 / 0.8)"
        nodeStrokeWidth={3}
      />
    </ReactFlow>
    </div>
  );  
}
  
export default function WorkflowChatPage() {
  const params = useParams();
  const chatId = params?.id as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [hasHandledInitialPrompt, setHasHandledInitialPrompt] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const {
    isLoading: isChatLoading,
    sendMessage,
    getChat
  } = useChat({
    onError: (error) => {
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        updated[updated.length - 1] = {
          ...lastMessage,
          blocks: [{ type: 'text', content: error.message }],
          steps: {},
          status: "failed"
        };
        return updated;
      });
    }
  });

  const {
    isLoading: isWorkflowLoading,
    getWorkflow
  } = useWorkflow({
    onError: (error) => {
      console.error('Failed to load workflow:', error);
    }
  });

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    // Scroll to bottom whenever messages change or when initial messages are loaded
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!isInitialLoad) return;

      try {
        const chat = await getChat(chatId);
        setChat(chat);
        
        const { workflow, nodes, edges } = await getWorkflow(chatId);
        if (workflow) {
          setWorkflow(workflow);
          setNodes(nodes);
          setEdges(edges);
        }

        if (chat?.messages?.length > 0) {
          chat.messages = chat.messages.map(message => ({
            ...message,
            blocks: message.blocks?.length ? message.blocks : [{
              type: 'text',
              content: message.content || ''
            }],
            steps: message.steps || {},
          }));
          setMessages(chat.messages);
        }
        
        const promptParam = searchParams.get('prompt');
        if (promptParam) {
          setInitialPrompt(promptParam);
          router.replace(`/dashboard/workflows/${chatId}`);
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (chatId) {
      loadWorkflow();
    }
  }, [chatId, getChat, getWorkflow, isInitialLoad, router, searchParams]);

  useEffect(() => {
    if (initialPrompt && !hasHandledInitialPrompt && !isInitialLoad) {
      handleMessageUpdate(initialPrompt);
      setHasHandledInitialPrompt(true);
    }
  }, [initialPrompt, hasHandledInitialPrompt, isInitialLoad]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleMessageUpdate(prompt);
  };

  const handleMessageUpdate = async (prompt: string) => {
    if (!prompt.trim()) return;

    const userMessage: ChatMessageType = {
      role: "user",
      blocks: [{ type: 'text', content: prompt }],
      steps: {},
      status: "success"
    };

    setMessages(prev => [...prev, userMessage]);

    const loadingMessage: ChatMessageType = {
      role: "assistant",
      blocks: [],
      steps: {},
      status: "loading"
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      await sendMessage(
        chatId,
        loadingMessage,
        prompt,
        (message) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = message;
            return updated;
          });
        }
      );
    } catch (error) {
      console.error('Error in chat:', error);
    }

    setPrompt('');
  };

  const showWorkflow = nodes.length > 0;
  return (
    <div className="flex h-full">
         <div className={`w-[calc(30vw-8rem)] ${showWorkflow ? '' : 'mx-auto'} h-full`}>
          <div className="px-4 mx-auto max-w-3xl h-full">
            <div className={`flex flex-col`}>
                <ChatMessageList messages={messages} isLoading={isInitialLoad || isChatLoading} />
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white py-4 sticky bottom-0 w-full">
                <ChatInput
                  prompt={prompt}
                  hasStarted={true}
                  onPromptChange={setPrompt}
                  onSubmit={handleSubmit}
                  isLoading={isChatLoading}
                />
              </div>              
          </div>
        </div>

        
        {/* Workflow section */}
        {showWorkflow && (
          <div className="fixed right-0 bottom-0 w-[calc(70vw-9rem)] h-[calc(100vh-4.5rem)] mr-4">
            <ReactFlowProvider>
              <WorkflowView nodes={nodes} edges={edges} />
            </ReactFlowProvider>
          </div>
        )}
    </div>
  );
}