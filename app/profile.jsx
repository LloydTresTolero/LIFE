import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { StyleSheet, Text, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../firebase';
import { useUserRole } from '../lib/useUserRole';
import BottomNav from './components/BottomNav';

export default function Profile() {
  const router = useRouter();
  const { isResponder, user } = useUserRole();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of your session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Account Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, isResponder && styles.avatarResponder]}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email || 'Logged in user'}</Text>

          {/* Role Badge */}
          <View
            style={[
              styles.roleBadge,
              isResponder ? styles.roleBadgeResponder : styles.roleBadgeReporter,
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                isResponder ? styles.roleBadgeTextResponder : styles.roleBadgeTextReporter,
              ]}
            >
              {isResponder ? '🛡️ Authorized Emergency Responder' : '👤 Registered Emergency Reporter'}
            </Text>
          </View>
        </View>

        {/* Responder Command Center Quick Access */}
        {isResponder && (
          <TouchableOpacity
            style={styles.responderActionBanner}
            onPress={() => router.push('/responder')}
            activeOpacity={0.85}
          >
            <Text style={styles.responderActionIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.responderActionTitle}>Responder Command Center</Text>
              <Text style={styles.responderActionSubtitle}>
                Manage active incoming emergency calls & live dispatch
              </Text>
            </View>
            <Text style={styles.responderActionArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>My Incident Reports</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/incidents')}
          >
            <Text style={styles.menuIcon}>🚨</Text>
            <Text style={styles.menuText}>Public Incident Feed</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/shelters')}
          >
            <Text style={styles.menuIcon}>🏢</Text>
            <Text style={styles.menuText}>Evacuation Facilities</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/map')}
          >
            <Text style={styles.menuIcon}>🗺️</Text>
            <Text style={styles.menuText}>Balamban Emergency Map</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                'About LIFE',
                'LIFE (Life-saving Integrated Facility for Emergencies)\nVersion 2.0.0\n\nBuilt for rapid dispatch, real-time tracking, and cross-network reliability in Balamban, Cebu.'
              )
            }
          >
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>About LIFE Emergency App</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarResponder: {
    backgroundColor: '#1E293B',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  email: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  roleBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleBadgeReporter: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  roleBadgeResponder: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  roleBadgeTextReporter: {
    color: '#4B5563',
  },
  roleBadgeTextResponder: {
    color: '#1D4ED8',
  },
  responderActionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  responderActionIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  responderActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  responderActionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  responderActionArrow: {
    fontSize: 20,
    color: '#F8FAFC',
    fontWeight: '800',
    marginLeft: 8,
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonText: {
    color: '#DC143C',
    fontSize: 15,
    fontWeight: '800',
  },
});
