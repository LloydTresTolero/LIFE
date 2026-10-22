import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import BottomNav from '../components/BottomNav';

const EMERGENCY_TYPES = [
  {
    id: 'fire',
    label: 'Fire Incident',
    subtitle: 'Blaze, smoke, burning structure',
    icon: '🔥',
    color: '#E65100', // Deep Orange
    gradient: '#FF5722',
  },
  {
    id: 'accident',
    label: 'Vehicular Accident',
    subtitle: 'Collision, crash, road hazard',
    icon: '🚗',
    color: '#D84315', // Darker Amber/Orange
    gradient: '#FF8A65',
  },
  {
    id: 'medical',
    label: 'Medical Emergency',
    subtitle: 'Injury, unconscious, heart attack',
    icon: '🏥',
    color: '#2E7D32', // Green
    gradient: '#4CAF50',
  },
  {
    id: 'police',
    label: 'Police / Security Threat',
    subtitle: 'Crime, violence, danger, intruder',
    icon: '🚔',
    color: '#1565C0', // Blue
    gradient: '#1E88E5',
  },
];

export default function EmergencyType() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords(loc.coords);

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const parts = [
            addr.street,
            addr.district || addr.subregion,
            addr.city,
            addr.region,
          ].filter(Boolean);
          setAddress(parts.join(', ') || 'Address located');
        }
      } catch (_e) {
        setAddress('Address located');
      }
    } catch (_error) {
      console.warn('Location fetch warning');
    }
  };

  const handleSelectType = (type) => {
    router.push({
      pathname: '/emergency/report',
      params: {
        type: type.id,
        typeLabel: type.label,
        cachedAddress: address || '',
        lat: coords?.latitude ? String(coords.latitude) : '',
        lon: coords?.longitude ? String(coords.longitude) : '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenHeader}>Emergency Dispatch</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.instructionBanner}>
          <Text style={styles.title}>What is your emergency?</Text>
          <Text style={styles.subtitle}>
            Tap a category below for rapid dispatch assistance.
          </Text>
        </View>

        {/* Emergency Call Button */}
        <TouchableOpacity
          style={styles.callEmergencyButton}
          onPress={() => {
            Alert.alert(
              'Call 911 Emergency',
              'This will immediately dial the 911 emergency hotline. Do you want to proceed?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call 911', style: 'destructive', onPress: () => Linking.openURL('tel:911') },
              ]
            );
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.callEmergencyIcon}>📞</Text>
          <View>
            <Text style={styles.callEmergencyTitle}>DIAL 911 HOTLINE NOW</Text>
            <Text style={styles.callEmergencySubtext}>Direct call to national emergency services</Text>
          </View>
        </TouchableOpacity>

        {/* Categories Grid */}
        <View style={styles.gridContainer}>
          {EMERGENCY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeCard, { borderLeftColor: type.color }]}
              onPress={() => handleSelectType(type)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: type.color }]}>
                <Text style={styles.typeIcon}>{type.icon}</Text>
              </View>
              <View style={styles.typeTextContainer}>
                <Text style={styles.typeLabel}>{type.label}</Text>
                <Text style={styles.typeSub}>{type.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location Preview Card */}
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>📍 GPS Location Status</Text>
          <Text style={styles.locationAddress}>
            {address || 'Fetching your GPS coordinates...'}
          </Text>
          {coords && (
            <Text style={styles.coordsText}>
              Lat: {coords.latitude.toFixed(5)}, Lon: {coords.longitude.toFixed(5)}
            </Text>
          )}
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
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC143C',
  },
  screenHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  instructionBanner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  callEmergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 24,
    shadowColor: '#DC143C',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  callEmergencyIcon: {
    fontSize: 30,
    marginRight: 14,
  },
  callEmergencyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  callEmergencySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  gridContainer: {
    gap: 14,
    marginBottom: 24,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeIcon: {
    fontSize: 26,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  typeSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  locationCard: {
    backgroundColor: '#EEF2F6',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  coordsText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
});
