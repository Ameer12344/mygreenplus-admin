'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export default function ExportButton({
  type,
  label = 'Download CSV',
}: {
  /** Must match a key in EXPORT_CONFIG in app/api/export/route.ts */
  type: 'users' | 'dropoffs' | 'claims' | 'rewards' | 'withdrawals' | 'reports';
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export?type=${type}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Export failed');
      }
      const blob = await res.blob();

      // Pull the filename Server suggested via Content-Disposition, falling
      // back to a generic one if it's missing for some reason.
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] ?? `${type}-export.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message ?? 'Something went wrong while exporting.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-sage-50 text-ink hover:bg-sage-100 transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      {loading ? 'Preparing…' : label}
    </button>
  );
}
