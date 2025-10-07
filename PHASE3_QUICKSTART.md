# Phase 3 Quick Start Guide

## 🚀 Get Phase 3 Running in 30 Minutes

This guide will help you implement the AI integration and RAG system quickly.

---

## ✅ Prerequisites

- Phase 1 & 2 completed
- API keys configured (OpenAI, Pinecone, Cloudinary)
- Firebase project created
- Node.js 20+ installed

---

## 📦 Step 1: Install Dependencies (5 minutes)

```bash
# Backend dependencies
cd backend
npm install firebase-admin socket.io ioredis
npm install @google-cloud/vision tesseract.js
npm install @pinecone-database/pinecone
npm install langchain @langchain/openai @langchain/community
npm install pdf-parse

# Frontend dependencies
cd ..
npm install firebase socket.io-client
npm install react-firebase-hooks
```

---

## 🔑 Step 2: Update Environment Variables (2 minutes)

Add to `backend/.env`:

```env
# Firebase Admin (get from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=hackathon-ai-7ffc9
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@hackathon-ai-7ffc9.iam.gserviceaccount.com

# Pinecone (already configured)
PINECONE_API_KEY=pcsk_4pXNcW_89zDrQVb3N9KQwhuW2E6GaAfnFkVDUQnyu6Wpj7RH3AwmDsTEX7SErWMCvYawKk
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=neocure-medical

# Redis (for conversation memory)
REDIS_URL=redis://localhost:6379

# Google Vision API (optional, for better OCR)
GOOGLE_VISION_API_KEY=your-key-here
```

---

## 🏗️ Step 3: Create Pinecone Index (3 minutes)

1. Go to https://app.pinecone.io/
2. Click "Create Index"
3. Settings:
   - Name: `neocure-medical`
   - Dimensions: `1536` (OpenAI embeddings)
   - Metric: `cosine`
   - Pod Type: `p1.x1` (free tier)
4. Click "Create Index"

---

## 🔥 Step 4: Get Firebase Service Account Key (2 minutes)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `hackathon-ai-7ffc9`
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download JSON file
6. Extract values and add to `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

---

## 🗄️ Step 5: Set Up Firebase Security Rules (3 minutes)

In Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isDoctor() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'DOCTOR';
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) || isAdmin();
    }
    
    // Patients collection
    match /patients/{patientId} {
      allow read: if isAuthenticated();
      allow write: if isDoctor() || isAdmin();
    }
    
    // Prescriptions
    match /prescriptions/{prescriptionId} {
      allow read: if isAuthenticated();
      allow create: if isDoctor() || isAdmin();
      allow update, delete: if isDoctor() || isAdmin();
    }
    
    // Drug Interactions
    match /drugInteractions/{interactionId} {
      allow read: if isAuthenticated();
      allow write: if isDoctor() || isAdmin();
    }
    
    // Medical Documents
    match /medicalDocuments/{documentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isDoctor() || isAdmin();
    }
    
    // Chat Logs
    match /chatLogs/{chatId} {
      allow read, write: if isAuthenticated() && 
                           resource.data.userId == request.auth.uid;
    }
    
    // Alerts
    match /alerts/{alertId} {
      allow read: if isAuthenticated();
      allow write: if isDoctor() || isAdmin();
    }
  }
}
```

---

## 🔧 Step 6: Start Redis (Optional, 2 minutes)

For conversation memory:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis && redis-server
# Linux: sudo apt-get install redis-server
```

---

## 🚀 Step 7: Run the Application (2 minutes)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd ..
npm run dev
```

**Expected output:**
```
✅ Firebase Admin initialized successfully
✅ OpenAI API initialized successfully
✅ Cloudinary initialized successfully
✅ Pinecone connected
✅ Redis connected
🚀 NeoCure backend listening on port 4000
```

---

## 🧪 Step 8: Test the Features (5 minutes)

### Test 1: Firebase Authentication

```bash
# Create a test user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@neocure.com",
    "password": "test123",
    "name": "Test User",
    "role": "PATIENT"
  }'
```

