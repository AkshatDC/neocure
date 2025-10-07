import { spawn } from 'child_process';
import path from 'path';
import { env } from '../server/config/env.js';
import { prisma } from './prisma.js';
import { db, collections } from '../config/firebase.js';
import { sendAlertToDoctor, sendCriticalInteractionAlert } from './alerts.js';
import { generateInteractionExplanation } from './ai.js';

export interface DrugInteractionInput {
  drugs: string[];
  userId?: string;
  patientId?: string;
  doctorId?: string;
}

export interface DrugInteractionResult {
  success: boolean;
  interactionDetected: boolean;
  severity: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  description: string;
  saferAlternatives: string[];
  fdaSource?: any;
  aiExplanation?: string;
  error?: string;
}

/**
 * Enhanced drug interaction checker with Firebase integration
 */
export class EnhancedDrugInteractionChecker {
  /**
   * Check drug interactions for a patient with Firebase integration
   */
  static async checkInteractions(
    input: DrugInteractionInput
  ): Promise<DrugInteractionResult> {
    const startTime = Date.now();

    try {
      // Try to call Python module first
      const result = await callPythonChecker(input.drugs);

      // Save to Firebase if patient context provided
      if (input.patientId && result.interactionDetected) {
        await this.saveInteractionToFirebase({
          patientId: input.patientId,
          drugsInvolved: input.drugs,
          severity: result.severity,
          description: result.description,
          saferAlternatives: result.saferAlternatives,
          aiExplanation: result.aiExplanation,
          fdaSource: result.fdaSource,
          autoChecked: false,
        });
      }

      // Log the interaction check
      await this.logInteractionCheck({
        drugs: input.drugs,
        success: true,
        responseTime: Date.now() - startTime,
        userId: input.userId,
        patientId: input.patientId,
      });

      return result;
    } catch (error: any) {
      console.warn('Python drug checker failed, using fallback:', error.message);

      // Log the failure
      await this.logInteractionCheck({
        drugs: input.drugs,
        success: false,
        errorMessage: error.message,
        responseTime: Date.now() - startTime,
        userId: input.userId,
        patientId: input.patientId,
      });

      // Return fallback data
      const fallbackResult = getFallbackInteractionData(input.drugs);

      // Save fallback interaction to Firebase if patient context provided
      if (input.patientId && fallbackResult.interactionDetected) {
        await this.saveInteractionToFirebase({
          patientId: input.patientId,
          drugsInvolved: input.drugs,
          severity: fallbackResult.severity,
          description: fallbackResult.description,
          saferAlternatives: fallbackResult.saferAlternatives,
          aiExplanation: fallbackResult.aiExplanation,
          fdaSource: fallbackResult.fdaSource,
          autoChecked: false,
        });
      }

      return fallbackResult;
    }
  }

  /**
   * Check interactions when adding a new prescription (auto-check)
   */
  static async checkPrescriptionInteractions(
    patientId: string,
    newDrug: string,
    doctorId: string
  ): Promise<{
    interaction: any;
    alertsSent: boolean;
  }> {
    try {
      // Get patient's active prescriptions from Firebase
      const activePrescriptions = await this.getActivePrescriptionsFromFirebase(patientId);

      if (activePrescriptions.length === 0) {
        return { interaction: null, alertsSent: false };
      }

      const activeDrugs = activePrescriptions.map(p => p.drugName);
      const allDrugs = [...activeDrugs, newDrug];

      // Check for interactions
      const interactionResult = await this.checkInteractions({
        drugs: allDrugs,
        patientId,
        doctorId,
      });

      // Save interaction to Firebase
      const interactionRef = await this.saveInteractionToFirebase({
        patientId,
        drugsInvolved: allDrugs,
        severity: interactionResult.severity,
        description: interactionResult.description,
        saferAlternatives: interactionResult.saferAlternatives,
        aiExplanation: interactionResult.aiExplanation,
        fdaSource: interactionResult.fdaSource,
        autoChecked: true,
      });

      // Send alerts if critical interaction detected
      let alertsSent = false;
      if (interactionResult.severity === 'SEVERE' || interactionResult.severity === 'CRITICAL') {
        await sendCriticalInteractionAlert(patientId, doctorId, {
          drugs: allDrugs,
          severity: interactionResult.severity,
          description: interactionResult.description,
        });
        alertsSent = true;
      }

      return {
        interaction: {
          id: interactionRef.id,
          ...interactionResult,
        },
        alertsSent,
      };

    } catch (error: any) {
      console.error('Error checking prescription interactions:', error.message);
      return { interaction: null, alertsSent: false };
    }
  }

