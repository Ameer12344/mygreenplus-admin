import { LucideIcon } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  tint = 'forest',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  tint?: 'forest' | 'amber' | 'plum' | 'sky' | 'rose';
}) {
  const tints: Record<string, string> = {
    forest: 'bg-forest-900/5 text-forest-900',
    amber: 'bg-amber-50 text-amber-600',
    plum: 'bg-plum-50 text-plum-600',
    sky: 'bg-sky-50 text-sky-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tints[tint]}`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-sage-400 mb-1">{label}</p>
        <p className="font-display font-semibold text-2xl text-ink leading-none">
          {value}
        </p>
        {sublabel && (
          <p className="text-xs text-sage-400 mt-1.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
