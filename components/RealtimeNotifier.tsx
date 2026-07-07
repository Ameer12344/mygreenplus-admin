'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { Bell, X, FileWarning, Recycle, UserPlus, Gift, Banknote } from 'lucide-react';

type NotifType = 'report' | 'dropoff' | 'newuser' | 'claim' | 'withdrawal';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  at: Date;
}

export default function RealtimeNotifier() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [toasts, setToasts] = useState<Notif[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<any>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Portals need the DOM, which isn't available during SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Recompute the panel's fixed viewport position so it's never clipped
  // by a parent sidebar's overflow, and stays anchored on resize/scroll.
  useLayoutEffect(() => {
    if (!panelOpen) return;

    const PANEL_WIDTH = 320; // matches w-80
    const MARGIN = 8;

    function updatePosition() {
      const btn = bellRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();

      let left = rect.right - PANEL_WIDTH;
      left = Math.min(Math.max(left, MARGIN), window.innerWidth - PANEL_WIDTH - MARGIN);

      const top = rect.bottom + 8;

      setPanelPos({ top, left });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [panelOpen]);

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
          });
        }
      );

      channel.on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'drop_off_history' },
        (payload: any) => {
          if (cancelled) return;
          const row = payload.new;
          push({
            type: 'dropoff',
            title: 'New drop-off recorded',
            body: `${row.weight_kg ?? '?'} kg of ${row.material_type ?? 'material'} · +${row.points_earned ?? 0} pts`,
          });
        }
      );

      channel.on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'app_users' },
        (payload: any) => {
          if (cancelled) return;
          const row = payload.new;
          push({
            type: 'newuser',
            title: 'New user signed up',
            body: row.name ?? row.email ?? 'A new user just registered',
          });
        }
      );

      channel.on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'reward_claims' },
        (payload: any) => {
          if (cancelled) return;
          const row = payload.new;
          push({
            type: 'claim',
            title: 'Reward claimed',
            body: `${row.points_spent ?? '?'} pts spent · voucher ${row.voucher_code ?? ''}`,
          });
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
            body: `RM ${Number(row.amount_rm ?? 0).toFixed(2)} · ${row.bank ?? 'Bank'} — awaiting approval`,
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

  function push({ type, title, body }: Omit<Notif, 'id' | 'at'>) {
    const notif: Notif = { id: crypto.randomUUID(), type, title, body, at: new Date() };

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

  const NotifIcon = ({ type }: { type: NotifType }) => {
    if (type === 'report') return <FileWarning className="w-4 h-4 text-rose-500" />;
    if (type === 'newuser') return <UserPlus className="w-4 h-4 text-blue-500" />;
    if (type === 'claim') return <Gift className="w-4 h-4 text-plum-500" />;
    if (type === 'withdrawal') return <Banknote className="w-4 h-4 text-amber-600" />;
    return <Recycle className="w-4 h-4 text-forest-700" />;
  };

  const timeAgo = (d: Date) => {
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  return (
    <>
      {/* Bell button — inline, sits wherever the Sidebar renders it */}
      <div className="relative">
        <button
          ref={bellRef}
          onClick={openPanel}
          className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>

      {/*
        Notification panel — rendered through a portal straight into document.body.
        This is deliberate: the bell often lives inside a sidebar that has its own
        overflow/scroll container, which would silently clip an absolutely-positioned
        panel even if the CSS math were correct. Portaling out, and positioning with
        `fixed` + coordinates measured from the bell's real screen position, guarantees
        the panel always renders directly below the bell with nothing able to clip it.
      */}
      {mounted &&
        panelOpen &&
        panelPos &&
        createPortal(
          <>
            {/* invisible backdrop just to catch outside clicks and close the panel */}
            <div className="fixed inset-0 z-[60]" onClick={() => setPanelOpen(false)} />

            <div
              ref={panelRef}
              style={{ top: panelPos.top, left: panelPos.left }}
              className="fixed w-80 bg-white rounded-xl shadow-2xl border border-sage-100 overflow-hidden z-[61]"
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
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-sage-50 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <NotifIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink">{n.title}</p>
                        <p className="text-xs text-sage-400 mt-0.5 truncate">{n.body}</p>
                        <p className="text-[10px] text-sage-300 mt-1">{timeAgo(n.at)}</p>
                      </div>
                      <button onClick={() => dismissNotif(n.id)} className="text-sage-300 hover:text-sage-400 flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>,
          document.body
        )}

      {/* Toast popups — bottom-right, auto-dismiss */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((n) => (
          <div
            key={n.id}
            className="pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-xl border border-sage-100 px-4 py-3 w-72"
            style={{ transition: 'all 0.3s ease-out' }}
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

    </>
  );
}
