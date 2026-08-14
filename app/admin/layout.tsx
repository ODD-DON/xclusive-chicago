'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  Wine,
  Bus,
  PartyPopper,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PushNotificationsButton } from '@/components/push-notifications-button'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clubs', label: 'Clubs', icon: Building2 },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/guests', label: 'Guests', icon: Users },
  { href: '/admin/vip', label: 'VIP Requests', icon: Wine },
  { href: '/admin/experiences', label: 'Experiences', icon: Bus },
  { href: '/admin/bachelorette', label: 'Bachelorette', icon: PartyPopper },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 glass border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
            </div>
            <span className="font-medium text-gold-gradient">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border/30 z-50 lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 relative">
                    <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
                  </div>
                  <span className="font-medium text-gold-gradient">Admin</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      pathname === item.href
                        ? 'bg-gold/10 text-gold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {pathname === item.href && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log out</span>
                </button>
                <div className="px-4 py-3">
                  <PushNotificationsButton />
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop layout */}
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border/30 bg-card/50">
          <div className="flex items-center gap-3 p-6 border-b border-border/30">
            <div className="w-10 h-10 relative">
              <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
            </div>
            <div>
              <span className="font-medium text-gold-gradient">XCLUSIVE</span>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  pathname === item.href
                    ? 'bg-gold/10 text-gold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border/30 space-y-2">
            <Link
              href="/"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View public site
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
            <PushNotificationsButton />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
