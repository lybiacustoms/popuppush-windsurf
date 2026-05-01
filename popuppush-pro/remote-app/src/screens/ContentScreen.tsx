/**
 * ContentScreen - Thumbnail-based content browser
 * Videos, playlists, and media library
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import { useStore } from '../contexts/StoreContext';
import { useSocket } from '../contexts/SocketContext';
import { COLORS } from '../../App';
import { showToast } from '../utils/toast';

const { width } = Dimensions.get('window');
const THUMB_WIDTH = (width - 60) / 2;

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: 'view-grid' },
  { id: 'video', name: 'فيديو', icon: 'movie' },
  { id: 'audio', name: 'صوت', icon: 'music' },
  { id: 'youtube', name: 'يوتيوب', icon: 'youtube' },
  { id: 'playlist', name: 'قوائم', icon: 'playlist-play' },
];

export default function ContentScreen() {
  const { content, playlists, currentDevice, devices } = useStore();
  const { sendCommand, activateLayer } = useSocket();
  
  const device = currentDevice || devices[0];
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const handlePlayContent = (contentId: string, type: string) => {
    if (!device) {
      showToast('لا يوجد جهاز متصل', 'error');
      return;
    }

    activateLayer(device.id, 1, { contentId });
    showToast(`جاري تشغيل: ${type}`, 'success');
  };

  const handlePlayPlaylist = (playlistId: string) => {
    if (!device) {
      showToast('لا يوجد جهاز متصل', 'error');
      return;
    }

    activateLayer(device.id, 1, { playlistId });
    showToast('جاري تشغيل القائمة', 'success');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>المكتبة</Text>
        
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}>
              <Icon
                name={cat.icon}
                size={20}
                color={selectedCategory === cat.id ? 'white' : COLORS.text}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content Grid */}
        <View style={styles.grid}>
          {content.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.contentCard}
              onPress={() => handlePlayContent(item.id, item.type)}>
              <FastImage
                source={{ uri: item.thumbnailUrl }}
                style={styles.thumbnail}
                resizeMode={FastImage.resizeMode.cover}>
                {/* Play Button Overlay */}
                <View style={styles.playOverlay}>
                  <Icon name="play-circle" size={50} color="white" />
                </View>
                
                {/* Duration Badge */}
                {item.duration && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                      {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                )}
                
                {/* Type Badge */}
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
                  <Icon name={getTypeIcon(item.type)} size={14} color="white" />
                </View>
              </FastImage>
              
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.contentMeta}>
                  <Text style={styles.contentType}>{getTypeLabel(item.type)}</Text>
                  <TouchableOpacity
                    style={styles.quickPlay}
                    onPress={() => handlePlayContent(item.id, item.type)}>
                    <Icon name="play" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Playlists Section */}
        <Text style={styles.sectionTitle}>قوائم التشغيل</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playlists}>
          {playlists.length === 0 ? (
            <View style={styles.emptyPlaylist}>
              <Icon name="playlist-plus" size={40} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>لا توجد قوائم بعد</Text>
            </View>
          ) : (
            playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistCard}
                onPress={() => handlePlayPlaylist(playlist.id)}>
                <View style={styles.playlistIcon}>
                  <Icon name="playlist-play" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.playlistName} numberOfLines={2}>
                  {playlist.name}
                </Text>
                <Text style={styles.playlistCount}>
                  {playlist.items?.length || 0} عنصر
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'video': return COLORS.error;
    case 'audio': return COLORS.success;
    case 'youtube': return '#FF0000';
    case 'image': return COLORS.info;
    default: return COLORS.primary;
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'video': return 'movie';
    case 'audio': return 'music';
    case 'youtube': return 'youtube';
    case 'image': return 'image';
    default: return 'file';
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'video': return 'فيديو';
    case 'audio': return 'صوت';
    case 'youtube': return 'يوتيوب';
    case 'image': return 'صورة';
    default: return type;
  }
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
    marginBottom: 15,
  },
  categories: {
    paddingBottom: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.text,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: 'white',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  contentCard: {
    width: THUMB_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
  },
  thumbnail: {
    width: '100%',
    height: THUMB_WIDTH * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInfo: {
    padding: 12,
  },
  contentTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentType: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  quickPlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  playlists: {
    gap: 15,
  },
  playlistCard: {
    width: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
  },
  playlistIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  playlistName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  playlistCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyPlaylist: {
    width: 150,
    height: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
});
