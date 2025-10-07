# NeoCure System Architecture

Complete architecture overview including the drug interaction integration.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│  React 18 + TypeScript + Vite + Tailwind CSS (Glassmorphism)  │
│                    Port: 5173 (Development)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                           │
│         Node.js 20 + Express.js + TypeScript + Prisma          │
│                    Port: 4000 (API Server)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes Layer                       │  │
│  │  /auth  /records  /ai  /chat  /reminders  /cures         │  │
│  │  /drug-interactions  /prescriptions  /admin              │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │                 Controllers Layer                         │  │
│  │  Request handling, validation, response formatting        │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │                  Services Layer                           │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │ AI Service  │  │ RAG Pipeline │  │ Drug Interaction│  │  │
│  │  │ (OpenAI)    │  │ (LangChain)  │  │ Checker         │  │  │
│  │  └─────────────┘  └──────────────┘  └────────┬────────┘  │  │
│  │  ┌─────────────┐  ┌──────────────┐           │           │  │
│  │  │ Upload      │  │ Notifications│           │           │  │
│  │  │ (Cloudinary)│  │ (Email/Push) │           │           │  │
│  │  └─────────────┘  └──────────────┘           │           │  │
│  └───────────────────────────────────────────────┼───────────┘  │
│                                                   │              │
│  ┌────────────────────────────────────────────────▼──────────┐  │
│  │                  Prisma ORM Layer                          │  │
│  │  Type-safe database client with migrations & schema       │  │
│  └────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────┬─┼────────────────────────────────┘
                              │ │
                              │ └──────────────────┐
                              ▼                    ▼
┌──────────────────────────────────┐  ┌────────────────────────────┐
│      DATABASE LAYER              │  │   PYTHON MICROSERVICE      │
│   PostgreSQL 16 + pgAdmin        │  │  drug-interaction-checker  │
│      Port: 5432 (DB)             │  │  ┌──────────────────────┐  │
│      Port: 5050 (pgAdmin)        │  │  │ check_interactions.py│  │
│                                  │  │  └──────────┬───────────┘  │
│  ┌────────────────────────────┐  │  │             │              │
│  │ Tables:                    │  │  │  ┌──────────▼───────────┐  │
│  │ • User                     │  │  │  │ fda_api.py           │  │
│  │ • UserProfile              │  │  │  │ (openFDA queries)    │  │
│  │ • MedicalRecord            │  │  │  └──────────────────────┘  │
│  │ • AllergyRisk              │  │  │  ┌──────────────────────┐  │
│  │ • Prescription       🆕    │  │  │  │ rag_pipeline.py      │  │
│  │ • DrugInteraction    🆕    │  │  │  │ (FAISS + LLM)        │  │
│  │ • InteractionLog     🆕    │  │  │  └──────────────────────┘  │
│  │ • Reminder                 │  │  │                            │
│  │ • ChatLog                  │  │  │  Returns: JSON             │
│  │ • Cure                     │  │  │  {interaction, severity,   │
│  │ • AlternativeMedicine      │  │  │   alternatives, ...}       │
│  └────────────────────────────┘  │  └────────────────────────────┘
└──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│      EXTERNAL SERVICES           │
│  • OpenAI GPT-4 (AI/LLM)        │
│  • Pinecone (Vector DB)         │
│  • Cloudinary (File Storage)    │
│  • OpenFDA API (Drug Data)      │
│  • SMTP/SendGrid (Email)        │
└──────────────────────────────────┘
```

---

## 🔄 Drug Interaction Check Flow

### Manual Check Flow

```
┌─────────────┐
│   Doctor    │
│  or Patient │
└──────┬──────┘
       │ POST /api/drug-interactions/check
       │ { drugs: ["Warfarin", "Aspirin"] }
       ▼
┌──────────────────────────────────────────┐
│  DrugInteractionController.checkInteractions()
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  drugInteractionChecker.checkDrugInteractions()
│  ┌────────────────────────────────────┐  │
│  │ 1. Log start time                  │  │
│  │ 2. Call Python subprocess          │  │
│  │ 3. Parse JSON response             │  │
│  │ 4. Map severity levels             │  │
│  │ 5. Log to InteractionLog table     │  │
│  └────────────────────────────────────┘  │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Python: check_interactions.py           │
│  ┌────────────────────────────────────┐  │
│  │ 1. Parse drug list from args       │  │
│  │ 2. Fetch FDA labels (fda_api.py)   │  │
│  │ 3. Run RAG pipeline (rag_pipeline) │  │
│  │ 4. Parse severity from LLM output  │  │
│  │ 5. Extract alternatives            │  │
│  │ 6. Return JSON                     │  │
│  └────────────────────────────────────┘  │
└──────┬───────────────────────────────────┘
       │ JSON: {interactionDetected, severity, ...}
       ▼
