# Phase 3: AI Integration & RAG System - Implementation Plan

## 🎯 Overview

This phase transforms NeoCure into a fully intelligent AI-assisted medical platform with:
- RAG (Retrieval-Augmented Generation) over patient documents
- OCR for medical record extraction
- Pinecone vector database for semantic search
- Real-time drug interaction alerts
- Context-aware chatbots for doctors and patients
- Firebase for authentication and database

---

## 🔄 Architecture Change: Firebase Integration

### Current: PostgreSQL + Prisma
### New: Firebase Firestore + Authentication

**Why Firebase?**
- Real-time database updates
- Built-in authentication
- Scalable cloud infrastructure
- WebSocket-like real-time listeners
- Easier deployment

---

## 📋 Implementation Checklist

### 1. Firebase Setup ✅
- [x] Firebase config provided
- [ ] Install Firebase SDK
- [ ] Initialize Firebase in backend
- [ ] Migrate Prisma schema to Firestore collections
- [ ] Update authentication to use Firebase Auth

### 2. RAG Pipeline 🔄
- [ ] Implement OCR service (Tesseract.js or Google Vision)
- [ ] Create document chunking service
- [ ] Integrate OpenAI embeddings
- [ ] Connect Pinecone vector store
- [ ] Build retrieval service

### 3. Chatbot Enhancement 🔄
- [ ] Replace mock responses with real OpenAI streaming
- [ ] Add conversation memory (Redis or in-memory)
- [ ] Implement RAG context injection
- [ ] Create patient chatbot mode
- [ ] Create doctor chatbot mode

### 4. Drug Interaction Intelligence 🔄
- [ ] Real-time ADR detection
- [ ] Alert notification system (WebSocket)
- [ ] Doctor dashboard alerts panel
- [ ] Patient medication history tracking

### 5. Security & Privacy 🔄
- [ ] Role-based access control (Firebase rules)
- [ ] Encrypt sensitive medical data
- [ ] Audit trail logging
- [ ] HIPAA compliance measures

### 6. Frontend Integration 🔄
- [ ] Firebase authentication UI
- [ ] Real-time data listeners
- [ ] File upload with OCR feedback
- [ ] Alert notifications UI
- [ ] Enhanced chatbot interface

### 7. Testing 🔄
- [ ] Unit tests for RAG pipeline
- [ ] Integration tests for Firebase
- [ ] E2E tests for chatbot flow
- [ ] Load testing for AI services

---

## 🗂️ Firebase Collections Structure

```
users/
  {userId}/
    - email
    - name
    - role (PATIENT | DOCTOR | ADMIN)
    - createdAt
    - profilePicture

patients/
  {patientId}/
    - userId (reference)
    - dateOfBirth
    - bloodType
    - allergies[]
    - medicalHistory
    
prescriptions/
  {prescriptionId}/
    - patientId
    - doctorId
    - drugName
    - dosage
    - frequency
    - status (ACTIVE | COMPLETED | DISCONTINUED)
    - startDate
    - endDate
    
drugInteractions/
  {interactionId}/
    - patientId
    - drugsInvolved[]
    - severity (NONE | MILD | MODERATE | SEVERE | CRITICAL)
    - description
    - saferAlternatives[]
    - aiExplanation
    - autoChecked
    - createdAt
    
medicalDocuments/
  {documentId}/
    - patientId
    - fileName
    - fileUrl (Cloudinary)
    - fileType (PDF | IMAGE)
    - extractedText
    - ocrStatus (PENDING | COMPLETED | FAILED)
    - uploadedAt
    
vectorEmbeddings/
  {embeddingId}/
    - documentId
    - patientId
    - chunkText
    - pineconeId
    - metadata
    
chatLogs/
  {chatId}/
    - userId
    - role (PATIENT | DOCTOR)
    - messages[]
      - role (user | assistant)
      - content
      - timestamp
    - context (RAG retrieved docs)
    
alerts/
  {alertId}/
    - type (ADR | NEW_DOCUMENT | CRITICAL_INTERACTION)
    - patientId
    - doctorId
    - severity
    - message
    - read
    - createdAt
```

---

## 🔧 Implementation Steps

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install firebase-admin
npm install @google-cloud/vision  # For OCR
npm install tesseract.js          # Alternative OCR
npm install @pinecone-database/pinecone
npm install langchain @langchain/openai
npm install socket.io              # For real-time alerts
npm install ioredis                # For conversation memory

# Frontend
cd ..
npm install firebase
npm install socket.io-client
```

### Step 2: Firebase Configuration

Create `backend/src/config/firebase.ts`:
```typescript
import admin from 'firebase-admin';

