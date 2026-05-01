import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Play, 
  Monitor, 
  ListMusic, 
  CalendarClock, 
  Settings, 
  LogOut,
  Coffee
} from 'lucide-react'

const menuItems = [
  { path: '/dashboard', label: 'لوحة المعلومات', icon: LayoutDashboard },
  { path: '/content', label: 'المحتوى', icon: Play },
  { path: '/devices', label: 'الأجهزة', icon: Monitor },
  { path: '/playlists', label: 'قوائم التشغيل', icon: ListMusic },
  { path: '/schedule', label: 'الجدولة', icon: CalendarClock },
  { path: '/settings', label: 'الإعدادات', icon: Settings },
]

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return <Outlet />
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 h-full w-72 bg-white shadow-xl z-50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white">
              <Coffee size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">CafeScreen</h1>
              <p className="text-xs text-slate-500">نظام إدارة المقاهي</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {window.location.pathname === item.path && (
                    <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-bold text-sm">
                {user.name?.charAt(0) || 'م'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 text-sm truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.cafe?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mr-72">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
