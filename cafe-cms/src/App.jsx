import { useState } from 'react'
import Dashboard from './components/Dashboard'
import ContentManager from './components/ContentManager'
import Devices from './components/Devices'
import Sidebar from './components/Sidebar'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 mr-64 p-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'content' && <ContentManager />}
        {activeTab === 'devices' && <Devices />}
      </main>
    </div>
  )
}

export default App
