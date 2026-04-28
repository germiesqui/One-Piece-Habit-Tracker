import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
 
const NAV_ITEMS = [
  { to: '/dashboard', icon: '🗺️', label: 'Voyage' },
  { to: '/tasks',     icon: '📜', label: 'Tasks'  },
  { to: '/party',     icon: '⚓', label: 'Crew'   },
  { to: '/profile',   icon: '🏴‍☠️', label: 'Log'  },
]
 
interface AppShellProps {
  children: React.ReactNode
}
 
export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
 
  return (
    <div className="flex flex-col min-h-dvh max-w-2xl mx-auto">
      {/* Top header */}
      <header className="sticky top-0 z-10 bg-parchment-100 border-b border-parchment-300 shadow-parchment px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-sm text-ink-900 leading-none">
            Grand Line
            <span className="block text-xs font-heading font-normal text-ink-500 tracking-widest uppercase">
              Chronicles
            </span>
          </h1>
          {/* Arc indicator */}
          <ArcIndicator />
        </div>
      </header>
 
      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
 
      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-10
                      bg-parchment-50 border-t border-parchment-300 shadow-parchment-lg
                      safe-area-pb">
        <div className="flex items-stretch justify-around px-2 py-1">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={clsx(
                  'nav-item flex-1 text-center',
                  isActive && 'active'
                )}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className={clsx(
                  'font-heading text-[10px] uppercase tracking-widest',
                  isActive ? 'text-sea-700' : 'text-ink-400'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-6 h-0.5 bg-sea-500 rounded-t-full" />
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
 
// Small arc name in header
function ArcIndicator() {
  // Will be wired to store in real usage
  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <div className="font-heading text-[10px] uppercase tracking-widest text-ink-400">Current Arc</div>
        <div className="font-heading text-xs text-sea-700 font-semibold">Romance Dawn</div>
      </div>
      <div className="w-8 h-8 rounded-full bg-sea-100 border border-sea-300 flex items-center justify-center text-sm">
        🗺️
      </div>
    </div>
  )
}