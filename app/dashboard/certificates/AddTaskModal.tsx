'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import { createTask } from './taskActions';

export default function AddTaskModal() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createTask(formData);
      setOpen(false);
    });
  }

  return (
    <Modal title="Add task" open={open} onClose={() => setOpen(false)} trigger={
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-forest-900 hover:bg-forest-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add task
      </button>
    }>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-sage-400 mb-1.5">Task Title</label>
          <input
            name="title"
            required
            placeholder="e.g. Recycle 10kg of plastic"
            className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-sage-400 mb-1.5">Description</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Optional description..."
            className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-sage-400 mb-1.5">Goal Type</label>
          <select
            name="goalType"
            required
            defaultValue=""
            className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink focus:border-forest-700 outline-none transition-colors"
          >
            <option value="" disabled>Select goal type…</option>
            <option value="kg_recycled">Total kg recycled</option>
            <option value="drop_off_count">Number of drop-offs</option>
            <option value="points_earned">Points earned</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-sage-400 mb-1.5">Goal Value</label>
          <input
            name="goalValue"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="e.g. 10"
            className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-sage-400 mb-1.5">Material Type (optional)</label>
          <select
            name="materialType"
            defaultValue=""
            className="w-full px-3 py-2 rounded-lg border border-sage-200 text-sm text-ink focus:border-forest-700 outline-none transition-colors"
          >
            <option value="">Any material</option>
            <option value="plastic">Plastic</option>
            <option value="aluminium">Aluminium</option>
            <option value="glass">Glass</option>
            <option value="paper">Paper</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-forest-900 hover:bg-forest-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
        >
          {pending ? 'Creating…' : 'Create task'}
        </button>
      </form>
    </Modal>
  );
}
