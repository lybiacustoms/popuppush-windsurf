/**
 * SocketContext - Manages WebSocket connection for real-time control
 */

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from './StoreContext';
import { showToast } from '../utils/toast';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  sendCommand: (deviceId: string, command: string, data?: any) => void;
  activateLayer: (deviceId: string, layerNumber: number, data?: any) => void;
  deactivateLayer: (deviceId: string, layerNumber: number) => void;
  switchToMatch: (deviceId: string, matchId: string) => void;
  setVolume: (deviceId: string, layer: number, volume: number) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = 'ws://your-server.com:3001'; // Replace with your server

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const { currentDevice, setDeviceStatus, setLayerState } = useStore();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      showToast('متصل بالخادم', 'success');
      
      // Register as remote app
      socket.emit('remote:register', {
        cafeId: 'demo-cafe',
        userId: 'demo-user',
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      showToast('انقطع الاتصال', 'error');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      showToast('خطأ في الاتصال', 'error');
    });

    // Listen for device status updates
    socket.on('device:status_update', (data) => {
      setDeviceStatus(data.deviceId, data.status);
    });

    // Listen for layer updates
    socket.on('layer:update', (data) => {
      setLayerState(data.deviceId, data.layerNumber, data.state);
    });

    // Command acknowledgment
    socket.on('command:acknowledged', (data) => {
      showToast('تم تنفيذ الأمر', 'success');
    });

    // Match events
    socket.on('match:start', (data) => {
      showToast(`بدأت المباراة: ${data.matchName}`, 'info');
    });

    socket.on('match:end', (data) => {
      showToast('انتهت المباراة', 'info');
    });

    return () => {
      socket.disconnect();
    };
  }, [setDeviceStatus, setLayerState]);

  const sendCommand = useCallback((deviceId: string, command: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(`command:${command}`, { deviceId, ...data });
    } else {
      showToast('غير متصل بالخادم', 'error');
    }
  }, []);

  const activateLayer = useCallback((deviceId: string, layerNumber: number, data?: any) => {
    sendCommand(deviceId, 'layer', { layerNumber, active: true, ...data });
  }, [sendCommand]);

  const deactivateLayer = useCallback((deviceId: string, layerNumber: number) => {
    sendCommand(deviceId, 'layer', { layerNumber, active: false });
  }, [sendCommand]);

  const switchToMatch = useCallback((deviceId: string, matchId: string) => {
    sendCommand(deviceId, 'switchToMatch', { matchId });
    showToast('جاري التبديل للمباراة...', 'info');
  }, [sendCommand]);

  const setVolume = useCallback((deviceId: string, layer: number, volume: number) => {
    sendCommand(deviceId, 'volume', { layer, volume });
  }, [sendCommand]);

  const value: SocketContextType = {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    sendCommand,
    activateLayer,
    deactivateLayer,
    switchToMatch,
    setVolume,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
