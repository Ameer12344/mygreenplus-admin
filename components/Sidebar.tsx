'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Recycle,
  Gift,
  Flag,
  Award,
  Leaf,
  Menu,
  X,
  Wallet,
} from 'lucide-react';
import LogoutButton from './LogoutButton';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/dropoffs', label: 'Drop-offs & RVMs', icon: Recycle },
  { href: '/dashboard/rewards', label: 'Rewards & Claims', icon: Gift },
  { href: '/dashboard/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/dashboard/reports', label: 'Problem Reports', icon: Flag },
  { href: '/dashboard/certificates', label: 'Certificates', icon: Award },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
              isActive
                ? 'bg-white/10 text-white font-medium'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-acid rounded-full" />
            )}
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 bg-forest-950 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-acid flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-forest-950" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-sm tracking-tight">
            MyGreenPlus
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="flex flex-col w-72 h-full bg-forest-950 text-white shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-acid flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-forest-950" strokeWidth={2.5} />
                </div>
                <span className="font-display font-semibold text-base tracking-tight">
                  MyGreenPlus
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-white/70">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
              <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="px-3 py-4 border-t border-white/10">
              <div className="px-3 py-2 mb-1">
                <p className="text-xs text-white/40">Signed in as</p>
                <p className="text-sm text-white/85 truncate">{adminName}</p>
              </div>
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-forest-950 text-white">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="w-8 h-8 rounded-lg bg-acid flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-forest-950" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-base tracking-tight">
            MyGreenPlus
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          <NavLinks pathname={pathname} />
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-white/40">Signed in as</p>
            <p className="text-sm text-white/85 truncate">{adminName}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
