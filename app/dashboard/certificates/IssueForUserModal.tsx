'use client';

import { useState } from 'react';
import { Award } from 'lucide-react';
import Modal from '@/components/Modal';
import IssueCertificateForm from './IssueCertificateForm';

export default function IssueForUserModal({
  user,
  allUsers,
  task,
}: {
  user: { id: string; name: string | null; phone: string | null };
  allUsers: { id: string; name: string | null; phone: string | null }[];
  task: any;
}) {
  const [open, setOpen] = useState(false);

  const defaultLevel = (task.reward_cert_level ?? '').toLowerCase();
  const defaultTitle = task.title ? `${task.title} — Achieved` : 'Eco Achievement';
  const defaultSubtitle = task.description || '';
  const defaultTotalKg = task.goal_type === 'kg_recycled' ? Number(task.goal_value) : undefined;

  return (
    <Modal
      title={`Issue certificate to ${user.name ?? 'user'}`}
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors px-2 py-1 rounded-md hover:bg-emerald-50 flex-shrink-0"
        >
          <Award className="w-3.5 h-3.5" />
          Issue
        </button>
      }
    >
      <IssueCertificateForm
        users={allUsers}
        onDone={() => setOpen(false)}
        defaultUserId={user.id}
        defaultTitle={defaultTitle}
        defaultSubtitle={defaultSubtitle}
        defaultLevel={defaultLevel}
        defaultTotalKg={defaultTotalKg}
      />
    </Modal>
  );
}
