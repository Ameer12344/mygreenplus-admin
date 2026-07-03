'use client';

import { useTransition } from 'react';
import { issueCertificate } from './actions';

export default function IssueCertificateForm({
  users,
  onDone,
  defaultUserId,
  defaultTitle,
  defaultSubtitle,
  defaultLevel,
  defaultTotalKg,
}: {
  users: { id: string; name: string | null; phone: string | null }[];
  onDone: () => void;
  defaultUserId?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultLevel?: string;
  defaultTotalKg?: number;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await issueCertificate(formData);
      onDone();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">User</label>
        <select
          name="userId"
          required
          defaultValue={defaultUserId ?? ''}
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink focus:border-forest-700 outline-none transition-colors"
        >
          <option value="" disabled>Select a user…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || 'Unnamed user'} {u.phone ? `— ${u.phone}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Certificate Title</label>
        <input
          name="title"
          required
          defaultValue={defaultTitle ?? ''}
          placeholder="e.g. 2026 Eco Contributor"
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Description</label>
        <input
          name="subtitle"
          defaultValue={defaultSubtitle ?? ''}
          placeholder="e.g. Q1 · Plastic Recycling Champion"
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Year</label>
        <input
          name="year"
          required
          placeholder="2026"
          defaultValue={new Date().getFullYear().toString()}
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Level</label>
        <select
          name="level"
          required
          defaultValue={defaultLevel ?? ''}
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink focus:border-forest-700 outline-none transition-colors"
        >
          <option value="" disabled>Select level…</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Total Recycled (kg)</label>
        <input
          name="totalKg"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultTotalKg ?? ''}
          placeholder="e.g. 25.5"
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-forest-900 hover:bg-forest-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
      >
        {pending ? 'Issuing…' : 'Issue certificate'}
      </button>
    </form>
  );
}
