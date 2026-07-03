'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'points_desc', label: 'Most points' },
  { value: 'points_asc', label: 'Least points' },
  { value: 'kg_desc', label: 'Most recycled' },
  { value: 'name_asc', label: 'Name A→Z' },
];

export default function UserFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page'); // reset to page 1 on filter change
    router.push(`/dashboard/users?${params.toString()}`);
  }, [sp, router]);

  const sort = sp.get('sort') ?? 'newest';
  const role = sp.get('role') ?? 'all';
  const minPts = sp.get('min_pts') ?? '';
  const maxPts = sp.get('max_pts') ?? '';

  const active = sort !== 'newest' || role !== 'all' || minPts || maxPts;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => update('sort', e.target.value)}
        className="text-sm px-3 py-2 rounded-lg border border-sage-200 bg-white text-ink focus:border-forest-700 outline-none transition-colors"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Role filter */}
      <div className="flex rounded-lg border border-sage-200 bg-white overflow-hidden text-sm">
        {(['all', 'user', 'admin'] as const).map((r) => (
          <button
            key={r}
            onClick={() => update('role', r === 'all' ? '' : r)}
            className={`px-3 py-2 capitalize transition-colors ${
              role === r || (r === 'all' && !sp.get('role'))
                ? 'bg-forest-900 text-white font-medium'
                : 'text-sage-400 hover:text-ink hover:bg-sage-50'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Points range */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-sage-400 text-xs whitespace-nowrap">Points</span>
        <input
          type="number"
          placeholder="Min"
          value={minPts}
          min={0}
          onChange={(e) => update('min_pts', e.target.value)}
          className="w-20 px-2 py-2 rounded-lg border border-sage-200 bg-white text-ink text-xs focus:border-forest-700 outline-none transition-colors"
        />
        <span className="text-sage-300">—</span>
        <input
          type="number"
          placeholder="Max"
          value={maxPts}
          min={0}
          onChange={(e) => update('max_pts', e.target.value)}
          className="w-20 px-2 py-2 rounded-lg border border-sage-200 bg-white text-ink text-xs focus:border-forest-700 outline-none transition-colors"
        />
      </div>

      {/* Clear filters */}
      {active && (
        <button
          onClick={() => router.push('/dashboard/users')}
          className="text-xs text-sage-400 hover:text-ink transition-colors px-2 py-2 rounded-lg hover:bg-sage-100"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
