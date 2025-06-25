import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if we have valid Firebase configuration
const hasValidFirebaseConfig = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.authDomain && 
         firebaseConfig.projectId &&
         !firebaseConfig.apiKey.includes('demo') &&
         !firebaseConfig.authDomain.includes('demo') &&
         !firebaseConfig.projectId.includes('demo') &&
         firebaseConfig.apiKey !== 'your_api_key_here' &&
         firebaseConfig.apiKey !== 'demo-api-key';
};

// Check if we're using demo credentials
const isDemoMode = !hasValidFirebaseConfig();

if (isDemoMode) {
  console.warn('Demo Firebase credentials detected or missing configuration. Running in demo mode - authentication features will be limited.');
}

// Initialize Firebase with error handling
let app = null;
let auth = null;
let db = null;
let storage = null;

if (hasValidFirebaseConfig()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.warn('Firebase not initialized due to invalid or missing configuration');
}

export { auth, db, storage };
export default app;

// Helper function to check if Firebase is available
export const isFirebaseAvailable = () => {
  return app !== null && auth !== null && db !== null;
};

// Types for MySurgeon platform
export interface Profile {
  id: string;
  email: string;
  role: 'patient' | 'surgeon' | 'admin';
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientDetails {
  id: string;
  profileId: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string;
  currentMedications?: string[];
}

export interface SurgeonDetails {
  id: string;
  profileId: string;
  licenseNumber: string;
  specialization: string[];
  yearsOfExperience: number;
  hospitalAffiliations: string[];
  certifications: string[];
  bio?: string;
}

export interface VitalSigns {
  id: string;
  patientId: string;
  timestamp: Date;
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  notes?: string;
}

export interface SurgicalHistory {
  id: string;
  patientId: string;
  surgeonId: string;
  procedureName: string;
  date: Date;
  duration: number;
  complications?: string;
  outcome: 'successful' | 'complications' | 'failed';
  notes?: string;
  followUpRequired: boolean;
}

export interface SurgicalCase {
  id: string;
  patientId: string;
  surgeonId: string;
  procedureName: string;
  scheduledDate: Date;
  estimatedDuration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  preOpNotes?: string;
  postOpNotes?: string;
  complications?: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
}

export interface HistoricalSurgicalData {
  id: string;
  surgeonId: string;
  year: number;
  month: number;
  totalSurgeries: number;
  successfulSurgeries: number;
  averageDuration: number;
  complicationRate: number;
  patientSatisfactionScore: number;
}