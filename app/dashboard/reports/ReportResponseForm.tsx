'use client';

import { useTransition } from 'react';
import { updateReport } from './actions';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function ReportResponseForm({
  reportId,
  currentStatus,
  currentNotes,
  onDone,
}: {
  reportId: string;
  currentStatus: string;
  currentNotes: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateReport(formData);
      onDone();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="reportId" value={reportId} />

      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Status</label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex-1">
              <input
                type="radio"
                name="status"
                value={opt.value}
                defaultChecked={opt.value === currentStatus}
                className="peer hidden"
              />
              <div className="text-center text-xs font-medium py-2 rounded-lg border border-sage-200 text-sage-400 peer-checked:bg-forest-900 peer-checked:text-white peer-checked:border-forest-900 cursor-pointer transition-colors">
                {opt.label}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Admin notes</label>
        <textarea
          name="adminNotes"
          rows={4}
          defaultValue={currentNotes}
          placeholder="Internal notes — not visible to the user"
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-forest-900 hover:bg-forest-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
