export type WorkflowNode = {
  id: string;
  type: string;
  name: string;
  position: {
    x: number;
    y: number;
  };
  task?: {
    type: string;
    activity: string;
    queue: string;
  };
  data?: {
    input?: Record<string, any>;
    output?: Record<string, any>;
    instanceInput?: Record<string, any>;
  };
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
};

export type WorkflowDefinition = {
  id: string;
  version: string;
  title: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type Workflow = {
  id: string;
  chat_id: string;
  name: string;
  description: string;
  definition: WorkflowDefinition;
  status: string;
  created_at: string;
  updated_at: string;
}; 

export type WorkflowResponse = {
  data: Workflow;
};