export type UserRole = 'patient' | 'doctor' | 'admin';

export type RiskLevel = 'green' | 'amber' | 'red';

export type MedicationStatus = 'active' | 'completed' | 'discontinued';

export type AllergenType = 'medication' | 'food' | 'environmental' | 'other';

export type Severity = 'mild' | 'moderate' | 'severe';

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  geneticBackground?: Record<string, any>;
  environmentalFactors?: Record<string, any>;
  specialization?: string;
  licenseNumber?: string;
  onboardingCompleted: boolean;
  themePreference: 'light' | 'dark';
  avatarUrl?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  documentUrl?: string;
  documentType?: 'pdf' | 'image' | 'text';
  extractedData?: Record<string, any>;
  uploadDate: string;
  tags: string[];
}

export interface Allergy {
  id: string;
  patientId: string;
  allergenName: string;
  allergenType: AllergenType;
  severity: Severity;
  symptoms: string[];
  detectedDate: string;
  verifiedByDoctor: boolean;
  doctorId?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  purpose?: string;
  status: MedicationStatus;
  sideEffects: string[];
}

export interface RiskAssessment {
  id: string;
  patientId: string;
  medicationId?: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactors: Record<string, any>;
  explanation: string;
  alternativeMedications: Array<{
    name: string;
    benefits: string[];
    risks: string[];
  }>;
  precautions: string[];
  assessedAt: string;
}

export interface MedicineReminder {
  id: string;
  patientId: string;
  medicationId: string;
  reminderTime: string;
  reminderDays: string[];
  enabled: boolean;
  lastNotification?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SymptomLog {
  id: string;
  patientId: string;
  symptoms: string[];
  severity?: string;
  dateOccurred: string;
  associatedMedicationId?: string;
  aiAnalysis?: Record<string, any>;
}

export interface AllergyTreatment {
  id: string;
  allergyId: string;
  treatmentName: string;
  treatmentType: string;
  description: string;
  effectiveness?: string;
  providedBy?: string;
}