  /**
   * Get active prescriptions from Firebase
   */
  private static async getActivePrescriptionsFromFirebase(patientId: string): Promise<any[]> {
    try {
      const snapshot = await db.collection(collections.prescriptions)
        .where('patientId', '==', patientId)
        .where('status', '==', 'ACTIVE')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

    } catch (error: any) {
      console.error('Error getting active prescriptions from Firebase:', error.message);
      return [];
    }
  }

  /**
   * Save interaction to Firebase
   */
  private static async saveInteractionToFirebase(params: {
    patientId: string;
    drugsInvolved: string[];
    severity: DrugInteractionResult['severity'];
    description: string;
    saferAlternatives: string[];
    aiExplanation?: string;
    fdaSource?: any;
    autoChecked: boolean;
  }) {
    try {
      const docRef = await db.collection(collections.drugInteractions).add({
        patientId: params.patientId,
        drugsInvolved: params.drugsInvolved,
        severity: params.severity,
        description: params.description,
        saferAlternatives: params.saferAlternatives,
        aiExplanation: params.aiExplanation,
        fdaSource: params.fdaSource,
        autoChecked: params.autoChecked,
        createdAt: new Date(),
      });

      return docRef;
    } catch (error: any) {
      console.error('Error saving interaction to Firebase:', error.message);
      throw error;
    }
  }

  /**
   * Log interaction check to database
   */
  private static async logInteractionCheck(params: {
    drugs: string[];
    success: boolean;
    errorMessage?: string;
    responseTime: number;
    userId?: string;
    patientId?: string;
  }) {
    try {
      // Log to Prisma (legacy)
      await prisma.interactionLog.create({
        data: {
          endpoint: '/api/drug-interactions',
          drugsChecked: params.drugs,
          success: params.success,
          errorMessage: params.errorMessage,
          responseTime: params.responseTime,
          userId: params.userId,
        },
      });

      // Log to Firebase for real-time analytics
      await db.collection(collections.interactionLogs).add({
        drugs: params.drugs,
        success: params.success,
        errorMessage: params.errorMessage,
        responseTime: params.responseTime,
        userId: params.userId,
        patientId: params.patientId,
        createdAt: new Date(),
      });

    } catch (error) {
      console.error('Failed to log interaction check:', error);
    }
  }

  /**
   * Get interaction history for a patient from Firebase
   */
  static async getInteractionHistory(patientId: string): Promise<any[]> {
    try {
      const snapshot = await db.collection(collections.drugInteractions)
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

    } catch (error: any) {
      console.error('Error getting interaction history:', error.message);
      return [];
    }
  }

  /**
   * Get interaction statistics for analytics
   */
  static async getInteractionStats(): Promise<{
    totalChecks: number;
    bySeverity: Record<string, number>;
    recentAlerts: number;
  }> {
    try {
      const snapshot = await db.collection(collections.drugInteractions)
        .orderBy('createdAt', 'desc')
        .limit(1000)
        .get();

      const interactions = snapshot.docs.map(doc => doc.data());

      const stats = {
        totalChecks: interactions.length,
        bySeverity: {} as Record<string, number>,
        recentAlerts: interactions.filter(i =>
          i.createdAt?.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        ).length,
      };

      // Count by severity
      interactions.forEach(interaction => {
        const severity = interaction.severity || 'NONE';
        stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
      });

      return stats;

    } catch (error: any) {
      console.error('Error getting interaction stats:', error.message);
      return { totalChecks: 0, bySeverity: {}, recentAlerts: 0 };
    }
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function checkDrugInteractions(
  input: DrugInteractionInput
): Promise<DrugInteractionResult> {
  return await EnhancedDrugInteractionChecker.checkInteractions(input);
}

/**
 * Legacy function for backward compatibility
 */
export async function checkInteractionsWithActiveMeds(
  userId: string,
  newDrug: string
): Promise<DrugInteractionResult> {
  // This would need patientId context for Firebase integration
  // For now, falling back to legacy implementation
  const activeMeds = await getUserActiveMedications(userId);
  const allDrugs = [...activeMeds, newDrug];

  return await checkDrugInteractions({ drugs: allDrugs, userId });
}

/**
 * Calls the Python drug-interaction-checker script
 */
async function callPythonChecker(drugs: string[]): Promise<DrugInteractionResult> {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(
      process.cwd(),
      '..',
      'drug-interaction-checker',
      'drug-interaction-checker',
      'src',
      'check_interactions.py'
    );

    // Check if Python script exists, otherwise use fallback
    const fs = require('fs');
    if (!fs.existsSync(pythonScriptPath)) {
      return reject(new Error('Python script not found'));
    }

    const pythonProcess = spawn('python', [pythonScriptPath, JSON.stringify(drugs)]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }

      try {
        const result = JSON.parse(stdout);
        resolve(parsePythonResult(result));
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${e}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Python process timeout'));
    }, 30000);
  });
}

