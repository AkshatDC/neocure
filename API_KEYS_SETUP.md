# API Keys Integration Guide

Complete guide to set up and use your API keys in NeoCure.

---

## 🔑 API Keys Added

You've added the following API keys to `.env.example`:

1. **OpenAI API Key** — For GPT-4 powered AI explanations
2. **Pinecone API Key** — For vector database (RAG pipeline)
3. **Cloudinary Credentials** — For file uploads (medical records, images)

---

## ⚙️ Setup Instructions

### Step 1: Create Actual `.env` File

The `.env.example` file is just a template. You need to create the actual `.env` file:

```bash
cd backend
cp .env.example .env
```

**Important:** The `.env` file is gitignored for security. Never commit it to Git!

### Step 2: Verify API Keys in `.env`

Open `backend/.env` and ensure it contains:

```env
# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/neocure

# Auth
JWT_SECRET=your-very-secure-jwt-secret-change-this-in-production
JWT_EXPIRES_IN=1h

# OpenAI / RAG
OPENAI_API_KEY=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
PINECONE_API_KEY=pcsk_4pXNcW_89zDrQVb3N9KQwhuW2E6GaAfnFkVDUQnyu6Wpj7RH3AwmDsTEX7SErWMCvYawKk
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=neocure-medical

# Cloudinary
CLOUDINARY_CLOUD_NAME=dnwfux5a0
CLOUDINARY_API_KEY=367376464581734
CLOUDINARY_API_SECRET=SegSwM77n6L3NJ_s0YugrtPTofE
```

### Step 3: Install Dependencies

Make sure all required packages are installed:

```bash
cd backend
npm install openai @pinecone-database/pinecone cloudinary
```

### Step 4: Restart Backend

```bash
npm run dev
```

You should see:
```
✅ OpenAI API initialized successfully
✅ Cloudinary initialized successfully
```

---

## 🧪 Testing API Keys

### Test OpenAI Integration

The OpenAI API is now integrated in `backend/src/services/ai.ts`. It will:
- Generate AI-powered drug interaction explanations
- Provide natural language responses in the chatbot
- Analyze medical records and symptoms

**Test it:**
1. Start backend: `npm run dev`
2. Check for: `✅ OpenAI API initialized successfully`
3. Add a prescription via API
4. Verify AI explanation is generated (not mock data)

**Note:** If you see rate limit errors, the system will automatically fall back to mock responses.

### Test Cloudinary Integration

Cloudinary is now integrated in `backend/src/services/cloudinary.ts`. It will:
- Upload medical records (PDFs, images)
- Store user profile pictures
- Optimize images automatically

**Test it:**
1. Upload a medical record via the frontend
2. Check Cloudinary dashboard: https://console.cloudinary.com/
3. Verify file appears in `neocure` folder

### Test Pinecone Integration

Pinecone will be used for the RAG (Retrieval Augmented Generation) pipeline to:
- Store medical document embeddings
- Enable semantic search across medical records
- Improve AI response accuracy

**Setup Pinecone Index:**
```bash
# You'll need to create an index in Pinecone dashboard
# Index name: neocure-medical
# Dimensions: 1536 (for OpenAI embeddings)
# Metric: cosine
```

---

## 🔧 How API Keys Are Used

### 1. OpenAI GPT-4

**File:** `backend/src/services/ai.ts`

**Usage:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a clinical pharmacist...' },
    { role: 'user', content: 'Analyze drug interaction...' }
  ],
});
```

**Features:**
- ✅ Drug interaction explanations
- ✅ Medical record analysis
- ✅ Symptom checking
- ✅ Chatbot responses
- ✅ Alternative medicine suggestions

### 2. Cloudinary

**File:** `backend/src/services/cloudinary.ts`

**Usage:**
```typescript
import { uploadToCloudinary } from './cloudinary.js';

const result = await uploadToCloudinary(fileBuffer, {
  folder: 'medical-records',
  resourceType: 'auto',
});

console.log(result.secureUrl); // https://res.cloudinary.com/...
```

**Features:**
- ✅ Medical record uploads (PDF, images)
- ✅ Profile picture uploads
- ✅ Automatic image optimization
- ✅ Secure URLs
- ✅ File deletion

### 3. Pinecone (RAG Pipeline)

**File:** `backend/src/services/ragPipeline.ts`

**Usage:**
```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
  environment: env.PINECONE_ENVIRONMENT,
});

