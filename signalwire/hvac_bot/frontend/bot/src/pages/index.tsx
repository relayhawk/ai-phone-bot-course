import { Company, ContactReason } from '../types';
import { mockCompany, contactReasons } from '../data/mockData';

const HomePage = () => {
  // In the future, this could be replaced with actual API calls
  const company: Company = mockCompany;
  const reasons: ContactReason[] = contactReasons;

  return (
    <>
      <h1 className="text-3xl font-bold">Reasons for Contacting {company.name}</h1>
      {/* <p className="mt-4 text-lg text-gray-600">{company.description}</p> */}
      
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reasons.map((reason: ContactReason) => (
          <div 
            key={reason.id}
            className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold">{reason.title}</h2>
            <p className="mt-2 text-gray-600">{reason.description}</p>
            {reason.gather && reason.gather.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Information to Gather:</h3>
                <ul className="mt-2 space-y-2">
                  {reason.gather.map((field) => (
                    <li key={field.name} className="text-sm text-gray-600">
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default HomePage;
