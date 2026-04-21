'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, BookOpen } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CandlestickChart,
  Upload,
  Settings,
  FileUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/yahrzeits', label: 'Yahrzeits', icon: CandlestickChart },
  { href: '/import', label: 'Nedarim Import', icon: Upload },
  { href: '/bulk-upload', label: 'Bulk Upload', icon: FileUp },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex md:hidden items-center h-14 border-b px-4 gap-3">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="flex items-center gap-2 h-16 border-b px-6">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold">ShulFlow</span>
          </SheetTitle>
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <BookOpen className="h-5 w-5 text-primary" />
      <span className="font-bold">ShulFlow</span>
    </div>
  );
}
