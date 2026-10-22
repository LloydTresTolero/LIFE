import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  arrayUnion,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { isSupabaseConfigured, supabase } from '../supabase';

// Official Incident Status Workflow
export const STATUS_PENDING = 'pending';
export const STATUS_ACCEPTED = 'accepted';
export const STATUS_ON_THE_WAY = 'on_the_way';
export const STATUS_RESOLVED = 'resolved';

export const STATUS_CONFIG = {
  [STATUS_PENDING]: {
    key: STATUS_PENDING,
    label: 'Pending',
    shortLabel: 'Pending',
    description: 'Awaiting responder acknowledgment',
    color: '#D97706',       // Amber-600
    badgeBg: '#FEF3C7',     // Amber-100
    badgeBorder: '#FCD34D',
    icon: '⏳',
  },
  [STATUS_ACCEPTED]: {
    key: STATUS_ACCEPTED,
    label: 'Accepted',
    shortLabel: 'Accepted',
    description: 'Responder has acknowledged the report',
    color: '#2563EB',       // Blue-600
    badgeBg: '#DBEAFE',     // Blue-100
    badgeBorder: '#93C5FD',
    icon: '✅',
  },
  [STATUS_ON_THE_WAY]: {
    key: STATUS_ON_THE_WAY,
    label: 'Responders on the Way',
    shortLabel: 'En Route',
    description: 'Response team dispatched to location',
    color: '#7C3AED',       // Purple-600
    badgeBg: '#EDE9FE',     // Purple-100
    badgeBorder: '#C4B5FD',
    icon: '🚑',
  },
  [STATUS_RESOLVED]: {
    key: STATUS_RESOLVED,
    label: 'Resolved',
    shortLabel: 'Resolved',
    description: 'Emergency situation handled and marked resolved',
    color: '#059669',       // Green-600
    badgeBg: '#D1FAE5',     // Green-100
    badgeBorder: '#6EE7B7',
    icon: '🏁',
  },
};

/**
 * Normalizes legacy status values into the 4 official statuses.
 */
export function normalizeStatus(status) {
  if (!status) return STATUS_PENDING;
  const s = String(status).toLowerCase().trim();
  if (s === 'pending') return STATUS_PENDING;
  if (s === 'accepted') return STATUS_ACCEPTED;
  if (s === 'on_the_way' || s === 'en_route' || s === 'on the way') return STATUS_ON_THE_WAY;
  if (s === 'resolved' || s === 'completed' || s === 'done') return STATUS_RESOLVED;
  if (s === 'active') return STATUS_PENDING;
  return STATUS_PENDING;
}

export function getStatusDetails(status) {
  const norm = normalizeStatus(status);
  return STATUS_CONFIG[norm] || STATUS_CONFIG[STATUS_PENDING];
}

/**
 * Maps Supabase PostgreSQL snake_case columns to app-standard camelCase.
 */
