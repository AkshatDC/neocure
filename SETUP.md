# NeoCure Setup Guide

Complete step-by-step instructions to get NeoCure running locally or with Docker.

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 20+** and npm installed ([Download](https://nodejs.org/))
- **Docker Desktop** (for containerized setup) ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

### Optional (for full AI features):
- OpenAI API key ([Get one](https://platform.openai.com/api-keys))
- Pinecone account ([Sign up](https://www.pinecone.io/))
- Cloudinary account ([Sign up](https://cloudinary.com/))

---

## 🚀 Quick Start (Docker - Recommended)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd neocure
```

### Step 2: Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set at minimum:
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/neocure
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173
```

### Step 3: Start Backend with Docker

```bash
# From backend directory
docker-compose up --build
```

This will start:
- **PostgreSQL** database on port 5432
- **Backend API** on port 4000
- **pgAdmin** on port 5050

Wait for migrations to complete and seed data to load.

### Step 4: Start Frontend

Open a **new terminal** window:

```bash
# From project root
cd ..
npm install
npm run dev
```

Frontend will start on `http://localhost:5173`

### Step 5: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **API Docs (Swagger)**: http://localhost:4000/api/docs
- **pgAdmin**: http://localhost:5050
  - Email: `admin@neocure.local`
  - Password: `admin`

### Step 6: Login with Sample Credentials

| Role    | Email                | Password   |
|---------|----------------------|------------|
| Patient | patient@neocure.com  | patient123 |
| Doctor  | doctor@neocure.com   | doctor123  |
| Admin   | admin@neocure.com    | admin123   |

---

## 🔧 Local Development (Without Docker)

### Step 1: Install PostgreSQL

Install PostgreSQL 16 locally:
- **Windows**: [Download installer](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql@16`
- **Linux**: `sudo apt install postgresql-16`

Create database:
```bash
psql -U postgres
CREATE DATABASE neocure;
\q
```

### Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/neocure
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=http://localhost:5173
```

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

Backend will run on `http://localhost:4000`

### Step 3: Setup Frontend

Open a new terminal:

```bash
# From project root
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 🤖 Enabling AI Features

The backend includes placeholder stubs that return mock data. To enable real AI:

### 1. Get API Keys

- **OpenAI**: https://platform.openai.com/api-keys
- **Pinecone**: https://app.pinecone.io/
- **Cloudinary**: https://cloudinary.com/console

### 2. Update `.env`

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=neocure-medical-records

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 3. Implement AI Services

Edit these files to integrate real AI:

- `backend/src/services/ai.ts` — Replace mock responses with OpenAI API calls
- `backend/src/services/ragPipeline.ts` — Implement LangChain + Pinecone RAG
- `backend/src/services/upload.ts` — Add Cloudinary upload and OCR

Example OpenAI integration:
```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
});
```

---

## 🧪 Running Tests

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

## 🐛 Troubleshooting

### Port Already in Use

If ports 4000, 5173, or 5432 are in use:

**Backend**: Change `PORT` in `backend/.env`
**Frontend**: Vite will auto-increment to 5174, 5175, etc.
**PostgreSQL**: Change port in `docker-compose.yml` or local config

### Docker Issues

```bash
# Stop all containers
docker-compose down

# Remove volumes (fresh start)
docker-compose down -v

# Rebuild
docker-compose up --build
```

### Database Connection Errors

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- For Docker: use `db` as hostname
- For local: use `localhost` or `127.0.0.1`

### Prisma Errors

```bash
# Regenerate client
npm run prisma:generate

# Reset database
npm run prisma:migrate reset

# Re-seed
npm run seed
```

### TypeScript Errors in Backend

These are expected before running `npm install`. After installing dependencies, run:

```bash
npm run build
```

---

## 📦 Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

Or with Docker:
```bash
docker build -t neocure-backend .
docker run -p 4000:4000 --env-file .env neocure-backend
```

### Frontend

```bash
npm run build
npm run preview
```

Build output will be in `dist/` directory.

---

## 🔐 Security Checklist for Production

- [ ] Change `JWT_SECRET` to a strong random string (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Use environment-specific database credentials
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS to allow only your frontend domain
- [ ] Set up rate limiting per user/IP
- [ ] Enable database backups
- [ ] Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
- [ ] Review and update Helmet.js security headers
- [ ] Implement refresh token rotation
- [ ] Add audit logging for sensitive operations

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [LangChain Docs](https://js.langchain.com/docs/)
- [Pinecone Docs](https://docs.pinecone.io/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review backend logs: `docker-compose logs api`
3. Check database logs: `docker-compose logs db`
4. Review the main README.md
5. Contact the development team

---

**Happy coding! 🚀**