const firebaseConfig = {
  apiKey: "AIzaSyB_n7YLb9m-wi8Q2NG3e2BoqPqKaj8ejwU",
  authDomain: "hackathon-ai-7ffc9.firebaseapp.com",
  projectId: "hackathon-ai-7ffc9",
  storageBucket: "hackathon-ai-7ffc9.firebasestorage.app",
  messagingSenderId: "353377307573",
  appId: "1:353377307573:web:ef9a1c1bfecea9ea26e7fc",
};

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: firebaseConfig.projectId,
    // Add service account key here
  }),
});

export const db = admin.firestore();
export const auth = admin.auth();
```

### Step 3: OCR Service

Create `backend/src/services/ocr.ts`:
```typescript
import Tesseract from 'tesseract.js';
import vision from '@google-cloud/vision';

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  // Use Tesseract for local OCR
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
  return text;
}

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  // Use pdf-parse or Google Vision API
  // Implementation depends on your choice
}
```

### Step 4: RAG Pipeline

Create `backend/src/services/ragPipeline.ts`:
```typescript
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index('neocure-medical');

export async function indexDocument(
  documentId: string,
  patientId: string,
  text: string
) {
  // Split text into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  const chunks = await splitter.splitText(text);
  
  // Generate embeddings
  const vectors = await Promise.all(
    chunks.map(async (chunk, i) => {
      const embedding = await embeddings.embedQuery(chunk);
      return {
        id: `${documentId}-${i}`,
        values: embedding,
        metadata: {
          documentId,
          patientId,
          text: chunk,
          chunkIndex: i,
        },
      };
    })
  );
  
  // Store in Pinecone
  await index.upsert(vectors);
}

export async function retrieveContext(
  patientId: string,
  query: string,
  topK: number = 5
) {
  const queryEmbedding = await embeddings.embedQuery(query);
  
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    filter: { patientId },
    includeMetadata: true,
  });
  
  return results.matches.map(match => match.metadata?.text || '');
}
```

### Step 5: Enhanced Chatbot

Update `backend/src/services/ai.ts`:
```typescript
import OpenAI from 'openai';
import { retrieveContext } from './ragPipeline.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Conversation memory (use Redis in production)
const conversationMemory = new Map<string, any[]>();

export async function chatWithAI(params: {
  userId: string;
  patientId?: string;
  message: string;
  role: 'PATIENT' | 'DOCTOR';
}) {
  const { userId, patientId, message, role } = params;
  
  // Get conversation history
  const history = conversationMemory.get(userId) || [];
  
  // Retrieve relevant context from RAG
  let context = '';
  if (patientId) {
    const relevantDocs = await retrieveContext(patientId, message);
    context = relevantDocs.join('\n\n');
  }
  
  // Build system prompt
  const systemPrompt = role === 'PATIENT'
    ? `You are a helpful medical assistant for patients. Provide informational guidance based on their medical records. Never diagnose or prescribe.
    
Patient's Medical Context:
${context}`
    : `You are an AI assistant for doctors. Help them analyze patient data, identify patterns, and provide clinical insights.
    
Patient's Medical Context:
${context}`;
  
  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });
  
  const response = completion.choices[0].message.content || '';
  
  // Update conversation memory
  history.push(
    { role: 'user', content: message },
    { role: 'assistant', content: response }
  );
  
  // Keep only last 10 messages
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }
  
  conversationMemory.set(userId, history);
  
  return response;
}
```

### Step 6: Real-Time Alerts

Create `backend/src/services/alerts.ts`:
```typescript
import { Server } from 'socket.io';
import { db } from '../config/firebase.js';

let io: Server;

