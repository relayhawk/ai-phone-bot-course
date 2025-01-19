import { Company, ContactReason } from '../types';
import { mockCompany, contactReasons } from '../data/mockData';
import ReasonForContact from '../components/ReasonForContact';

const HomePage = () => {
  // In the future, this could be replaced with actual API calls
  const company: Company = mockCompany;
  const reasons: ContactReason[] = contactReasons;

  return (
    <>
      <h1 className="text-3xl font-bold">Reasons for Contacting {company.name}</h1>
      {/* <p className="mt-4 text-lg text-gray-600">{company.description}</p> */}
      
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reasons.map((reason) => (
          <ReasonForContact key={reason.id} reason={reason} />
        ))}
      </div>
    </>
  );
};

export default HomePage;
