import { memo, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  ConnectionMode,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Constants
const NODE_STYLES = {
  start: { color: '#10b981' },
  end: { color: '#ef4444' },
  task: { color: '#3b82f6' },
  parallel: { color: '#f97316' },
  condition: { color: '#8b5cf6' }
} as const;

const FLOW_DEFAULT_PROPS = {
  connectionMode: ConnectionMode.Strict,
  fitViewOptions: {
    padding: 0.2,
    includeHiddenNodes: true
  },
  defaultEdgeOptions: {
    type: 'workflow-edge',
    animated: false
  },
  className: "h-full w-full rounded-lg",
  minZoom: 0.5,
  maxZoom: 2,
  nodesDraggable: false,
  nodesConnectable: false,
  fitView: true
} as const;

// Types
interface WorkflowViewProps {
  nodes: Node[];
  edges: Edge[];
}

// Memoized background component
const MemoizedBackground = memo(() => (
  <Background
    variant={BackgroundVariant.Dots}
    gap={16}
    size={1}
    className='bg-zinc-50'
    color='--var(--tw-gradient-stops)'
  />
));

MemoizedBackground.displayName = 'MemoizedBackground';

// Memoized controls component
const MemoizedControls = memo(() => (
  <Controls
    className="bg-white/80 backdrop-blur-sm border border-zinc-200"
    showInteractive={false}
  />
));

MemoizedControls.displayName = 'MemoizedControls';

export const WorkflowView = memo(({ nodes, edges }: WorkflowViewProps) => {
  if (nodes.length === 0) return null;

  const getNodeColor = useCallback((node: Node) => {
    const type = node.data.type as keyof typeof NODE_STYLES;
    return NODE_STYLES[type]?.color || '#94a3b8';
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        {...FLOW_DEFAULT_PROPS}
        fitView
      >
        <MemoizedBackground />
        <MemoizedControls />
        <MiniMap
          className="!bg-white/80 !border-zinc-200"
          nodeColor={getNodeColor}
          maskColor="rgb(241 245 249 / 0.8)"
          nodeStrokeWidth={3}
        />
      </ReactFlow>
    </div>
  );
});

WorkflowView.displayName = 'WorkflowView'; 