'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateWithdrawalStatus } from './actions';

type Withdrawal = {
  id: string;
  reference_id: string;
  amount_rm: number;
  points_spent: number;
  bank: string;
  account_number: string;
  account_holder: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  app_users: { name: string; phone: string } | null;
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
};

export default function WithdrawalList({ initial }: { initial: Withdrawal[] }) {
  const [items, setItems] = useState<Withdrawal[]>(initial);
  const channelRef = useRef<any>(null);

  // useState(initial) only seeds state on first mount. On soft navigation
  // (e.g. clicking a sidebar Link back to this page), the server component
  // re-renders with a fresh `initial` prop, but without this effect, `items`
  // would keep showing whatever was there the very first time this
  // component mounted. This keeps local state in sync with the server data.
  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = createClient();

    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    const channel = supabase.channel('admin-withdrawals-live');

    channel.on(
      'postgres_changes' as any,
      { event: 'INSERT', schema: 'public', table: 'withdrawals' },
      async (payload: any) => {
        const { data } = await supabase
          .from('withdrawals')
          .select('*, app_users(name, phone)')
          .eq('id', payload.new.id)
          .single();
        if (data) setItems((prev) => [data as Withdrawal, ...prev]);
      }
    );

    channel.on(
      'postgres_changes' as any,
      { event: 'UPDATE', schema: 'public', table: 'withdrawals' },
      (payload: any) => {
        setItems((prev) =>
          prev.map((w) => (w.id === payload.new.id ? { ...w, ...payload.new } : w))
        );
      }
    );

    channel.subscribe((status: string) => {
      console.log('Withdrawal channel status:', status);
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, []);

  async function handleAction(id: string, status: string) {
    setItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status } : w))
    );
    const fd = new FormData();
    fd.set('id', id);
    fd.set('status', status);
    await updateWithdrawalStatus(fd);
  }

  return (
    <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sage-100 text-left text-xs text-sage-400">
              <th className="px-5 py-3 font-medium">Reference</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Bank</th>
              <th className="px-5 py-3 font-medium">Account</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Points</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Submitted</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-100">
            {items.map((w) => (
              <tr key={w.id} className="hover:bg-sage-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-ink whitespace-nowrap">
                  {w.reference_id}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <p className="font-medium text-ink">{w.app_users?.name ?? '—'}</p>
                  <p className="text-xs text-sage-400">{w.app_users?.phone ?? ''}</p>
                </td>
                <td className="px-5 py-3 text-ink whitespace-nowrap">{w.bank}</td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <p className="text-ink font-mono text-xs">{w.account_number}</p>
                  <p className="text-xs text-sage-400">{w.account_holder}</p>
                </td>
                <td className="px-5 py-3 font-semibold text-ink whitespace-nowrap">
                  RM {Number(w.amount_rm).toFixed(2)}
                </td>
                <td className="px-5 py-3 text-ink whitespace-nowrap">
                  {w.points_spent} pts
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[w.status] ?? 'bg-sage-50 text-sage-400'}`}>
                    {w.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-sage-400 whitespace-nowrap text-xs">
                  {new Date(w.created_at).toISOString().slice(0, 10)}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  {w.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(w.id, 'approved')}
                        className="px-3 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-700 text-white text-xs font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(w.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors border border-red-200"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-sage-400">
                      {w.reviewed_at ? new Date(w.reviewed_at).toISOString().slice(0, 10) : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-sage-400">
                  No withdrawal requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
