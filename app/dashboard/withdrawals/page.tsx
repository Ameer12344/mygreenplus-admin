import { createServiceClient } from '@/lib/supabase/server';
import WithdrawalList from './WithdrawalList';

export const dynamic = 'force-dynamic';

export default async function WithdrawalsPage() {
  const supabase = createServiceClient();

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*, app_users(name, phone)')
    .order('created_at', { ascending: false });

  const pending = (withdrawals ?? []).filter((w: any) => w.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display font-semibold text-2xl text-ink">Withdrawals</h1>
          <p className="text-sage-400 text-sm mt-1">
            {withdrawals?.length ?? 0} total · {pending} pending review
          </p>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium text-amber-700">
              {pending} pending
            </span>
          </div>
        )}
      </div>

      <WithdrawalList initial={(withdrawals ?? []) as any} />
    </div>
  );
}
