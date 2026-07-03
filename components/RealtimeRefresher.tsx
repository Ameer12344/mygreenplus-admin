'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RealtimeRefresher({ table }: { table: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // Set auth token before subscribing so RLS allows the realtime broadcast
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`${table}_admin_refresh_${Math.random().toString(36).slice(2)}`)
        .on(
          'postgres_changes' as any,
          { event: '*', schema: 'public', table },
          () => {
            router.refresh();
          }
        )
        .subscribe((status: string) => {
          console.log(`[RealtimeRefresher:${table}] status:`, status);
        });
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [table, router]);

  return null;
}
