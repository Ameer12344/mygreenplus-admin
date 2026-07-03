'use client';

import { useState, useTransition } from 'react';
import { updateRvmStatus } from './actions';

export default function UpdateRvmStatus({ rvmId, currentStatus }: { rvmId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const statuses = [
    { value: 'online', label: 'Online', color: 'text-emerald-700 bg-emerald-50' },
    { value: 'offline', label: 'Offline', color: 'text-rose-700 bg-rose-50' },
    { value: 'maintenance', label: 'Maintenance', color: 'text-amber-700 bg-amber-50' },
  ];

  function handleUpdate(newStatus: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('rvmId', rvmId);
      formData.set('status', newStatus);
      await updateRvmStatus(formData);
      setOpen(false);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-sage-50 text-ink hover:bg-sage-100 transition-colors"
      >
        Update
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 bg-white rounded-xl shadow-lg border border-sage-100 p-3 w-52 space-y-2">
          <p className="text-xs font-medium text-sage-400 mb-2">Set machine status</p>
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => handleUpdate(s.value)}
              disabled={pending || s.value === currentStatus}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-40 ${s.color}`}
            >
              {s.label} {s.value === currentStatus ? '(current)' : ''}
            </button>
          ))}
          <p className="text-[10px] text-sage-400 pt-1 border-t border-sage-100">
            Capacity % updates automatically based on real drop-offs — it can't be set manually here. Use "Mark as emptied" to reset it.
          </p>
          <button onClick={() => setOpen(false)} className="w-full text-xs text-sage-400 hover:text-ink mt-1">Cancel</button>
        </div>
      )}
    </div>
  );
}
