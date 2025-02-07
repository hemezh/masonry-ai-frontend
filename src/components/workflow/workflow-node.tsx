import React from 'react';
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import { 
  PlayCircleIcon, 
  StopCircleIcon, 
  ServerIcon,
  CircleStackIcon,
  ArrowsPointingOutIcon,
  Square2StackIcon
} from '@heroicons/react/24/outline';

interface WorkflowNodeData {
  id: string;
  type: 'start' | 'end' | 'task' | 'parallel' | 'condition';
  name: string;
  task?: {
    type: string;
    activity: string;
    queue: string;
  };
  metadata: {
    level: number;
    parallelGroup?: string;
    parallelIndex?: number;
    dataFlow: {
      inputs: Record<string, string>;
      outputs: Record<string, string>;
    };
  };
}

interface WorkflowNodeProps {
  data: WorkflowNodeData;
  isConnectable: boolean;
  selected: boolean;
}

const nodeStyles = {
  start: {
    icon: PlayCircleIcon,
    gradient: 'from-emerald-50 to-emerald-100',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    handle: 'border-emerald-400'
  },
  end: {
    icon: StopCircleIcon,
    gradient: 'from-red-50 to-red-100',
    border: 'border-red-200',
    text: 'text-red-700',
    handle: 'border-red-400'
  },
  task: {
    icon: CircleStackIcon,
    gradient: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-700',
    handle: 'border-blue-400'
  },
  parallel: {
    icon: ArrowsPointingOutIcon,
    gradient: 'from-orange-50 to-orange-100',
    border: 'border-orange-200',
    text: 'text-orange-700',
    handle: 'border-orange-400'
  },
  condition: {
    icon: Square2StackIcon,
    gradient: 'from-purple-50 to-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-700',
    handle: 'border-purple-400'
  }
};

export function WorkflowNode({ data, isConnectable, selected }: WorkflowNodeProps) {
  const styles = nodeStyles[data.type];
  const Icon = styles.icon;
  
  const inputKeys = Object.keys(data.metadata.dataFlow.inputs);
  const outputKeys = Object.keys(data.metadata.dataFlow.outputs);

  return (
    <div className={cn(
      "group relative",
      data.metadata.parallelGroup && "ml-4"
    )}>
      {/* Main Node */}
      <div className={cn(
        "rounded-lg border-2 bg-gradient-to-b shadow-sm transition-all duration-200",
        styles.border,
        styles.gradient,
        selected ? "shadow-lg" : "hover:shadow-md",
        "min-w-[240px] max-w-[320px]"
      )}>
        {/* Header */}
        <div className="p-3 border-b border-opacity-20" style={{ borderColor: styles.border }}>
          <div className="flex items-center gap-2">
            <Icon className={cn("w-4 h-4", styles.text)} />
            <span className={cn("text-sm font-medium", styles.text)}>
              {data.name}
            </span>
          </div>
        </div>

        {/* Content */}
        {data.task && (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <CircleStackIcon className="w-4 h-4" />
              <span className="text-xs">{data.task.activity}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ServerIcon className="w-4 h-4" />
              <span className="text-xs">{data.task.queue}</span>
            </div>
          </div>
        )}

        {/* Parallel Indicator */}
        {data.type === 'parallel' && data.metadata.dataFlow.inputs && (
          <div className="px-3 pb-3">
            <div className="text-xs text-gray-500">
              Collection: {Object.values(data.metadata.dataFlow.inputs)[0]}
            </div>
          </div>
        )}
      </div>

      {/* Input Handles */}
      {inputKeys.map((input, index) => {
        const yOffset = (index + 1) * (100 / (inputKeys.length + 1));
        return (
          <div
            key={`input-${input}`}
            className="absolute -left-3 transform -translate-x-full flex items-center gap-2"
            style={{ top: `${yOffset}%` }}
          >
            <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {data.metadata.dataFlow.inputs[input]}
            </div>
            <Handle
              type="target"
              position={Position.Left}
              id={input}
              className={cn("w-3 h-3 !bg-white border-2", styles.handle)}
              isConnectable={isConnectable}
            />
            <div className="text-xs text-gray-600">{input}</div>
          </div>
        );
      })}

      {/* Output Handles */}
      {outputKeys.map((output, index) => {
        const yOffset = (index + 1) * (100 / (outputKeys.length + 1));
        return (
          <div
            key={`output-${output}`}
            className="absolute -right-3 transform translate-x-full flex items-center gap-2"
            style={{ top: `${yOffset}%` }}
          >
            <div className="text-xs text-gray-600">{output}</div>
            <Handle
              type="source"
              position={Position.Right}
              id={output}
              className={cn("w-3 h-3 !bg-white border-2", styles.handle)}
              isConnectable={isConnectable}
            />
            <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {data.metadata.dataFlow.outputs[output]}
            </div>
          </div>
        );
      })}
    </div>
  );
}