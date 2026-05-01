/**
 * StoreContext - Global state management using Zustand
 */

import React, { createContext, useContext } from 'react';
import { create } from 'zustand';

// Types
interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'playing';
  currentLayers: {
    layer1: { active: boolean; contentId?: string; volume: number };
    layer2: { active: boolean; inputSource?: string };
    layer3: { active: boolean; contentId?: string };
    layer4: { active: boolean; text: string };
  };
}

interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'youtube' | 'image';
  thumbnailUrl: string;
  duration?: number;
}

interface Match {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  matchTime: string;
  status: 'upcoming' | 'live' | 'finished';
}

interface StoreState {
  // Devices
  devices: Device[];
  currentDevice: Device | null;
  setCurrentDevice: (device: Device) => void;
  setDeviceStatus: (deviceId: string, status: any) => void;
  setLayerState: (deviceId: string, layerNumber: number, state: any) => void;
  
  // Content
  content: ContentItem[];
  playlists: any[];
  setContent: (content: ContentItem[]) => void;
  
  // Matches
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  
  // UI State
  selectedLayer: number | null;
  setSelectedLayer: (layer: number | null) => void;
  isMatchMode: boolean;
  setIsMatchMode: (value: boolean) => void;
}

const useStore = create<StoreState>((set) => ({
  // Devices
  devices: [
    {
      id: 'device-1',
      name: 'الشاشة الرئيسية',
      status: 'online',
      currentLayers: {
        layer1: { active: true, contentId: 'content-1', volume: 0.7 },
        layer2: { active: false },
        layer3: { active: false },
        layer4: { active: true, text: 'مرحباً بكم في مقهى الريم ☕' },
      },
    },
  ],
  currentDevice: null,
  setCurrentDevice: (device) => set({ currentDevice: device }),
  setDeviceStatus: (deviceId, status) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId ? { ...d, status } : d
      ),
    })),
  setLayerState: (deviceId, layerNumber, layerState) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              currentLayers: {
                ...d.currentLayers,
                [`layer${layerNumber}`]: layerState,
              },
            }
          : d
      ),
    })),

  // Content
  content: [
    {
      id: 'content-1',
      title: 'قائمة المشروبات',
      type: 'video',
      thumbnailUrl: 'https://via.placeholder.com/150',
      duration: 30,
    },
    {
      id: 'content-2',
      title: 'موسيقى هادئة',
      type: 'audio',
      thumbnailUrl: 'https://via.placeholder.com/150',
    },
    {
      id: 'content-3',
      title: 'إعلان العروض',
      type: 'video',
      thumbnailUrl: 'https://via.placeholder.com/150',
      duration: 15,
    },
  ],
  playlists: [],
  setContent: (content) => set({ content }),

  // Matches
  matches: [],
  setMatches: (matches) => set({ matches }),

  // UI State
  selectedLayer: null,
  setSelectedLayer: (layer) => set({ selectedLayer: layer }),
  isMatchMode: false,
  setIsMatchMode: (value) => set({ isMatchMode: value }),
}));

const StoreContext = createContext<ReturnType<typeof useStore> | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreContext() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within StoreProvider');
  }
  return context;
}

// Re-export for convenience
export { useStore };
