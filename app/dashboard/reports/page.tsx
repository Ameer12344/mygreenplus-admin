import Link from 'next/link';
import { MessageSquareWarning } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ReportModal from './ReportModal';

export const dynamic = 'force-dynamic';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status ?? 'open';
  const supabase = createClient();

  let query = supabase
    .from('problem_reports')
    .select('id, title, description, category, status, admin_notes, created_at, image_urls, app_users(name, phone), rvm_machines(machine_code)')
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: reports } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-2xl text-ink">Problem Reports</h1>
        <p className="text-sage-400 text-sm mt-1">{reports?.length ?? 0} reports</p>
      </div>

      <div className="flex gap-1 bg-white rounded-lg shadow-card p-1 w-fit overflow-x-auto scrollbar-thin">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/dashboard/reports${f.value === 'open' ? '' : `?status=${f.value}`}`}
            className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              status === f.value ? 'bg-forest-900 text-white' : 'text-sage-400 hover:text-ink'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {(reports ?? []).map((r: any) => (
          <ReportModal key={r.id} r={r} />
        ))}

        {(reports ?? []).length === 0 && (
          <div className="bg-white rounded-xl2 shadow-card p-10 text-center text-sage-400">
            No {status !== 'all' ? status.replace('_', ' ') : ''} reports right now.
          </div>
        )}
      </div>
    </div>
  );
}
