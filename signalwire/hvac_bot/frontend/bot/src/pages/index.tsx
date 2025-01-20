import { useState } from 'react';
import ReasonForContact from '../components/ReasonForContact';
import ReasonModal from '../components/ReasonModal';
import { Company, ContactReason } from '../types';
import { mockCompany, contactReasons } from '../data/mockData';

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const company: Company = mockCompany;
  const reasons: ContactReason[] = contactReasons;

  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Reasons for Contacting {company.name}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md border border-rh-blue-600 px-4 py-2 text-sm font-medium text-rh-blue-600 hover:bg-gray-100 hover:border-rh-blue-700 hover:text-rh-blue-700 transition-colors duration-150"
        >
          Add Reason
        </button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reasons.map((reason) => (
          <ReasonForContact key={reason.id} reason={reason} />
        ))}
      </div>

      <ReasonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(reason) => {
          console.log('Save reason:', reason);
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export default HomePage;
