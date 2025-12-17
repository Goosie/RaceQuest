import { NavLink } from 'react-router-dom'
import { Home, Map, Users, User, Plus } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/route-maker', icon: Plus, label: 'Create', special: true },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/profile', icon: User, label: 'Profile' }
]

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ to, icon: Icon, label, special }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center p-2 rounded-lg transition-colors',
                special
                  ? 'bg-grounded-500 text-white shadow-lg'
                  : isActive
                  ? 'text-grounded-600'
                  : 'text-gray-500 hover:text-grounded-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon 
                  className={clsx(
                    'w-6 h-6 mb-1',
                    special && 'text-white',
                    !special && isActive && 'text-grounded-600'
                  )} 
                />
                <span 
                  className={clsx(
                    'text-xs font-medium',
                    special && 'text-white',
                    !special && isActive && 'text-grounded-600'
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}