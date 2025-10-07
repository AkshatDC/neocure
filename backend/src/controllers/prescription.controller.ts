import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db, collections } from '../config/firebase.js';
import { EnhancedDrugInteractionChecker } from '../services/drugInteractionChecker.js';
import { generateInteractionExplanation } from '../services/ai.js';
import { sendCriticalInteractionAlert } from '../services/alerts.js';

/**
 * Get user's prescriptions
 */
export async function getPrescriptions(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { status, patientId } = req.query;
    
    let query = db.collection(collections.prescriptions);
    
    // Filter based on user role
    if (req.user!.role === 'PATIENT') {
      query = query.where('patientId', '==', userId);
    } else if (patientId) {
      query = query.where('patientId', '==', patientId);
    } else if (req.user!.role === 'DOCTOR') {
      query = query.where('doctorId', '==', userId);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const prescriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      endDate: doc.data().endDate?.toDate(),
    }));
    
    return res.json(prescriptions);
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch prescriptions',
      message: error.message 
    });
  }
}

/**
 * Add new prescription with automatic interaction check
 */
export async function addPrescription(req: AuthRequest, res: Response) {
  try {
    const { patientId, drugName, dosage, frequency, endDate, notes } = req.body as {
      patientId: string;
      drugName: string;
      dosage: string;
      frequency: string;
      endDate?: string;
      notes?: string;
    };
    
    if (!patientId || !drugName || !dosage || !frequency) {
      return res.status(400).json({ 
        error: 'Missing required fields: patientId, drugName, dosage, frequency' 
      });
    }
    
    const doctorId = req.user!.role === 'DOCTOR' ? req.user!.id : null;
    
    // Create prescription in Firebase
    const prescriptionData = {
      patientId,
      doctorId,
      drugName,
      dosage,
      frequency,
      endDate: endDate ? new Date(endDate) : null,
      notes: notes || '',
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    
    const prescriptionRef = await db.collection(collections.prescriptions).add(prescriptionData);
    
    console.log(`✅ Prescription created: ${prescriptionRef.id} - ${drugName}`);
    
    // Automatically check for interactions with active medications
    console.log(`🔍 Auto-checking interactions for: ${drugName}`);
    
    try {
      const { interaction, alertsSent } = await EnhancedDrugInteractionChecker.checkPrescriptionInteractions(
        patientId,
        drugName,
        doctorId || patientId
      );
      
      if (interaction && interaction.interactionDetected) {
        console.log(`⚠️  Interaction detected: ${interaction.severity}`);
        
        return res.status(201).json({
          prescription: {
            id: prescriptionRef.id,
            ...prescriptionData,
          },
          interactionWarning: {
            detected: true,
            severity: interaction.severity,
            description: interaction.description,
            saferAlternatives: interaction.saferAlternatives,
            aiExplanation: interaction.aiExplanation,
            alertsSent,
          },
        });
      }
    } catch (error) {
      console.error('Interaction check failed (non-fatal):', error);
      // Continue even if interaction check fails
    }
    
    return res.status(201).json({
      prescription: {
        id: prescriptionRef.id,
        ...prescriptionData,
      },
      interactionWarning: {
        detected: false,
        message: 'No interactions detected with current medications',
      },
    });
  } catch (error: any) {
    console.error('Error adding prescription:', error);
    return res.status(500).json({ 
      error: 'Failed to add prescription',
      message: error.message 
    });
  }
}

/**
 * Update prescription
 */
export async function updatePrescription(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { dosage, frequency, endDate, notes, status } = req.body;
    
    const updates: any = {};
    if (dosage) updates.dosage = dosage;
    if (frequency) updates.frequency = frequency;
    if (endDate) updates.endDate = new Date(endDate);
    if (notes !== undefined) updates.notes = notes;
    if (status) updates.status = status;
    updates.updatedAt = new Date();
    
    await db.collection(collections.prescriptions).doc(id).update(updates);
    
    const updated = await db.collection(collections.prescriptions).doc(id).get();
    
    return res.json({
      id: updated.id,
      ...updated.data(),
      createdAt: updated.data()?.createdAt?.toDate(),
      endDate: updated.data()?.endDate?.toDate(),
    });
  } catch (error: any) {
    console.error('Error updating prescription:', error);
    return res.status(500).json({ 
      error: 'Failed to update prescription',
      message: error.message 
    });
  }
}

/**
 * Discontinue prescription
 */
export async function discontinuePrescription(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    await db.collection(collections.prescriptions).doc(id).update({
      status: 'DISCONTINUED',
      endDate: new Date(),
      updatedAt: new Date(),
    });
    
    const updated = await db.collection(collections.prescriptions).doc(id).get();
    
    return res.json({
      id: updated.id,
      ...updated.data(),
      createdAt: updated.data()?.createdAt?.toDate(),
      endDate: updated.data()?.endDate?.toDate(),
    });
  } catch (error: any) {
    console.error('Error discontinuing prescription:', error);
    return res.status(500).json({ 
      error: 'Failed to discontinue prescription',
      message: error.message 
    });
  }
}

/**
 * Get interaction history for a patient
 */
export async function getInteractionHistory(req: AuthRequest, res: Response) {
  try {
    const { patientId } = req.params;
    const userId = req.user!.id;
    
    // Authorization check
    if (req.user!.role === 'PATIENT' && patientId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const interactions = await EnhancedDrugInteractionChecker.getInteractionHistory(patientId);
    
    return res.json(interactions);
  } catch (error: any) {
    console.error('Error fetching interaction history:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch interaction history',
      message: error.message 
    });
  }
}
