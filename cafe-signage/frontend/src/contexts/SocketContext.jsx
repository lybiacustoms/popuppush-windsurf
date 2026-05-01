import { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Commands to devices
  const sendCommand = useCallback((deviceId, command, data = {}) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(`command:${command}`, { deviceId, ...data })
    }
  }, [])

  const play = useCallback((deviceId) => sendCommand(deviceId, 'play'), [sendCommand])
  const pause = useCallback((deviceId) => sendCommand(deviceId, 'pause'), [sendCommand])
  const next = useCallback((deviceId) => sendCommand(deviceId, 'next'), [sendCommand])
  const setVolume = useCallback((deviceId, volume) => {
    sendCommand(deviceId, 'volume', { volume })
  }, [sendCommand])
  const setPlaylist = useCallback((deviceId, playlistId) => {
    sendCommand(deviceId, 'playlist', { playlistId })
  }, [sendCommand])

  // Listen for device status updates
  const subscribeToDevice = useCallback((deviceId, callback) => {
    if (!socketRef.current) return () => {}
    
    socketRef.current.on(`device:${deviceId}:status`, callback)
    
    return () => {
      socketRef.current?.off(`device:${deviceId}:status`, callback)
    }
  }, [])

  const value = {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    play,
    pause,
    next,
    setVolume,
    setPlaylist,
    sendCommand,
    subscribeToDevice
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}
