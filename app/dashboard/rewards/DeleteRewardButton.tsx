'use client';

import { deleteReward } from './actions';

export default function DeleteRewardButton({ rewardId, title }: { rewardId: string; title: string }) {
  return (
    <form
      action={deleteReward}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="rewardId" value={rewardId} />
      <button
        type="submit"
        className="text-xs font-medium py-1.5 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
