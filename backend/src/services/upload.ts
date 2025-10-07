import { v2 as cloudinary } from 'cloudinary';
import { env } from '../server/config/env.js';

// Configure Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
  // TODO: Implement Cloudinary upload or S3 upload
  // For now, return a mock URL
  
  if (!env.CLOUDINARY_CLOUD_NAME) {
    console.warn('Cloudinary not configured, returning mock URL');
    return `https://mock-storage.example.com/${fileName}`;
  }

  // Example Cloudinary upload (uncomment when ready):
  // const result = await cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
  //   if (error) throw error;
  //   return result.secure_url;
  // });
  
  return `https://mock-storage.example.com/${fileName}`;
}

export async function extractTextFromFile(fileUrl: string): Promise<string> {
  // TODO: Implement OCR using Tesseract.js or Google Vision API
  // TODO: Or use OpenAI Vision API for medical document parsing
  
  console.log('extractTextFromFile called (stub) for:', fileUrl);
  return 'Extracted text placeholder. Integrate OCR or LLM-based extraction.';
}
