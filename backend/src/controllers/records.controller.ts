import { Request, Response } from 'express';
import { db, collections } from '../config/firebase.js';
import { AuthRequest } from '../middleware/auth.js';
import { processMedicalDocument } from '../services/ocr.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

/**
 * List all medical records for a user
 */
export async function listRecords(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { patientId } = req.query;
    
    let query = db.collection(collections.medicalRecords);
    
    // If user is a patient, only show their records
    if (req.user!.role === 'PATIENT') {
      query = query.where('patientId', '==', userId);
    } else if (patientId) {
      // Doctor viewing specific patient's records
      query = query.where('patientId', '==', patientId);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
    
    return res.json(records);
  } catch (error: any) {
    console.error('Error listing records:', error);
    return res.status(500).json({ error: 'Failed to fetch records', message: error.message });
  }
}

/**
 * Create a new medical record
 */
export async function createRecord(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { 
      patientId, 
      symptoms = [], 
      pastConditions = [], 
      currentMedications = [], 
      allergies = [],
      diagnosis = '',
      notes = '',
      doctorId
    } = req.body;
    
    const recordData = {
      patientId: patientId || userId,
      doctorId: doctorId || (req.user!.role === 'DOCTOR' ? userId : null),
      symptoms,
      pastConditions,
      currentMedications,
      allergies,
      diagnosis,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await db.collection(collections.medicalRecords).add(recordData);
    
    return res.status(201).json({
      id: docRef.id,
      ...recordData,
    });
  } catch (error: any) {
    console.error('Error creating record:', error);
    return res.status(500).json({ error: 'Failed to create record', message: error.message });
  }
}

/**
 * Get a specific medical record
 */
export async function getRecord(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const doc = await db.collection(collections.medicalRecords).doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    const recordData = doc.data();
    
    // Authorization check
    if (req.user!.role === 'PATIENT' && recordData?.patientId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    return res.json({
      id: doc.id,
      ...recordData,
      createdAt: recordData?.createdAt?.toDate(),
      updatedAt: recordData?.updatedAt?.toDate(),
    });
  } catch (error: any) {
    console.error('Error fetching record:', error);
    return res.status(500).json({ error: 'Failed to fetch record', message: error.message });
  }
}

/**
 * Update a medical record
 */
export async function updateRecord(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;
    
    const doc = await db.collection(collections.medicalRecords).doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    const recordData = doc.data();
    
    // Authorization check
    if (req.user!.role === 'PATIENT' && recordData?.patientId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await db.collection(collections.medicalRecords).doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });
    
    const updated = await db.collection(collections.medicalRecords).doc(id).get();
    
    return res.json({
      id: updated.id,
      ...updated.data(),
      createdAt: updated.data()?.createdAt?.toDate(),
      updatedAt: updated.data()?.updatedAt?.toDate(),
    });
  } catch (error: any) {
    console.error('Error updating record:', error);
    return res.status(500).json({ error: 'Failed to update record', message: error.message });
  }
}

/**
 * Delete a medical record
 */
export async function deleteRecord(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const doc = await db.collection(collections.medicalRecords).doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    const recordData = doc.data();
    
    // Authorization check - only doctors or the patient themselves can delete
    if (req.user!.role === 'PATIENT' && recordData?.patientId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await db.collection(collections.medicalRecords).doc(id).delete();
    
    return res.json({ message: 'Record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting record:', error);
    return res.status(500).json({ error: 'Failed to delete record', message: error.message });
  }
}

/**
 * Upload medical document with OCR processing
 */
export async function uploadDocument(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { patientId } = req.body;
    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const targetPatientId = patientId || userId;
    
    // Process document with OCR
    const result = await processMedicalDocument(
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
      targetPatientId,
      userId
    );
    
    return res.status(201).json({
      message: 'Document uploaded and processed successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Failed to upload document', message: error.message });
  }
}

export { upload };
