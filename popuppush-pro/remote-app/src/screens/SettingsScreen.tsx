/**
 * SettingsScreen - App settings and device configuration
 */

import React from 'react';
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
import { COLORS } from '../../App';
import { showToast } from '../utils/toast';

export default function SettingsScreen() {
  const [autoConnect, setAutoConnect] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);

  const handlePairDevice = () => {
    showToast('افتح الكاميرا لمسح رمز QR على الشاشة', 'info');
  };

  const handleCheckUpdate = () => {
    showToast('أنت تستخدم أحدث إصدار', 'success');
  };

  const settingsSections = [
    {
      title: 'الجهاز',
      items: [
        {
          icon: 'qrcode-scan',
          label: 'إقران جهاز جديد',
          action: handlePairDevice,
          type: 'button',
        },
        {
          icon: 'monitor',
          label: 'الشاشة المتصلة',
          value: 'الشاشة الرئيسية',
          type: 'info',
        },
        {
          icon: 'connection',
          label: 'الاتصال التلقائي',
          value: autoConnect,
          onValueChange: setAutoConnect,
          type: 'toggle',
        },
      ],
    },
    {
      title: 'التفضيلات',
      items: [
        {
          icon: 'bell',
          label: 'الإشعارات',
          value: notifications,
          onValueChange: setNotifications,
          type: 'toggle',
        },
        {
          icon: 'theme-light-dark',
          label: 'الوضع الداكن',
          value: darkMode,
          onValueChange: setDarkMode,
          type: 'toggle',
        },
        {
          icon: 'translate',
          label: 'اللغة',
          value: 'العربية',
          type: 'info',
        },
      ],
    },
    {
      title: 'عن التطبيق',
      items: [
        {
          icon: 'information',
          label: 'الإصدار',
          value: '1.0.0',
          type: 'info',
        },
        {
          icon: 'update',
          label: 'التحقق من التحديثات',
          action: handleCheckUpdate,
          type: 'button',
        },
        {
          icon: 'help-circle',
          label: 'المساعدة والدعم',
          action: () => showToast('قريباً', 'info'),
          type: 'button',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>الإعدادات</Text>

        {/* Device Status Card */}
        <View style={styles.deviceCard}>
          <View style={styles.deviceIcon}>
            <Icon name="remote-tv" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceTitle}>الريموت الذكي</Text>
            <Text style={styles.deviceSubtitle}>متصل بـ {settingsSections[0].items[1].value}</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: COLORS.success }]} />
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={item.type === 'button' ? item.action : undefined}
                  disabled={item.type !== 'button'}>
                  <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                      <Icon name={item.icon} size={22} color={COLORS.primary} />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>

                  {item.type === 'toggle' && (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: COLORS.surface, true: COLORS.primary }}
                      thumbColor={item.value ? 'white' : '#f4f3f4'}
                    />
                  )}

                  {item.type === 'info' && (
                    <Text style={styles.itemValue}>{item.value}</Text>
                  )}

                  {item.type === 'button' && (
                    <Icon name="chevron-left" size={24} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => showToast('تم تسجيل الخروج', 'info')}>
          <Icon name="logout" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          Pop-up Push Remote v1.0.0{'\n'}
          Made with ☕ in Saudi Arabia
        </Text>
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
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  deviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 15,
  },
  deviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deviceSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginLeft: 5,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.text}05`,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  itemValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 20,
  },
});
