import Link from 'next/link';
import { Gift } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import StatusBadge from '@/components/StatusBadge';
import AddRewardModal from './AddRewardModal';
import { toggleRewardStatus } from './actions';
import DeleteRewardButton from './DeleteRewardButton';

export const dynamic = 'force-dynamic';

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab === 'claims' ? 'claims' : 'rewards';
  const supabase = createClient();

  const rewardsPromise = supabase
    .from('rewards')
    .select('id, title, partner, points_required, status, stock, total_claimed, expires_at')
    .order('points_required');

  const claimsPromise = supabase
    .from('reward_claims')
    .select('id, voucher_code, points_spent, claimed_at, app_users(name), rewards(title, partner)')
    .order('claimed_at', { ascending: false })
    .limit(100);

  const [{ data: rewards }, { data: claims }] = await Promise.all([rewardsPromise, claimsPromise]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-ink">Rewards &amp; Claims</h1>
          <p className="text-sage-400 text-sm mt-1">
            {tab === 'rewards' ? `${rewards?.length ?? 0} rewards` : `${claims?.length ?? 0} claims`}
          </p>
        </div>

        {tab === 'rewards' && (
          <AddRewardModal />
        )}
      </div>

      <div className="flex gap-1 bg-white rounded-lg shadow-card p-1 w-fit">
        <Tab href="/dashboard/rewards" active={tab === 'rewards'}>Rewards</Tab>
        <Tab href="/dashboard/rewards?tab=claims" active={tab === 'claims'}>Claims</Tab>
      </div>

      {tab === 'rewards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(rewards ?? []).map((r) => (
            <div key={r.id} className="bg-white rounded-xl2 shadow-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 rounded-lg bg-forest-900/8 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 text-forest-900" />
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div>
                <p className="text-ink font-medium leading-snug">{r.title}</p>
                {r.partner && <p className="text-sage-400 text-xs mt-0.5">{r.partner}</p>}
              </div>
              <div className="flex items-center justify-between text-xs text-sage-400 pt-2 border-t border-sage-100">
                <span className="font-mono text-ink">{r.points_required} pts</span>
                <span>{r.stock ?? '∞'} in stock</span>
                <span>{r.total_claimed ?? 0} claimed</span>
              </div>
              <div className="flex gap-2">
                <form action={toggleRewardStatus} className="flex-1">
                  <input type="hidden" name="rewardId" value={r.id} />
                  <input
                    type="hidden"
                    name="nextStatus"
                    value={r.status === 'active' ? 'out_of_stock' : 'active'}
                  />
                  <button
                    type="submit"
                    className="w-full text-xs font-medium py-1.5 rounded-lg bg-sage-50 text-ink hover:bg-sage-100 transition-colors"
                  >
                    {r.status === 'active' ? 'Mark out of stock' : 'Mark active'}
                  </button>
                </form>
                <DeleteRewardButton rewardId={r.id} title={r.title} />
              </div>
            </div>
          ))}

          {(rewards ?? []).length === 0 && (
            <p className="text-sage-400 text-sm col-span-full text-center py-10">
              No rewards yet — add one to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sage-100 text-left text-xs text-sage-400">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Reward</th>
                  <th className="px-5 py-3 font-medium">Voucher code</th>
                  <th className="px-5 py-3 font-medium">Points spent</th>
                  <th className="px-5 py-3 font-medium">Claimed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {(claims ?? []).map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 text-ink font-medium whitespace-nowrap">
                      {c.app_users?.name ?? 'Unknown'}
                    </td>
                    <td className="px-5 py-3 text-ink whitespace-nowrap">{c.rewards?.title ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-ink whitespace-nowrap">{c.voucher_code}</td>
                    <td className="px-5 py-3 font-mono text-ink whitespace-nowrap">{c.points_spent}</td>
                    <td className="px-5 py-3 text-sage-400 whitespace-nowrap">
                      {new Date(c.claimed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {(claims ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sage-400">
                      No claims yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-forest-900 text-white' : 'text-sage-400 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}
