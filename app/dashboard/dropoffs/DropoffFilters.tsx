'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const MATERIALS = ['plastic', 'glass', 'aluminium', 'metal', 'paper', 'e-waste', 'other'];

const fieldClass =
  'px-3 py-1.5 rounded-lg border border-sage-200 bg-white text-sm text-ink ' +
  'focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 transition-colors';

type Rvm = { id: string; machine_code: string; location_name: string | null };
type Person = { id: string; name: string | null };

export default function DropoffFilters({
  rvms,
  users,
}: {
  rvms: Rvm[];
  users: Person[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const rvm = searchParams.get('rvm') ?? '';
  const material = searchParams.get('material') ?? '';
  const user = searchParams.get('user') ?? '';

  const hasFilters = Boolean(from || to || rvm || material || user);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      // Any filter change jumps back to page 1.
      params.delete('page');
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ['from', 'to', 'rvm', 'material', 'user', 'page'].forEach((k) => params.delete(k));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={from}
          onChange={(e) => setParam('from', e.target.value)}
          className={fieldClass}
          aria-label="From date"
        />
        <span className="text-sage-400 text-xs">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setParam('to', e.target.value)}
          className={fieldClass}
          aria-label="To date"
        />
      </div>

      <select
        value={rvm}
        onChange={(e) => setParam('rvm', e.target.value)}
        className={fieldClass}
        aria-label="Filter by station"
      >
        <option value="">All stations</option>
        {rvms.map((m) => (
          <option key={m.id} value={m.id}>
            {m.location_name || m.machine_code}
          </option>
        ))}
      </select>

      <select
        value={material}
        onChange={(e) => setParam('material', e.target.value)}
        className={fieldClass + ' capitalize'}
        aria-label="Filter by material"
      >
        <option value="">All materials</option>
        {MATERIALS.map((mt) => (
          <option key={mt} value={mt} className="capitalize">
            {mt}
          </option>
        ))}
      </select>

      <select
        value={user}
        onChange={(e) => setParam('user', e.target.value)}
        className={fieldClass}
        aria-label="Filter by user"
      >
        <option value="">All users</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name ?? 'Unknown'}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-medium text-sage-400 hover:text-forest-700 transition-colors underline underline-offset-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
