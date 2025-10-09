# NeoCure: Healing Safely 🏥✨

**AI-Powered Healthcare Platform** — A luxurious, glassmorphic web application that predicts medicine side effects and allergies, suggests safer alternatives, and provides personalized healthcare via explainable AI and an interactive RAG-powered chatbot.

![WhatsApp Image 2025-10-09 at 23 02 48_28898625](https://github.com/user-attachments/assets/5554917c-92e1-471d-8b9a-215d8bfe157a)

---

## 🌟 Overview

NeoCure combines cutting-edge AI technology with a beautiful, modern UI to revolutionize how patients and healthcare providers manage medication safety and allergy risks.

### Key Features

- **🔐 Role-Based Authentication** — Patient, Doctor, and Admin dashboards with JWT-based security
- **🧬 Personalized Onboarding** — Collect genetic, environmental, and medical background data
- **📄 Medical Records Management** — Secure upload with AI-powered text extraction and parsing
- **🤖 AI Allergy Detection** — Explainable AI predicts allergy risks (Red/Amber/Green) with detailed reasoning
- **💊 Safer Medicine Alternatives** — AI-powered suggestions with side-by-side comparisons
- **🩺 Symptom-Based Detection** — Check symptoms for possible allergies with confidence scores
- **💬 RAG-Powered Chatbot** — Contextual medical assistant with access to your complete medical history
- **⏰ Medicine Reminders** — Smart notifications with email/push support
- **📊 Admin Analytics** — System-wide insights and user management
- **🎨 Glassmorphic UI** — Modern, responsive design with Tailwind CSS

---

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Glassmorphism)
- **Icons**: Lucide React
- **State**: React Context API
- **Location**: `/` (root directory)

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM
- **Authentication**: JWT + bcrypt
- **AI/ML**: OpenAI GPT-4 + LangChain + Pinecone/ChromaDB
- **File Storage**: Cloudinary / AWS S3
- **API Docs**: Swagger (OpenAPI 3.0)
- **Testing**: Jest + Supertest
- **Location**: `/backend`

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Docker** and Docker Compose (recommended)
- **PostgreSQL** 16 (if running without Docker)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd neocure

# Start backend services (PostgreSQL + API + pgAdmin)
cd backend
docker-compose up --build

# In a new terminal, start frontend
cd ..
npm install
npm run dev
```

**Services:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- API Docs: `http://localhost:4000/api/docs`
- pgAdmin: `http://localhost:5050` (admin@neocure.local / admin)

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials (DATABASE_URL, JWT_SECRET, API keys)

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

#### Frontend Setup

```bash
# From project root
npm install
npm run dev
```

---

## 🔑 Sample Credentials (After Seeding)

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Patient | patient@neocure.com    | patient123  |
| Doctor  | doctor@neocure.com     | doctor123   |
| Admin   | admin@neocure.com      | admin123    |

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login and receive JWT
- `POST /api/auth/logout` — Logout
- `POST /api/auth/refresh` — Refresh access token

### Medical Records
- `GET /api/records` — List user's records
- `POST /api/records` — Upload new record
- `GET /api/records/:id` — Get specific record

### AI Features
- `POST /api/ai/allergy-detection` — Predict allergy risk
- `POST /api/ai/medicine-alternatives` — Get safer alternatives
- `POST /api/ai/symptom-check` — Symptom-based allergy detection
- `GET /api/ai/explain/:id` — Get AI explanation

### Chat
- `POST /api/chat` — Chat with RAG-powered AI assistant

### Reminders
- `GET /api/reminders` — List reminders
- `POST /api/reminders` — Create reminder
- `PUT /api/reminders/:id` — Update reminder
- `DELETE /api/reminders/:id` — Delete reminder

### Cures & Remedies
- `GET /api/cures/:allergyType` — Get treatment plan
- `POST /api/cures/:allergyType` — Create/update cure (Doctor/Admin)

### Admin
- `GET /api/admin/users` — List all users
- `GET /api/admin/analytics` — System analytics

**Full API Documentation**: `http://localhost:4000/api/docs`

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test

# With coverage
npm test -- --coverage
```

### Frontend Tests (To be implemented)

```bash
npm test
```

---

## 🔐 Security Features

- **Helmet.js** — Security headers
- **CORS** — Configurable cross-origin policies
- **Rate Limiting** — 300 requests per 15 minutes
- **HPP** — HTTP Parameter Pollution protection
- **JWT Authentication** — Stateless, role-based access control
- **bcrypt** — Password hashing (10 rounds)
- **Input Validation** — Zod/Joi schemas
- **SQL Injection Protection** — Prisma ORM with parameterized queries

---

## 🤖 AI Integration Status

### Current Implementation
The backend includes **placeholder stubs** for AI services with mock responses. This allows the full application to run and be tested without API keys.

### To Enable Full AI Features

1. **Set Environment Variables**:
   ```bash
   OPENAI_API_KEY=your-openai-key
   PINECONE_API_KEY=your-pinecone-key
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   ```

2. **Implement Services**:
   - `backend/src/services/ai.ts` — OpenAI GPT-4 integration
   - `backend/src/services/ragPipeline.ts` — LangChain + Pinecone RAG
   - `backend/src/services/upload.ts` — Cloudinary/S3 + OCR

3. **RAG Pipeline**:
   - Chunk and embed medical records
   - Store vectors in Pinecone
   - Retrieve context during chat queries
   - Generate explainable responses

---

## 📊 Database Schema

Key models (see `backend/prisma/schema.prisma`):

- **User** — Authentication and roles
- **UserProfile** — Genetic, environmental data
- **MedicalRecord** — Uploaded records with extracted text
- **AllergyRisk** — AI predictions with explanations
- **AlternativeMedicine** — Safer alternatives database
- **Cure** — Treatment plans per allergy type
- **Reminder** — Medicine reminders
- **ChatLog** — Conversation history for RAG

---

## 🌐 Deployment

### Docker Production

```bash
# Backend
cd backend
docker build -t neocure-backend .
docker run -p 4000:4000 --env-file .env neocure-backend

