import { ContactReason } from '../types';

interface ReasonForContactProps {
  reason: ContactReason;
}

const ReasonForContact = ({ reason }: ReasonForContactProps) => {
  return (
    <div 
      key={reason.id}
      className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <h2 className="text-xl font-semibold">{reason.title}</h2>
      <p className="mt-2">{reason.description}</p>
      {reason.gather && reason.gather.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium">Information to Gather:</h3>
          <ul className="mt-2 space-y-2">
            {reason.gather.map((field) => (
              <li key={field.name} className="text-sm">
                {field.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReasonForContact; 