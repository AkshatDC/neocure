import { env } from '../server/config/env.js';
import { db, collections } from '../config/firebase.js';

// Initialize OCR services
let Tesseract: any = null;
let vision: any = null;

try {
  // Dynamic import for Tesseract.js (client-side OCR)
  if (typeof window !== 'undefined') {
    // Browser environment - use Tesseract.js
    Tesseract = require('tesseract.js');
  }
} catch (error) {
  console.warn('⚠️ Tesseract.js not available - OCR will use server-side alternatives');
}

try {
  // Google Cloud Vision API (server-side)
  if (env.GOOGLE_VISION_API_KEY) {
    vision = require('@google-cloud/vision')({
      keyFilename: env.GOOGLE_VISION_API_KEY,
    });
    console.log('✅ Google Vision API initialized');
  }
} catch (error) {
  console.warn('⚠️ Google Vision API not available - using fallback OCR');
}

/**
 * Extract text from image buffer using Tesseract.js (client-side)
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<{
  text: string;
  confidence: number;
  metadata: any;
}> {
  if (Tesseract) {
    try {
      const { data: { text, confidence } } = await Tesseract.recognize(
        imageBuffer,
        'eng',
        {
          logger: m => console.log(m), // Progress logger
        }
      );

      return {
        text: text.trim(),
        confidence: confidence / 100, // Convert to 0-1 scale
        metadata: {
          engine: 'tesseract',
          language: 'eng',
          processingTime: Date.now(),
        },
      };
    } catch (error: any) {
      console.error('Tesseract OCR error:', error.message);
      throw new Error('OCR processing failed');
    }
  }

  // Fallback to Google Vision API
  return await extractTextFromImageVision(imageBuffer);
}

/**
 * Extract text using Google Cloud Vision API (server-side)
 */
export async function extractTextFromImageVision(imageBuffer: Buffer): Promise<{
  text: string;
  confidence: number;
  metadata: any;
}> {
  if (!vision) {
    throw new Error('Vision API not configured');
  }

  try {
    const [result] = await vision.textDetection({
      image: {
        content: imageBuffer,
      },
    });

    const detections = result.textAnnotations;
    const text = detections[0]?.description || '';

    // Calculate average confidence
    const confidence = detections.length > 0
      ? detections.slice(1).reduce((sum, detection) =>
          sum + (detection.boundingPoly ? 0.8 : 0.6), 0) / detections.length
      : 0;

    return {
      text: text.trim(),
      confidence,
      metadata: {
        engine: 'google-vision',
        detections: detections.length,
        processingTime: Date.now(),
      },
    };
  } catch (error: any) {
    console.error('Google Vision OCR error:', error.message);
    throw new Error('Vision API OCR failed');
  }
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<{
  text: string;
  confidence: number;
  metadata: any;
}> {
  try {
    // Dynamic import for pdf-parse
    const pdfParse = await import('pdf-parse');

    const data = await pdfParse.default(pdfBuffer);

    return {
      text: data.text.trim(),
      confidence: 0.95, // High confidence for PDF text extraction
      metadata: {
        engine: 'pdf-parse',
        pages: data.numpages,
        processingTime: Date.now(),
      },
    };
  } catch (error: any) {
    console.error('PDF extraction error:', error.message);
    throw new Error('PDF text extraction failed');
  }
}

/**
 * Process uploaded medical document with OCR
 */
export async function processMedicalDocument(
  file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  },
  patientId: string,
  userId: string
): Promise<{
  documentId: string;
  extractedText: string;
  confidence: number;
  fileUrl: string;
}> {
  console.log(`📄 Processing medical document: ${file.originalname}`);

  let extractedText = '';
  let confidence = 0;

  try {
    // Step 1: Upload file to Cloudinary
    const { uploadToCloudinary } = await import('./cloudinary.js');
    const uploadResult = await uploadToCloudinary(file.buffer, {
      folder: `medical-documents/${patientId}`,
      resourceType: 'auto',
      publicId: `${Date.now()}-${file.originalname}`,
    });

    // Step 2: Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      const result = await extractTextFromPDF(file.buffer);
      extractedText = result.text;
      confidence = result.confidence;
    } else if (file.mimetype.startsWith('image/')) {
      const result = await extractTextFromImage(file.buffer);
      extractedText = result.text;
      confidence = result.confidence;
    } else {
      throw new Error('Unsupported file type for OCR');
    }

    // Step 3: Save document metadata to Firebase
    const documentRef = await db.collection(collections.medicalDocuments).add({
      patientId,
      userId,
      fileName: file.originalname,
      fileUrl: uploadResult.secureUrl,
      fileType: file.mimetype,
      fileSize: file.size,
      extractedText,
      confidence,
      ocrStatus: extractedText ? 'COMPLETED' : 'FAILED',
      uploadedAt: new Date(),
      metadata: {
        uploadResult,
        processingTime: Date.now(),
      },
    });

    // Step 4: Index document for RAG if text was extracted
    if (extractedText && confidence > 0.5) {
      try {
        await indexDocumentForRAG(documentRef.id, patientId, extractedText);
      } catch (error) {
        console.warn('RAG indexing failed, but document saved:', error);
      }
    }

    console.log(`✅ Document processed: ${documentRef.id}`);

    return {
      documentId: documentRef.id,
      extractedText,
      confidence,
      fileUrl: uploadResult.secureUrl,
    };

  } catch (error: any) {
    console.error('Document processing error:', error.message);

    // Save failed document record
    await db.collection(collections.medicalDocuments).add({
      patientId,
      userId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      extractedText: '',
      confidence: 0,
      ocrStatus: 'FAILED',
      uploadedAt: new Date(),
      error: error.message,
    });

    throw error;
  }
}

/**
 * Index document for RAG pipeline
 */
async function indexDocumentForRAG(
  documentId: string,
  patientId: string,
  text: string
): Promise<void> {
  const { indexDocument } = await import('./ragPipeline.js');
  await indexDocument(documentId, patientId, text);
  console.log(`✅ Document indexed for RAG: ${documentId}`);
}
