import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../firebase';
import { createIncident } from '../../lib/incidentStore';

const EMERGENCY_THEMES = {
  fire: {
    color: '#E65100',
    title: 'Fire Incident',
    icon: '🔥',
    bg: '#FFF3E0',
  },
  accident: {
    color: '#D84315',
    title: 'Vehicular Accident',
    icon: '🚗',
    bg: '#FBE9E7',
  },
  medical: {
    color: '#2E7D32',
    title: 'Medical Emergency',
    icon: '🏥',
    bg: '#E8F5E9',
  },
  police: {
    color: '#1565C0',
    title: 'Police / Security Threat',
    icon: '🚔',
    bg: '#E3F2FD',
  },
};

export default function EmergencyReport() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const emergencyType = params.type || 'medical';
  const typeLabel = params.typeLabel || EMERGENCY_THEMES[emergencyType]?.title || 'Emergency';

  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(params.cachedAddress || '');
  const [gettingLocation, setGettingLocation] = useState(!params.cachedAddress);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const theme = EMERGENCY_THEMES[emergencyType] || EMERGENCY_THEMES.medical;

  useEffect(() => {
    // If coords were passed from previous screen, seed them
    if (params.lat && params.lon) {
      setLocation({
        coords: {
          latitude: parseFloat(params.lat),
          longitude: parseFloat(params.lon),
        },
      });
      setGettingLocation(false);
    } else {
      getCurrentLocation();
    }
  }, [params.lat, params.lon]);

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Enabling location helps responders reach your exact coordinate faster.'
        );
        setGettingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

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
      console.warn('Location retrieval warning');
    } finally {
      setGettingLocation(false);
    }
  };

  const handlePickImage = () => {
    Alert.alert(
      'Attach Incident Photo',
      'Choose an option to attach visual proof (optional):',
      [
        {
          text: 'Take Photo with Camera',
          onPress: takePhotoWithCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6, // Compressed to reduce data usage and latency
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (_e) {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required to attach images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (_e) {
      Alert.alert('Error', 'Could not access photo library.');
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Authentication Required', 'You must be logged in to submit an emergency report.', [
        { text: 'Log In', onPress: () => router.replace('/login') },
      ]);
      return;
    }

    if (loading) return; // Prevent duplicate submissions

    setLoading(true);
    setStatusMessage(imageUri ? 'Uploading photo & transmitting report...' : 'Transmitting emergency report...');

    try {
      const incidentData = {
        type: emergencyType,
        typeLabel: typeLabel,
        description: description.trim() || 'Urgent emergency assistance requested.',
        latitude: location?.coords?.latitude ?? null,
        longitude: location?.coords?.longitude ?? null,
        address: address || (location ? `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` : 'Location not available'),
        reportedBy: user.uid,
        reportedByEmail: user.email,
      };

      // createIncident never throws due to image failure — image errors are non-fatal
      const created = await createIncident(incidentData, imageUri);

      // Notify reporter if image failed but report was still saved
      if (created._imageUploadFailed && imageUri) {
        Alert.alert(
          'Report Submitted',
          'Your emergency report was sent successfully. The photo could not be attached due to a network issue, but responders have received your location and details.',
          [{ text: 'OK' }]
        );
      } else {
        setStatusMessage('Report received by responders!');
      }

      // Redirect to live tracking
      router.replace({
        pathname: '/emergency/rescue',
        params: {
          incidentId: created.id,
          type: emergencyType,
          typeLabel: typeLabel,
        },
      });
    } catch (error) {
      console.error('[LIFE] Emergency report submission error:', error);
      Alert.alert(
        'Submission Failed',
        'Could not transmit your emergency report. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            onPress: handleSubmit,
          },
        ]
      );
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Banner */}
          <View style={[styles.headerBanner, { borderLeftColor: theme.color, backgroundColor: theme.bg }]}>
            <View style={styles.headerRow}>
              <Text style={styles.headerIcon}>{theme.icon}</Text>
              <View style={styles.headerTextGroup}>
                <Text style={[styles.headerTitle, { color: theme.color }]}>{typeLabel}</Text>
                <Text style={styles.headerSubtitle}>Immediate responder dispatch</Text>
              </View>
            </View>
          </View>

          {/* Call 911 Direct Action */}
          <TouchableOpacity
            style={[styles.call911Button, { backgroundColor: theme.color }]}
            onPress={() => {
              Alert.alert(
                'Direct Emergency Call',
                'Dial 911 emergency dispatch immediately?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Call 911', style: 'destructive', onPress: () => Linking.openURL('tel:911') },
                ]
              );
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.call911Text}>📞 DIAL 911 IMMEDIATELY</Text>
          </TouchableOpacity>

          {/* Section: GPS Location */}
          <View style={styles.cardSection}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>📍 Current Incident Location</Text>
              <TouchableOpacity
                onPress={getCurrentLocation}
                disabled={gettingLocation}
                style={styles.refreshBadge}
              >
                <Text style={styles.refreshBadgeText}>🔄 Refresh GPS</Text>
              </TouchableOpacity>
            </View>

            {gettingLocation ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.color} />
                <Text style={styles.loadingAddressText}>Locating your coordinates...</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.addressDisplay}>
                  {address || 'Location acquired'}
                </Text>
                {location && (
                  <Text style={styles.coordsDisplay}>
                    Coordinates: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                  </Text>
                )}
                {!location && !address && (
                  <Text style={styles.warnLocationText}>
                    ⚠️ GPS location unavailable. Responders will rely on your description.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Section: Optional Image Attachment */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>📸 Photo Proof (Optional)</Text>
            <Text style={styles.sectionSub}>
              Attach a photo to help responders assess the scene. Reporting is not blocked if omitted.
            </Text>

            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <View style={styles.imageActionsRow}>
                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={handlePickImage}
                  >
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={handleRemoveImage}
                  >
                    <Text style={styles.removePhotoText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.attachPhotoButton}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Text style={styles.attachPhotoIcon}>📷</Text>
                <View>
                  <Text style={styles.attachPhotoTitle}>Add Photo Evidence</Text>
                  <Text style={styles.attachPhotoSub}>Take a photo or choose from library</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Section: Description */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>📝 Description (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Provide quick details (e.g., 2 victims injured, smoke coming from 2nd floor, blocked roadway)..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button with Loading Indicator */}
          {loading && (
            <View style={styles.submissionProgressBox}>
              <ActivityIndicator size="small" color="#DC143C" />
              <Text style={styles.submissionProgressText}>
                {statusMessage || 'Transmitting report to dispatchers...'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.color },
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>🚨 SUBMIT EMERGENCY REPORT</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel Report</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerBanner: {
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 34,
    marginRight: 14,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  call911Button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  call911Text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardSection: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  refreshBadge: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  refreshBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  loadingAddressText: {
    fontSize: 13,
    color: '#6B7280',
  },
  addressDisplay: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  coordsDisplay: {
    fontSize: 11,
    color: '#6B7280',
  },
  warnLocationText: {
    fontSize: 12,
    color: '#DC143C',
    fontWeight: '600',
    marginTop: 4,
  },
  attachPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  attachPhotoIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  attachPhotoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  attachPhotoSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#E5E7EB',
  },
  imageActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  changePhotoButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  removePhotoButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  removePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC143C',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 90,
  },
  submissionProgressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  submissionProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC143C',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '700',
  },
});
