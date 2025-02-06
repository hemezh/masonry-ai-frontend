import { useState } from 'react';
import { Node, Edge, MarkerType } from 'reactflow';
import { Workflow, WorkflowNode as SchemaNode } from '@/types/workflow-api';
import { WorkflowService } from '@/services/workflow-service';
import ELK, { ElkNode } from 'elkjs/lib/elk.bundled.js';

interface UseWorkflowOptions {
  onError?: (error: Error) => void;
  layoutConfig?: {
    nodeWidth?: number;
    nodeHeight?: number;
    verticalSpacing?: number;
  };
}

export function useWorkflow(options: UseWorkflowOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const elk = new ELK();

  const {
    nodeWidth = 200,
    nodeHeight = 80,
    verticalSpacing = 100
  } = options.layoutConfig || {};

  const createElkGraph = (nodes: SchemaNode[], edges: Edge[]) => {
    return {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': verticalSpacing,
        'elk.layered.spacing.nodeNodeBetweenLayers': verticalSpacing,
        // Enable straight-line edges
        'elk.edge.routing': 'ORTHOGONAL',
        'elk.layered.nodePlacement.strategy': 'SIMPLE'
      },
      children: nodes.map(node => ({
        id: node.id,
        width: nodeWidth,
        height: nodeHeight
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target]
      }))
    };
  };

  const transformToReactFlow = async (workflow: Workflow): Promise<{ nodes: Node[], edges: Edge[] }> => {

    // Create and layout ELK graph
    const elkGraph = createElkGraph(workflow.definition.nodes, workflow.definition.edges);
    const layoutedGraph = await elk.layout(elkGraph as unknown as ElkNode);

    // Transform nodes with layout positions
    const nodes: Node[] = layoutedGraph.children!.map(node => {
      const originalNode = workflow.definition.nodes.find(n => n.id === node.id)!;
      
      return {
        id: node.id,
        type: 'default',
        position: { x: node.x || 0, y: node.y || 0 },
        data: { 
          label: originalNode.name || node.id
        }
      };
    });

    // Create simple vertical edges
    const edges: Edge[] = workflow.definition.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: false,
      style: { 
        strokeWidth: 2,
        stroke: '#94a3b8'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#94a3b8'
      }
    }));

    return { nodes, edges };
  };

  const getWorkflow = async (workflowId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const workflow = await WorkflowService.getWorkflow(workflowId);
      if (!workflow) { 
        setIsLoading(false);
        return { workflow: null, nodes: [], edges: [] };
      }
      const flowElements = await transformToReactFlow(workflow);
      return { workflow, ...flowElements };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch workflow');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    getWorkflow,
    transformToReactFlow
  };
}