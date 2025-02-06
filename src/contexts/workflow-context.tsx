'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import { Workflow } from '@/types/workflow-api';

interface WorkflowContextType {
  workflow: Workflow | null;
  setWorkflow: (workflow: Workflow | null) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);

  return (
    <WorkflowContext.Provider value={{ workflow, setWorkflow }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflowContext() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflowContext must be used within a WorkflowProvider');
  }
  return context;
} 