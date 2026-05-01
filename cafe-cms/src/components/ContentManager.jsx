import { useState } from 'react'

function ContentManager() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const mediaItems = [
    { id: 1, title: 'إعلان المشروبات الصيفية', type: 'video', duration: '00:30', category: 'ads', status: 'active' },
    { id: 2, title: 'موسيقى هادئة - الجاز', type: 'audio', duration: '05:45', category: 'music', status: 'active' },
    { id: 3, title: 'قائمة الطعام - عرض 1', type: 'video', duration: '00:15', category: 'menu', status: 'scheduled' },
    { id: 4, title: 'موسيقى كلاسيكية', type: 'audio', duration: '12:00', category: 'music', status: 'active' },
    { id: 5, title: 'إعلان الحلويات', type: 'video', duration: '00:20', category: 'ads', status: 'draft' },
    { id: 6, title: 'عرض الإفطار', type: 'video', duration: '00:25', category: 'menu', status: 'active' },
  ]

  const categories = [
    { id: 'all', label: 'الكل', count: 24 },
    { id: 'video', label: 'فيديو', count: 12 },
    { id: 'audio', label: 'صوت', count: 8 },
    { id: 'ads', label: 'إعلانات', count: 6 },
    { id: 'menu', label: 'قوائم', count: 4 },
    { id: 'music', label: 'موسيقى', count: 4 },
  ]

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      scheduled: 'bg-blue-100 text-blue-700',
      draft: 'bg-gray-100 text-gray-700',
    }
    const labels = {
      active: 'نشط',
      scheduled: 'مجدول',
      draft: 'مسودة',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getTypeIcon = (type) => {
    return type === 'video' ? '🎬' : '🎵'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة المحتوى</h2>
          <p className="text-gray-500 mt-1">إدارة الفيديوهات والموسيقى</p>
        </div>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
          <span>+</span>
          رفع ملف جديد
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat.label}
            <span className={`mr-2 text-xs ${selectedCategory === cat.id ? 'text-orange-200' : 'text-gray-400'}`}>
              ({cat.count})
            </span>
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
              <span className="text-4xl">{getTypeIcon(item.type)}</span>
              <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                {item.duration}
              </span>
              {item.type === 'video' && (
                <button className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <span className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">▶</span>
                </button>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-800 line-clamp-1">{item.title}</h3>
                <button className="text-gray-400 hover:text-gray-600">⋮</button>
              </div>
              <div className="flex items-center justify-between mt-3">
                {getStatusBadge(item.status)}
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    تعديل
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Area - Hidden by default, shown when needed */}
      <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">📤</div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">اسحب الملفات هنا</h3>
        <p className="text-gray-500 mb-4">أو اضغط لاختيار الملفات من جهازك</p>
        <p className="text-sm text-gray-400">يدعم: MP4, MP3, MOV, WAV (حد أقصى 500MB)</p>
      </div>
    </div>
  )
}

export default ContentManager
