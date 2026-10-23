import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from './components/BottomNav';

const EMERGENCY_SERVICES = [
  { name: 'National Emergency Hotline', number: '911', icon: '🚨', type: 'national' },
  { name: 'Balamban Police Station', number: '(032) 333-2144', icon: '🚔', type: 'local' },
  { name: 'Balamban Fire Station (BFP)', number: '(032) 333-2222', icon: '🔥', type: 'local' },
  { name: 'Balamban MDRRMO Rescue', number: '(032) 333-2555', icon: '🚑', type: 'local' },
  { name: 'Balamban District Hospital', number: '(032) 333-2287', icon: '🏥', type: 'local' },
];

const FAMILY_CONTACTS = [
  { name: 'Mama', number: '+639171234567', icon: '👤' },
  { name: 'Papa', number: '+639181234567', icon: '👤' },
  { name: 'Ate', number: '+639191234567', icon: '👤' },
  { name: 'Kuya', number: '+639201234567', icon: '👤' },
  { name: 'Uncle', number: '+639211234567', icon: '👤' },
  { name: 'Aunty', number: '+639221234567', icon: '👤' },
];

export default function Contacts() {
  const handleCall = (number) => {
    Linking.openURL(`tel:${number.replace(/\s+/g, '')}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>Direct hotlines & trusted personal emergency contacts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hotlines */}
        <Text style={styles.sectionHeader}>Balamban Emergency Hotlines</Text>
        <View style={styles.list}>
          {EMERGENCY_SERVICES.map((service, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.contactCard, styles.emergencyCard]}
              onPress={() => handleCall(service.number)}
              activeOpacity={0.8}
            >
              <Text style={styles.contactIcon}>{service.icon}</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{service.name}</Text>
                <Text style={styles.emergencyNumber}>{service.number}</Text>
              </View>
              <View style={styles.callBadge}>
                <Text style={styles.callBadgeText}>📞 Call</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Family Contacts */}
        <Text style={[styles.sectionHeader, { marginTop: 20 }]}>Family & Trusted Contacts</Text>
        <View style={styles.list}>
          {FAMILY_CONTACTS.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={() => handleCall(contact.number)}
              activeOpacity={0.8}
            >
              <Text style={styles.contactIcon}>{contact.icon}</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactNumber}>{contact.number}</Text>
              </View>
              <View style={styles.callBadgeGray}>
                <Text style={styles.callBadgeGrayText}>📞 Call</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Tap any card to dial immediately. In life-threatening emergencies, always call the National Hotline (911) or local MDRRMO first.
          </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  emergencyCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#DC143C',
  },
  contactIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  emergencyNumber: {
    fontSize: 13,
    color: '#DC143C',
    fontWeight: '800',
  },
  callBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  callBadgeText: {
    color: '#DC143C',
    fontWeight: '800',
    fontSize: 12,
  },
  callBadgeGray: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  callBadgeGrayText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 12,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
});
