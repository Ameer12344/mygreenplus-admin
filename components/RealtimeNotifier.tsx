'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, X, FileWarning, Recycle, Award, Wallet } from 'lucide-react';

type NotifType = 'report' | 'dropoff' | 'task_completed' | 'withdrawal';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  at: Date;
  href?: string;
}

export default function RealtimeNotifier() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [toasts, setToasts] = useState<Notif[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabaseRef.current = supabase;

    const channelName = `admin-notifs-${Math.random().toString(36).slice(2)}`;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;

      // Pass JWT so Realtime can evaluate RLS per-row before broadcasting
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      const channel = supabase.channel(channelName);

      channel.on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'problem_reports' },
        (payload: any) => {
          if (cancelled) return;
          const row = payload.new;
          push({
            type: 'report',
            title: 'New problem report',
            body: row.title ?? 'A user submitted a new report',
            href: '/dashboard/reports',
          });
        }
      );

      channel.on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'drop_off_history' },
        async (payload: any) => {
          if (cancelled) return;
          const row = payload.new;
          push({
            type: 'dropoff',
            title: 'New drop-off recorded',
            body: `${row.weight_kg ?? '?'} kg of ${row.material_type ?? 'material'} · +${row.points_earned ?? 0} pts`,
            href: '/dashboard/dropoffs',
          });

          // Check if this drop-off caused any user to complete a task
          try {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('id, title, goal_type, goal_value, material_type')
              .eq('status', 'active');

            if (!tasks || tasks.length === 0) return;

            for (const task of tasks) {
              let value = 0;
              if (task.goal_type === 'kg_recycled') {
                const { data: dropoffs } = await supabase
                  .from('drop_off_history')
                  .select('weight_kg')
                  .eq('user_id', row.user_id)
                  .eq('material_type', task.material_type ?? row.material_type);
                const prev = (dropoffs ?? []).slice(0, -1).reduce((s: number, d: any) => s + (d.weight_kg ?? 0), 0);
                const curr = (dropoffs ?? []).reduce((s: number, d: any) => s + (d.weight_kg ?? 0), 0);
                if (prev < task.goal_value && curr >= task.goal_value) {
                  // Fetch user name
                  const { data: user } = await supabase
                    .from('app_users')
                    .select('name')
                    .eq('id', row.user_id)
                    .maybeSingle();
                  if (!cancelled) push({
                    type: 'task_completed',
                    title: 'Task completed!',
                    body: `${user?.name ?? 'A user'} completed "${task.title}" — issue their certificate now`,
                    href: '/dashboard/certificates?tab=tasks',
                  });
                }
              } else if (task.goal_type === 'drop_off_count') {
                const { count } = await supabase
                  .from('drop_off_history')
                  .select('id', { count: 'exact', head: true })
                  .eq('user_id', row.user_id);
                if (count === task.goal_value) {
                  const { data: user } = await supabase
                    .from('app_users')
                    .select('name')
                    .eq('id', row.user_id)
                    .maybeSingle();
                  if (!cancelled) push({
                    type: 'task_completed',
                    title: 'Task completed!',
                    body: `${user?.name ?? 'A user'} completed "${task.title}" — issue their certificate now`,
                    href: '/dashboard/certificates?tab=tasks',
                  });
                }
              }
            }
          } catch (_) {}
        }
      );

      channel.on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'withdrawals' },
        (payload: any) => {
          if (cancelled) return;
          const row = payload.new;
          push({
            type: 'withdrawal',
            title: 'New withdrawal request',
            body: `RM ${Number(row.amount_rm ?? 0).toFixed(2)} · ${row.bank ?? ''}`,
            href: '/dashboard/withdrawals',
          });
        }
      );

      channel.subscribe((status: string) => {
        console.log('[RealtimeNotifier] status:', status);
      });

      channelRef.current = channel;
    });

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  function push({ type, title, body, href }: Omit<Notif, 'id' | 'at'>) {
    const notif: Notif = { id: crypto.randomUUID(), type, title, body, at: new Date(), href };

    setNotifs((prev) => [notif, ...prev].slice(0, 20));
    setUnread((n) => n + 1);

    // Show toast
    setToasts((prev) => [notif, ...prev].slice(0, 3));

    // Auto-dismiss toast after 6s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notif.id));
    }, 6000);
  }

  function openPanel() {
    setPanelOpen(true);
    setUnread(0);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function dismissNotif(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  function clearAll() {
    setNotifs([]);
    setToasts([]);
    setUnread(0);
    setPanelOpen(false);
  }

  const NotifIcon = ({ type }: { type: NotifType }) =>
    type === 'report'
      ? <FileWarning className="w-4 h-4 text-rose-500" />
      : type === 'task_completed'
      ? <Award className="w-4 h-4 text-amber-500" />
      : type === 'withdrawal'
      ? <Wallet className="w-4 h-4 text-amber-500" />
      : <Recycle className="w-4 h-4 text-forest-700" />;

  const timeAgo = (d: Date) => {
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  return (
    <>
      {/* Bell button
          Mobile: sits just to the left of the hamburger menu (right-14)
          Desktop: sits at top-right of the sidebar (right-[200px] is inside the 256px sidebar) */}
      <button
        onClick={openPanel}
        className="fixed top-2.5 right-14 lg:right-[200px] z-50 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setPanelOpen(false)}>
          <div
            className="absolute top-14 right-4 w-80 bg-white rounded-xl shadow-2xl border border-sage-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-sage-100">
              <span className="font-semibold text-sm text-ink">Notifications</span>
              <div className="flex items-center gap-2">
                {notifs.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-sage-400 hover:text-ink transition-colors">
                    Clear all
                  </button>
                )}
                <button onClick={() => setPanelOpen(false)} className="text-sage-400 hover:text-ink">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-sage-50">
              {notifs.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-sage-200 mx-auto mb-2" />
                  <p className="text-sm text-sage-400">No notifications yet</p>
                  <p className="text-xs text-sage-300 mt-1">New reports and drop-offs will appear here in real time</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <a
                    key={n.id}
                    href={n.href ?? '#'}
                    onClick={() => setPanelOpen(false)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-sage-50 transition-colors ${n.type === 'task_completed' ? 'bg-amber-50 hover:bg-amber-100' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${n.type === 'task_completed' ? 'bg-amber-100' : 'bg-sage-50'}`}>
                      <NotifIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink">{n.title}</p>
                      <p className="text-xs text-sage-400 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-sage-300 mt-1">{timeAgo(n.at)}</p>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); dismissNotif(n.id); }} className="text-sage-300 hover:text-sage-400 flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast popups — bottom-right, auto-dismiss */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl shadow-xl border px-4 py-3 w-72 ${n.type === 'task_completed' ? 'bg-amber-50 border-amber-200' : 'bg-white border-sage-100'}`}
            style={{ animation: 'slideInRight 0.3s ease-out' }}
          >
            <div className="w-7 h-7 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <NotifIcon type={n.type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink">{n.title}</p>
              <p className="text-xs text-sage-400 mt-0.5">{n.body}</p>
            </div>
            <button onClick={() => dismissToast(n.id)} className="text-sage-300 hover:text-sage-400 flex-shrink-0 mt-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </>
  );
}
