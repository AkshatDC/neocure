import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../services/prisma.js';
import { 
  checkInteractionsWithActiveMeds, 
  saveDrugInteraction 
} from '../services/drugInteractionChecker.js';
import { generateInteractionExplanation } from '../services/ai.js';

/**
 * Get user's prescriptions
 */
export async function getPrescriptions(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { status } = req.query;
    
    const prescriptions = await prisma.prescription.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        interactionChecks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
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
    const { userId, drugName, dosage, frequency, endDate, notes } = req.body as {
      userId: string;
      drugName: string;
      dosage: string;
      frequency: string;
      endDate?: string;
      notes?: string;
    };
    
    if (!userId || !drugName || !dosage || !frequency) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, drugName, dosage, frequency' 
      });
    }
    
    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        userId,
        doctorId: req.user!.id,
        drugName,
        dosage,
        frequency,
        endDate: endDate ? new Date(endDate) : undefined,
        notes,
        status: 'ACTIVE',
      },
    });
    
    // Automatically check for interactions with active medications
    console.log(`Auto-checking interactions for new prescription: ${drugName}`);
    
    try {
      const interactionResult = await checkInteractionsWithActiveMeds(userId, drugName);
      
      if (interactionResult.interactionDetected) {
        // Generate AI explanation
        let aiExplanation = interactionResult.aiExplanation;
        try {
          const activeMeds = await prisma.prescription.findMany({
            where: { userId, status: 'ACTIVE', id: { not: prescription.id } },
            select: { drugName: true },
          });
          
          aiExplanation = await generateInteractionExplanation({
            drugs: [...activeMeds.map(m => m.drugName), drugName],
            severity: interactionResult.severity,
            description: interactionResult.description,
          });
        } catch (error) {
          console.warn('Failed to generate AI explanation:', error);
        }
        
        // Save interaction to database
        const savedInteraction = await saveDrugInteraction({
          userId,
          prescriptionId: prescription.id,
          drugsInvolved: [drugName, ...(interactionResult.fdaSource ? Object.keys(interactionResult.fdaSource) : [])],
          severity: interactionResult.severity,
          description: interactionResult.description,
          saferAlternatives: interactionResult.saferAlternatives,
          aiExplanation: aiExplanation || interactionResult.aiExplanation,
          fdaSource: interactionResult.fdaSource,
          autoChecked: true,
        });
        
        return res.status(201).json({
          prescription,
          interactionWarning: {
            detected: true,
            severity: interactionResult.severity,
            description: interactionResult.description,
            saferAlternatives: interactionResult.saferAlternatives,
            aiExplanation: aiExplanation || interactionResult.aiExplanation,
            interactionId: savedInteraction.id,
          },
        });
      }
    } catch (error) {
      console.error('Interaction check failed (non-fatal):', error);
      // Continue even if interaction check fails
    }
    
    return res.status(201).json({
      prescription,
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
    
    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        ...(dosage && { dosage }),
        ...(frequency && { frequency }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
    });
    
    return res.json(prescription);
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
    
    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        status: 'DISCONTINUED',
        endDate: new Date(),
      },
    });
    
    return res.json(prescription);
  } catch (error: any) {
    console.error('Error discontinuing prescription:', error);
    return res.status(500).json({ 
      error: 'Failed to discontinue prescription',
      message: error.message 
    });
  }
}
