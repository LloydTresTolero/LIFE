import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUserRole } from '../../lib/useUserRole';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isResponder } = useUserRole();

  const isHomeActive = pathname === '/home1' || pathname === '/home';
  const isFacilitiesActive = pathname === '/shelters' || pathname === '/map';
  const isContactsActive = pathname === '/contacts';
  const isProfileActive = pathname === '/profile';
  const isHelpActive = pathname.startsWith('/emergency');
  const isResponderActive = pathname.startsWith('/responder');

  return (
    <View style={styles.container}>
      {/* Home / Dispatch */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push(isResponder ? '/responder' : '/home1')}
        activeOpacity={0.8}
      >
        <Text style={[styles.icon, (isHomeActive || isResponderActive) && styles.iconActive]}>
          {isResponder ? '🛡️' : '🏠'}
        </Text>
        <Text style={[styles.label, (isHomeActive || isResponderActive) && styles.labelActive]}>
          {isResponder ? 'Command' : 'Home'}
        </Text>
      </TouchableOpacity>

      {/* Facilities / Shelters */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/shelters')}
        activeOpacity={0.8}
      >
        <Text style={[styles.icon, isFacilitiesActive && styles.iconActive]}>🏢</Text>
        <Text style={[styles.label, isFacilitiesActive && styles.labelActive]}>Facilities</Text>
      </TouchableOpacity>

      {/* Central SOS Button */}
      <View style={styles.helpSlot}>
        <TouchableOpacity
          style={[styles.helpButton, isHelpActive && styles.helpButtonActive]}
          onPress={() => router.push('/emergency/type')}
          accessibilityRole="button"
          accessibilityLabel="Report Emergency"
          activeOpacity={0.85}
        >
          <Text style={styles.helpButtonText}>HELP</Text>
        </TouchableOpacity>
      </View>

      {/* Contacts */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/contacts')}
        activeOpacity={0.8}
      >
        <Text style={[styles.icon, isContactsActive && styles.iconActive]}>📞</Text>
        <Text style={[styles.label, isContactsActive && styles.labelActive]}>Contacts</Text>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/profile')}
        activeOpacity={0.8}
      >
        <Text style={[styles.icon, isProfileActive && styles.iconActive]}>👤</Text>
        <Text style={[styles.label, isProfileActive && styles.labelActive]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  helpSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#DC143C',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    marginTop: -18,
  },
  helpButtonActive: {
    backgroundColor: '#B0102E',
  },
  helpButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  icon: {
    fontSize: 22,
    marginBottom: 3,
  },
  iconActive: {
    transform: [{ scale: 1.15 }],
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  labelActive: {
    color: '#DC143C',
    fontWeight: '800',
  },
});
