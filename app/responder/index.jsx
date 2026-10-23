import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../firebase';
import {
  getStatusDetails,
  STATUS_ACCEPTED,
  STATUS_ON_THE_WAY,
  STATUS_PENDING,
  STATUS_RESOLVED,
  subscribeToAllIncidents,
  updateIncidentStatus,
} from '../../lib/incidentStore';
import { useUserRole } from '../../lib/useUserRole';

export default function ResponderDashboard() {
  const router = useRouter();
  const { isResponder, loading: roleLoading, user } = useUserRole();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('active'); // 'all', 'pending', 'active' (accepted + on_the_way), 'resolved'
  const [selectedImage, setSelectedImage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    // Only subscribe if authorized
    if (!isResponder && !roleLoading) return;

    const unsubscribe = subscribeToAllIncidents(
      (items) => {
        setIncidents(items);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        // Supabase errors don't print cleanly — log the fields explicitly
        console.error(
          'Responder incident stream error — code:', error?.code,
          '| message:', error?.message || JSON.stringify(error)
        );
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [isResponder, roleLoading]);

  // Role Access Guard
  if (roleLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC143C" />
        <Text style={styles.loadingRoleText}>Verifying responder credentials...</Text>
      </SafeAreaView>
    );
  }

  if (!isResponder) {
    return (
      <SafeAreaView style={styles.restrictedContainer}>
        <Text style={styles.restrictedIcon}>🛡️</Text>
        <Text style={styles.restrictedTitle}>Responder Portal Access Restricted</Text>
        <Text style={styles.restrictedText}>
          Your account ({user?.email || 'Guest'}) does not have authorized emergency responder privileges.
        </Text>
        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => router.replace('/home1')}
        >
          <Text style={styles.returnButtonText}>Go to Reporter Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.switchAccountButton}
          onPress={async () => {
            await signOut(auth);
            router.replace('/login');
          }}
        >
          <Text style={styles.switchAccountText}>Switch Account / Log In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Counts for Badges
  const pendingIncidents = incidents.filter((i) => i.status === STATUS_PENDING);
  const enRouteIncidents = incidents.filter(
    (i) => i.status === STATUS_ACCEPTED || i.status === STATUS_ON_THE_WAY
  );
  const resolvedIncidents = incidents.filter((i) => i.status === STATUS_RESOLVED);

  // Filter List
  const filteredIncidents = incidents.filter((incident) => {
    if (activeFilter === 'pending') return incident.status === STATUS_PENDING;
    if (activeFilter === 'active')
      return (
        incident.status === STATUS_PENDING ||
        incident.status === STATUS_ACCEPTED ||
        incident.status === STATUS_ON_THE_WAY
      );
    if (activeFilter === 'resolved') return incident.status === STATUS_RESOLVED;
    return true; // 'all'
  });

  const handleStatusTransition = async (incident, nextStatus) => {
    setUpdatingId(incident.id);
    try {
      await updateIncidentStatus(incident.id, nextStatus, {
        uid: user?.uid,
        email: user?.email,
      });
    } catch (e) {
      console.error('Error transitioning incident status:', e);
      Alert.alert('Update Failed', 'Could not update status. Please verify network connection.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatIncidentTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>LIFE COMMAND CENTER</Text>
          <Text style={styles.subTitle}>Emergency Response Dashboard</Text>
          <Text style={styles.officerBadge}>
            Officer: <Text style={styles.officerEmail}>{user?.email}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBadge}
          onPress={() => {
            Alert.alert('Sign Out', 'Sign out of Responder Command Center?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  await signOut(auth);
                  router.replace('/login');
                },
              },
            ]);
          }}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Urgent Pending Reports Alert Banner */}
      {pendingIncidents.length > 0 && (
        <View style={styles.urgentBanner}>
          <Text style={styles.urgentPulse}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.urgentBannerTitle}>
              {pendingIncidents.length} NEW EMERGENCY {pendingIncidents.length === 1 ? 'REPORT' : 'REPORTS'} AWAITING ACKNOWLEDGMENT
            </Text>
            <Text style={styles.urgentBannerSub}>
              Tap &quot;Accept&quot; below to confirm receipt and assign units.
            </Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeFilter === 'active' && styles.tabButtonActive]}
          onPress={() => setActiveFilter('active')}
        >
          <Text style={[styles.tabText, activeFilter === 'active' && styles.tabTextActive]}>
            Active ({pendingIncidents.length + enRouteIncidents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeFilter === 'pending' && styles.tabButtonActive]}
          onPress={() => setActiveFilter('pending')}
        >
          <Text style={[styles.tabText, activeFilter === 'pending' && styles.tabTextActive]}>
            Pending ({pendingIncidents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeFilter === 'resolved' && styles.tabButtonActive]}
          onPress={() => setActiveFilter('resolved')}
        >
          <Text style={[styles.tabText, activeFilter === 'resolved' && styles.tabTextActive]}>
            Resolved ({resolvedIncidents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeFilter === 'all' && styles.tabButtonActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.tabText, activeFilter === 'all' && styles.tabTextActive]}>
            All ({incidents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Incident Feed */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Connecting to emergency dispatch stream...</Text>
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
          {filteredIncidents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>No incidents found</Text>
              <Text style={styles.emptySub}>
                Incoming emergency reports will populate here in real-time.
              </Text>
            </View>
          ) : (
            filteredIncidents.map((incident) => {
              const statusDetails = getStatusDetails(incident.status);
              const isUpdating = updatingId === incident.id;

              return (
                <View
                  key={incident.id}
                  style={[
                    styles.incidentCard,
                    { borderLeftColor: statusDetails.color },
                    incident.status === STATUS_PENDING && styles.pendingHighlightCard,
                  ]}
                >
                  {/* Card Top Row */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTypeGroup}>
                      <Text style={styles.categoryIcon}>
                        {incident.type === 'fire'
                          ? '🔥'
                          : incident.type === 'accident'
                          ? '🚗'
                          : incident.type === 'police'
                          ? '🚔'
                          : '🏥'}
                      </Text>
                      <View>
                        <Text style={styles.cardTypeTitle}>
                          {incident.typeLabel || incident.type || 'Emergency'}
                        </Text>
                        <Text style={styles.cardTimestamp}>
                          Reported: {formatIncidentTime(incident.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: statusDetails.badgeBg,
                          borderColor: statusDetails.badgeBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: statusDetails.color }]}>
                        {statusDetails.icon} {statusDetails.label}
                      </Text>
                    </View>
                  </View>

                  {/* Incident Description */}
                  {incident.description ? (
                    <Text style={styles.incidentDescription}>{incident.description}</Text>
                  ) : null}

                  {/* Incident Location & Map Button */}
                  <View style={styles.locationContainer}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText}>{incident.address || 'Location provided'}</Text>
                  </View>

                  {/* Coordinates & Direct Map Action */}
                  {incident.latitude != null && incident.longitude != null && (
                    <TouchableOpacity
                      style={styles.openMapButton}
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.openMapButtonText}>
                        🗺️ Open in Google Maps ({incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Image Attachment Preview */}
                  {incident.imageUrl ? (
                    <View style={styles.attachmentContainer}>
                      <Text style={styles.attachmentLabel}>📷 Attached Photo Evidence (Tap to view):</Text>
                      <TouchableOpacity
                        onPress={() => setSelectedImage(incident.imageUrl)}
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{ uri: incident.imageUrl }}
                          style={styles.imageThumbnail}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* Reporter Info */}
                  <View style={styles.reporterInfoRow}>
                    <Text style={styles.reporterEmailText}>
                      Reporter: {incident.reportedByEmail || 'Anonymous / Citizen'}
                    </Text>
                    {incident.responderEmail && (
                      <Text style={styles.assignedResponderText}>
                        Unit: {incident.responderEmail}
                      </Text>
                    )}
                  </View>

                  {/* Status Progression Controls */}
                  <View style={styles.controlsRow}>
                    {incident.status === STATUS_PENDING && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.acceptBtn]}
                        onPress={() => handleStatusTransition(incident, STATUS_ACCEPTED)}
                        disabled={isUpdating}
                        activeOpacity={0.8}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.actionBtnText}>✅ Confirm & Accept Report</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {incident.status === STATUS_ACCEPTED && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.enRouteBtn]}
                        onPress={() => handleStatusTransition(incident, STATUS_ON_THE_WAY)}
                        disabled={isUpdating}
                        activeOpacity={0.8}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.actionBtnText}>🚑 Dispatch: Responders En Route</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {incident.status === STATUS_ON_THE_WAY && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.resolveBtn]}
                        onPress={() => {
                          Alert.alert(
                            'Mark as Resolved',
                            'Are you sure this emergency incident has been completely handled?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Yes, Mark Resolved',
                                onPress: () => handleStatusTransition(incident, STATUS_RESOLVED),
                              },
                            ]
                          );
                        }}
                        disabled={isUpdating}
                        activeOpacity={0.8}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.actionBtnText}>🏁 Mark Incident Resolved</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {incident.status === STATUS_RESOLVED && (
                      <View style={styles.resolvedInfoBox}>
                        <Text style={styles.resolvedInfoText}>
                          Incident closed and marked resolved.
                        </Text>
                        <TouchableOpacity
                          style={styles.reopenButton}
                          onPress={() => handleStatusTransition(incident, STATUS_ACCEPTED)}
                          disabled={isUpdating}
                        >
                          <Text style={styles.reopenButtonText}>Reopen Incident</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Full Screen Image Modal */}
      <Modal
        visible={Boolean(selectedImage)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.closeModalText}>✕ Close Preview</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingRoleText: {
    marginTop: 14,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  restrictedIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  restrictedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  restrictedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  returnButton: {
    backgroundColor: '#DC143C',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 14,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  switchAccountButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  switchAccountText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111827',
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 1.5,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F9FAFB',
    marginTop: 2,
  },
  officerBadge: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  officerEmail: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  logoutBadge: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  logoutText: {
    color: '#F3F4F6',
    fontSize: 12,
    fontWeight: '700',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  urgentPulse: {
    fontSize: 26,
  },
  urgentBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  urgentBannerSub: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabButtonActive: {
    backgroundColor: '#111827',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
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
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  incidentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pendingHighlightCard: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFDF5',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTypeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 28,
  },
  cardTypeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  cardTimestamp: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  locationIcon: {
    fontSize: 15,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  openMapButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  openMapButtonText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  attachmentContainer: {
    marginBottom: 14,
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  imageThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  reporterInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 14,
  },
  reporterEmailText: {
    fontSize: 11,
    color: '#6B7280',
  },
  assignedResponderText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  controlsRow: {
    marginTop: 4,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptBtn: {
    backgroundColor: '#2563EB',
  },
  enRouteBtn: {
    backgroundColor: '#7C3AED',
  },
  resolveBtn: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resolvedInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resolvedInfoText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
  },
  reopenButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  reopenButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  closeModalButton: {
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
    fontSize: 14,
    fontWeight: '800',
  },
  fullScreenImage: {
    width: '100%',
    height: '75%',
    borderRadius: 12,
  },
});
