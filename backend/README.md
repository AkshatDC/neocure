# NeoCure Backend

**AI-Powered Healthcare Platform Backend** — Secure, scalable, and production-ready Node.js + TypeScript + Express + Prisma + PostgreSQL backend with JWT authentication, RAG-powered chatbot, and explainable AI for allergy detection and medicine alternatives.

---

## 🚀 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js (TypeScript)
- **Database**: PostgreSQL 16 via Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **AI/ML**: OpenAI GPT-4, LangChain, Pinecone/ChromaDB (RAG)
- **File Uploads**: Cloudinary / AWS S3
- **API Docs**: Swagger (OpenAPI 3.0)
- **Testing**: Jest + Supertest
- **Deployment**: Docker + Docker Compose

---

## 📦 Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server/
│   │   ├── app.ts               # Express app setup
│   │   └── config/
│   │       ├── env.ts           # Environment variables
│   │       └── swagger.ts       # Swagger configuration
│   ├── routes/
│   │   ├── index.ts             # Main router
│   │   └── modules/             # Feature-based routes
│   ├── controllers/             # Request handlers
│   ├── middleware/              # Auth, validation, etc.
│   ├── services/                # Business logic (AI, RAG, uploads, etc.)
│   └── __tests__/               # Jest tests
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed script
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for containerized setup)
- PostgreSQL 16 (if running locally without Docker)

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required variables:**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secure random string for JWT signing
- `OPENAI_API_KEY` — OpenAI API key for AI features
- `PINECONE_API_KEY` — Pinecone API key for RAG (optional)
- `CLOUDINARY_*` — Cloudinary credentials for file uploads (optional)

### 3. Run with Docker Compose (Recommended)

```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** on `localhost:5432`
- **pgAdmin** on `localhost:5050` (admin@neocure.local / admin)
- **Backend API** on `localhost:4000`

### 4. Run Locally (Without Docker)

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run seed

# Start dev server
npm run dev
```

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login and get JWT token
- `POST /api/auth/logout` — Logout (client-side token removal)
- `POST /api/auth/refresh` — Refresh JWT token

### Medical Records
- `GET /api/records` — List user's medical records
- `POST /api/records` — Upload and create new record
- `GET /api/records/:id` — Get specific record

### AI Features
- `POST /api/ai/allergy-detection` — Predict allergy risk with explainable AI
- `POST /api/ai/medicine-alternatives` — Get safer medicine alternatives
- `POST /api/ai/symptom-check` — Check symptoms for possible allergies
- `GET /api/ai/explain/:id` — Get explanation for a prediction

### Chat (RAG-powered)
- `POST /api/chat` — Chat with AI assistant (retrieves medical history)

### Reminders
- `GET /api/reminders` — List reminders
- `POST /api/reminders` — Create reminder
- `PUT /api/reminders/:id` — Update reminder
- `DELETE /api/reminders/:id` — Delete reminder

### Cures & Remedies
- `GET /api/cures/:allergyType` — Get treatment plan for allergy
- `POST /api/cures/:allergyType` — Create/update cure (Doctor/Admin only)

### Admin
- `GET /api/admin/users` — List all users (Admin only)
- `GET /api/admin/analytics` — System analytics (Admin only)

### Documentation
- `GET /api/docs` — Swagger UI (interactive API docs)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## 🔐 Security Features

- **Helmet.js** — Security headers
- **CORS** — Configurable cross-origin access
- **Rate Limiting** — Prevent abuse (300 req/15min)
- **HPP** — HTTP Parameter Pollution protection
- **JWT** — Stateless authentication with role-based access control
- **bcrypt** — Password hashing (10 rounds)
- **Input Validation** — Zod/Joi schemas (to be extended)

---

## 🤖 AI & RAG Integration

### Current Status
The backend includes **placeholder stubs** for AI services. To enable full functionality:

1. **Set `OPENAI_API_KEY`** in `.env`
2. **Implement LangChain pipelines** in `src/services/ragPipeline.ts`
3. **Configure Pinecone** or ChromaDB for vector storage
4. **Integrate OCR** (Tesseract.js or Google Vision) in `src/services/upload.ts`

### RAG Pipeline (To Implement)
- Chunk and embed medical records using OpenAI embeddings
- Store vectors in Pinecone with metadata
- Retrieve relevant context during chat queries
- Augment prompts with retrieved documents
- Generate explainable AI responses

---

## 📊 Database Schema

See `prisma/schema.prisma` for full schema. Key models:

- **User** — Authentication and roles (PATIENT, DOCTOR, ADMIN)
- **UserProfile** — Genetic, environmental, and preference data
- **MedicalRecord** — Uploaded records with extracted text
- **AllergyRisk** — AI predictions with explanations
- **AlternativeMedicine** — Safer medicine alternatives
- **Cure** — Treatment plans per allergy type
- **Reminder** — Medicine reminders
- **ChatLog** — Chat history for RAG context

---

## 🌐 Deployment

### Docker Production Build

```bash
docker build -t neocure-backend .
docker run -p 4000:4000 --env-file .env neocure-backend
```

### Environment Variables for Production

Ensure these are set securely (use secrets management):
- `NODE_ENV=production`
- `JWT_SECRET` — Strong random secret
- `DATABASE_URL` — Production PostgreSQL URL
- `OPENAI_API_KEY`, `PINECONE_API_KEY`, `CLOUDINARY_*` — API credentials

---

## 📝 Sample Credentials (After Seeding)

- **Patient**: `patient@neocure.com` / `patient123`
- **Doctor**: `doctor@neocure.com` / `doctor123`
- **Admin**: `admin@neocure.com` / `admin123`

---

## 🛣️ Roadmap

- [ ] Implement full OpenAI + LangChain integration
- [ ] Add Pinecone vector DB for RAG
- [ ] Integrate Cloudinary/S3 file uploads
- [ ] Add OCR/LLM-based medical record parsing
- [ ] Implement cron jobs for reminder notifications
- [ ] Add email/push notification service
- [ ] Expand test coverage (>80%)
- [ ] Add API request/response validation middleware
- [ ] Implement refresh token rotation
- [ ] Add audit logs for admin actions

---

## 📄 License

Proprietary — NeoCure: Healing Safely

---

## 🤝 Contributing

This is a private project. For questions or contributions, contact the development team.

---

**Built with ❤️ for safer healthcare.**