export function initializeSocketIO(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join-doctor-room', (doctorId) => {
      socket.join(`doctor-${doctorId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

export async function sendAlertToDoctor(
  doctorId: string,
  alert: {
    type: string;
    patientId: string;
    severity: string;
    message: string;
  }
) {
  // Save to Firebase
  await db.collection('alerts').add({
    ...alert,
    doctorId,
    read: false,
    createdAt: new Date(),
  });
  
  // Send real-time notification
  if (io) {
    io.to(`doctor-${doctorId}`).emit('new-alert', alert);
  }
}
```

### Step 7: Drug Interaction with Alerts

Update `backend/src/services/drugInteractionChecker.ts`:
```typescript
import { sendAlertToDoctor } from './alerts.js';
import { db } from '../config/firebase.js';

export async function checkPrescriptionInteractions(
  patientId: string,
  newDrug: string,
  doctorId: string
) {
  // Get active prescriptions
  const prescriptionsSnapshot = await db
    .collection('prescriptions')
    .where('patientId', '==', patientId)
    .where('status', '==', 'ACTIVE')
    .get();
  
  const activeDrugs = prescriptionsSnapshot.docs.map(
    doc => doc.data().drugName
  );
  
  // Check interactions
  const drugs = [...activeDrugs, newDrug];
  const interaction = await checkDrugInteractions(drugs);
  
  // If severe interaction detected, alert doctor
  if (interaction.severity === 'SEVERE' || interaction.severity === 'CRITICAL') {
    await sendAlertToDoctor(doctorId, {
      type: 'ADR',
      patientId,
      severity: interaction.severity,
      message: `Severe drug interaction detected: ${drugs.join(' + ')}`,
    });
  }
  
  // Save interaction to Firebase
  await db.collection('drugInteractions').add({
    patientId,
    drugsInvolved: drugs,
    severity: interaction.severity,
    description: interaction.description,
    saferAlternatives: interaction.saferAlternatives,
    aiExplanation: interaction.aiExplanation,
    autoChecked: true,
    createdAt: new Date(),
  });
  
  return interaction;
}
```

---

## 🎨 Frontend Updates

### Firebase Authentication

Create `src/config/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_n7YLb9m-wi8Q2NG3e2BoqPqKaj8ejwU",
  authDomain: "hackathon-ai-7ffc9.firebaseapp.com",
  projectId: "hackathon-ai-7ffc9",
  storageBucket: "hackathon-ai-7ffc9.firebasestorage.app",
  messagingSenderId: "353377307573",
  appId: "1:353377307573:web:ef9a1c1bfecea9ea26e7fc",
  measurementId: "G-9R6CPJPC9M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Real-Time Alerts Component

Create `src/components/AlertsPanel.tsx`:
```typescript
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import io from 'socket.io-client';

export function AlertsPanel({ doctorId }: { doctorId: string }) {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    // Listen to Firestore
    const q = query(
      collection(db, 'alerts'),
      where('doctorId', '==', doctorId),
      where('read', '==', false)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newAlerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlerts(newAlerts);
    });
    
    // Connect to WebSocket for real-time push
    const socket = io('http://localhost:4000');
    socket.emit('join-doctor-room', doctorId);
    
    socket.on('new-alert', (alert) => {
      // Show toast notification
      console.log('New alert:', alert);
    });
    
    return () => {
      unsubscribe();
      socket.disconnect();
    };
  }, [doctorId]);
  
  return (
    <div className="alerts-panel">
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

---

## 📊 Testing Strategy

### Unit Tests
```bash
# Test OCR
npm test ocr.test.ts

# Test RAG pipeline
npm test ragPipeline.test.ts

# Test chatbot
npm test ai.test.ts
```

### Integration Tests
```bash
# Test Firebase integration
npm test firebase.test.ts

# Test drug interaction flow
npm test drugInteractions.test.ts
```

### E2E Tests
```bash
# Test full user journey
npm run cypress:run
```

---

## 🔐 Security Checklist

- [ ] Firebase Security Rules configured
- [ ] API keys in environment variables
- [ ] Sensitive data encrypted
- [ ] Role-based access enforced
- [ ] Audit logging enabled
- [ ] CORS properly configured
- [ ] Rate limiting on AI endpoints

---

## 📚 Documentation to Create

1. **FIREBASE_MIGRATION.md** — Prisma to Firebase migration guide
2. **RAG_SYSTEM.md** — RAG pipeline architecture
3. **CHATBOT_GUIDE.md** — Chatbot implementation details
4. **ALERTS_SYSTEM.md** — Real-time alerting documentation
5. **SECURITY_COMPLIANCE.md** — HIPAA/GDPR compliance

---

## 🚀 Deployment

### Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Pinecone
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=neocure-medical

# Firebase
FIREBASE_PROJECT_ID=hackathon-ai-7ffc9
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=dnwfux5a0
CLOUDINARY_API_KEY=367376464581734
CLOUDINARY_API_SECRET=SegSwM77n6L3NJ_s0YugrtPTofE

# Google Vision (Optional)
GOOGLE_VISION_API_KEY=...
```

---

## 📈 Success Metrics

- [ ] OCR accuracy > 95%
- [ ] RAG retrieval relevance > 90%
- [ ] Chatbot response time < 3s
- [ ] Alert delivery latency < 1s
- [ ] Zero data breaches
- [ ] 99.9% uptime

---

**Phase 3 will transform NeoCure into a truly intelligent medical platform!** 🚀

Next: Execute implementation steps in order, test thoroughly, and deploy.
