'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CandlestickChart,
  Upload,
  Settings,
  FileUp,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/donors', label: 'Donors', icon: Heart },
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/yahrzeits', label: 'Yahrzeits', icon: CandlestickChart },
  { href: '/import', label: 'Nedarim Import', icon: Upload },
  { href: '/bulk-upload', label: 'Bulk Upload', icon: FileUp },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">ShulFlow</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
