'use client';

import { useMemo, useState, useTransition } from 'react';
import { logDropoff } from './actions';
import { calculatePoints } from '@/lib/points';

type SimpleUser = { id: string; name: string | null; phone: string | null };
type SimpleRvm = { id: string; machine_code: string; location_name: string | null };

export default function LogDropoffForm({
  users,
  rvms,
  onDone,
}: {
  users: SimpleUser[];
  rvms: SimpleRvm[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [materialType, setMaterialType] = useState('plastic');
  const [weightKg, setWeightKg] = useState('');

  const previewPoints = useMemo(() => {
    const w = parseFloat(weightKg);
    if (isNaN(w) || w <= 0) return 0;
    return calculatePoints(materialType, w);
  }, [materialType, weightKg]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await logDropoff(formData);
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
          defaultValue=""
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
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Material Type</label>
        <select
          name="materialType"
          required
          value={materialType}
          onChange={(e) => setMaterialType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink focus:border-forest-700 outline-none transition-colors"
        >
          <option value="plastic">Plastic</option>
          <option value="aluminium">Aluminium</option>
          <option value="glass">Glass</option>
          <option value="paper">Paper</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Weight (kg)</label>
        <input
          name="weightKg"
          type="number"
          step="0.01"
          min="0.01"
          max="200"
          required
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="e.g. 2.5"
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
        />
        <p className="text-xs text-sage-400/70 mt-1">Max 200 kg per drop-off session.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">RVM Machine (optional)</label>
        <select
          name="rvmId"
          defaultValue=""
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink focus:border-forest-700 outline-none transition-colors"
        >
          <option value="">No machine — manual / demo entry</option>
          {rvms.map((m) => (
            <option key={m.id} value={m.id}>
              {m.machine_code} {m.location_name ? `— ${m.location_name}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between bg-sage-50 rounded-lg px-3 py-2.5">
        <span className="text-xs font-medium text-sage-400">Points to issue</span>
        <span className="text-sm font-semibold text-forest-900">+{previewPoints} pts</span>
      </div>

      <button
        type="submit"
        disabled={pending || previewPoints === 0}
        className="w-full bg-forest-900 hover:bg-forest-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
      >
        {pending ? 'Logging…' : 'Log drop-off & issue points'}
      </button>
    </form>
  );
}
