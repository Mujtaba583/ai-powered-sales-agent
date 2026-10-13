import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Lead, LeadStatus } from './types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with custom firestoreDatabaseId if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Infrastructure as mandated by skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Startup connection verification
export async function verifyFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode. Please check connection.');
      return false;
    }
    // Expected if test/connection doesn't exist yet, server responded without network drop
    return true;
  }
}

// ---------------- AUTHENTICATION HELPERS ----------------

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  businessName: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (businessName) {
    try {
      await updateProfile(cred.user, { displayName: businessName });
    } catch {}
    try {
      await setDoc(doc(db, 'users', cred.user.uid), {
        id: cred.user.uid,
        email: cred.user.email || email,
        displayName: businessName,
        businessName: businessName,
        role: 'sales_agent',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not store initial user profile:', e);
    }
  }
  return cred.user;
}

export async function loginWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  if (cred.user) {
    try {
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          id: cred.user.uid,
          email: cred.user.email || '',
          displayName: cred.user.displayName || 'Sales Agent',
          businessName: cred.user.displayName || 'Solar Business',
          role: cred.user.email === 'mujtabacs50@gmail.com' ? 'admin' : 'sales_agent',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Could not upsert google profile in firestore:', e);
    }
  }
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ---------------- FIRESTORE LEADS HELPERS ----------------

export async function saveLeadToFirestore(lead: Lead): Promise<void> {
  const leadDocId = lead.id || `lead-${Date.now()}`;
  const path = `leads/${leadDocId}`;
  try {
    const cleanLead: Record<string, any> = {
      id: leadDocId,
      name: lead.name || 'Anonymous Inquiry',
      phone: lead.phone || '',
      product: lead.product || 'Solar Inquiry',
      status: lead.status || 'New',
    };

    if (lead.email) cleanLead.email = lead.email;
    if (lead.city) cleanLead.city = lead.city;
    if (lead.address) cleanLead.address = lead.address;
    if (lead.note) cleanLead.note = lead.note;
    if (lead.value) cleanLead.value = lead.value;
    if (lead.timestamp) cleanLead.timestamp = lead.timestamp;
    if (typeof lead.estimatedKw === 'number') cleanLead.estimatedKw = lead.estimatedKw;
    if (auth.currentUser?.uid) cleanLead.capturedBy = auth.currentUser.uid;

    await setDoc(doc(db, 'leads', leadDocId), cleanLead);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToLeads(
  onData: (leads: Lead[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const collectionRef = collection(db, 'leads');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items: Lead[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          name: d.name || 'Lead',
          phone: d.phone || '',
          email: d.email || '',
          product: d.product || 'Solar Package',
          status: (d.status as LeadStatus) || 'New',
          note: d.note || '',
          city: d.city || '',
          address: d.address || '',
          timestamp: d.timestamp || 'Recent',
          value: d.value || '',
          estimatedKw: d.estimatedKw,
        });
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'leads');
    }
  );
}

export async function updateLeadStatusInFirestore(
  leadId: string,
  newStatus: LeadStatus
): Promise<void> {
  const path = `leads/${leadId}`;
  try {
    await updateDoc(doc(db, 'leads', leadId), {
      status: newStatus,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteLeadFromFirestore(leadId: string): Promise<void> {
  const path = `leads/${leadId}`;
  try {
    await deleteDoc(doc(db, 'leads', leadId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
