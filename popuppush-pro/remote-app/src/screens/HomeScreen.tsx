/**
 * HomeScreen - Main control dashboard
 * Quick access to all features with icon-based UI
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useStore } from '../contexts/StoreContext';
import { useSocket } from '../contexts/SocketContext';
import { COLORS } from '../../App';
import { showToast } from '../utils/toast';

export default function HomeScreen() {
  const { currentDevice, devices, isMatchMode, setIsMatchMode } = useStore();
  const { switchToMatch, activateLayer, sendCommand } = useSocket();

  const device = currentDevice || devices[0];

  const handleMatchMode = () => {
    if (!device) {
      showToast('لا يوجد جهاز متصل', 'error');
      return;
    }
    
    setIsMatchMode(!isMatchMode);
    
    if (!isMatchMode) {
      // Activate Match Mode
      switchToMatch(device.id, 'current-match');
      showToast('تم تفعيل وضع المباراة', 'success');
    } else {
      // Deactivate Match Mode
      activateLayer(device.id, 1, { playlistId: 'default' });
      showToast('تم إيقاف وضع المباراة', 'info');
    }
  };

  const handleAzan = () => {
    if (!device) {
      showToast('لا يوجد جهاز متصل', 'error');
      return;
    }

    // Mute all layers except Azan
    sendCommand(device.id, 'azan', { 
      layer1Volume: 0,
      layer2Volume: 0,
      azanSource: 'default' 
    });
    showToast('جاري تشغيل الأذان...', 'info');
  };

  const handleEmergencyStop = () => {
    if (!device) return;
    
    // Stop all playback
    sendCommand(device.id, 'emergencyStop');
    showToast('تم الإيقاف الطارئ', 'error');
  };

  const quickActions = [
    {
      icon: 'play-circle',
      label: 'تشغيل',
      color: COLORS.success,
      onPress: () => {
        if (device) {
          sendCommand(device.id, 'play');
          showToast('تم التشغيل', 'success');
        }
      },
    },
    {
      icon: 'pause-circle',
      label: 'إيقاف',
      color: COLORS.warning,
      onPress: () => {
        if (device) {
          sendCommand(device.id, 'pause');
          showToast('تم الإيقاف', 'info');
        }
      },
    },
    {
      icon: 'skip-next',
      label: 'التالي',
      color: COLORS.info,
      onPress: () => {
        if (device) {
          sendCommand(device.id, 'next');
          showToast('تم التخطي', 'info');
        }
      },
    },
    {
      icon: 'volume-mute',
      label: 'صامت',
      color: COLORS.textSecondary,
      onPress: () => {
        if (device) {
          sendCommand(device.id, 'mute');
          showToast('تم كتم الصوت', 'info');
        }
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot,
              { backgroundColor: device?.status === 'online' ? COLORS.success : COLORS.error }
            ]} />
            <Text style={styles.statusText}>
              {device?.status === 'online' ? 'متصل' : 'غير متصل'}
            </Text>
          </View>
        </View>

        {/* Device Info */}
        <View style={styles.deviceCard}>
          <Icon name="monitor" size={40} color={COLORS.primary} />
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{device?.name || 'لا يوجد جهاز'}</Text>
            <Text style={styles.deviceId}>{device?.id || '---'}</Text>
          </View>
        </View>

        {/* Match Mode Button - The Big One */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleMatchMode}>
          <LinearGradient
            colors={isMatchMode ? ['#DC2626', '#B91C1C'] : ['#F97316', '#EA580C']}
            style={styles.matchModeButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Icon
              name={isMatchMode ? 'trophy' : 'soccer'}
              size={50}
              color="white"
            />
            <View style={styles.matchModeTextContainer}>
              <Text style={styles.matchModeTitle}>
                {isMatchMode ? 'وضع المباراة نشط' : 'تفعيل وضع المباراة'}
              </Text>
              <Text style={styles.matchModeSubtitle}>
                {isMatchMode 
                  ? 'جاري عرض المباراة مباشرة' 
                  : 'انتقال فوري للمباراة مع إعلانات'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التحكم السريع</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={action.onPress}>
                <Icon name={action.icon} size={32} color={action.color} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Buttons */}
        <View style={styles.specialButtons}>
          {/* Azan Button */}
          <TouchableOpacity
            style={[styles.specialButton, { backgroundColor: COLORS.success }]}
            onPress={handleAzan}>
            <Icon name="mosque" size={30} color="white" />
            <Text style={styles.specialButtonText}>الأذان</Text>
          </TouchableOpacity>

          {/* Emergency Stop */}
          <TouchableOpacity
            style={[styles.specialButton, { backgroundColor: COLORS.error }]}
            onPress={handleEmergencyStop}>
            <Icon name="alert-octagon" size={30} color="white" />
            <Text style={styles.specialButtonText}>إيقاف طارئ</Text>
          </TouchableOpacity>
        </View>

        {/* Active Layers Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الطبقات النشطة</Text>
          <View style={styles.layersSummary}>
            {[
              { number: 1, name: 'الوسائط', active: device?.currentLayers.layer1.active, color: COLORS.layer1 },
              { number: 2, name: 'المباريات', active: device?.currentLayers.layer2.active, color: COLORS.layer2 },
              { number: 3, name: 'الإعلانات', active: device?.currentLayers.layer3.active, color: COLORS.layer3 },
              { number: 4, name: 'الشريط', active: device?.currentLayers.layer4.active, color: COLORS.layer4 },
            ].map((layer) => (
              <View
                key={layer.number}
                style={[
                  styles.layerItem,
                  layer.active && { backgroundColor: `${layer.color}20`, borderColor: layer.color }
                ]}>
                <View style={[styles.layerDot, { backgroundColor: layer.color }]} />
                <Text style={[
                  styles.layerName,
                  layer.active && { color: layer.color, fontWeight: 'bold' }
                ]}>
                  {layer.name}
                </Text>
                {layer.active && (
                  <Icon name="check-circle" size={20} color={layer.color} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 14,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  deviceInfo: {
    marginLeft: 15,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deviceId: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  matchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  matchModeTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  matchModeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  matchModeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 8,
  },
  specialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  specialButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  specialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  layersSummary: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 15,
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  layerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  layerName: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
