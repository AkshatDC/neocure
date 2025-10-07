import admin from 'firebase-admin';
import { env } from '../server/config/env.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_n7YLb9m-wi8Q2NG3e2BoqPqKaj8ejwU",
  authDomain: "hackathon-ai-7ffc9.firebaseapp.com",
  projectId: "hackathon-ai-7ffc9",
  storageBucket: "hackathon-ai-7ffc9.firebasestorage.app",
  messagingSenderId: "353377307573",
  appId: "1:353377307573:web:ef9a1c1bfecea9ea26e7fc",
  measurementId: "G-9R6CPJPC9M"
};

// Initialize Firebase Admin SDK
// Note: For production, use service account key
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      // In production, load from environment variables:
      // privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      // clientEmail: env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error: any) {
  console.error('❌ Firebase initialization error:', error.message);
  console.warn('⚠️  Running without Firebase - some features will be limited');
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Firestore collections
export const collections = {
  users: 'users',
  patients: 'patients',
  prescriptions: 'prescriptions',
  drugInteractions: 'drugInteractions',
  medicalDocuments: 'medicalDocuments',
  medicalRecords: 'medicalRecords',
  vectorEmbeddings: 'vectorEmbeddings',
  chatLogs: 'chatLogs',
  alerts: 'alerts',
  interactionLogs: 'interactionLogs',
};

// Helper functions
export async function getUserById(userId: string) {
  const doc = await db.collection(collections.users).doc(userId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function createUser(userData: any) {
  const docRef = await db.collection(collections.users).add({
    ...userData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

export { firebaseConfig };
