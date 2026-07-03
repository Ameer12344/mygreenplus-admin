const STYLES: Record<string, string> = {
  // problem_reports.status
  open: 'bg-rose-50 text-rose-600',
  in_progress: 'bg-amber-50 text-amber-600',
  resolved: 'bg-forest-900/8 text-forest-900',

  // rewards.status
  active: 'bg-forest-900/8 text-forest-900',
  out_of_stock: 'bg-sage-100 text-sage-400',

  // rvm_machines.status
  online: 'bg-forest-900/8 text-forest-900',
  near_full: 'bg-amber-50 text-amber-600',
  offline: 'bg-rose-50 text-rose-600',
};

const LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  active: 'Active',
  out_of_stock: 'Out of stock',
  online: 'Online',
  near_full: 'Near full',
  offline: 'Offline',
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? 'bg-sage-100 text-sage-400';
  const label = LABELS[status] ?? status;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