export function mapSupabaseIncident(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    type: row.type || 'medical',
    typeLabel: row.type_label || row.typeLabel || row.type || 'Emergency',
    description: row.description || '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    address: row.address || '',
    reportedBy: row.reported_by || row.reportedBy,
    reportedByEmail: row.reported_by_email || row.reportedByEmail || '',
    imageUrl: row.image_url || row.imageUrl || null,
    status: normalizeStatus(row.status),
    responderId: row.responder_id || row.responderId || null,
    responderEmail: row.responder_email || row.responderEmail || null,
    statusHistory: Array.isArray(row.status_history)
      ? row.status_history
      : row.statusHistory || [],
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

/**
 * Uploads an image file to Supabase Storage (bucket: 'incident-photos').
 * Falls back to Firebase Storage if Supabase is not yet configured.
 */
export async function uploadIncidentImage(imageUri, userId = 'anon') {
  if (!imageUri) return null;

  // 1. Try Supabase Storage first if configured
  if (isSupabaseConfigured()) {
    try {
      const filename = `${Date.now()}_${userId || 'user'}.jpg`;
      const filePath = `incidents/${filename}`;

      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('incident-photos')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from('incident-photos')
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      } else {
        console.warn('Supabase storage upload error:', uploadError.message);
      }
    } catch (sbError) {
      console.warn('Supabase image upload exception:', sbError?.message || sbError);
    }
  }

  // 2. Fallback to Firebase Storage if present
  try {
    const filename = `incidents/${Date.now()}_${userId}.jpg`;
    const storageRef = ref(storage, filename);

    const fetchPromise = (async () => {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      return await getDownloadURL(storageRef);
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Image upload timed out')), 15000)
    );

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.warn('⚠️ Warning: Image upload failed or skipped:', error?.message || error);
    return null;
  }
}

/**
 * Creates and persists a new emergency incident report to Supabase (and Firebase).
 */
export async function createIncident(incidentData, imageUri = null) {
  let imageUrl = incidentData.imageUrl || null;

  if (imageUri && !imageUrl) {
    try {
      imageUrl = await uploadIncidentImage(imageUri, incidentData.reportedBy);
    } catch (e) {
      console.warn('Image upload error ignored for emergency submission:', e);
    }
  }

  const initialStatus = STATUS_PENDING;
  const initialHistory = [
    {
      status: initialStatus,
      timestamp: new Date().toISOString(),
      note: 'Report submitted by user',
    },
  ];

  // 1. Save to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const payload = {
        type: incidentData.type || 'medical',
        type_label: incidentData.typeLabel || 'Emergency',
        description: (incidentData.description || '').trim(),
        latitude: incidentData.latitude ?? null,
        longitude: incidentData.longitude ?? null,
        address: incidentData.address || 'Location shared',
        reported_by: incidentData.reportedBy || null,
        reported_by_email: incidentData.reportedByEmail || '',
        image_url: imageUrl,
        status: initialStatus,
        responder_id: null,
        responder_email: null,
        status_history: initialHistory,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('incidents')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Supabase incident insert error:', error.message);
      } else if (data) {
        return mapSupabaseIncident(data);
      }
    } catch (sbErr) {
      console.warn('Supabase createIncident exception:', sbErr);
    }
  }

  // 2. Save to Firestore (as backup or primary if Supabase not yet configured)
  const docData = {
    type: incidentData.type || 'medical',
    typeLabel: incidentData.typeLabel || 'Emergency',
    description: (incidentData.description || '').trim(),
    latitude: incidentData.latitude ?? null,
    longitude: incidentData.longitude ?? null,
    address: incidentData.address || 'Location shared',
    reportedBy: incidentData.reportedBy || null,
    reportedByEmail: incidentData.reportedByEmail || '',
    imageUrl: imageUrl,
    status: initialStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    statusHistory: initialHistory,
    responderId: null,
    responderEmail: null,
  };

  const docRef = await addDoc(collection(db, 'incidents'), docData);
  return { id: docRef.id, ...docData, imageUrl };
}

/**
 * Updates the incident status across Supabase and Firestore.
 */
export async function updateIncidentStatus(incidentId, newStatus, responderInfo = null) {
  if (!incidentId) throw new Error('Incident ID required');
  const normalized = normalizeStatus(newStatus);

  const statusHistoryEntry = {
    status: normalized,
    timestamp: new Date().toISOString(),
    updatedBy: responderInfo?.email || 'Authorized Responder',
    responderId: responderInfo?.uid || responderInfo?.id || null,
  };

  // 1. Update in Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      // First fetch current history to append
      const { data: current } = await supabase
        .from('incidents')
        .select('status_history')
        .eq('id', incidentId)
        .maybeSingle();

      const existingHistory = Array.isArray(current?.status_history)
        ? current.status_history
        : [];

      const sbUpdate = {
        status: normalized,
        updated_at: new Date().toISOString(),
        status_history: [...existingHistory, statusHistoryEntry],
      };

      if (responderInfo) {
        sbUpdate.responder_id = responderInfo.uid || responderInfo.id || null;
        sbUpdate.responder_email = responderInfo.email || null;
      }

      await supabase.from('incidents').update(sbUpdate).eq('id', incidentId);
    } catch (sbErr) {
      console.warn('Supabase updateIncidentStatus warning:', sbErr);
    }
  }

  // 2. Update in Firestore
  try {
    const docRef = doc(db, 'incidents', incidentId);
    const updatePayload = {
      status: normalized,
      updatedAt: serverTimestamp(),
      statusHistory: arrayUnion(statusHistoryEntry),
    };

    if (responderInfo) {
      updatePayload.responderId = responderInfo.uid || responderInfo.id || null;
      updatePayload.responderEmail = responderInfo.email || null;
    }

    await updateDoc(docRef, updatePayload);
  } catch (fsErr) {
    // If it's a Supabase UUID, it may not exist in Firestore
  }

  return true;
}

/**
 * Real-time listener for ALL incidents (used by Responder Dashboard).
 * Uses Supabase Realtime WebSocket when configured, otherwise Firestore onSnapshot.
 */
