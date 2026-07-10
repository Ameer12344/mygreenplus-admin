'use client';

import { useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from './NotificationsProvider';

/**
 * Just the bell icon + unread badge. Safe to render in multiple places at
 * once (e.g. mobile top bar AND desktop sidebar, hidden/shown by CSS
 * breakpoints) — it holds no state of its own and reads everything from
 * <NotificationsProvider>, so every instance always agrees on the count.
 */
export default function NotificationBell() {
  const { unread, openPanel } = useNotifications();
  const bellRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={bellRef}
      onClick={() => openPanel(bellRef.current)}
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
  );
}
