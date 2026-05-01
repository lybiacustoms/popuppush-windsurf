/**
 * LayersScreen - Control the 4-layer display system
 * Toggle layers, adjust volumes, manage content
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useStore } from '../contexts/StoreContext';
import { useSocket } from '../contexts/SocketContext';
import { COLORS } from '../../App';
import { showToast } from '../utils/toast';

const LAYERS = [
  {
    number: 1,
    name: 'طبقة الوسائط',
    subtitle: 'فيديو، صوت، YouTube',
    icon: 'play-circle',
    color: COLORS.layer1,
    controls: ['volume', 'playlist', 'playpause'],
  },
  {
    number: 2,
    name: 'طبقة المباريات',
    subtitle: 'HDMI-IN، البث المباشر',
    icon: 'television',
    color: COLORS.layer2,
    controls: ['input', 'volume'],
  },
  {
    number: 3,
    name: 'طبقة الإعلانات',
    subtitle: 'Pop-up، GIF، PNG',
    icon: 'image',
    color: COLORS.layer3,
    controls: ['toggle', 'position', 'animation'],
  },
  {
    number: 4,
    name: 'طبقة الشريط',
    subtitle: 'Ticker، أخبار، نصوص',
    icon: 'format-text',
    color: COLORS.layer4,
    controls: ['text', 'speed', 'direction'],
  },
];

export default function LayersScreen() {
  const { currentDevice, devices } = useStore();
  const { activateLayer, deactivateLayer, setVolume, sendCommand } = useSocket();
  
  const device = currentDevice || devices[0];
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

  const handleToggleLayer = (layerNumber: number, active: boolean) => {
    if (!device) {
      showToast('لا يوجد جهاز متصل', 'error');
      return;
    }

    if (active) {
      activateLayer(device.id, layerNumber);
      showToast(`تم تفعيل الطبقة ${layerNumber}`, 'success');
    } else {
      deactivateLayer(device.id, layerNumber);
      showToast(`تم إخفاء الطبقة ${layerNumber}`, 'info');
    }
  };

  const handleVolumeChange = (layer: number, volume: number) => {
    if (!device) return;
    setVolume(device.id, layer, volume);
  };

  const getLayerState = (number: number) => {
    if (!device) return { active: false, volume: 0.5 };
    
    switch (number) {
      case 1:
        return {
          active: device.currentLayers.layer1.active,
          volume: device.currentLayers.layer1.volume,
        };
      case 2:
        return {
          active: device.currentLayers.layer2.active,
          volume: 1,
        };
      case 3:
        return {
          active: device.currentLayers.layer3.active,
        };
      case 4:
        return {
          active: device.currentLayers.layer4.active,
        };
      default:
        return { active: false };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>لوحة تحكم الطبقات</Text>
        <Text style={styles.subtitle}>تحكم في الـ 4 طبقات المعروضة</Text>

        {LAYERS.map((layer) => {
          const state = getLayerState(layer.number);
          const isSelected = selectedLayer === layer.number;

          return (
            <View
              key={layer.number}
              style={[
                styles.layerCard,
                isSelected && { borderColor: layer.color, borderWidth: 2 },
                state.active && { backgroundColor: `${layer.color}15` },
              ]}>
              {/* Layer Header */}
              <TouchableOpacity
                style={styles.layerHeader}
                onPress={() => setSelectedLayer(isSelected ? null : layer.number)}>
                <View style={[styles.iconContainer, { backgroundColor: `${layer.color}30` }]}>
                  <Icon name={layer.icon} size={30} color={layer.color} />
                </View>
                
                <View style={styles.layerInfo}>
                  <Text style={styles.layerName}>{layer.name}</Text>
                  <Text style={styles.layerSubtitle}>{layer.subtitle}</Text>
                </View>

                <Switch
                  value={state.active}
                  onValueChange={(value) => handleToggleLayer(layer.number, value)}
                  trackColor={{ false: COLORS.surface, true: layer.color }}
                  thumbColor={state.active ? 'white' : '#f4f3f4'}
                />
              </TouchableOpacity>

              {/* Expanded Controls */}
              {isSelected && (
                <View style={styles.controlsContainer}>
                  {layer.controls.includes('volume') && (
                    <View style={styles.controlRow}>
                      <Icon name="volume-low" size={20} color={COLORS.textSecondary} />
                      <Slider
                        style={styles.slider}
                        value={state.volume || 0.5}
                        minimumValue={0}
                        maximumValue={1}
                        minimumTrackTintColor={layer.color}
                        maximumTrackTintColor={COLORS.surface}
                        thumbTintColor={layer.color}
                        onValueChange={(value) => handleVolumeChange(layer.number, value)}
                      />
                      <Icon name="volume-high" size={20} color={COLORS.textSecondary} />
                      <Text style={styles.volumeText}>
                        {Math.round((state.volume || 0.5) * 100)}%
                      </Text>
                    </View>
                  )}

                  {layer.number === 1 && (
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: COLORS.success }]}
                        onPress={() => sendCommand(device?.id, 'play')}>
                        <Icon name="play" size={24} color="white" />
                        <Text style={styles.buttonText}>تشغيل</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: COLORS.warning }]}
                        onPress={() => sendCommand(device?.id, 'pause')}>
                        <Icon name="pause" size={24} color="white" />
                        <Text style={styles.buttonText}>إيقاف</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: COLORS.info }]}
                        onPress={() => sendCommand(device?.id, 'next')}>
                        <Icon name="skip-next" size={24} color="white" />
                        <Text style={styles.buttonText}>التالي</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {layer.number === 3 && (
                    <View style={styles.buttonRow}>
                      <TouchableOpacity style={styles.positionButton}>
                        <Icon name="arrow-top-left" size={24} color={COLORS.text} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.positionButton}>
                        <Icon name="arrow-top-right" size={24} color={COLORS.text} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.positionButton}>
                        <Icon name="arrow-bottom-left" size={24} color={COLORS.text} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.positionButton}>
                        <Icon name="arrow-bottom-right" size={24} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Layer Mixing Section */}
        <View style={styles.mixingSection}>
          <Text style={styles.sectionTitle}>مزج الصوت</Text>
          <Text style={styles.mixingDescription}>
            اضبط توازن الصوت بين الموسيقى والمباريات
          </Text>
          
          <View style={styles.mixingControl}>
            <View style={styles.mixingLabel}>
              <Icon name="music" size={20} color={COLORS.layer1} />
              <Text style={styles.mixingText}>موسيقى</Text>
            </View>
            <Slider
              style={styles.mixingSlider}
              value={0.7}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={COLORS.layer1}
              maximumTrackTintColor={COLORS.layer2}
              thumbTintColor="white"
            />
            <View style={styles.mixingLabel}>
              <Icon name="television" size={20} color={COLORS.layer2} />
              <Text style={styles.mixingText}>مباراة</Text>
            </View>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  layerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  layerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  layerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  controlsContainer: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.text}10`,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  volumeText: {
    color: COLORS.text,
    fontSize: 14,
    minWidth: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  positionButton: {
    width: 50,
    height: 50,
    backgroundColor: `${COLORS.text}15`,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mixingSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  mixingDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  mixingControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mixingLabel: {
    alignItems: 'center',
    minWidth: 60,
  },
  mixingText: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 4,
  },
  mixingSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
});
