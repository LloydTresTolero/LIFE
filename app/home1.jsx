import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../firebase';
import {
  getStatusDetails,
  STATUS_RESOLVED,
  subscribeToUserIncidents,
} from '../lib/incidentStore';
import { useUserRole } from '../lib/useUserRole';
import BottomNav from './components/BottomNav';

const QUICK_CATEGORIES = [
  { id: 'fire', label: 'Fire', icon: '🔥', color: '#E65100' },
  { id: 'accident', label: 'Accident', icon: '🚗', color: '#D84315' },
  { id: 'medical', label: 'Medical', icon: '🏥', color: '#2E7D32' },
  { id: 'police', label: 'Police', icon: '🚔', color: '#1565C0' },
];

const QUICK_SHELTERS = [
  { id: '1', name: 'LAMAC Multi-Purpose Center', address: 'Aliwanay, Balamban', capacity: 400 },
  { id: '2', name: 'Balamban Municipal Hall', address: 'Poblacion, Balamban', capacity: 300 },
];

export default function ReporterHome() {
  const router = useRouter();
  const { user, isResponder } = useUserRole();

  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(true);

  // Fetch location on mount
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Location permission not granted');
        setGettingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords(loc.coords);

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode.length > 0) {
          const item = geocode[0];
          const parts = [
            item.street,
            item.district || item.subregion,
            item.city,
            item.region,
          ].filter(Boolean);
          setAddress(parts.join(', ') || 'Current location detected');
        }
      } catch (_e) {
        setAddress('Location coordinates acquired');
      }
    } catch (_e) {
      setAddress('Tap to refresh location');
    } finally {
      setGettingLocation(false);
    }
  };

  // Real-time listener for current user's submitted incidents
  useEffect(() => {
    const currentUserId = user?.uid || auth.currentUser?.uid;
    if (!currentUserId) return;

    const unsubscribe = subscribeToUserIncidents(currentUserId, (items) => {
      setRecentReports(items.slice(0, 3));
      // Look for the most recent un-resolved report
      const active = items.find((i) => i.status !== STATUS_RESOLVED);
      setActiveEmergency(active || null);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleQuickCategory = (category) => {
    router.push({
      pathname: '/emergency/report',
      params: {
        type: category.id,
        typeLabel: `${category.label} Emergency`,
        cachedAddress: address || '',
        lat: coords?.latitude ? String(coords.latitude) : '',
        lon: coords?.longitude ? String(coords.longitude) : '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>LIFE</Text>
          </View>
          <View>
            <Text style={styles.topBarTitle}>LIFE Emergency App</Text>
            <Text style={styles.topBarSubtitle}>Balamban, Cebu Dispatch</Text>
          </View>
        </View>

        {isResponder && (
          <TouchableOpacity
            style={styles.responderShortcutBtn}
            onPress={() => router.push('/responder')}
          >
            <Text style={styles.responderShortcutText}>🛡️ Command</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Emergency Status Card (Real-Time Live Banner) */}
        {activeEmergency && (
          <TouchableOpacity
            style={styles.activeEmergencyCard}
            onPress={() =>
              router.push({
                pathname: '/emergency/rescue',
                params: {
                  incidentId: activeEmergency.id,
                  type: activeEmergency.type,
                  typeLabel: activeEmergency.typeLabel,
                },
              })
            }
            activeOpacity={0.88}
          >
            <View style={styles.activeEmergencyHeader}>
              <View style={styles.activePulseRow}>
                <Text style={styles.activePulseIcon}>🚨</Text>
                <Text style={styles.activeEmergencyTitle}>ACTIVE EMERGENCY REPORT</Text>
              </View>
              {(() => {
                const s = getStatusDetails(activeEmergency.status);
                return (
                  <View style={[styles.activeStatusPill, { backgroundColor: s.badgeBg, borderColor: s.badgeBorder }]}>
                    <Text style={[styles.activeStatusPillText, { color: s.color }]}>
                      {s.icon} {s.label}
                    </Text>
                  </View>
                );
              })()}
            </View>

            <Text style={styles.activeEmergencyType}>
              {activeEmergency.typeLabel || activeEmergency.type}
            </Text>
            <Text style={styles.activeEmergencyDesc} numberOfLines={2}>
              {activeEmergency.description || activeEmergency.address || 'Responders notified'}
            </Text>

            <View style={styles.activeEmergencyFooter}>
              <Text style={styles.activeTrackLink}>Tap to track responder arrival →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* SOS Emergency Button */}
        <View style={styles.sosContainer}>
          <Text style={styles.sosPrompt}>Need urgent assistance?</Text>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => router.push('/emergency/type')}
            activeOpacity={0.85}
          >
            <View style={styles.sosInnerGlow}>
              <Text style={styles.sosIcon}>🚨</Text>
              <Text style={styles.sosButtonText}>REPORT</Text>
              <Text style={styles.sosButtonSub}>EMERGENCY</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.sosInstruction}>
            Tap above or select a quick emergency category below:
          </Text>
        </View>

        {/* Quick Category Action Grid */}
        <View style={styles.quickGrid}>
          {QUICK_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.quickCard, { borderTopColor: cat.color }]}
              onPress={() => handleQuickCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>{cat.icon}</Text>
              <Text style={styles.quickLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* GPS Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.locationHeaderLabel}>📍 Your Current Address</Text>
            <TouchableOpacity
              onPress={fetchCurrentLocation}
              disabled={gettingLocation}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.refreshLocLink}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {gettingLocation ? (
            <View style={styles.locationLoadingRow}>
              <ActivityIndicator size="small" color="#DC143C" />
              <Text style={styles.locationLoadingText}>Locating GPS coordinates...</Text>
            </View>
          ) : (
            <Text style={styles.locationText}>{address || 'Location acquired'}</Text>
          )}
        </View>

        {/* Recent Activities Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>My Recent Reports</Text>
          <TouchableOpacity onPress={() => router.push('/home')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {recentReports.length === 0 ? (
          <View style={styles.emptyRecentCard}>
            <Text style={styles.emptyRecentText}>No incident reports submitted yet.</Text>
            <Text style={styles.emptyRecentSub}>
              Reports you submit will appear here with live response tracking.
            </Text>
          </View>
        ) : (
          recentReports.map((report) => {
            const s = getStatusDetails(report.status);
            return (
              <TouchableOpacity
                key={report.id}
                style={[styles.recentCard, { borderLeftColor: s.color }]}
                onPress={() =>
                  router.push({
                    pathname: '/emergency/rescue',
                    params: {
                      incidentId: report.id,
                      type: report.type,
                      typeLabel: report.typeLabel,
                    },
                  })
                }
              >
                <View style={styles.recentCardLeft}>
                  <Text style={styles.recentCardType}>
                    {report.typeLabel || report.type}
                  </Text>
                  <Text style={styles.recentCardLocation} numberOfLines={1}>
                    📍 {report.address || 'Address registered'}
                  </Text>
                </View>
                <View style={[styles.statusBadgeSmall, { backgroundColor: s.badgeBg, borderColor: s.badgeBorder }]}>
                  <Text style={[styles.statusBadgeSmallText, { color: s.color }]}>
                    {s.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Evacuation Centers Highlight */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionHeading}>Nearby Evacuation Shelters</Text>
          <TouchableOpacity onPress={() => router.push('/shelters')}>
            <Text style={styles.viewAllText}>All Shelters →</Text>
          </TouchableOpacity>
        </View>

        {QUICK_SHELTERS.map((shelter) => (
          <View key={shelter.id} style={styles.shelterCard}>
            <Text style={styles.shelterIcon}>🏢</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.shelterName}>{shelter.name}</Text>
              <Text style={styles.shelterAddr}>{shelter.address}</Text>
            </View>
            <Text style={styles.shelterCap}>{shelter.capacity} cap</Text>
          </View>
        ))}
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  topBarSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  responderShortcutBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  responderShortcutText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  activeEmergencyCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#DC143C',
    shadowColor: '#DC143C',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  activeEmergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activePulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activePulseIcon: {
    fontSize: 18,
  },
  activeEmergencyTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC143C',
    letterSpacing: 1,
  },
  activeStatusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeStatusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  activeEmergencyType: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  activeEmergencyDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  activeEmergencyFooter: {
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    paddingTop: 8,
  },
  activeTrackLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC143C',
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  sosPrompt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
  },
  sosButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC143C',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 6,
    borderColor: '#fff',
  },
  sosInnerGlow: {
    alignItems: 'center',
  },
  sosIcon: {
    fontSize: 32,
    marginBottom: 2,
  },
  sosButtonText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  sosButtonSub: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
  },
  sosInstruction: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 18,
    fontWeight: '500',
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
  },
  locationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshLocLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC143C',
  },
  locationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationLoadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC143C',
  },
  emptyRecentCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptyRecentSub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  recentCardLeft: {
    flex: 1,
    marginRight: 10,
  },
  recentCardType: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  recentCardLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadgeSmall: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeSmallText: {
    fontSize: 11,
    fontWeight: '800',
  },
  shelterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    gap: 12,
  },
  shelterIcon: {
    fontSize: 22,
  },
  shelterName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  shelterAddr: {
    fontSize: 11,
    color: '#6B7280',
  },
  shelterCap: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
});
