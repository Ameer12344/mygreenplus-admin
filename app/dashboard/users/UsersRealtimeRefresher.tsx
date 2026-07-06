'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Invisible client component — listens for new app_users rows
 * and refreshes the page data automatically when a new user signs up.
 */
export default function UsersRealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const channelName = `users-page-refresh-${Math.random().toString(36).slice(2)}`;

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

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null; // invisible — no UI
}