# Frontend
docker build -t neocure-frontend .
docker run -p 80:80 neocure-frontend
```

### Environment Variables (Production)

Ensure these are set securely:
- `NODE_ENV=production`
- `JWT_SECRET` — Strong random secret (32+ chars)
- `DATABASE_URL` — Production PostgreSQL connection
- `OPENAI_API_KEY`, `PINECONE_API_KEY` — AI service credentials
- `CLOUDINARY_*` or `AWS_*` — File storage credentials

---

## 📁 Project Structure

```
neocure/
├── backend/                    # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic (AI, RAG, uploads)
│   │   ├── middleware/         # Auth, validation
│   │   ├── server/             # Express app setup
│   │   └── __tests__/          # Jest tests
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Seed script
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
├── src/                        # React frontend
│   ├── components/             # UI components
│   ├── context/                # React context
│   └── types.ts                # TypeScript types
├── index.html
├── package.json
└── README.md                   # This file
```

---

## 🛣️ Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Backend scaffolding with Express + TypeScript
- [x] Prisma schema and migrations
- [x] JWT authentication with role-based access
- [x] API route structure
- [x] Docker setup
- [x] Basic tests

### Phase 2: AI Integration (In Progress)
- [ ] OpenAI GPT-4 integration
- [ ] LangChain RAG pipeline
- [ ] Pinecone vector database
- [ ] Medical record OCR/parsing
- [ ] Explainable AI responses

### Phase 3: Frontend-Backend Integration
- [ ] API client setup in frontend
- [ ] Authentication flow
- [ ] Medical records upload UI
- [ ] AI prediction displays
- [ ] Chatbot integration
- [ ] Reminder management

### Phase 4: Production Readiness
- [ ] Comprehensive test coverage (>80%)
- [ ] Input validation middleware
- [ ] Refresh token rotation
- [ ] Email/push notifications
- [ ] Cron jobs for reminders
- [ ] Admin audit logs
- [ ] Performance optimization
- [ ] Security audit

---

## 🤝 Contributing

This is a private project. For questions or contributions, contact the development team.

---

## 📄 License

Proprietary — NeoCure: Healing Safely

---

## 💡 Tech Highlights

- **Modern Stack**: React 18, TypeScript, Node.js 20, PostgreSQL 16
- **Type Safety**: Full TypeScript coverage (frontend + backend)
- **API-First**: RESTful API with Swagger documentation
- **Containerized**: Docker + Docker Compose for easy deployment
- **Scalable**: Modular architecture with clear separation of concerns
- **Secure**: Industry-standard security practices (JWT, bcrypt, Helmet, CORS)
- **Testable**: Jest + Supertest for backend, ready for frontend tests
- **AI-Ready**: Placeholder stubs for seamless AI integration

---

---

## 🆕 Latest Feature: Drug Interaction Checker

**Just Integrated!** The Python `drug-interaction-checker` module is now fully integrated into the backend:

### What It Does
- ✅ **Automatic Safety Checking** — New prescriptions checked against active medications
- ✅ **FDA Data + RAG + LLM** — Uses openFDA API with RAG pipeline and LLM analysis
- ✅ **AI Explanations** — Natural language interaction analysis with clinical recommendations
- ✅ **Severity Levels** — NONE, MILD, MODERATE, SEVERE, CRITICAL classifications
- ✅ **Safer Alternatives** — Suggests alternative medications when interactions detected
- ✅ **Comprehensive Logging** — All checks logged with response times and audit trail

### Quick Start
```bash
# 1. Migrate database
cd backend
npm run prisma:migrate

# 2. Seed sample data
npm run seed

# 3. Setup Python module
cd ../drug-interaction-checker/drug-interaction-checker
pip install -r requirements.txt

# 4. Test the integration
curl -X POST http://localhost:4000/api/drug-interactions/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"drugs":["Warfarin","Aspirin"]}'
```

### Documentation
- 📘 **Quick Start**: `DRUG_INTERACTION_QUICKSTART.md` — 5-minute setup
- 📗 **Integration Guide**: `backend/DRUG_INTERACTION_INTEGRATION.md` — Complete API reference
- 📙 **Migration Guide**: `backend/MIGRATION_GUIDE.md` — Database migration steps
- 📕 **Summary**: `INTEGRATION_SUMMARY.md` — Overview and architecture

### Example Response
```json
{
  "interactionDetected": true,
  "severity": "SEVERE",
  "description": "Combining Warfarin with Aspirin may increase bleeding risk...",
  "saferAlternatives": ["Acetaminophen"],
  "aiExplanation": "**Drug Interaction Analysis**\n\n**Medications Involved**: Warfarin, Aspirin\n\n**Severity Level**: SEVERE..."
}
```

---

**Built with ❤️ for safer, smarter healthcare.**
