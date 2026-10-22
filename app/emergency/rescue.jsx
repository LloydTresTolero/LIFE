import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import {
  getStatusDetails,
  STATUS_ACCEPTED,
  STATUS_ON_THE_WAY,
  STATUS_PENDING,
  STATUS_RESOLVED,
  subscribeToIncident,
} from '../../lib/incidentStore';

export default function RescueTracking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.incidentId;

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(Boolean(incidentId));

  useEffect(() => {
    if (!incidentId) return;

    const unsubscribe = subscribeToIncident(
      incidentId,
      (data) => {
        setIncident(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error tracking incident:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [incidentId]);

  const currentStatus = incident?.status || STATUS_PENDING;
  const statusInfo = getStatusDetails(currentStatus);

  const getHeadline = () => {
    switch (currentStatus) {
      case STATUS_PENDING:
        return 'Broadcast Sent — Awaiting Responder';
      case STATUS_ACCEPTED:
        return 'Report Acknowledged & Assigned';
      case STATUS_ON_THE_WAY:
        return 'Responders are on the Way!';
      case STATUS_RESOLVED:
        return 'Emergency Resolved';
      default:
        return 'Emergency Help Dispatched';
    }
  };

  const getSubheadline = () => {
    switch (currentStatus) {
      case STATUS_PENDING:
        return 'Nearby emergency units are receiving your alert.';
      case STATUS_ACCEPTED:
        return incident?.responderEmail
          ? `Acknowledged by unit: ${incident.responderEmail}`
          : 'An emergency unit has taken ownership of this dispatch.';
      case STATUS_ON_THE_WAY:
        return 'Emergency responders are en route to your specified coordinates.';
      case STATUS_RESOLVED:
        return 'The response team has concluded emergency handling for this report.';
      default:
        return 'Stay in a secure location while responders proceed.';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Banner with dynamic status styling */}
      <View style={[styles.banner, { backgroundColor: statusInfo.color }]}>
        <View style={styles.bannerRow}>
          <Text style={styles.statusEmoji}>{statusInfo.icon}</Text>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>{getHeadline()}</Text>
            <Text style={styles.bannerSubtitle}>{getSubheadline()}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Stepper Progression */}
        <View style={styles.stepperCard}>
          <Text style={styles.cardHeading}>Live Dispatch Progression</Text>
          <View style={styles.stepsContainer}>
            {[
              { key: STATUS_PENDING, label: '1. Pending' },
              { key: STATUS_ACCEPTED, label: '2. Accepted' },
              { key: STATUS_ON_THE_WAY, label: '3. En Route' },
              { key: STATUS_RESOLVED, label: '4. Resolved' },
            ].map((step, idx) => {
              const order = [STATUS_PENDING, STATUS_ACCEPTED, STATUS_ON_THE_WAY, STATUS_RESOLVED];
              const currentIndex = order.indexOf(currentStatus);
              const stepIndex = order.indexOf(step.key);
              const isPastOrCurrent = stepIndex <= currentIndex;
              const isCurrent = stepIndex === currentIndex;

              return (
                <View key={step.key} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      isPastOrCurrent && { backgroundColor: statusInfo.color },
                      isCurrent && styles.stepDotActive,
                    ]}
                  >
                    <Text style={styles.stepDotText}>{isPastOrCurrent ? '✓' : idx + 1}</Text>
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isPastOrCurrent && styles.stepLabelActive,
                      isCurrent && { color: statusInfo.color, fontWeight: '800' },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Incident Summary Card */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#DC143C" />
            <Text style={styles.loadingText}>Syncing live incident data...</Text>
          </View>
        ) : incident ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.incidentTypeBadge}>
                {incident.typeLabel || incident.type || 'Emergency'}
              </Text>
              <View
                style={[
                  styles.statusBadgePill,
                  { backgroundColor: statusInfo.badgeBg, borderColor: statusInfo.badgeBorder },
                ]}
              >
                <Text style={[styles.statusBadgePillText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>

            {incident.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Incident Address</Text>
                  <Text style={styles.infoValue}>{incident.address}</Text>
                </View>
              </View>
            )}

            {incident.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📝</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Details</Text>
                  <Text style={styles.infoValue}>{incident.description}</Text>
                </View>
              </View>
            )}

            {incident.imageUrl && (
              <View style={styles.imageBox}>
                <Text style={styles.infoLabel}>Attached Evidence</Text>
                <Image source={{ uri: incident.imageUrl }} style={styles.attachedImage} />
              </View>
            )}

            {incident.latitude != null && incident.longitude != null && (
              <TouchableOpacity
                style={styles.openMapButton}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`
                  )
                }
              >
                <Text style={styles.openMapText}>🗺️ Open Location in Google Maps</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={async () => {
              try {
                const mapLink =
                  incident?.latitude && incident?.longitude
                    ? `\n📍 Map: https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`
                    : '';
                await Share.share({
                  message: `🚨 LIFE Emergency Alert: I reported a ${incident?.typeLabel || 'emergency'} incident.\nCurrent Status: ${statusInfo.label}.${mapLink}\nShared via LIFE Emergency Response App.`,
                  title: 'Emergency Alert Notification',
                });
              } catch (e) {
                console.warn(e);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>📲 Share Alert with Family / Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/home1')}
            activeOpacity={0.8}
          >
            <Text style={styles.homeButtonText}>Return to Home Dashboard</Text>
          </TouchableOpacity>
        </View>
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
  banner: {
    padding: 20,
    paddingVertical: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusEmoji: {
    fontSize: 36,
    marginRight: 14,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  stepperCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 14,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotActive: {
    transform: [{ scale: 1.15 }],
  },
  stepDotText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#374151',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  incidentTypeBadge: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  statusBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  imageBox: {
    marginTop: 8,
    marginBottom: 12,
  },
  attachedImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: '#E5E7EB',
  },
  openMapButton: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  openMapText: {
    color: '#4338CA',
    fontSize: 13,
    fontWeight: '700',
  },
  actionsContainer: {
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  homeButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  homeButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
});
