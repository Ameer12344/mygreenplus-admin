import Link from 'next/link';
import { Users, Recycle, Coins, Flag, Gift, Server, Banknote } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/StatCard';
import DropoffTrendChart from '@/components/DropoffTrendChart';
import RealtimeRefresher from '@/components/RealtimeRefresher';

export const dynamic = 'force-dynamic';

const TREND_DAYS = 14;
const ADMIN_TIMEZONE = 'Asia/Kuala_Lumpur';

// Formats any Date into a "YYYY-MM-DD" key for a given local timezone,
// independent of what timezone the server itself is running in.
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ADMIN_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function localDayKey(d: Date): string {
  return dayKeyFormatter.format(d); // e.g. "2026-07-07"
}

export default async function OverviewPage() {
  const supabase = createClient();

  // Anchor "today" to the admin's local calendar day (Asia/Kuala_Lumpur),
  // not the server's own clock/timezone (which is typically UTC on most hosts).
  const todayKey = localDayKey(new Date());
  const [ty, tm, td] = todayKey.split('-').map(Number);
  const todayAnchor = new Date(Date.UTC(ty, tm - 1, td));

  // Build the last TREND_DAYS local calendar day-keys, oldest → newest, today included.
  const dayKeys: string[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(todayAnchor);
    d.setUTCDate(d.getUTCDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  // Fetch a couple of extra buffer days before the window so rows near the
  // UTC/local-timezone boundary aren't missed, then bucket by local calendar day below.
  const fetchSince = new Date(todayAnchor);
  fetchSince.setUTCDate(fetchSince.getUTCDate() - (TREND_DAYS + 1));

  const [
    { count: userCount },
    { data: usersAgg },
    { count: openReports },
    { count: claimsCount },
    { data: rvms },
    { data: recentDropoffs },
    { data: trendRows },
    { count: pendingWithdrawals },
  ] = await Promise.all([
    supabase.from('app_users').select('id', { count: 'exact', head: true }),
    supabase.from('app_users').select('eco_points, total_kg'),
    supabase.from('problem_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('reward_claims').select('id', { count: 'exact', head: true }),
    supabase.from('rvm_machines').select('status'),
    supabase
      .from('drop_off_history')
      .select('*, app_users(name), rvm_machines(machine_code, location_name)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('drop_off_history')
      .select('weight_kg, created_at')
      .gte('created_at', fetchSince.toISOString()),
    supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalKg = (usersAgg ?? []).reduce((sum, u) => sum + (Number(u.total_kg) || 0), 0);
  const totalPoints = (usersAgg ?? []).reduce((sum, u) => sum + (Number(u.eco_points) || 0), 0);

  const rvmCounts = { online: 0, near_full: 0, offline: 0 };
  (rvms ?? []).forEach((m) => {
    if (m.status in rvmCounts) {
      rvmCounts[m.status as keyof typeof rvmCounts]++;
    }
  });

  // Build contiguous local-day buckets so days with no drop-offs still show as 0,
  // and today's bucket is always present (even before any drop-offs happen today).
  const buckets = new Map<string, number>();
  dayKeys.forEach((key) => buckets.set(key, 0));

  (trendRows ?? []).forEach((row) => {
    const key = localDayKey(new Date(row.created_at));
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + Number(row.weight_kg));
    }
  });

  const trendData = dayKeys.map((key) => ({
    day: new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }),
    kg: buckets.get(key) ?? 0,
    isToday: key === todayKey,
  }));

  return (
    <div className="space-y-8">
      {/* Auto-refresh on new drop-offs, reports, withdrawals */}
      <RealtimeRefresher table="drop_off_history" />
      <RealtimeRefresher table="problem_reports" />
      <RealtimeRefresher table="withdrawals" />

      <div>
        <h1 className="font-display font-semibold text-2xl text-ink">Overview</h1>
        <p className="text-sage-400 text-sm mt-1">A snapshot of MyGreenPlus right now.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total users" value={String(userCount ?? 0)} tint="forest" />
        <StatCard icon={Recycle} label="Total recycled" value={`${totalKg.toFixed(1)} kg`} tint="sky" />
        <StatCard icon={Coins} label="Points in circulation" value={totalPoints.toLocaleString()} tint="amber" />
        <StatCard
          icon={Flag}
          label="Open problem reports"
          value={String(openReports ?? 0)}
          tint={openReports ? 'rose' : 'forest'}
        />
      </div>

      {/* Pending withdrawals alert */}
      {(pendingWithdrawals ?? 0) > 0 && (
        <Link
          href="/dashboard/withdrawals"
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm hover:bg-amber-100 transition-colors"
        >
          <Banknote className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 font-medium">
            {pendingWithdrawals} pending withdrawal{(pendingWithdrawals ?? 0) > 1 ? 's' : ''} awaiting your approval →
          </p>
        </Link>
      )}

      {/* Recycling trend chart */}
      <div className="bg-white rounded-xl2 shadow-card p-5">
        <h2 className="font-display font-semibold text-base text-ink mb-1">Recycling trend</h2>
        <p className="text-sage-400 text-xs mb-3">Kilograms recycled per day, last {TREND_DAYS} days</p>
        <DropoffTrendChart data={trendData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RVM status */}
        <div className="bg-white rounded-xl2 shadow-card p-5 lg:col-span-1">
          <h2 className="font-display font-semibold text-base text-ink mb-4">RVM machines</h2>
          <div className="space-y-3">
            <RvmRow label="Online" count={rvmCounts.online} dot="bg-forest-700" />
            <RvmRow label="Near full" count={rvmCounts.near_full} dot="bg-amber-600" />
            <RvmRow label="Offline" count={rvmCounts.offline} dot="bg-rose-600" />
          </div>
          <Link
            href="/dashboard/dropoffs"
            className="block text-center text-sm text-forest-700 font-medium mt-5 hover:underline"
          >
            View all machines →
          </Link>
        </div>

        {/* Recent drop-offs */}
        <div className="bg-white rounded-xl2 shadow-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-base text-ink">Recent drop-offs</h2>
            <Link href="/dashboard/dropoffs" className="text-sm text-forest-700 font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-sage-100">
            {(recentDropoffs ?? []).length === 0 && (
              <p className="text-sm text-sage-400 py-6 text-center">No drop-offs yet.</p>
            )}
            {(recentDropoffs ?? []).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between py-3 text-sm">
                <div className="min-w-0">
                  <p className="text-ink font-medium truncate">{d.app_users?.name ?? 'Unknown user'}</p>
                  <p className="text-sage-400 text-xs mt-0.5 truncate">
                    {d.rvm_machines?.location_name ?? d.rvm_machines?.machine_code ?? 'Unknown RVM'}
                    {' · '}
                    {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 pl-3">
                  <p className="font-mono text-ink">{Number(d.weight_kg).toFixed(1)} kg</p>
                  <p className="text-xs text-sage-400">+{d.points_earned ?? 0} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Gift} label="Rewards claimed" value={String(claimsCount ?? 0)} tint="plum" />
        <StatCard icon={Server} label="RVM machines tracked" value={String((rvms ?? []).length)} tint="sky" />
        <StatCard
          icon={Banknote}
          label="Pending withdrawals"
          value={String(pendingWithdrawals ?? 0)}
          tint={(pendingWithdrawals ?? 0) > 0 ? 'amber' : 'forest'}
        />
      </div>
    </div>
  );
}

function RvmRow({ label, count, dot }: { label: string; count: number; dot: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-ink">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="font-mono text-ink">{count}</span>
    </div>
  );
}