export function subscribeToAllIncidents(callback, onError = null) {
  if (isSupabaseConfigured()) {
    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        if (onError) onError(error);
        return;
      }

      if (data) {
        callback(data.map(mapSupabaseIncident));
      }
    };

    // Initial load
    fetchIncidents();

    // Subscribe to Supabase Realtime channel
    const channel = supabase
      .channel('realtime:all_incidents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Fallback to Firestore listener
  const incidentsRef = collection(db, 'incidents');
  const q = query(incidentsRef, orderBy('createdAt', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          ...data,
          status: normalizeStatus(data.status),
        });
      });
      callback(items);
    },
    (error) => {
      console.error('Error listening to all incidents:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for incidents reported by a SPECIFIC user.
 */
export function subscribeToUserIncidents(userId, callback, onError = null) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  if (isSupabaseConfigured()) {
    const fetchUserIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('reported_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (onError) onError(error);
        return;
      }

      if (data) {
        callback(data.map(mapSupabaseIncident));
      }
    };

    fetchUserIncidents();

    const channel = supabase
      .channel(`realtime:user_incidents_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
          filter: `reported_by=eq.${userId}`,
        },
        () => {
          fetchUserIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Fallback to Firestore
  const incidentsRef = collection(db, 'incidents');
  const q = query(incidentsRef, where('reportedBy', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          ...data,
          status: normalizeStatus(data.status),
        });
      });

      items.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tb - ta;
      });

      callback(items);
    },
    (error) => {
      console.error('Error listening to user incidents:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for a SINGLE incident (used by Rescue Tracking screen).
 */
export function subscribeToIncident(incidentId, callback, onError = null) {
  if (!incidentId) return () => {};

  if (isSupabaseConfigured()) {
    const fetchSingle = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', incidentId)
        .maybeSingle();

      if (error) {
        if (onError) onError(error);
        return;
      }

      callback(data ? mapSupabaseIncident(data) : null);
    };

    fetchSingle();

    const channel = supabase
      .channel(`realtime:incident_${incidentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
          filter: `id=eq.${incidentId}`,
        },
        () => {
          fetchSingle();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Fallback to Firestore
  const docRef = doc(db, 'incidents', incidentId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          id: docSnap.id,
          ...data,
          status: normalizeStatus(data.status),
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to incident:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Deletes an incident document from Supabase and Firestore.
 */
export async function deleteIncident(incidentId) {
  if (!incidentId) return;

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('incidents').delete().eq('id', incidentId);
    } catch (e) {
      console.warn('Supabase deleteIncident error:', e);
    }
  }

  try {
    await deleteDoc(doc(db, 'incidents', incidentId));
  } catch (_e) {}
}

/**
 * Updates incident description or details.
 */
export async function updateIncidentDetails(incidentId, details) {
  if (!incidentId) return;

  if (isSupabaseConfigured()) {
    try {
      const sbDetails = {
        updated_at: new Date().toISOString(),
      };
      if (details.description !== undefined) sbDetails.description = details.description;
      if (details.type !== undefined) sbDetails.type = details.type;
      if (details.typeLabel !== undefined) sbDetails.type_label = details.typeLabel;

      await supabase.from('incidents').update(sbDetails).eq('id', incidentId);
    } catch (e) {
      console.warn('Supabase updateIncidentDetails error:', e);
    }
  }

  try {
    const docRef = doc(db, 'incidents', incidentId);
    await updateDoc(docRef, {
      ...details,
      updatedAt: serverTimestamp(),
    });
  } catch (_e) {}
}

// Backward-Compatibility Helpers
let _cachedIncidents = [];
export function getIncidents() {
  return [..._cachedIncidents];
}

export function addIncident(data) {
  const tempId = 'temp_' + Date.now();
  const tempItem = {
    id: tempId,
    ...data,
    status: normalizeStatus(data.status || STATUS_PENDING),
    createdAt: data.createdAt || { toDate: () => new Date() },
  };
  _cachedIncidents.unshift(tempItem);

  createIncident(data)
    .then((created) => {
      const idx = _cachedIncidents.findIndex((i) => i.id === tempId);
      if (idx !== -1) {
        _cachedIncidents[idx] = created;
      }
    })
    .catch((err) => {
      console.error('addIncident async save error:', err);
    });

  return tempId;
}

export function removeIncident(id) {
  _cachedIncidents = _cachedIncidents.filter((i) => i.id !== id);
  deleteIncident(id).catch(() => {});
}

export function subscribe() {
  return () => {};
}
