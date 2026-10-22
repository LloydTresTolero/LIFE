import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getStatusDetails,
  STATUS_ACCEPTED,
  STATUS_ON_THE_WAY,
  STATUS_PENDING,
  STATUS_RESOLVED,
  subscribeToAllIncidents,
  updateIncidentStatus,
} from '../lib/incidentStore';
import { useUserRole } from '../lib/useUserRole';
import BottomNav from './components/BottomNav';

const EMERGENCY_THEMES = {
  fire: { color: '#E65100', icon: '🔥' },
  accident: { color: '#D84315', icon: '🚗' },
  medical: { color: '#2E7D32', icon: '🏥' },
  police: { color: '#1565C0', icon: '🚔' },
};

export default function IncidentsScreen() {
  const router = useRouter();
  const { isResponder, user } = useUserRole();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllIncidents(
      (items) => {
        setIncidents(items);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('All Incidents stream error:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (incident, nextStatus) => {
    setUpdatingId(incident.id);
    try {
      await updateIncidentStatus(incident.id, nextStatus, {
        uid: user?.uid,
        email: user?.email,
      });
    } catch (_e) {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const filtered = incidents.filter((i) => {
    if (selectedFilter === 'all') return true;
    return i.type === selectedFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Public Incident Feed</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          Real-time view of active and reported emergencies in Balamban
        </Text>
      </View>

      {/* Category Filter Pills */}
      <View style={styles.filterBar}>
        {['all', 'fire', 'accident', 'medical', 'police'].map((type) => {
          const isSelected = selectedFilter === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setSelectedFilter(type)}
            >
              <Text
                style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feed Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Syncing live incidents...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              tintColor="#DC143C"
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>No incidents reported</Text>
              <Text style={styles.emptySubtitle}>All areas currently reporting normal status.</Text>
            </View>
          ) : (
            filtered.map((incident) => {
              const theme = EMERGENCY_THEMES[incident.type] || EMERGENCY_THEMES.medical;
              const status = getStatusDetails(incident.status);
              const isUpdating = updatingId === incident.id;

              return (
                <View
                  key={incident.id}
                  style={[styles.card, { borderLeftColor: status.color }]}
                >
                  {/* Top Bar */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTypeRow}>
                      <Text style={styles.typeIcon}>{theme.icon}</Text>
                      <View>
                        <Text style={styles.cardTypeTitle}>
                          {incident.typeLabel || incident.type}
                        </Text>
                        <Text style={styles.cardTime}>
                          {formatTimestamp(incident.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Status Pill */}
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: status.badgeBg, borderColor: status.badgeBorder },
                      ]}
                    >
                      <Text style={[styles.statusPillText, { color: status.color }]}>
                        {status.icon} {status.label}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  {incident.description && (
                    <Text style={styles.description}>{incident.description}</Text>
                  )}

                  {/* Location Address */}
                  {incident.address && (
                    <View style={styles.locationRow}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>{incident.address}</Text>
                    </View>
                  )}

                  {/* Image Thumbnail */}
                  {incident.imageUrl && (
                    <TouchableOpacity
                      style={styles.imageThumbBox}
                      onPress={() => setSelectedImage(incident.imageUrl)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: incident.imageUrl }} style={styles.thumbnail} />
                      <Text style={styles.imageThumbLabel}>📷 Tap to expand photo</Text>
                    </TouchableOpacity>
                  )}

                  {/* Open in Map */}
                  {incident.latitude != null && incident.longitude != null && (
                    <TouchableOpacity
                      style={styles.mapLinkBtn}
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`
                        )
                      }
                    >
                      <Text style={styles.mapLinkText}>🗺️ View Incident Location on Map</Text>
                    </TouchableOpacity>
                  )}

                  {/* Actions & Responder Status Controls */}
                  <View style={styles.cardBottomRow}>
                    <TouchableOpacity
                      style={styles.shareBtn}
                      onPress={async () => {
                        try {
                          await Share.share({
                            message: `Emergency Alert: ${incident.typeLabel || incident.type}\nStatus: ${status.label}\nLocation: ${incident.address || ''}\nShared via LIFE Emergency App`,
                            title: 'Emergency Incident',
                          });
                        } catch (_e) {}
                      }}
                    >
                      <Text style={styles.shareBtnText}>Share</Text>
                    </TouchableOpacity>

                    {/* Responder quick action if authorized */}
                    {isResponder && incident.status === STATUS_PENDING && (
                      <TouchableOpacity
                        style={styles.responderActionBtn}
                        onPress={() => handleStatusUpdate(incident, STATUS_ACCEPTED)}
                        disabled={isUpdating}
                      >
                        <Text style={styles.responderActionText}>
                          {isUpdating ? 'Updating...' : 'Accept Incident'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {isResponder && incident.status === STATUS_ACCEPTED && (
                      <TouchableOpacity
                        style={[styles.responderActionBtn, { backgroundColor: '#7C3AED' }]}
                        onPress={() => handleStatusUpdate(incident, STATUS_ON_THE_WAY)}
                        disabled={isUpdating}
                      >
                        <Text style={styles.responderActionText}>
                          {isUpdating ? 'Updating...' : 'Dispatch Team'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {isResponder && incident.status === STATUS_ON_THE_WAY && (
                      <TouchableOpacity
                        style={[styles.responderActionBtn, { backgroundColor: '#059669' }]}
                        onPress={() => handleStatusUpdate(incident, STATUS_RESOLVED)}
                        disabled={isUpdating}
                      >
                        <Text style={styles.responderActionText}>
                          {isUpdating ? 'Updating...' : 'Mark Resolved'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Image Modal */}
      <Modal
        visible={Boolean(selectedImage)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeModalBtn}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.closeModalText}>✕ Close</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    color: '#DC143C',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterPillActive: {
    backgroundColor: '#DC143C',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  typeIcon: {
    fontSize: 26,
  },
  cardTypeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  cardTime: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
    flex: 1,
  },
  imageThumbBox: {
    position: 'relative',
    marginBottom: 10,
  },
  thumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  imageThumbLabel: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  mapLinkBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  mapLinkText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  shareBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  responderActionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  responderActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 10,
  },
  closeModalText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  fullImage: {
    width: '100%',
    height: '75%',
    borderRadius: 12,
  },
});