┌──────────────────────────────────────────┐
│  ai.generateInteractionExplanation()     │
│  ┌────────────────────────────────────┐  │
│  │ Generate natural language          │  │
│  │ explanation using OpenAI GPT-4     │  │
│  │ (or fallback template)             │  │
│  └────────────────────────────────────┘  │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Save to DrugInteraction table           │
│  if interaction detected                 │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Return JSON response to client          │
│  {                                        │
│    interactionDetected: true,            │
│    severity: "SEVERE",                   │
│    description: "...",                   │
│    saferAlternatives: [...],             │
│    aiExplanation: "..."                  │
│  }                                        │
└──────────────────────────────────────────┘
```

### Automatic Check Flow (Prescription)

```
┌─────────────┐
│   Doctor    │
└──────┬──────┘
       │ POST /api/prescriptions/add
       │ { userId, drugName, dosage, ... }
       ▼
┌──────────────────────────────────────────┐
│  PrescriptionController.addPrescription()│
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  1. Create Prescription record           │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  2. Get patient's active medications     │
│     SELECT * FROM Prescription           │
│     WHERE userId = ? AND status = ACTIVE │
└──────┬───────────────────────────────────┘
       │ ["Metformin", "Lisinopril"]
       ▼
┌──────────────────────────────────────────┐
│  3. Check interactions with new drug     │
│     checkInteractionsWithActiveMeds()    │
│     drugs: ["Metformin", "Lisinopril",   │
│             "Warfarin" (new)]            │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  [Same as Manual Check Flow]             │
│  Python → RAG → LLM → Parse → AI Explain │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  4. Save DrugInteraction record          │
│     with prescriptionId link             │
│     and autoChecked = true               │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  5. Return response with warning         │
│  {                                        │
│    prescription: {...},                  │
│    interactionWarning: {                 │
│      detected: true,                     │
│      severity: "SEVERE",                 │
│      description: "...",                 │
│      saferAlternatives: [...],           │
│      aiExplanation: "...",               │
│      interactionId: "uuid"               │
│    }                                      │
│  }                                        │
└──────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Doctor    │
│  Reviews    │
│  Warning    │
└─────────────┘
```

---

## 📦 Module Dependencies

### Backend Dependencies

```
Core Framework:
├── express (4.19.2) — Web framework
├── typescript (5.5.3) — Type safety
└── tsx (4.19.0) — TypeScript execution

Database:
├── @prisma/client (5.19.1) — ORM client
├── prisma (5.19.1) — Schema & migrations
└── postgresql (16) — Database

Authentication:
├── jsonwebtoken (9.0.2) — JWT tokens
└── bcryptjs (2.4.3) — Password hashing

Security:
├── helmet (7.1.0) — Security headers
├── cors (2.8.5) — CORS handling
├── hpp (0.2.3) — Parameter pollution
└── rate-limiter-flexible (5.0.0) — Rate limiting

AI/ML:
├── openai (4.55.3) — OpenAI API
├── langchain (0.2.17) — LLM framework
└── @pinecone-database/pinecone (4.0.0) — Vector DB

File Handling:
├── cloudinary (2.5.1) — File storage
└── multer (1.4.5) — File uploads

Utilities:
├── dotenv (16.4.5) — Environment config
├── morgan (1.10.0) — HTTP logging
├── joi (17.13.3) — Validation
└── zod (3.23.8) — Schema validation

Documentation:
├── swagger-jsdoc (6.2.8) — API docs generation
└── swagger-ui-express (5.0.1) — API docs UI

Testing:
├── jest (29.7.0) — Test framework
├── supertest (7.0.0) — HTTP testing
└── ts-jest (29.2.4) — TypeScript support

Notifications:
├── node-cron (3.0.3) — Scheduled tasks
└── nodemailer (6.9.14) — Email sending
```

### Python Module Dependencies

```
AI/ML:
├── langchain (0.0.200+) — LLM framework
├── langchain-openai — OpenAI integration
├── openai — OpenAI API client
└── google-generativeai (0.5.0+) — Google AI

Vector DB:
└── faiss-cpu — Vector similarity search

Web:
├── streamlit (1.18+) — Web UI (demo)
└── requests (2.28+) — HTTP client

Utilities:
├── python-dotenv — Environment config
├── tqdm — Progress bars
└── rich — Terminal formatting
```

---

## 🗄️ Database Schema Relationships

```
User (1) ──────────────┬─────────────── (N) MedicalRecord
  │                    │
  │                    └─────────────── (N) AllergyRisk
  │
  ├─────────────────── (1) UserProfile
  │
  ├─────────────────── (N) Reminder
  │
  ├─────────────────── (N) ChatLog
  │
  ├─────────────────── (N) Prescription 🆕
  │                         │
  │                         └─────────── (N) DrugInteraction 🆕
  │                                           │
  └─────────────────────────────────────────┘
  
