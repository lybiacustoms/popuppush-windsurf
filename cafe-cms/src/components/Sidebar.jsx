function Sidebar({ activeTab, onTabChange }) {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة المعلومات', icon: '📊' },
    { id: 'content', label: 'إدارة المحتوى', icon: '🎬' },
    { id: 'devices', label: 'الأجهزة', icon: '📱' },
    { id: 'schedule', label: 'الجدولة', icon: '📅' },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
  ]

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg z-10">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-orange-600">☕ CafeScreen</h1>
        <p className="text-sm text-gray-500 mt-1">لوحة تحكم المقهى</p>
      </div>
      
      <nav className="p-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
              activeTab === item.id
                ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 right-0 left-0 p-4 border-t">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-orange-600 font-bold">م</span>
          </div>
          <div>
            <p className="font-medium text-gray-800">مدير المقهى</p>
            <p className="text-xs text-gray-500">متصل</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
