'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const [, startTransition] = useTransition();

  function update(next: string) {
    setValue(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set('q', next);
    } else {
      params.delete('q');
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative w-full sm:w-72">
      <Search className="w-4 h-4 text-sage-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 bg-white focus:border-forest-700 outline-none transition-colors"
      />
    </div>
  );
}
