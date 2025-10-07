import { spawn } from 'child_process';
import path from 'path';
import { env } from '../server/config/env.js';
import { prisma } from './prisma.js';

export interface DrugInteractionInput {
  drugs: string[];
  userId?: string;
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
 * Calls the Python drug-interaction-checker module via subprocess
 * Falls back to mock data if Python module is unavailable
 */
export async function checkDrugInteractions(
  input: DrugInteractionInput
): Promise<DrugInteractionResult> {
  const startTime = Date.now();
  
  try {
    // Try to call Python module
    const result = await callPythonChecker(input.drugs);
    
    // Log the interaction check
    await logInteractionCheck({
      drugs: input.drugs,
      success: true,
      responseTime: Date.now() - startTime,
      userId: input.userId,
    });
    
    return result;
  } catch (error: any) {
    console.warn('Python drug checker failed, using fallback:', error.message);
    
    // Log the failure
    await logInteractionCheck({
      drugs: input.drugs,
      success: false,
      errorMessage: error.message,
      responseTime: Date.now() - startTime,
      userId: input.userId,
    });
    
    // Return mock/fallback data
    return getFallbackInteractionData(input.drugs);
  }
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
 * Log interaction check to database
 */
async function logInteractionCheck(params: {
  drugs: string[];
  success: boolean;
  errorMessage?: string;
  responseTime: number;
  userId?: string;
}) {
  try {
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
  } catch (error) {
    console.error('Failed to log interaction check:', error);
  }
}

/**
 * Save drug interaction result to database
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
 * Get all active medications for a user
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

/**
 * Check interactions for all active medications plus a new drug
 */
export async function checkInteractionsWithActiveMeds(
  userId: string,
  newDrug: string
): Promise<DrugInteractionResult> {
  const activeMeds = await getUserActiveMedications(userId);
  const allDrugs = [...activeMeds, newDrug];
  
  return await checkDrugInteractions({ drugs: allDrugs, userId });
}
