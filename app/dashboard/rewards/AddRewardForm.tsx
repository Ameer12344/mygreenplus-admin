'use client';

import { useTransition } from 'react';
import { addReward } from './actions';

export default function AddRewardForm({ onDone }: { onDone: () => void }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addReward(formData);
      onDone();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Field label="Title" name="title" required placeholder="RM10 GrabFood Voucher" />
      <Field label="Partner" name="partner" placeholder="GrabFood" />
      <div>
        <label className="block text-xs font-medium text-sage-400 mb-1.5">Description</label>
        <textarea
          name="description"
          rows={3}
          placeholder="What the user gets and any conditions"
          className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Points required" name="points" type="number" required placeholder="500" />
        <Field label="Stock" name="stock" type="number" placeholder="100" />
      </div>
      <Field label="Expires at" name="expiresAt" type="date" />

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-forest-900 hover:bg-forest-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
      >
        {pending ? 'Adding…' : 'Add reward'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-sage-400 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
      />
    </div>
  );
}
