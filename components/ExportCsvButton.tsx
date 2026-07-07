'use client';

import { Download } from 'lucide-react';

export default function ExportCsvButton({ type }: { type: string }) {
  return (
    <a
      href={`/api/export?type=${type}`}
      download
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink bg-white border border-sage-100 shadow-card hover:bg-sage-50 transition-colors whitespace-nowrap"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </a>
  );
}
