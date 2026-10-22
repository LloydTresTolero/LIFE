import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndRoute = async () => {
      // Small splash delay for branding
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!isMounted) return;

      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const role = userDoc.exists() ? userDoc.data().role : 'user';
          if (!isMounted) return;

          if (role === 'responder' || role === 'admin') {
            router.replace('/responder');
          } else {
            router.replace('/home1');
          }
          return;
        } catch (e) {
          console.warn('Splash auth check error:', e);
        }
      }

      if (isMounted) {
        router.replace('/login');
      }
    };

    checkAuthAndRoute();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <LinearGradient
      colors={['#DC143C', '#FF1744', '#FF6B6B']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <View style={styles.outerRing}>
          <View style={styles.innerRing}>
            <Text style={styles.logoText}>LIFE</Text>
          </View>
        </View>
        <Text style={styles.tagline}>EMERGENCY RESPONSE</Text>
        <Text style={styles.subTagline}>Integrated Facility for Life-Saving Actions</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  innerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  tagline: {
    marginTop: 24,
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },
  subTagline: {
    marginTop: 6,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
});
