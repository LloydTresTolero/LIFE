import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebase';

const VALID_RESPONDER_CODES = ['LIFE911', 'RESPONDER2026', 'LIFE2026', 'ADMIN911'];

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('user'); // 'user' or 'responder'
  const [responderCode, setResponderCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter an email address.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (selectedRole === 'responder') {
      const codeUpper = responderCode.trim().toUpperCase();
      if (!codeUpper || !VALID_RESPONDER_CODES.includes(codeUpper)) {
        setErrorMsg('Invalid Responder Authorization Code. Use LIFE911 or RESPONDER2026.');
        return;
      }
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const roleToSave = selectedRole === 'responder' ? 'responder' : 'user';

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: roleToSave,
        createdAt: new Date().toISOString(),
      });

      setPassword('');
      setConfirmPassword('');
      setEmail('');
      setResponderCode('');
      setSuccessMsg(
        roleToSave === 'responder'
          ? '✅ Responder account created! Redirecting...'
          : '✅ Account created! Redirecting to login...'
      );

      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    } catch (error) {
      setErrorMsg('⚠️ ' + (error?.message || 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#DC143C', '#FF1744', '#FF6B6B']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.appBadge}>LIFE EMERGENCY RESPONSE</Text>
            <Text style={styles.title}>Create Account</Text>

            {/* Role Selection */}
            <Text style={styles.roleLabel}>I am registering as:</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'user' && styles.roleOptionActive,
                ]}
                onPress={() => setSelectedRole('user')}
                activeOpacity={0.8}
              >
                <Text style={styles.roleIcon}>👤</Text>
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === 'user' && styles.roleTextActive,
                  ]}
                >
                  Reporter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'responder' && styles.roleOptionActive,
                ]}
                onPress={() => setSelectedRole('responder')}
                activeOpacity={0.8}
              >
                <Text style={styles.roleIcon}>🛡️</Text>
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === 'responder' && styles.roleTextActive,
                  ]}
                >
                  Responder
                </Text>
              </TouchableOpacity>
            </View>

            {selectedRole === 'responder' && (
              <View style={styles.responderCodeBox}>
                <Text style={styles.responderCodeLabel}>
                  Responder Authorization Code
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter code (e.g., LIFE911)"
                  placeholderTextColor="#888"
                  autoCapitalize="characters"
                  value={responderCode}
                  onChangeText={setResponderCode}
                />
                <Text style={styles.responderHint}>
                  Official code: <Text style={styles.boldText}>LIFE911</Text> or <Text style={styles.boldText}>RESPONDER2026</Text>
                </Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
            {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.signupButtonText}>
                  {selectedRole === 'responder'
                    ? 'Register as Responder'
                    : 'Create Reporter Account'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}> Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 28,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  appBadge: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#DC143C',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: '900',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  roleOptionActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC143C',
  },
  roleIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  roleTextActive: {
    color: '#DC143C',
  },
  responderCodeBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  responderCodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  responderHint: {
    fontSize: 11,
    color: '#B45309',
    marginTop: -8,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#1F2937',
  },
  signupButton: {
    backgroundColor: '#DC143C',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#DC143C',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  error: {
    color: '#DC143C',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  success: {
    color: '#059669',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: '800',
  },
});
