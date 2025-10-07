import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string, fallback?: string) {
  const v = process.env[key] ?? fallback;
  if (!v) throw new Error(`Missing env var ${key}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  DATABASE_URL: requireEnv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/neocure'),
  JWT_SECRET: requireEnv('JWT_SECRET', 'changeme-in-prod'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || ''
};
