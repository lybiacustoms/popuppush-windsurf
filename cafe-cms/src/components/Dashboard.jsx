import { useState, useEffect } from 'react'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Dashboard() {
  const [devices, setDevices] = useState([])
  const [stats, setStats] = useState({
    totalVideos: 0,
    activeDevices: 0,
    totalViews: 0,
    uptime: '0 ساعة'
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch devices
        const devicesRes = await fetch(`${API_BASE_URL}/devices`)
        const devicesData = await devicesRes.json()
        
        // Fetch stats
        const statsRes = await fetch(`${API_BASE_URL}/cafes/demo-cafe/stats`)
        const statsData = await statsRes.json()
        
        // Fetch activity logs
        const logsRes = await fetch(`${API_BASE_URL}/remote-logs?limit=10`)
        const logsData = await logsRes.json()
        
        setDevices(devicesData.data || [])
        setStats(statsData.data || stats)
        setRecentActivity(logsData.data || [])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('لم يتم الاتصال بالخادم. تأكد من تشغيل Backend على port 3001')
        setLoading(false)
        
        // Use demo data if API fails
        setDevices([
          { id: '1', name: 'الشاشة الرئيسية', status: 'online', location: 'الصالة' },
          { id: '2', name: 'شاشة VIP', status: 'online', location: 'قسم العائلات' },
        ])
      }
    }

    fetchDashboardData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Demo data fallback
  const demoStats = [
    { label: 'إجمالي الفيديوهات', value: stats.totalVideos || '4', icon: '🎬', color: 'bg-blue-50 text-blue-600' },
    { label: 'الأجهزة النشطة', value: devices.filter(d => d.status === 'online').length || '2', icon: '📱', color: 'bg-green-50 text-green-600' },
    { label: 'إعلانات اليوم', value: '48', icon: '�', color: 'bg-purple-50 text-purple-600' },
    { label: 'وقت التشغيل', value: stats.uptime || '24 ساعة', icon: '⏱️', color: 'bg-orange-50 text-orange-600' },
  ]

  const demoActivity = [
    { time: '10:30 ص', event: 'تم تشغيل وضع المباراة', device: 'الشاشة الرئيسية' },
    { time: '09:15 ص', event: 'تم تفعيل إعلان Pop-up', device: 'النظام' },
    { time: '08:00 ص', event: 'تم تشغيل قائمة الصباح', device: 'الشاشة الرئيسية' },
    { time: '07:45 ص', event: 'تم الاتصال بالخادم', device: 'شاشة VIP' },
    { time: '05:30 ص', event: 'تم تشغيل الأذان', device: 'النظام' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">لوحة المعلومات</h2>
          <p className="text-gray-500 mt-1">نظرة عامة على أداء المقهى</p>
        </div>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          تحديث البيانات
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-red-500">⚠️</span>
          <p className="text-red-700">{error}</p>
          <p className="text-sm text-red-600 mr-auto">تعمل ببيانات تجريبية</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {demoStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Playing */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">الشاشات النشطة</h3>
          <div className="space-y-4">
            {(devices.length > 0 ? devices : [
              { name: 'الشاشة الرئيسية', status: 'online', location: 'الصالة', currentLayer: 'قائمة المشروبات' },
              { name: 'شاشة VIP', status: 'online', location: 'قسم العائلات', currentLayer: 'موسيقى هادئة' },
            ]).map((screen, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${screen.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{screen.name}</p>
                    <p className="text-sm text-gray-500">{screen.location || screen.currentLayer}</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm bg-white border rounded-lg hover:bg-gray-50 hover:border-orange-500 transition-colors">
                  تحكم
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">النشاط الأخير</h3>
          <div className="space-y-4">
            {(recentActivity.length > 0 ? recentActivity : demoActivity).map((activity, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{activity.event}</p>
                  <p className="text-sm text-gray-500">{activity.device}</p>
                </div>
                <span className="text-sm text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
        <h3 className="text-lg font-bold mb-4">التحكم السريع</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            ⚽ وضع المباراة
          </button>
          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            🕌 تشغيل الأذان
          </button>
          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            🎵 تغيير الموسيقى
          </button>
          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            📢 إعلان Pop-up
          </button>
          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            ⏸️ إيقاف الكل
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
