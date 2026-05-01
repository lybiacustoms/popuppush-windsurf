import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  Monitor,
  Film,
  Music,
  Activity,
  MoreVertical
} from 'lucide-react'

// Mock data
const mockStats = {
  devices: { total: 3, online: 2, offline: 1 },
  content: { total: 24, video: 16, audio: 8 },
  playlists: 5,
  activeSchedules: 3
}

const mockDevices = [
  { id: '1', name: 'الشاشة الرئيسية', location: 'داخل المقهى', status: 'online', currentMedia: 'قائمة المشروبات', volume: 75, isPlaying: true },
  { id: '2', name: 'الشاشة الخارجية', location: 'الواجهة', status: 'online', currentMedia: 'إعلان العروض', volume: 80, isPlaying: true },
  { id: '3', name: 'شاشة العداد', location: 'منطقة الطلب', status: 'offline', currentMedia: '-', volume: 0, isPlaying: false },
]

const mockRecentActivity = [
  { time: 'منذ 5 دقائق', event: 'تم تشغيل قائمة الصباح', device: 'الشاشة الرئيسية' },
  { time: 'منذ 15 دقيقة', event: 'تم رفع فيديو جديد', device: 'النظام' },
  { time: 'منذ 30 دقيقة', event: 'الشاشة الخارجية متصلة', device: 'النظام' },
  { time: 'منذ ساعة', event: 'تم تحديث الجدولة', device: 'النظام' },
]

function Dashboard() {
  const { user } = useAuth()
  const { play, pause, next, setVolume } = useSocket()
  const [devices, setDevices] = useState(mockDevices)
  const [stats, setStats] = useState(mockStats)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(d => ({
        ...d,
        status: d.id === '3' ? 'offline' : Math.random() > 0.1 ? 'online' : 'offline'
      })))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleDeviceCommand = (deviceId, command) => {
    switch (command) {
      case 'play':
        play(deviceId)
        break
      case 'pause':
        pause(deviceId)
        break
      case 'next':
        next(deviceId)
        break
      default:
        break
    }
    
    // Update local state
    setDevices(prev => prev.map(d => 
      d.id === deviceId 
        ? { ...d, isPlaying: command === 'play' }
        : d
    ))
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">لوحة المعلومات</h1>
          <p className="text-slate-500 mt-1">نظرة عامة على {user?.cafe?.name || 'مقهاك'}</p>
        </div>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2">
          <Activity size={18} />
          تحديث البيانات
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="الأجهزة" 
          value={stats.devices.total}
          subtitle={`${stats.devices.online} متصل • ${stats.devices.offline} غير متصل`}
          icon={Monitor}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="المحتوى" 
          value={stats.content.total}
          subtitle={`${stats.content.video} فيديو • ${stats.content.audio} صوت`}
          icon={Film}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard 
          title="قوائم التشغيل" 
          value={stats.playlists}
          subtitle="قائمة نشطة"
          icon={Music}
          color="bg-green-50 text-green-600"
        />
        <StatCard 
          title="الجدولة" 
          value={stats.activeSchedules}
          subtitle="جدولة اليوم"
          icon={Activity}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Devices Control */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">الأجهزة النشطة</h3>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                إدارة الأجهزة
              </button>
            </div>

            <div className="space-y-4">
              {devices.map(device => (
                <div 
                  key={device.id} 
                  className={`p-4 rounded-xl border-2 transition-all ${
                    device.status === 'online' 
                      ? 'border-green-200 bg-green-50/30' 
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        device.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                      }`} />
                      <div>
                        <h4 className="font-medium text-slate-800">{device.name}</h4>
                        <p className="text-sm text-slate-500">{device.location}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {device.status === 'online' ? `يعرض الآن: ${device.currentMedia}` : 'غير متصل'}
                        </p>
                      </div>
                    </div>
                    
                    {device.status === 'online' && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDeviceCommand(device.id, device.isPlaying ? 'pause' : 'play')}
                          className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                        >
                          {device.isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDeviceCommand(device.id, 'next')}
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <SkipForward size={18} />
                        </button>
                        <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                          <Volume2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Schedule */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="font-bold text-lg mb-4">الجدولة الحالية</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-primary-100">قائمة الصباح</span>
                <span className="text-sm">6:00 - 12:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary-100">قائمة الظهيرة</span>
                <span className="text-sm">12:00 - 17:00</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>قائمة المساء</span>
                <span className="text-sm">17:00 - 23:00</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm">
              تعديل الجدولة
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">النشاط الأخير</h3>
            <div className="space-y-4">
              {mockRecentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{activity.event}</p>
                    <p className="text-xs text-slate-500">{activity.device} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-slate-600 font-medium">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
  )
}

export default Dashboard
