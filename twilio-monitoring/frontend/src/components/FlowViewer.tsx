import { useEffect, useState } from 'react';
import ReactFlow, { 
  Node, 
  Edge,
  Controls,
  Background,
} from 'react-flow-renderer';
import { Flow, ExecutionStep } from '../types/twilio';
import { api } from '../services/api';

interface FlowViewerProps {
  flow: Flow;
  executionSid: string;
}

export default function FlowViewer({ flow, executionSid }: FlowViewerProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);

  useEffect(() => {
    loadExecutionDetails();
  }, [executionSid]);

  const loadExecutionDetails = async () => {
    try {
      const steps = await api.getExecutionDetails(executionSid);
      setExecutionSteps(steps);
      createFlowElements(flow.definition, steps);
    } catch (error) {
      console.error('Error loading execution details:', error);
    }
  };

  const createFlowElements = (definition: any, steps: ExecutionStep[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    Object.entries(definition.states).forEach(([id, state]: [string, any], index) => {
      const executedStep = steps.find(step => step.name === id);
      
      newNodes.push({
        id,
        type: 'default',
        position: { x: index * 200, y: index * 100 },
        data: { 
          label: state.name || id,
          type: state.type,
          executed: !!executedStep
        },
        style: {
          background: executedStep ? '#93c5fd' : '#ffffff',
          padding: 10,
          borderRadius: 5,
          border: '1px solid #666',
        }
      });

      if (state.transitions) {
        Object.entries(state.transitions).forEach(([key, target]: [string, any]) => {
          if (target) {
            newEdges.push({
              id: `${id}-${target}`,
              source: id,
              target: target as string,
              label: key,
            });
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  return (
    <div className="h-[600px] bg-white rounded-lg shadow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
} 