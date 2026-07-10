import { resetMachineCapacity } from './resetCapacityAction';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import StatusBadge from '@/components/StatusBadge';
import SearchBox from '@/components/SearchBox';
import UpdateRvmStatus from './UpdateRvmStatus';
import LogDropoffModal from './LogDropoffModal';
import ExportCsvButton from './ExportCsvButton';
import RealtimeRefresher from '@/components/RealtimeRefresher';
import { MapPin, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function DropoffsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const supabase = createClient();
  const serviceSupabase = createServiceClient();
  const q = searchParams.q?.trim() ?? '';
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const rvmsPromise = serviceSupabase
    .from('rvm_machines')
    .select('id, machine_code, location_name, status, capacity_pct, accepted_materials')
    .order('machine_code');

  const usersPromise = serviceSupabase
    .from('app_users')
    .select('id, name, phone')
    .order('name');

  // Get total kg per machine from drop_off_history
  const kgPerMachinePromise = serviceSupabase
    .from('drop_off_history')
    .select('rvm_id, weight_kg');

  const dropoffColumns =
    'id, weight_kg, points_earned, material_type, created_at, app_users(name), rvm_machines(machine_code, location_name)';

  let dropoffs: any[] = [];
  let count = 0;

  if (q) {
    const [{ data: matchedUsers }, { data: matchedRvms }] = await Promise.all([
      supabase.from('app_users').select('id').ilike('name', `%${q}%`),
      supabase
        .from('rvm_machines')
        .select('id')
        .or(`machine_code.ilike.%${q}%,location_name.ilike.%${q}%`),
    ]);

    const userIds = (matchedUsers ?? []).map((u) => u.id);
    const rvmIds = (matchedRvms ?? []).map((m) => m.id);

    if (userIds.length === 0 && rvmIds.length === 0) {
      dropoffs = [];
      count = 0;
    } else {
      const orParts: string[] = [];
      if (userIds.length) orParts.push(`user_id.in.(${userIds.join(',')})`);
      if (rvmIds.length) orParts.push(`rvm_id.in.(${rvmIds.join(',')})`);

      const { data, count: matchCount } = await supabase
        .from('drop_off_history')
        .select(dropoffColumns, { count: 'exact' })
        .or(orParts.join(','))
        .order('created_at', { ascending: false })
        .limit(200);

      dropoffs = data ?? [];
      count = matchCount ?? dropoffs.length;
    }
  }

  const dropoffsQuery = q
    ? null
    : supabase
        .from('drop_off_history')
        .select(dropoffColumns, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

  const [{ data: rvms }, dropoffsResult, { data: allDropoffs }, { data: dropoffUsers }] = await Promise.all([
    rvmsPromise,
    dropoffsQuery ?? Promise.resolve({ data: null, count: null }),
    kgPerMachinePromise,
    usersPromise,
  ]);

  if (!q && dropoffsResult) {
    dropoffs = dropoffsResult.data ?? [];
    count = dropoffsResult.count ?? 0;
  }

  // Calculate total kg per machine
  const kgPerMachine: Record<string, number> = {};
  (allDropoffs ?? []).forEach((d: any) => {
    if (d.rvm_id) {
      kgPerMachine[d.rvm_id] = (kgPerMachine[d.rvm_id] ?? 0) + (d.weight_kg ?? 0);
    }
  });

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const capacityColor = (pct: number) => {
    if (pct >= 90) return { bar: '#EF4444', bg: '#FEF2F2', text: '#DC2626' };
    if (pct >= 70) return { bar: '#F97316', bg: '#FFF7ED', text: '#EA580C' };
    if (pct >= 50) return { bar: '#EAB308', bg: '#FEFCE8', text: '#CA8A04' };
    return { bar: '#22C55E', bg: '#F0FDF4', text: '#16A34A' };
  };

  return (
    <div className="space-y-8">
      <RealtimeRefresher table="rvm_machines" />
      <RealtimeRefresher table="drop_off_history" />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-ink">Drop-offs &amp; RVMs</h1>
          <p className="text-sage-400 text-sm mt-1">{count} drop-off sessions recorded</p>
        </div>
        <LogDropoffModal users={dropoffUsers ?? []} rvms={rvms ?? []} />
      </div>

      {/* RVM machines */}
      <div>
        <h2 className="font-display font-semibold text-base text-ink mb-3">RVM machines</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(rvms ?? []).map((m: any) => {
            const pct = m.capacity_pct ?? 0;
            const colors = capacityColor(pct);
            const totalKg = kgPerMachine[m.id] ?? 0;
            return (
              <div key={m.id} className="bg-white rounded-xl2 shadow-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink font-medium font-mono text-sm">{m.machine_code}</p>
                    <p className="text-sage-400 text-xs mt-1 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {m.location_name || 'No location set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    <UpdateRvmStatus rvmId={m.id} currentStatus={m.status} />
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sage-400">Capacity</span>
                    <span className="font-semibold" style={{ color: colors.text }}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-sage-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: colors.bar }}
                    />
                  </div>
                  {pct >= 90 && (
                    <p className="text-xs font-medium text-red-600">⚠️ Machine is full — action needed</p>
                  )}
                  {pct >= 70 && pct < 90 && (
                    <p className="text-xs font-medium text-orange-600">⚡ Machine is near full</p>
                  )}
                </div>

                {/* Total kg collected */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-sage-100">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-sage-400" />
                        <span className="text-xs text-sage-400">Total collected:</span>
                        <span className="text-xs font-semibold text-ink">{totalKg.toFixed(1)} kg</span>
                      </div>
                      {pct > 0 && (
                        <form action={resetMachineCapacity}>
                          <input type="hidden" name="machineId" value={m.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-sage-400 hover:text-forest-700 transition-colors underline underline-offset-2"
                          >
                            Mark as emptied
                          </button>
                        </form>
                      )}
                    </div>

                {/* Accepted materials */}
                {m.accepted_materials && m.accepted_materials.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.accepted_materials.map((mat: string) => (
                      <span key={mat} className="px-2 py-0.5 rounded-full text-xs bg-sage-50 text-sage-400 capitalize">
                        {mat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {(rvms ?? []).length === 0 && (
            <p className="text-sage-400 text-sm col-span-full text-center py-6">No RVM machines registered yet.</p>
          )}
        </div>
      </div>

      {/* Drop-off history */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-3">
          <h2 className="font-display font-semibold text-base text-ink">Drop-off history</h2>
          <div className="flex items-center gap-2">
            <SearchBox placeholder="Search user or machine…" />
            <ExportCsvButton />
          </div>
        </div>

        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sage-100 text-left text-xs text-sage-400">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Machine</th>
                  <th className="px-5 py-3 font-medium">Material</th>
                  <th className="px-5 py-3 font-medium">Weight</th>
                  <th className="px-5 py-3 font-medium">Points</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {dropoffs.map((d: any) => (
                  <tr key={d.id}>
                    <td className="px-5 py-3 text-ink font-medium whitespace-nowrap">
                      {d.app_users?.name ?? 'Unknown'}
                    </td>
                    <td className="px-5 py-3 text-ink whitespace-nowrap">
                      {d.rvm_machines?.location_name ?? d.rvm_machines?.machine_code ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-ink capitalize whitespace-nowrap">
                      {d.material_type ?? 'other'}
                    </td>
                    <td className="px-5 py-3 font-mono text-ink whitespace-nowrap">
                      {Number(d.weight_kg).toFixed(1)} kg
                    </td>
                    <td className="px-5 py-3 font-mono text-ink whitespace-nowrap">+{d.points_earned ?? 0}</td>
                    <td className="px-5 py-3 text-sage-400 whitespace-nowrap">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {dropoffs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sage-400">
                      {q ? `No drop-offs match "${q}".` : 'No drop-offs recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && !q && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-sage-100 text-sm">
              <span className="text-sage-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <a href={`/dashboard/dropoffs?page=${page - 1}`} className="px-3 py-1.5 rounded-lg text-ink hover:bg-sage-100 transition-colors">
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a href={`/dashboard/dropoffs?page=${page + 1}`} className="px-3 py-1.5 rounded-lg text-ink hover:bg-sage-100 transition-colors">
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
