/**
 * MatchesScreen - Sports matches scheduling and control
 * Saudi Pro League, Champions League, and more
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStore } from '../contexts/StoreContext';
import { useSocket } from '../contexts/SocketContext';
import { COLORS } from '../../App';
import { showToast } from '../utils/toast';

const LEAGUES = [
  { id: '307', name: 'دوري روشن السعودي', icon: 'star', color: '#00A651' },
  { id: '2', name: 'دوري أبطال أوروبا', icon: 'trophy', color: '#00008B' },
  { id: '39', name: 'الدوري الإنجليزي', icon: 'soccer', color: '#38003C' },
  { id: '140', name: 'الدوري الإسباني', icon: 'soccer-field', color: '#FF4B4B' },
];

// Mock matches data
const MOCK_MATCHES = [
  {
    id: '1',
    league: '307',
    homeTeam: 'الهلال',
    awayTeam: 'النصر',
    homeLogo: 'https://via.placeholder.com/50',
    awayLogo: 'https://via.placeholder.com/50',
    matchTime: '2024-05-20T20:00:00',
    status: 'upcoming',
  },
  {
    id: '2',
    league: '2',
    homeTeam: 'ريال مدريد',
    awayTeam: 'برشلونة',
    homeLogo: 'https://via.placeholder.com/50',
    awayLogo: 'https://via.placeholder.com/50',
    matchTime: '2024-05-21T21:00:00',
    status: 'upcoming',
  },
  {
    id: '3',
    league: '39',
    homeTeam: 'مانشستر يونايتد',
    awayTeam: 'ليفربول',
    homeLogo: 'https://via.placeholder.com/50',
    awayLogo: 'https://via.placeholder.com/50',
    matchTime: '2024-05-19T17:30:00',
    status: 'finished',
  },
];

export default function MatchesScreen() {
  const { currentDevice, devices, setMatches, matches } = useStore();
  const { switchToMatch, sendCommand } = useSocket();
  
  const device = currentDevice || devices[0];
  const [selectedLeague, setSelectedLeague] = useState('307');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load matches on mount
    loadMatches();
  }, [selectedLeague]);

  const loadMatches = async () => {
    // In production, fetch from API
    // const response = await fetchMatches(selectedLeague);
    setMatches(MOCK_MATCHES);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches().then(() => setRefreshing(false));
  };

  const handleScheduleMatch = (matchId: string) => {
    if (!device) {
      showToast('لا يوجد جهاز متصل', 'error');
      return;
    }

    // Enable auto-switch for this match
    sendCommand(device.id, 'scheduleMatch', { matchId });
    showToast('تمت جدولة المباراة للعرض التلقائي', 'success');
  };

  const handleWatchNow = (matchId: string) => {
    if (!device) {
      showToast('لا يوجد جهاز متصل', 'error');
      return;
    }

    switchToMatch(device.id, matchId);
    showToast('جاري التبديل للمباراة...', 'info');
  };

  const formatMatchTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return 'انتهت';
    if (hours > 24) return `${Math.floor(hours / 24)} يوم`;
    if (hours > 0) return `${hours} ساعة`;
    return `${minutes} دقيقة`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return COLORS.error;
      case 'upcoming': return COLORS.success;
      case 'finished': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'مباشر';
      case 'upcoming': return 'قادمة';
      case 'finished': return 'انتهت';
      default: return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Text style={styles.title}>المباريات</Text>

        {/* League Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagues}>
          {LEAGUES.map((league) => (
            <TouchableOpacity
              key={league.id}
              style={[
                styles.leagueChip,
                selectedLeague === league.id && styles.leagueChipActive,
              ]}
              onPress={() => setSelectedLeague(league.id)}>
              <Icon
                name={league.icon}
                size={24}
                color={selectedLeague === league.id ? league.color : COLORS.text}
              />
              <Text
                style={[
                  styles.leagueText,
                  selectedLeague === league.id && styles.leagueTextActive,
                ]}>
                {league.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Matches List */}
        {MOCK_MATCHES.filter(m => m.league === selectedLeague).map((match) => (
          <View key={match.id} style={styles.matchCard}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) }]}>
              <Text style={styles.statusText}>{getStatusText(match.status)}</Text>
            </View>

            {/* Teams */}
            <View style={styles.teamsContainer}>
              {/* Home Team */}
              <View style={styles.team}>
                <View style={styles.teamLogo}>
                  <Icon name="shield" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.teamName}>{match.homeTeam}</Text>
              </View>

              {/* VS */}
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
                <Text style={styles.timeText}>
                  {formatMatchTime(match.matchTime)}
                </Text>
              </View>

              {/* Away Team */}
              <View style={styles.team}>
                <View style={styles.teamLogo}>
                  <Icon name="shield" size={40} color={COLORS.info} />
                </View>
                <Text style={styles.teamName}>{match.awayTeam}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {match.status === 'upcoming' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                  onPress={() => handleScheduleMatch(match.id)}>
                  <Icon name="calendar-check" size={20} color="white" />
                  <Text style={styles.actionText}>جدولة</Text>
                </TouchableOpacity>
              )}
              
              {(match.status === 'live' || match.status === 'upcoming') && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                  onPress={() => handleWatchNow(match.id)}>
                  <Icon name="play" size={20} color="white" />
                  <Text style={styles.actionText}>مشاهدة</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Empty State */}
        {MOCK_MATCHES.filter(m => m.league === selectedLeague).length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="calendar-blank" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>لا توجد مباريات في هذا الأسبوع</Text>
          </View>
        )}

        {/* Auto-Schedule Info */}
        <View style={styles.infoCard}>
          <Icon name="information" size={24} color={COLORS.info} />
          <Text style={styles.infoText}>
            المباريات المجدولة ستُعرض تلقائياً 5 دقائق قبل البدء
          </Text>
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
    marginBottom: 20,
  },
  leagues: {
    paddingBottom: 20,
    gap: 10,
  },
  leagueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  leagueChipActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  leagueText: {
    color: COLORS.text,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  leagueTextActive: {
    color: COLORS.primary,
  },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  team: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: `${COLORS.text}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vsText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 15,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.info}15`,
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  infoText: {
    color: COLORS.info,
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
});
