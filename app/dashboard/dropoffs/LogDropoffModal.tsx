'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import LogDropoffForm from './LogDropoffForm';

type SimpleUser = { id: string; name: string | null; phone: string | null };
type SimpleRvm = { id: string; machine_code: string; location_name: string | null };

export default function LogDropoffModal({
  users,
  rvms,
}: {
  users: SimpleUser[];
  rvms: SimpleRvm[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      title="Log drop-off"
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-forest-900 hover:bg-forest-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log drop-off
        </button>
      }
    >
      <LogDropoffForm users={users} rvms={rvms} onDone={() => setOpen(false)} />
    </Modal>
  );
}
