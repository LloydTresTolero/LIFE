import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import BottomNav from './components/BottomNav';

const SAMPLE_SHELTERS = [
  {
    id: '1',
    name: 'LAMAC Multi-Purpose Center',
    address: 'Aliwanay, Balamban, Cebu',
    capacity: 400,
    distance: null,
    latitude: 10.4848,
    longitude: 123.7187,
  },
  {
    id: '2',
    name: 'Balamban Municipal Hall (CPAC)',
    address: 'Poblacion, Balamban, Cebu',
    capacity: 300,
    distance: null,
    latitude: 10.5048,
    longitude: 123.7143,
  },
  {
    id: '3',
    name: 'Balamban National High School Gym',
    address: 'Poblacion, Balamban, Cebu',
    capacity: 500,
    distance: null,
    latitude: 10.5062,
    longitude: 123.7128,
  },
  {
    id: '4',
    name: 'Buanoy Barangay Evacuation Center',
    address: 'Buanoy, Balamban, Cebu',
    capacity: 200,
    distance: null,
    latitude: 10.5212,
    longitude: 123.7012,
  },
  {
    id: '5',
    name: 'Sunog Integrated School',
    address: 'Sunog, Balamban, Cebu',
    capacity: 250,
    distance: null,
    latitude: 10.4622,
    longitude: 123.7522,
  },
];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Shelters() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [shelters, setShelters] = useState(SAMPLE_SHELTERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLocationAndCalculateDistances = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

        const userLat = loc.coords.latitude;
        const userLon = loc.coords.longitude;

        const sheltersWithDistance = SAMPLE_SHELTERS.map((shelter) => {
          const lat = shelter.latitude ?? userLat + 0.01;
          const lon = shelter.longitude ?? userLon + 0.01;
          const distance = calculateDistance(userLat, userLon, lat, lon);
          return {
            ...shelter,
            distance,
            latitude: lat,
            longitude: lon,
          };
        });

        sheltersWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setShelters(sheltersWithDistance);
      } catch (error) {
        console.warn('Error calculating shelter distances:', error);
      } finally {
        setLoading(false);
      }
    };

    getLocationAndCalculateDistances();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Evacuation Facilities</Text>
            <Text style={styles.subtitle}>Verified shelters in Balamban, Cebu</Text>
          </View>
          <TouchableOpacity
            style={styles.mapLinkButton}
            onPress={() => router.push('/map')}
          >
            <Text style={styles.mapLinkText}>🗺️ Map View</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Calculating distance to nearest shelters...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!location && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Location permission not granted. Distances cannot be calculated.
              </Text>
            </View>
          )}

          {shelters.map((shelter) => (
            <View key={shelter.id} style={styles.shelterCard}>
              <View style={styles.shelterHeader}>
                <Text style={styles.shelterIcon}>🏢</Text>
                <View style={styles.shelterInfo}>
                  <Text style={styles.shelterName}>{shelter.name}</Text>
                  <Text style={styles.shelterAddress}>{shelter.address}</Text>
                </View>
              </View>

              <View style={styles.shelterDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Capacity:</Text>
                  <Text style={styles.detailValue}>{shelter.capacity} people</Text>
                </View>

                {shelter.distance !== null && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Distance:</Text>
                    <Text style={styles.distanceValue}>
                      {shelter.distance < 1
                        ? `${(shelter.distance * 1000).toFixed(0)} m`
                        : `${shelter.distance.toFixed(2)} km`}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps?q=${shelter.latitude},${shelter.longitude}`
                  )
                }
              >
                <Text style={styles.directionsBtnText}>📍 Get Driving & Walking Directions</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 In the event of an evacuation order, proceed safely to your nearest designated center. These facilities are maintained by the Balamban Municipal Disaster Risk Reduction and Management Office (MDRRMO).
            </Text>
          </View>
        </ScrollView>
      )}

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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  mapLinkButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#DC143C',
    borderRadius: 10,
  },
  mapLinkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 14,
    color: '#6B7280',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  shelterCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: '#2E7D32',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  shelterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shelterIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  shelterInfo: {
    flex: 1,
  },
  shelterName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  shelterAddress: {
    fontSize: 12,
    color: '#4B5563',
  },
  shelterDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
  },
  detailValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '700',
  },
  distanceValue: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '800',
  },
  directionsBtn: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: 4,
  },
  directionsBtnText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 12,
    lineHeight: 18,
  },
});