/**
 * Parse Python module output to our standard format
 */
function parsePythonResult(pythonOutput: any): DrugInteractionResult {
  return {
    success: true,
    interactionDetected: pythonOutput.interactionDetected || false,
    severity: mapSeverity(pythonOutput.severity),
    description: pythonOutput.description || pythonOutput.summary || 'No description available',
    saferAlternatives: pythonOutput.saferAlternatives || pythonOutput.alternatives || [],
    fdaSource: pythonOutput.fdaData || pythonOutput.source,
    aiExplanation: pythonOutput.aiExplanation || pythonOutput.llm_summary,
  };
}

/**
 * Map various severity strings to our enum
 */
function mapSeverity(severity: string | undefined): DrugInteractionResult['severity'] {
  if (!severity) return 'NONE';
  const s = severity.toUpperCase();
  if (s.includes('CRITICAL') || s.includes('MAJOR')) return 'CRITICAL';
  if (s.includes('SEVERE') || s.includes('HIGH')) return 'SEVERE';
  if (s.includes('MODERATE') || s.includes('MEDIUM')) return 'MODERATE';
  if (s.includes('MILD') || s.includes('MINOR') || s.includes('LOW')) return 'MILD';
  return 'NONE';
}

/**
 * Fallback mock data when Python module is unavailable
 */
function getFallbackInteractionData(drugs: string[]): DrugInteractionResult {
  // Simple heuristic: if certain drug combinations are present, flag them
  const knownInteractions = [
    { drugs: ['warfarin', 'aspirin'], severity: 'SEVERE', description: 'Increased bleeding risk' },
    { drugs: ['warfarin', 'amoxicillin'], severity: 'MODERATE', description: 'May increase anticoagulant effect' },
    { drugs: ['metformin', 'alcohol'], severity: 'MODERATE', description: 'Risk of lactic acidosis' },
    { drugs: ['lisinopril', 'potassium'], severity: 'MODERATE', description: 'Risk of hyperkalemia' },
  ];

  const normalizedDrugs = drugs.map(d => d.toLowerCase().trim());

  for (const interaction of knownInteractions) {
    const hasAll = interaction.drugs.every(drug =>
      normalizedDrugs.some(nd => nd.includes(drug))
    );

    if (hasAll) {
      return {
        success: true,
        interactionDetected: true,
        severity: interaction.severity as any,
        description: `${interaction.description}. [Fallback data - Python module unavailable]`,
        saferAlternatives: ['Consult with healthcare provider for alternatives'],
        aiExplanation: `Based on known interactions between ${interaction.drugs.join(' and ')}, there is a ${interaction.severity.toLowerCase()} risk. This is fallback data; for production, integrate the Python module or use a licensed drug interaction database.`,
      };
    }
  }

  return {
    success: true,
    interactionDetected: false,
    severity: 'NONE',
    description: `No known interactions detected between ${drugs.join(', ')}. [Fallback data - Python module unavailable]`,
    saferAlternatives: [],
    aiExplanation: 'This is fallback data. For production use, please integrate the Python drug-interaction-checker module or a licensed drug interaction database.',
  };
}

/**
 * Legacy function for backward compatibility
 */
export async function saveDrugInteraction(params: {
  userId: string;
  prescriptionId?: string;
  drugsInvolved: string[];
  severity: DrugInteractionResult['severity'];
  description: string;
  saferAlternatives: string[];
  aiExplanation?: string;
  fdaSource?: any;
  autoChecked?: boolean;
}) {
  return await prisma.drugInteraction.create({
    data: {
      userId: params.userId,
      prescriptionId: params.prescriptionId,
      drugsInvolved: params.drugsInvolved,
      severity: params.severity,
      description: params.description,
      saferAlternatives: params.saferAlternatives,
      aiExplanation: params.aiExplanation,
      fdaSource: params.fdaSource,
      autoChecked: params.autoChecked || false,
    },
  });
}

/**
 * Legacy function for backward compatibility
 */
export async function getUserActiveMedications(userId: string): Promise<string[]> {
  const prescriptions = await prisma.prescription.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    select: {
      drugName: true,
    },
  });

  return prescriptions.map(p => p.drugName);
}
