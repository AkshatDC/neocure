import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB_n7YLb9m-wi8Q2NG3e2BoqPqKaj8ejwU",
  authDomain: "hackathon-ai-7ffc9.firebaseapp.com",
  projectId: "hackathon-ai-7ffc9",
  storageBucket: "hackathon-ai-7ffc9.firebasestorage.app",
  messagingSenderId: "353377307573",
  appId: "1:353377307573:web:ef9a1c1bfecea9ea26e7fc",
  measurementId: "G-9R6CPJPC9M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  console.log('🔧 Connected to Firebase emulators');
}

// Collection names
export const collections = {
  users: 'users',
  patients: 'patients',
  prescriptions: 'prescriptions',
  drugInteractions: 'drugInteractions',
  medicalDocuments: 'medicalDocuments',
  vectorEmbeddings: 'vectorEmbeddings',
  chatLogs: 'chatLogs',
  alerts: 'alerts',
};

export default app;