InteractionLog 🆕 (audit trail, no relations)

AlternativeMedicine (standalone reference data)

Cure (standalone reference data)
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: Network Security                             │
│  ├── CORS (configurable origins)                       │
│  ├── Helmet.js (security headers)                      │
│  └── Rate Limiting (300 req/15min)                     │
│                                                         │
│  Layer 2: Authentication                               │
│  ├── JWT tokens (stateless)                            │
│  ├── bcrypt password hashing (10 rounds)               │
│  └── Token expiration (1 hour default)                 │
│                                                         │
│  Layer 3: Authorization                                │
│  ├── Role-based access control (RBAC)                  │
│  ├── Resource ownership validation                     │
│  └── Middleware guards per route                       │
│                                                         │
│  Layer 4: Input Validation                             │
│  ├── Zod/Joi schemas                                   │
│  ├── Type checking (TypeScript)                        │
│  └── SQL injection protection (Prisma ORM)             │
│                                                         │
│  Layer 5: Data Protection                              │
│  ├── Encrypted connections (HTTPS in prod)             │
│  ├── Sensitive data masking in logs                    │
│  ├── Cascading deletes (data cleanup)                  │
│  └── Audit trail (InteractionLog)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Examples

### Example 1: User Login

```
Client → POST /api/auth/login {email, password}
    ↓
AuthController.login()
    ↓
Prisma: SELECT * FROM User WHERE email = ?
    ↓
bcrypt.compare(password, passwordHash)
    ↓
jwt.sign({sub: userId, role})
    ↓
Client ← {user, accessToken}
```

### Example 2: Check Drug Interactions

```
Client → POST /api/drug-interactions/check {drugs: [...]}
    ↓
Authenticate (verify JWT)
    ↓
DrugInteractionController.checkInteractions()
    ↓
drugInteractionChecker.checkDrugInteractions()
    ↓
spawn Python subprocess
    ↓
Python: fetch FDA + RAG + LLM
    ↓
Parse JSON response
    ↓
ai.generateInteractionExplanation()
    ↓
Prisma: INSERT INTO DrugInteraction
    ↓
Prisma: INSERT INTO InteractionLog
    ↓
Client ← {interactionDetected, severity, ...}
```

### Example 3: Add Prescription with Auto-Check

```
Doctor → POST /api/prescriptions/add {userId, drugName, ...}
    ↓
Authenticate + Authorize (Doctor/Admin only)
    ↓
Prisma: INSERT INTO Prescription
    ↓
Prisma: SELECT active prescriptions for userId
    ↓
checkInteractionsWithActiveMeds(userId, newDrug)
    ↓
[Drug interaction check flow]
    ↓
If interaction: Prisma: INSERT INTO DrugInteraction
    ↓
Doctor ← {prescription, interactionWarning}
```

---

## 🚀 Deployment Architecture

### Development

```
┌─────────────────────────────────────────┐
│  Local Machine (Windows)                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Frontend (Vite Dev Server)      │   │
│  │ Port: 5173                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Backend (tsx watch)              │   │
│  │ Port: 4000                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Docker Compose                   │   │
│  │ ├── PostgreSQL (5432)            │   │
│  │ └── pgAdmin (5050)               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Python venv                      │   │
│  │ drug-interaction-checker         │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Production (Docker)

```
┌─────────────────────────────────────────┐
│  Docker Compose Stack                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Frontend Container               │   │
│  │ nginx serving static build       │   │
│  │ Port: 80/443                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Backend Container                │   │
│  │ Node.js production build         │   │
│  │ Port: 4000                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Database Container               │   │
│  │ PostgreSQL 16                    │   │
│  │ Port: 5432 (internal)            │   │
│  │ Volume: db_data                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Python Service Container         │   │
│  │ drug-interaction-checker API     │   │
│  │ Port: 8000 (internal)            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📈 Scalability Considerations

### Current Architecture
- **Monolithic backend** (single Node.js process)
- **Single database** (PostgreSQL)
- **Subprocess Python calls** (synchronous)

### Future Enhancements
1. **Microservices**
   - Separate drug interaction service
   - Dedicated AI/RAG service
   - Independent scaling

2. **Message Queue**
   - RabbitMQ or Redis for async processing
   - Background job processing
   - Retry mechanisms

3. **Caching Layer**
   - Redis for API responses
   - FDA label caching
   - Session management

4. **Load Balancing**
   - Multiple backend instances
   - Database read replicas
   - CDN for static assets

5. **Monitoring**
   - Application Performance Monitoring (APM)
   - Error tracking (Sentry)
   - Log aggregation (ELK stack)

---

**Architecture designed for safety, scalability, and maintainability.** 🏗️
