'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import IssueCertificateForm from './IssueCertificateForm';

export default function IssueCertificateModal({ users }: { users: { id: string; name: string; phone: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      title="Issue certificate"
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-forest-900 hover:bg-forest-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Issue certificate
        </button>
      }
    >
      <IssueCertificateForm users={users} onDone={() => setOpen(false)} />
    </Modal>
  );
}
