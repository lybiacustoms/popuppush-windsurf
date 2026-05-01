import { useState } from 'react'

function Devices() {
  const [showRemote, setShowRemote] = useState(null)

  const devices = [
    {
      id: 1,
      name: 'الشاشة الرئيسية',
      location: 'داخل المقهى - الجدار الرئيسي',
      status: 'online',
      type: 'android-tv',
      lastSeen: 'الآن',
      battery: null,
      volume: 75,
      playlist: 'قائمة الصباح',
    },
    {
      id: 2,
      name: 'الشاشة الخارجية',
      location: 'الواجهة الخارجية',
      status: 'online',
      type: 'android-box',
      lastSeen: 'الآن',
      battery: null,
      volume: 85,
      playlist: 'إعلانات خارجية',
    },
    {
      id: 3,
      name: 'شاشة العداد',
      location: 'منطقة الطلبات',
      status: 'offline',
      type: 'tablet',
      lastSeen: 'منذ 2 ساعة',
      battery: 23,
      volume: 60,
      playlist: '-',
    },
  ]

  const getStatusBadge = (status) => {
    const styles = {
      online: 'bg-green-100 text-green-700 border-green-200',
      offline: 'bg-red-100 text-red-700 border-red-200',
      idle: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    }
    const labels = {
      online: 'متصل',
      offline: 'غير متصل',
      idle: 'خامل',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getTypeIcon = (type) => {
    const icons = {
      'android-tv': '📺',
      'android-box': '🔲',
      'tablet': '📱',
    }
    return icons[type] || '📱'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">الأجهزة</h2>
          <p className="text-gray-500 mt-1">إدارة مشغلات المقهى</p>
        </div>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          + إضافة جهاز
        </button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div key={device.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                  {getTypeIcon(device.type)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{device.name}</h3>
                  <p className="text-sm text-gray-500">{device.location}</p>
                </div>
              </div>
              {getStatusBadge(device.status)}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">آخر ظهور:</span>
                <span className="text-gray-700">{device.lastSeen}</span>
              </div>
              {device.battery && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">البطارية:</span>
                  <span className={`font-medium ${device.battery < 20 ? 'text-red-500' : 'text-gray-700'}`}>
                    {device.battery}%
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">قائمة التشغيل:</span>
                <span className="text-gray-700">{device.playlist}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRemote(showRemote === device.id ? null : device.id)}
                className="flex-1 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium"
              >
                🎮 ريموت
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                ⚙️
              </button>
            </div>

            {/* Remote Control Panel */}
            {showRemote === device.id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">التحكم عن بعد</span>
                  <button 
                    onClick={() => setShowRemote(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 hover:text-orange-600">
                    ⏮
                  </button>
                  <button className="w-14 h-14 bg-orange-600 rounded-full shadow-md flex items-center justify-center text-white text-xl hover:bg-orange-700">
                    ⏸
                  </button>
                  <button className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 hover:text-orange-600">
                    ⏭
                  </button>
                </div>

                {/* Volume Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">الصوت</span>
                    <span className="text-gray-700">{device.volume}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-gray-600">🔉</button>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue={device.volume}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <button className="text-gray-400 hover:text-gray-600">🔊</button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button className="px-3 py-2 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                    إعادة تشغيل
                  </button>
                  <button className="px-3 py-2 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                    تغيير القائمة
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">حالة الاتصال</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-gray-600">2 متصل</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">1 غير متصل</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-sm text-gray-600">1 غير مفعل</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Devices
