# NeoCure Backend Setup Instructions

## Phase 3: AI Integration & RAG System - COMPLETE IMPLEMENTATION

This implementation provides **REAL WORKING LOGIC** for:
- ✅ Medical records CRUD with Firebase
- ✅ Drug interaction checking with real alerts
- ✅ Prescription management with auto-interaction detection
- ✅ AI chatbot with OpenAI integration and RAG
- ✅ Document upload with OCR processing
- ✅ Real-time notifications with Socket.IO
- ✅ Vector database integration with Pinecone

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and update with your API keys:
```bash
cp .env.example .env
```

**Required API Keys (already in .env.example):**
- ✅ OPENAI_API_KEY (provided)
- ✅ PINECONE_API_KEY (provided) 
- ✅ CLOUDINARY credentials (provided)

### 3. Start the Server
```bash
npm run dev
```

## API Endpoints Now Available

### Medical Records
- `GET /api/records` - List medical records
- `POST /api/records` - Create medical record
- `GET /api/records/:id` - Get specific record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record
- `POST /api/records/upload` - Upload document with OCR

### Prescriptions (REAL DRUG INTERACTION LOGIC)
- `GET /api/prescriptions` - Get prescriptions
- `POST /api/prescriptions/add` - Add prescription (auto-checks interactions)
- `PUT /api/prescriptions/:id` - Update prescription
- `POST /api/prescriptions/:id/discontinue` - Discontinue prescription
- `GET /api/prescriptions/interactions/:patientId` - Get interaction history

### AI Chat (REAL OPENAI INTEGRATION)
- `POST /api/chat` - Chat with AI (uses RAG + OpenAI)
- `GET /api/chat/history` - Get chat history

### Alerts & Notifications
- `GET /api/alerts` - Get user alerts
- `GET /api/alerts/stats` - Get alert statistics
- `PATCH /api/alerts/:alertId/read` - Mark alert as read

### Drug Interactions
- `POST /api/drug-interactions/check` - Check drug interactions
- `GET /api/drug-interactions/stats` - Get interaction statistics

## Key Features Implemented

### 1. Real Drug Interaction Detection
```typescript
// When adding a prescription, automatically checks interactions
const result = await EnhancedDrugInteractionChecker.checkPrescriptionInteractions(
  patientId,
  drugName,
  doctorId
);
```

### 2. AI Chatbot with RAG
```typescript
// Real OpenAI integration with medical context
const result = await chatWithAI({
  userId,
  patientId,
  message,
  role: 'PATIENT' | 'DOCTOR'
});
```

### 3. OCR Document Processing
```typescript
// Upload document, extract text, index for RAG
const result = await processMedicalDocument(file, patientId, userId);
```

### 4. Real-time Alerts
```typescript
// WebSocket notifications for critical interactions
await sendCriticalInteractionAlert(patientId, doctorId, interaction);
```

## Frontend Integration Points

### Medical Records
```javascript
// Create record
POST /api/records
{
  "patientId": "user123",
  "symptoms": ["headache", "fever"],
  "currentMedications": ["aspirin"],
  "diagnosis": "Common cold"
}

// Upload document
POST /api/records/upload
FormData with 'document' file
```

### Prescriptions with Auto-Interaction Check
```javascript
// Add prescription (automatically checks interactions)
POST /api/prescriptions/add
{
  "patientId": "user123",
  "drugName": "warfarin",
  "dosage": "5mg",
  "frequency": "daily"
}

// Response includes interaction warning if detected
{
  "prescription": {...},
  "interactionWarning": {
    "detected": true,
    "severity": "SEVERE",
    "description": "Increased bleeding risk",
    "alertsSent": true
  }
}
```

### AI Chat
```javascript
// Chat with AI
POST /api/chat
{
  "message": "I'm feeling dizzy after taking my medicine",
  "patientId": "user123" // optional for doctors
}

// Response with RAG context
{
  "answer": "Based on your medical records...",
  "sources": [...],
  "context": "Retrieved medical information..."
}
```

## Database Collections (Firebase)

- `users` - User accounts
- `medicalRecords` - Patient medical records
- `prescriptions` - Active/inactive prescriptions
- `drugInteractions` - Detected interactions
- `chatLogs` - AI conversation history
- `alerts` - Real-time notifications
- `medicalDocuments` - Uploaded documents with OCR
- `vectorEmbeddings` - RAG vector storage metadata

## Real-Time Features

### WebSocket Events
- `new-alert` - Critical interaction detected
- `patient-alert` - Patient notifications
- `system-announcement` - System-wide messages

### Connection
```javascript
const socket = io('http://localhost:4000');
socket.emit('join-doctor-room', doctorId);
socket.on('new-alert', (alert) => {
  // Handle real-time alert
});
```

## Testing the Implementation

### 1. Test Drug Interactions
```bash
curl -X POST http://localhost:4000/api/prescriptions/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientId": "test123",
    "drugName": "warfarin",
    "dosage": "5mg",
    "frequency": "daily"
  }'
```

### 2. Test AI Chat
```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What are the side effects of my medications?",
    "patientId": "test123"
  }'
```

### 3. Test Document Upload
```bash
curl -X POST http://localhost:4000/api/records/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@medical_report.pdf" \
  -F "patientId=test123"
```

## Architecture Overview

```
Frontend (React) 
    ↓ HTTP/WebSocket
Backend (Node.js + Express)
    ↓
├── Firebase (Medical Records)
├── OpenAI (AI Chat + RAG)
├── Pinecone (Vector Database)
├── Cloudinary (File Storage)
└── Socket.IO (Real-time)
```

## Production Deployment

1. Set up Firebase project
2. Create Pinecone index: `neocure-medical`
3. Configure Cloudinary account
4. Set environment variables
5. Deploy with proper HTTPS/WSS

## Troubleshooting

### Common Issues
1. **TypeScript errors**: Run `npm install` to get all dependencies
2. **Firebase errors**: Check Firebase project configuration
3. **OpenAI errors**: Verify API key is valid
4. **Pinecone errors**: Ensure index exists and API key is correct

### Logs to Monitor
- `✅ OpenAI API initialized successfully`
- `✅ Pinecone index connected: neocure-medical`
- `✅ Firebase Admin initialized successfully`
- `🔌 WebSocket server ready for real-time alerts`

## Next Steps

The backend is now **FULLY FUNCTIONAL** with:
- Real drug interaction detection
- Working AI chatbot with medical context
- Document processing with OCR
- Real-time notifications
- Complete medical records management

Connect your frontend to these endpoints and you'll have a working medical platform!
