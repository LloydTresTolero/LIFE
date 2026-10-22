import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
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
import { db } from '../firebase';
import BottomNav from './components/BottomNav';

const BALAMBAN_SHELTERS = [
  { id: 's1', name: 'LAMAC Multi-Purpose', address: 'Aliwanay, Balamban, Cebu', latitude: 10.4848, longitude: 123.7187 },
  { id: 's2', name: 'Balamban Municipal Hall', address: 'Poblacion, Balamban, Cebu', latitude: 10.5048, longitude: 123.7143 },
  { id: 's3', name: 'Balamban NHS Gym', address: 'Poblacion, Balamban, Cebu', latitude: 10.5062, longitude: 123.7128 },
  { id: 's4', name: 'Buanoy Evacuation Center', address: 'Buanoy, Balamban, Cebu', latitude: 10.5212, longitude: 123.7012 },
  { id: 's5', name: 'Sunog Integrated School', address: 'Sunog, Balamban, Cebu', latitude: 10.4622, longitude: 123.7522 },
];

const EMERGENCY_COLORS = {
  fire: '#E65100',
  accident: '#D84315',
  medical: '#2E7D32',
  police: '#1565C0',
};

const openInMaps = (lat, lon, label) => {
  const url = `https://www.google.com/maps?q=${lat},${lon}`;
  Linking.openURL(url).catch(() => {});
};

export default function MapScreen() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch (_e) {}
    })();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.latitude != null && d.longitude != null) {
            list.push({ id: docSnap.id, ...d });
          }
        });
        setIncidents(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Map incident listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Loading map coordinates...</Text>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Emergency Map</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.subtitle}>
          Tap any shelter or emergency location to open live directions in Google Maps.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Active Emergency Locations ({incidents.length})</Text>
        {incidents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No emergency incidents with GPS currently reported.</Text>
          </View>
        ) : (
          incidents.map((inc) => {
            const color = EMERGENCY_COLORS[inc.type] || '#DC143C';
            return (
              <TouchableOpacity
                key={inc.id}
                style={[styles.card, { borderLeftColor: color }]}
                onPress={() => openInMaps(inc.latitude, inc.longitude, inc.typeLabel)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardIcon}>
                  {inc.type === 'fire'
                    ? '🔥'
                    : inc.type === 'accident'
                    ? '🚗'
                    : inc.type === 'police'
                    ? '🚔'
                    : '🏥'}
                </Text>
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{inc.typeLabel || inc.type}</Text>
                  <Text style={styles.cardAddress} numberOfLines={2}>
                    {inc.address || inc.description || 'Coordinates shared'}
                  </Text>
                  <Text style={styles.coordsSub}>
                    {inc.latitude.toFixed(5)}, {inc.longitude.toFixed(5)}
                  </Text>
                </View>
                <Text style={styles.openText}>Directions →</Text>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Balamban Evacuation Centers ({BALAMBAN_SHELTERS.length})
        </Text>
        {BALAMBAN_SHELTERS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.card}
            onPress={() => openInMaps(s.latitude, s.longitude, s.name)}
            activeOpacity={0.8}
          >
            <Text style={styles.cardIcon}>🏢</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{s.name}</Text>
              <Text style={styles.cardAddress}>{s.address}</Text>
            </View>
            <Text style={styles.openText}>Directions →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={() => {
          if (location) {
            openInMaps(location.coords.latitude, location.coords.longitude, 'My location');
          } else {
            openInMaps(10.5048, 123.7143, 'Balamban center');
          }
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.myLocationText}>📍 Open My Location in Google Maps</Text>
      </TouchableOpacity>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    color: '#DC143C',
    fontSize: 14,
    fontWeight: '700',
  },
  title: { fontSize: 18, fontWeight: '900', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280' },
  scrollContent: { padding: 18, paddingBottom: 120 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937', marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#2E7D32',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardContent: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  cardAddress: { fontSize: 12, color: '#4B5563' },
  coordsSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  openText: { fontSize: 12, color: '#DC143C', fontWeight: '800', marginLeft: 8 },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  emptyText: { fontSize: 13, color: '#6B7280' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  myLocationButton: {
    position: 'absolute',
    bottom: 74,
    left: 20,
    right: 20,
    backgroundColor: '#DC143C',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#DC143C',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  myLocationText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
