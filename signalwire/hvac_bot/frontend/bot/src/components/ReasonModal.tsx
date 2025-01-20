import { Dialog } from '@headlessui/react';
import { ContactReason } from '../types';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: ContactReason;
  onSave: (reason: Partial<ContactReason>) => void;
}

const ReasonModal = ({ isOpen, onClose, reason, onSave }: ReasonModalProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl rounded-lg bg-white p-6">
          <Dialog.Title className="text-xl font-semibold text-rh-blue-800">
            {reason ? 'Edit Reason' : 'Add New Reason'}
          </Dialog.Title>
          
          <div className="mt-4">
            {/* Form will go here in future implementation */}
            <p className="text-rh-neutral-600">Modal content coming soon</p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-rh-neutral-600 hover:text-rh-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave({})}
              className="rounded-md bg-rh-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-rh-blue-700"
            >
              Save
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ReasonModal; 