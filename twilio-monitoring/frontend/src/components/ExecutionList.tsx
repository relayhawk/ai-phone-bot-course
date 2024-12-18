import { Execution } from '../types/twilio';

interface ExecutionListProps {
  executions: Execution[];
  onSelectExecution: (executionSid: string) => void;
  selectedExecutionSid: string | null;
}

export default function ExecutionList({
  executions,
  onSelectExecution,
  selectedExecutionSid,
}: ExecutionListProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
      <div className="bg-white rounded-lg shadow p-4">
        {executions.map((execution) => (
          <button
            key={execution.sid}
            onClick={() => onSelectExecution(execution.sid)}
            className={`w-full text-left p-3 rounded mb-2 ${
              selectedExecutionSid === execution.sid
                ? 'bg-blue-100 text-blue-800'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">{execution.contact_channel_address}</div>
            <div className="text-sm text-gray-600">
              {new Date(execution.date_created).toLocaleString()}
            </div>
            <div className={`text-sm ${
              execution.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {execution.status}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 