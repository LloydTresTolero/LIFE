import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../firebase';
import {
  deleteIncident,
  getStatusDetails,
  STATUS_PENDING,
  STATUS_RESOLVED,
  subscribeToUserIncidents,
  updateIncidentDetails,
} from '../lib/incidentStore';
import { useUserRole } from '../lib/useUserRole';
import BottomNav from './components/BottomNav';

const EMERGENCY_THEMES = {
  fire: { color: '#E65100', icon: '🔥' },
  accident: { color: '#D84315', icon: '🚗' },
  medical: { color: '#2E7D32', icon: '🏥' },
  police: { color: '#1565C0', icon: '🚔' },
};

export default function MyReportsPage() {
  const router = useRouter();
  const { user } = useUserRole();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [editingIncident, setEditingIncident] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const currentUserId = user?.uid || auth.currentUser?.uid;
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserIncidents(
      currentUserId,
      (items) => {
        setIncidents(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error in user incidents stream:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleDelete = (incident) => {
    Alert.alert(
      'Delete Incident Report',
      'Are you sure you want to remove this incident record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIncident(incident.id);
            } catch (_error) {
              Alert.alert('Error', 'Failed to delete report.');
            }
          },
        },
      ]
    );
  };

  const handleStartEdit = (incident) => {
    setEditingIncident(incident);
    setEditDescription(incident.description || '');
  };

  const handleSaveUpdate = async () => {
    if (!editDescription.trim()) {
      Alert.alert('Error', 'Description cannot be empty.');
      return;
    }

    setEditLoading(true);
    try {
      await updateIncidentDetails(editingIncident.id, {
        description: editDescription.trim(),
      });
      setEditingIncident(null);
    } catch (_e) {
      Alert.alert('Error', 'Could not update report.');
    } finally {
      setEditLoading(false);
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

  const filteredIncidents = selectedFilter
    ? incidents.filter((inc) => inc.type === selectedFilter)
    : incidents;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/home1')}
          >
            <Text style={styles.backButtonText}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Incident Reports</Text>
          <TouchableOpacity
            style={styles.reportNewButton}
            onPress={() => router.push('/emergency/type')}
          >
            <Text style={styles.reportNewButtonText}>+ Report</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Track responses and status updates for your submitted emergencies
        </Text>
      </View>

      {/* Category Filter Pills */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterPill, selectedFilter === null && styles.filterPillActive]}
          onPress={() => setSelectedFilter(null)}
        >
          <Text style={[styles.filterPillText, selectedFilter === null && styles.filterPillTextActive]}>
            All ({incidents.length})
          </Text>
        </TouchableOpacity>

        {['fire', 'accident', 'medical', 'police'].map((cat) => {
          const count = incidents.filter((i) => i.type === cat).length;
          const isSelected = selectedFilter === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setSelectedFilter(isSelected ? null : cat)}
            >
              <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Loading your reports...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredIncidents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No reports to display</Text>
              <Text style={styles.emptySub}>
                Reports you submit will appear here with live responder updates.
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={() => router.push('/emergency/type')}
              >
                <Text style={styles.emptyCreateButtonText}>Report an Emergency</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredIncidents.map((incident) => {
              const theme = EMERGENCY_THEMES[incident.type] || EMERGENCY_THEMES.medical;
              const statusDetails = getStatusDetails(incident.status);

              return (
                <View
                  key={incident.id}
                  style={[styles.card, { borderLeftColor: statusDetails.color }]}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.cardIcon}>{theme.icon}</Text>
                      <View>
                        <Text style={styles.cardTitle}>
                          {incident.typeLabel || incident.type} Alert
                        </Text>
                        <Text style={styles.cardTimestamp}>
                          Reported: {formatTimestamp(incident.createdAt)}
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

                  {/* Description */}
                  {incident.description && (
                    <Text style={styles.description}>{incident.description}</Text>
                  )}

                  {/* Address */}
                  {incident.address && (
                    <View style={styles.addressRow}>
                      <Text style={styles.addressIcon}>📍</Text>
                      <Text style={styles.addressText}>{incident.address}</Text>
                    </View>
                  )}

                  {/* Photo Proof Thumbnail if available */}
                  {incident.imageUrl && (
                    <TouchableOpacity
                      style={styles.imageThumbContainer}
                      onPress={() => setPreviewImage(incident.imageUrl)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: incident.imageUrl }}
                        style={styles.imageThumbnail}
                      />
                      <Text style={styles.imageThumbBadge}>📷 View Photo</Text>
                    </TouchableOpacity>
                  )}

                  {/* Live Tracking Link */}
                  {incident.status !== STATUS_RESOLVED && (
                    <TouchableOpacity
                      style={[styles.trackButton, { backgroundColor: statusDetails.badgeBg, borderColor: statusDetails.badgeBorder }]}
                      onPress={() =>
                        router.push({
                          pathname: '/emergency/rescue',
                          params: {
                            incidentId: incident.id,
                            type: incident.type,
                            typeLabel: incident.typeLabel,
                          },
                        })
                      }
                    >
                      <Text style={[styles.trackButtonText, { color: statusDetails.color }]}>
                        🚨 Live Responder Tracking Status →
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Action Bar */}
                  <View style={styles.actionsBar}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.shareBtn]}
                      onPress={async () => {
                        try {
                          await Share.share({
                            message: `Emergency Alert: ${incident.typeLabel || incident.type}\nStatus: ${statusDetails.label}\nLocation: ${incident.address || ''}\nShared via LIFE Emergency App`,
                            title: 'Emergency Report',
                          });
                        } catch (_e) {}
                      }}
                    >
                      <Text style={styles.actionBtnText}>Share</Text>
                    </TouchableOpacity>

                    {incident.status === STATUS_PENDING && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() => handleStartEdit(incident)}
                      >
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDelete(incident)}
                    >
                      <Text style={styles.actionBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Edit Description Modal */}
      <Modal
        visible={editingIncident !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingIncident(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Report Details</Text>
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Describe emergency details..."
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setEditingIncident(null)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveUpdate}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveModalText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={Boolean(previewImage)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalOverlayDark}>
          <TouchableOpacity
            style={styles.closeImageBtn}
            onPress={() => setPreviewImage(null)}
          >
            <Text style={styles.closeImageText}>✕ Close</Text>
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
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
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  reportNewButton: {
    backgroundColor: '#DC143C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  reportNewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  filterContainer: {
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
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  emptyCreateButton: {
    backgroundColor: '#DC143C',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  emptyCreateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardIcon: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  cardTimestamp: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  addressIcon: {
    fontSize: 14,
  },
  addressText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
    flex: 1,
  },
  imageThumbContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  imageThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  imageThumbBadge: {
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
  trackButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareBtn: {
    backgroundColor: '#F3F4F6',
  },
  editBtn: {
    backgroundColor: '#EEF2FF',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    color: '#1F2937',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelModalText: {
    color: '#4B5563',
    fontWeight: '700',
  },
  saveModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#DC143C',
  },
  saveModalText: {
    color: '#fff',
    fontWeight: '800',
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  closeImageBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 10,
  },
  closeImageText: {
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
