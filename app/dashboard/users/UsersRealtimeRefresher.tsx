'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Invisible client component — listens for new app_users rows
 * and refreshes the page data automatically when a new user signs up.
 */
export default function UsersRealtimeRefresher() {
  const router = useRouter();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const channelName = `users-page-refresh-${Math.random().toString(36).slice(2)}`;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;

      // Pass JWT so Realtime can evaluate RLS per-row before broadcasting.
      // Without this, INSERT/UPDATE events can be silently withheld and
      // the page only looks "live" after a manual filter-triggered refetch.
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      const channel = supabase.channel(channelName);

      channel.on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'app_users' },
        () => {
          if (cancelled) return;
          // Refresh the server component data without a full page reload
          router.refresh();
        }
      );

      channel.on(
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'app_users' },
        () => {
          if (cancelled) return;
          router.refresh();
        }
      );

      channel.subscribe();

      channelRef.current = channel;
    });

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [router]);

  return null; // invisible — no UI
}
