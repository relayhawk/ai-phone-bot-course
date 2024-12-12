import { useEffect, useState } from 'react';
import { studioApi } from '../services/api';

export default function Home() {
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [executionContent, setExecutionContent] = useState(null);

  // Fetch flows on component mount
  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const flowsData = await studioApi.listFlows();
        setFlows(flowsData);
      } catch (error) {
        console.error('Error fetching flows:', error);
      }
    };

    fetchFlows();
  }, []);

  // Fetch executions when a flow is selected
  useEffect(() => {
    const fetchExecutions = async () => {
      if (selectedFlow) {
        try {
          const executionsData = await studioApi.listExecutions(selectedFlow.sid);
          setExecutions(executionsData);
        } catch (error) {
          console.error('Error fetching executions:', error);
        }
      }
    };

    fetchExecutions();
  }, [selectedFlow]);

  // Fetch execution details when an execution is selected
  useEffect(() => {
    const fetchExecutionDetails = async () => {
      if (selectedFlow && selectedExecution) {
        try {
          const executionData = await studioApi.getExecution(
            selectedFlow.sid,
            selectedExecution.sid
          );
          setExecutionContent(executionData);
        } catch (error) {
          console.error('Error fetching execution details:', error);
        }
      }
    };

    fetchExecutionDetails();
  }, [selectedFlow, selectedExecution]);

  return (
    <div className="flex h-screen">
      {/* Flows Panel */}
      <div className="w-1/4 border-r p-4">
        <h2 className="text-lg font-semibold mb-4">Flows</h2>
        <div className="space-y-2">
          {flows.map((flow) => (
            <button
              key={flow.sid}
              onClick={() => setSelectedFlow(flow)}
              className={`w-full text-left p-2 rounded ${
                selectedFlow?.sid === flow.sid
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100'
              }`}
            >
              {flow.friendly_name}
            </button>
          ))}
        </div>
      </div>

      {/* Executions Panel */}
      <div className="w-1/4 border-r p-4">
        <h2 className="text-lg font-semibold mb-4">Executions</h2>
        <div className="space-y-2">
          {executions.map((execution) => (
            <button
              key={execution.sid}
              onClick={() => setSelectedExecution(execution)}
              className={`w-full text-left p-2 rounded ${
                selectedExecution?.sid === execution.sid
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100'
              }`}
            >
              {execution.sid}
            </button>
          ))}
        </div>
      </div>

      {/* Execution Content Panel */}
      <div className="flex-1 p-4">
        <h2 className="text-lg font-semibold mb-4">Execution Details</h2>
        {executionContent && (
          <pre className="bg-gray-50 p-4 rounded">
            {JSON.stringify(executionContent, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
} 