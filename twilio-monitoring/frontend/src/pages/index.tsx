import { useEffect, useState } from 'react';
import { studioApi } from '../services/api';

export default function Home() {
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [executionContent, setExecutionContent] = useState(null);
  const [executionSteps, setExecutionSteps] = useState(null);
  const [selectedStepLogs, setSelectedStepLogs] = useState(null);

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
          const [executionData, stepsData] = await Promise.all([
            studioApi.getExecution(selectedFlow.sid, selectedExecution.sid),
            studioApi.listSteps(selectedFlow.sid, selectedExecution.sid)
          ]);
          
          setExecutionContent(executionData);
          setExecutionSteps(stepsData);
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
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-2">Execution Info</h3>
              <pre className="bg-gray-50 p-4 rounded">
                {JSON.stringify(executionContent, null, 2)}
              </pre>
            </div>
            
            {executionSteps && (
              <div>
                <h3 className="text-md font-medium mb-2">Execution Steps</h3>
                <div className="space-y-2">
                  {executionSteps.map((step) => (
                    // todo: These function logs load the most recent logs, not the logs for the specific function executed. 
                    <div key={step.sid} className="bg-gray-50 p-4 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{step.name}</div>
                          <div className="text-sm text-gray-600">Type: {step.widget_type}</div>
                        </div>
                        {step.function && (
                          <button
                            onClick={async () => {
                              const logs = await studioApi.getFunctionLogs(
                                step.function.service_sid,
                                step.function.environment_sid
                              );
                              setSelectedStepLogs(logs);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            View Logs
                          </button>
                        )}
                      </div>
                      
                      {selectedStepLogs && step.function && (
                        <div className="mt-4 p-3 bg-gray-100 rounded">
                          <h4 className="font-medium mb-2">Function Logs</h4>
                          <div className="max-h-60 overflow-y-auto">
                            {selectedStepLogs.map((log) => (
                              <div key={log.sid} className="text-sm mb-2">
                                <span className={`font-medium ${
                                  log.level === 'ERROR' ? 'text-red-600' : 
                                  log.level === 'WARN' ? 'text-yellow-600' : 
                                  'text-gray-600'
                                }`}>
                                  [{log.level}]
                                </span>
                                <span className="text-gray-500 ml-2">
                                  {new Date(log.date_created).toLocaleString()}
                                </span>
                                <div className="ml-5">{log.message}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <pre className="mt-2 text-sm">
                        {JSON.stringify(step, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 