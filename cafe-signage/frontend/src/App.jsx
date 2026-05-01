import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Content from './pages/Content'
import Devices from './pages/Devices'
import Playlists from './pages/Playlists'
import Schedule from './pages/Schedule'
import Settings from './pages/Settings'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="content" element={<Content />} />
              <Route path="devices" element={<Devices />} />
              <Route path="playlists" element={<Playlists />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
