import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../services/prisma.js';
import { checkDrugInteractions, saveDrugInteraction } from '../services/drugInteractionChecker.js';
import { generateInteractionExplanation } from '../services/ai.js';

/**
 * Check drug-drug interactions
 */
export async function checkInteractions(req: AuthRequest, res: Response) {
  try {
    const { drugs } = req.body as { drugs: string[] };
    
    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return res.status(400).json({ 
        error: 'Please provide at least 2 drugs as an array' 
      });
    }
    
    const userId = req.user!.id;
    
    // Check interactions using the drug-interaction-checker service
    const result = await checkDrugInteractions({ drugs, userId });
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to check interactions',
        details: result.error 
      });
    }
    
    // Generate AI explanation using RAG pipeline
    let aiExplanation = result.aiExplanation;
    if (!aiExplanation || aiExplanation.includes('fallback')) {
      try {
        aiExplanation = await generateInteractionExplanation({
          drugs,
          severity: result.severity,
          description: result.description,
        });
      } catch (error) {
        console.warn('Failed to generate AI explanation:', error);
      }
    }
    
    // Save to database if interaction detected
    if (result.interactionDetected) {
      await saveDrugInteraction({
        userId,
        drugsInvolved: drugs,
        severity: result.severity,
        description: result.description,
        saferAlternatives: result.saferAlternatives,
        aiExplanation: aiExplanation || result.aiExplanation,
        fdaSource: result.fdaSource,
        autoChecked: false,
      });
    }
    
    return res.json({
      interactionDetected: result.interactionDetected,
      severity: result.severity,
      description: result.description,
      saferAlternatives: result.saferAlternatives,
      aiExplanation: aiExplanation || result.aiExplanation,
      fdaSource: result.fdaSource,
    });
  } catch (error: any) {
    console.error('Error checking drug interactions:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Get user's interaction check history
 */
export async function getInteractionHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    
    const interactions = await prisma.drugInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        prescription: {
          select: {
            drugName: true,
            dosage: true,
            status: true,
          },
        },
      },
    });
    
    return res.json(interactions);
  } catch (error: any) {
    console.error('Error fetching interaction history:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch interaction history',
      message: error.message 
    });
  }
}

/**
 * Get specific interaction details by ID
 */
export async function getInteractionById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const interaction = await prisma.drugInteraction.findFirst({
      where: { 
        id,
        userId, // Ensure user can only access their own interactions
      },
      include: {
        prescription: true,
      },
    });
    
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    return res.json(interaction);
  } catch (error: any) {
    console.error('Error fetching interaction:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch interaction',
      message: error.message 
    });
  }
}
