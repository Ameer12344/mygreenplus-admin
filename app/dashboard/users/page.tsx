import { createClient } from '@/lib/supabase/server';
import SearchBox from '@/components/SearchBox';
import { ShieldCheck, Shield, ChevronLeft, ChevronRight, Banknote } from 'lucide-react';
import Link from 'next/link';
import { adjustPoints, toggleAdmin } from './actions';
import UserFilters from './UserFilters';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    page?: string;
    sort?: string;
    role?: string;
    min_pts?: string;
    max_pts?: string;
  };
}) {
  const supabase = createClient();
  const q       = searchParams.q?.trim() ?? '';
  const sort    = searchParams.sort ?? 'newest';
  const role    = searchParams.role ?? '';
  const minPts  = parseInt(searchParams.min_pts ?? '') || null;
  const maxPts  = parseInt(searchParams.max_pts ?? '') || null;
  const page    = Math.max(1, Number(searchParams.page) || 1);
  const from    = (page - 1) * PAGE_SIZE;
  const to      = from + PAGE_SIZE - 1;

  const sortMap: Record<string, { col: string; asc: boolean }> = {
    newest:      { col: 'created_at', asc: false },
    oldest:      { col: 'created_at', asc: true  },
    points_desc: { col: 'eco_points', asc: false  },
    points_asc:  { col: 'eco_points', asc: true   },
    kg_desc:     { col: 'total_kg',   asc: false  },
    name_asc:    { col: 'name',       asc: true   },
  };
  const { col, asc } = sortMap[sort] ?? sortMap.newest;

  let query = supabase
    .from('app_users')
    .select('id, name, phone, eco_points, total_kg, is_admin, created_at', { count: 'exact' })
    .order(col, { ascending: asc })
    .range(from, to);

  if (q)               query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
  if (role === 'admin') query = query.eq('is_admin', true);
  if (role === 'user')  query = query.eq('is_admin', false);
  if (minPts !== null)  query = query.gte('eco_points', minPts);
  if (maxPts !== null)  query = query.lte('eco_points', maxPts);

  const { data: users, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const activeFilters = sort !== 'newest' || role || minPts !== null || maxPts !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-ink">Users</h1>
          <p className="text-sage-400 text-sm mt-1">
            {count ?? 0} {activeFilters ? 'matching' : 'registered'} accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/withdrawals"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-forest-900/8 text-forest-900 hover:bg-forest-900/15 transition-colors whitespace-nowrap"
          >
            <Banknote className="w-4 h-4" />
            Withdrawals
          </Link>
          <SearchBox placeholder="Search name or phone…" />
        </div>
      </div>

      <UserFilters />

      <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sage-100 text-left text-xs text-sage-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Eco points</th>
                <th className="px-5 py-3 font-medium">Total recycled</th>
                <th className="px-5 py-3 font-medium">Member since</th>
                <th className="px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {(users ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-sage-50 transition-colors">
                  <td className="px-5 py-3 text-ink font-medium whitespace-nowrap">
                    {u.name || 'Unnamed user'}
                  </td>
                  <td className="px-5 py-3 text-ink whitespace-nowrap">{u.phone || '—'}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-ink">{u.eco_points ?? 0}</span>
                      <form action={adjustPoints} className="flex items-center gap-1">
                        <input type="hidden" name="userId" value={u.id} />
                        <button type="submit" name="delta" value="50"
                          className="text-xs px-1.5 py-0.5 rounded bg-forest-900/8 text-forest-900 hover:bg-forest-900/15 transition-colors"
                          title="Add 50 points">+50</button>
                        <button type="submit" name="delta" value="-50"
                          className="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Subtract 50 points">−50</button>
                      </form>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-ink whitespace-nowrap">
                    {Number(u.total_kg ?? 0).toFixed(1)} kg
                  </td>
                  <td className="px-5 py-3 text-sage-400 whitespace-nowrap">
                    {new Date(u.created_at).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <form action={toggleAdmin}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="nextValue" value={(!u.is_admin).toString()} />
                      <button type="submit"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          u.is_admin
                            ? 'bg-forest-900/8 text-forest-900 hover:bg-forest-900/15'
                            : 'bg-sage-100 text-sage-400 hover:bg-sage-200'
                        }`}>
                        {u.is_admin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                        {u.is_admin ? 'Admin' : 'User'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(users ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sage-400">
                    {q ? `No users match "${q}".` : 'No users match the selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-sage-100 text-sm">
            <span className="text-sage-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <PageLink page={page - 1} disabled={page <= 1} sp={searchParams} icon={ChevronLeft} label="Previous" />
              <PageLink page={page + 1} disabled={page >= totalPages} sp={searchParams} icon={ChevronRight} label="Next" trailing />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageLink({ page, disabled, sp, icon: Icon, label, trailing }: {
  page: number; disabled: boolean; sp: Record<string, string | undefined>;
  icon: any; label: string; trailing?: boolean;
}) {
  const params = new URLSearchParams();
  if (sp.q)       params.set('q', sp.q);
  if (sp.sort)    params.set('sort', sp.sort);
  if (sp.role)    params.set('role', sp.role);
  if (sp.min_pts) params.set('min_pts', sp.min_pts);
  if (sp.max_pts) params.set('max_pts', sp.max_pts);
  params.set('page', String(page));

  if (disabled) return (
    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sage-400/50 cursor-not-allowed">
      {!trailing && <Icon className="w-4 h-4" />}{label}{trailing && <Icon className="w-4 h-4" />}
    </span>
  );

  return (
    <a href={`/dashboard/users?${params.toString()}`}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-ink hover:bg-sage-100 transition-colors">
      {!trailing && <Icon className="w-4 h-4" />}{label}{trailing && <Icon className="w-4 h-4" />}
    </a>
  );
}
