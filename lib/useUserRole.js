import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';

export async function getUserRole(uid) {
  if (!uid) return 'user';
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().role || 'user';
    }
    return 'user';
  } catch (e) {
    console.error('Error fetching user role:', e);
    return 'user';
  }
}

export function useUserRole() {
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    // Listen for auth state changes
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setRole('user');
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setRole('user');
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, 'users', currentUser.uid);

    // Use onSnapshot so role updates in Firestore reflect immediately in app
    const unsubSnapshot = onSnapshot(
      ref,
      async (snap) => {
        if (snap.exists()) {
          setRole(snap.data().role || 'user');
          setLoading(false);
        } else {
          // Initialize user document if missing
          try {
            await setDoc(ref, {
              email: currentUser.email,
              role: 'user',
              createdAt: new Date().toISOString(),
            });
            setRole('user');
          } catch (err) {
            console.warn('Could not auto-create user document:', err);
            setRole('user');
          } finally {
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error('useUserRole snapshot error:', error);
        setRole('user');
        setLoading(false);
      }
    );

    return () => unsubSnapshot();
  }, [currentUser?.uid]);

  const isResponder = role === 'responder' || role === 'admin';
  const isAdmin = role === 'admin';
  const isReporter = !isResponder;

  return {
    role,
    loading,
    isResponder,
    isAdmin,
    isReporter,
    user: currentUser,
  };
}