### Test 2: Upload Document with OCR

1. Open http://localhost:5173
2. Login with test credentials
3. Navigate to "Medical Records"
4. Upload a PDF or image
5. Wait for OCR processing
6. Check extracted text

### Test 3: RAG-Powered Chatbot

1. Open chatbot (bottom-right)
2. Ask: "What medications am I currently taking?"
3. System should retrieve from your records
4. Response should be contextual

### Test 4: Drug Interaction Alert

1. Login as doctor
2. Add prescription for patient
3. If interaction detected:
   - Alert appears in real-time
   - Notification badge updates
   - Alert panel shows details

---

## 📊 Step 9: Verify Integration (3 minutes)

### Check Pinecone

```bash
# List vectors
curl -X GET "https://neocure-medical-xxxxx.svc.pinecone.io/describe_index_stats" \
  -H "Api-Key: YOUR_PINECONE_API_KEY"
```

### Check Firebase

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Verify collections exist:
   - users
   - prescriptions
   - drugInteractions
   - medicalDocuments
   - chatLogs

### Check OpenAI Usage

1. Go to https://platform.openai.com/usage
2. Verify API calls are being made
3. Check token usage

---

## 🐛 Troubleshooting

### Issue: Firebase initialization failed

**Solution:**
1. Verify service account key is correct
2. Check `FIREBASE_PRIVATE_KEY` has proper newlines (`\n`)
3. Ensure project ID matches

### Issue: Pinecone connection error

**Solution:**
1. Verify index name: `neocure-medical`
2. Check API key is valid
3. Ensure dimensions are 1536

### Issue: OCR not working

**Solution:**
1. Check file upload is successful
2. Verify Tesseract.js is installed
3. Try Google Vision API as alternative

### Issue: Chatbot not responding

**Solution:**
1. Check OpenAI API key
2. Verify rate limits not exceeded
3. Check console for errors

---

## 📈 Performance Optimization

### 1. Enable Caching

```typescript
// Cache embeddings
const embeddingCache = new Map<string, number[]>();

export async function getEmbedding(text: string) {
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }
  
  const embedding = await embeddings.embedQuery(text);
  embeddingCache.set(text, embedding);
  return embedding;
}
```

### 2. Batch Processing

```typescript
// Process multiple documents in parallel
const results = await Promise.all(
  documents.map(doc => processDocument(doc))
);
```

### 3. Use Redis for Conversation Memory

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getConversationHistory(userId: string) {
  const history = await redis.get(`chat:${userId}`);
  return history ? JSON.parse(history) : [];
}

export async function saveConversationHistory(userId: string, messages: any[]) {
  await redis.setex(`chat:${userId}`, 3600, JSON.stringify(messages));
}
```

---

## 🔐 Security Checklist

- [ ] Firebase Security Rules configured
- [ ] Service account key secured (not in Git)
- [ ] API keys in environment variables
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Sensitive data encrypted
- [ ] Audit logging enabled

---

## 📚 Next Steps

1. **Implement OCR Service** — See `backend/src/services/ocr.ts`
2. **Complete RAG Pipeline** — See `backend/src/services/ragPipeline.ts`
3. **Enhance Chatbot** — See `backend/src/services/ai.ts`
4. **Add Real-Time Alerts** — See `backend/src/services/alerts.ts`
5. **Create Frontend Components** — See `src/components/`

---

## 📖 Documentation

- **PHASE3_IMPLEMENTATION_PLAN.md** — Complete implementation guide
- **FIREBASE_INTEGRATION.md** — Firebase setup details
- **RAG_SYSTEM.md** — RAG pipeline architecture
- **CHATBOT_GUIDE.md** — Chatbot implementation

---

**You're now ready to build Phase 3!** 🚀

Follow the implementation plan and refer to the code examples provided. Test each feature thoroughly before moving to the next.

**Estimated Total Time:** 30-60 minutes for basic setup, 2-3 days for full implementation.