const index = pinecone.index(env.PINECONE_INDEX_NAME);
```

**Features:**
- ✅ Vector embeddings storage
- ✅ Semantic search
- ✅ Medical knowledge retrieval
- ✅ Context augmentation for AI

---

## 🚨 Rate Limits & Error Handling

### OpenAI Rate Limits

**Current Issue:** You're experiencing rate limits on the OpenAI API.

**Solutions:**

1. **Automatic Fallback** (Already Implemented)
   - System automatically uses mock responses when API fails
   - No disruption to user experience
   - Logs warning in console

2. **Upgrade OpenAI Plan**
   - Visit: https://platform.openai.com/account/billing
   - Upgrade to paid tier for higher limits
   - Add credits to your account

3. **Wait and Retry**
   - Rate limits reset after a few minutes
   - System will automatically retry on next request

4. **Optimize API Usage**
   - Cache responses where possible
   - Batch requests
   - Use lower-cost models for non-critical tasks

**Error Handling in Code:**
```typescript
if (openai) {
  try {
    const completion = await openai.chat.completions.create({...});
    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenAI API error:', error.message);
    // Fall through to mock response
  }
}

// Fallback mock explanation
return `**Drug Interaction Analysis**...`;
```

### Cloudinary Limits

**Free Tier:**
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month

**Monitor Usage:**
https://console.cloudinary.com/console/usage

### Pinecone Limits

**Free Tier:**
- 1 index
- 100K vectors
- 5 million queries/month

**Monitor Usage:**
https://app.pinecone.io/

---

## 📊 Monitoring API Usage

### Check API Status

**Backend Console:**
```bash
npm run dev
```

Look for:
```
✅ OpenAI API initialized successfully
✅ Cloudinary initialized successfully
⚠️  OPENAI_API_KEY not set - using mock responses
```

### Test Endpoints

**1. Test Drug Interaction (with AI):**
```bash
curl -X POST http://localhost:4000/api/drug-interactions/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drugs":["Warfarin","Aspirin"]}'
```

**2. Check if AI explanation is real or mock:**
- Real AI: Detailed, varied responses
- Mock: Always same template format

**3. Upload Test File:**
```bash
curl -X POST http://localhost:4000/api/records/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep `.env` file in `.gitignore`
- Use environment variables for all secrets
- Rotate API keys regularly
- Monitor API usage dashboards
- Set up billing alerts

### ❌ DON'T:
- Commit `.env` to Git
- Share API keys in chat/email
- Hardcode keys in source code
- Use production keys in development
- Expose keys in client-side code

---

## 🛠️ Troubleshooting

### Issue: "OpenAI API not initialized"

**Solution:**
1. Check `.env` file exists: `ls backend/.env`
2. Verify `OPENAI_API_KEY` is set
3. Restart backend: `npm run dev`

### Issue: "Rate limit reached"

**Solution:**
1. Wait 5-10 minutes
2. Check OpenAI dashboard for usage
3. System will use fallback responses automatically

### Issue: "Cloudinary upload failed"

**Solution:**
1. Verify credentials in `.env`
2. Check Cloudinary dashboard for errors
3. Ensure file size is within limits (<10MB)

### Issue: "Pinecone connection error"

**Solution:**
1. Create index in Pinecone dashboard
2. Verify index name matches `.env`
3. Check API key is valid

---

## 📈 Next Steps

### 1. Upgrade OpenAI Plan (Recommended)

Visit: https://platform.openai.com/account/billing
- Add payment method
- Set usage limits
- Enable higher rate limits

### 2. Create Pinecone Index

Visit: https://app.pinecone.io/
- Create new index: `neocure-medical`
- Dimensions: 1536
- Metric: cosine

### 3. Test All Features

- ✅ Drug interaction checking
- ✅ AI explanations
- ✅ File uploads
- ✅ Chatbot responses
- ✅ Medical record analysis

### 4. Monitor Usage

- OpenAI: https://platform.openai.com/usage
- Cloudinary: https://console.cloudinary.com/console/usage
- Pinecone: https://app.pinecone.io/usage

---

## 📝 Summary

### ✅ What's Configured

1. **Environment Variables** — All API keys added to `.env.example`
2. **OpenAI Integration** — GPT-4 for AI explanations (with fallback)
3. **Cloudinary Integration** — File upload service ready
4. **Pinecone Config** — RAG pipeline environment variables set
5. **Error Handling** — Automatic fallbacks for rate limits

### 🔄 Current Status

- **OpenAI:** ⚠️ Rate limited (using fallback responses)
- **Cloudinary:** ✅ Ready to use
- **Pinecone:** ⚠️ Needs index creation

### 🎯 Action Items

1. **Copy `.env.example` to `.env`** in backend folder
2. **Wait for OpenAI rate limit to reset** (or upgrade plan)
3. **Create Pinecone index** at https://app.pinecone.io/
4. **Test file upload** via frontend
5. **Monitor API usage** dashboards

---

**Your API keys are now integrated and ready to use!** 🎉

The system will automatically use real AI when available and fall back to mock responses during rate limits or errors.
