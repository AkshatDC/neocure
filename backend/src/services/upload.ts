import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { env } from '../server/config/env.js';
import { Readable } from 'stream';

// Configure Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.warn('⚠️ Cloudinary not fully configured - file uploads will use mock URLs');
}

/**
 * Upload file buffer to Cloudinary
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  options?: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    publicId?: string;
  }
): Promise<string> {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    console.warn('Cloudinary not configured, returning mock URL');
    return `https://mock-storage.example.com/${fileName}`;
  }

  try {
    const result = await uploadToCloudinary(fileBuffer, {
      folder: options?.folder || 'medical-documents',
      resourceType: options?.resourceType || 'auto',
      publicId: options?.publicId || fileName,
    });

    return result.secureUrl;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error.message);
    throw new Error(`File upload failed: ${error.message}`);
  }
}

/**
 * Upload buffer to Cloudinary using stream
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    publicId?: string;
  }
): Promise<{
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'medical-documents',
        resource_type: options.resourceType || 'auto',
        public_id: options.publicId,
        overwrite: false,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Upload failed - no result'));
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          resourceType: result.resource_type,
          bytes: result.bytes,
        });
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFile(publicId: string): Promise<void> {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    console.warn('Cloudinary not configured, skipping deletion');
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Deleted file from Cloudinary: ${publicId}`);
  } catch (error: any) {
    console.error('Cloudinary deletion error:', error.message);
    throw new Error(`File deletion failed: ${error.message}`);
  }
}

/**
 * Extract text from file URL (delegates to OCR service)
 */
export async function extractTextFromFile(fileUrl: string): Promise<string> {
  console.log('extractTextFromFile called for:', fileUrl);
  
  // This function is deprecated - use OCR service directly
  // Import and use processMedicalDocument from ocr.ts instead
  
  return 'Use processMedicalDocument from ocr.ts for text extraction';
}
