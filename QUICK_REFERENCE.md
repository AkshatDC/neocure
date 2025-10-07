# NeoCure Quick Reference Card

Fast reference for common tasks and commands.

---

## 🚀 Quick Start

```bash
# Backend
cd backend
npm install
npm run prisma:migrate
npm run seed
npm run dev

# Frontend
npm install
cp .env.example .env
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

---

## 🔑 Default Credentials

| Role    | Email                | Password   |
|---------|----------------------|------------|
| Patient | patient@neocure.com  | patient123 |
| Doctor  | doctor@neocure.com   | doctor123  |
| Admin   | admin@neocure.com    | admin123   |

---

## 📡 Key API Endpoints

### Drug Interactions
```bash
POST /api/drug-interactions/check
GET  /api/drug-interactions/history
GET  /api/drug-interactions/:id
```

### Prescriptions
```bash
GET  /api/prescriptions
POST /api/prescriptions/add          # Auto-checks interactions
PUT  /api/prescriptions/:id
POST /api/prescriptions/:id/discontinue
```

### Authentication
```bash
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh
```

---

## 💻 Frontend API Usage

### Check Drug Interactions
```typescript
import { drugInteractionsApi } from './api/drugInteractions';

const result = await drugInteractionsApi.check(['Warfarin', 'Aspirin']);
console.log(result.severity); // 'SEVERE'
```

### Add Prescription
```typescript
import { prescriptionsApi } from './api/prescriptions';

const response = await prescriptionsApi.add({
  userId: 'user-id',
  drugName: 'Warfarin',
  dosage: '5mg',
  frequency: 'Once daily',
});

if (response.interactionWarning.detected) {
  alert(`Warning: ${response.interactionWarning.severity}`);
}
```

### Get Interaction History
```typescript
const history = await drugInteractionsApi.getHistory();
```

---

## 🗄️ Database Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Reset database
npm run prisma:migrate reset

# Seed data
npm run seed

# Open Prisma Studio
npm run prisma:studio
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Specific test file
npm test drugInteractions

# With coverage
npm test -- --coverage
```

---

## 🐛 Debugging

### Check Backend Health
```bash
curl http://localhost:4000/health
```

### Test Drug Interaction Endpoint
```bash
curl -X POST http://localhost:4000/api/drug-interactions/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drugs":["Warfarin","Aspirin"]}'
```

### Check Logs
```bash
# Backend console output
npm run dev

# Docker logs
docker-compose logs api
docker-compose logs db
```

---

## 🔧 Common Fixes

### Port Already in Use
```bash
# Find process on port 4000
lsof -i :4000
kill -9 <PID>

# Or change port in backend/.env
PORT=4001
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart db
```

### Frontend Can't Connect to Backend
```bash
# Check .env file
cat .env
# Should have: VITE_API_URL=http://localhost:4000/api

# Restart frontend
npm run dev
```

---

## 📁 Project Structure

```
neocure/
├── backend/                 # Node.js + Express + Prisma
│   ├── src/
│   │   ├── api/            # (not used, routes in routes/)
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation
│   │   └── __tests__/      # Jest tests
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed script
│   └── package.json
├── src/                    # React frontend
│   ├── api/               # API client layer
│   ├── components/        # UI components
│   ├── context/           # React context
│   └── types.ts           # TypeScript types
└── drug-interaction-checker/  # Python module
```

---

## 🎨 UI Component Imports

```typescript
// Drug interaction features
import { DrugInteractionChecker } from './components/DrugInteractionChecker';
import { PrescriptionManager } from './components/PrescriptionManager';
import { InteractionHistory } from './components/InteractionHistory';
import { DrugInteractionAnalytics } from './components/DrugInteractionAnalytics';

// Existing features
import Dashboard from './components/Dashboard';
import MedicalRecords from './components/MedicalRecords';
import ChatBot from './components/ChatBot';
```

---

## 🔐 Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neocure
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
OPENAI_API_KEY=sk-...
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:4000/api
```

---

## 📊 Severity Levels

| Level    | Color  | Meaning                    |
|----------|--------|----------------------------|
| NONE     | Green  | No interaction             |
| MILD     | Orange | Minor interaction          |
| MODERATE | Yellow | Moderate risk              |
| SEVERE   | Red    | High risk                  |
| CRITICAL | Red    | Contraindicated (do not use)|

---

## 🎯 Role-Based Features

### Patient
- View prescriptions
- Check drug interactions
- View interaction history
- Medical records
- Reminders

### Doctor
- All patient features +
- Add prescriptions (auto-check)
- View analytics
- Manage patients

### Admin
- All features +
- User management
- System analytics
- All interactions view

---

## 📚 Documentation Files

| File                              | Purpose                          |
|-----------------------------------|----------------------------------|
| README.md                         | Project overview                 |
| SETUP.md                          | Setup instructions               |
| DRUG_INTERACTION_QUICKSTART.md    | 5-minute setup                   |
| DRUG_INTERACTION_INTEGRATION.md   | Backend API reference            |
| FRONTEND_INTEGRATION.md           | Frontend integration guide       |
| MIGRATION_GUIDE.md                | Database migration steps         |
| ARCHITECTURE.md                   | System architecture              |
| PHASE2_COMPLETE.md                | Phase 2 summary                  |
| QUICK_REFERENCE.md                | This file                        |

---

## 🆘 Quick Troubleshooting

| Problem                    | Solution                                      |
|----------------------------|-----------------------------------------------|
| Can't login                | Check credentials, verify backend is running  |
| 401 Unauthorized           | Re-login to get fresh token                   |
| API connection failed      | Check VITE_API_URL in .env                    |
| No interactions detected   | Verify Python module is running               |
| Database error             | Run `npm run prisma:migrate`                  |
| Port in use                | Change PORT in backend/.env                   |
| Chatbot not responding     | Check browser console for errors              |

---

## 🚀 Deployment Commands

### Build Frontend
```bash
npm run build
npm run preview
```

### Build Backend
```bash
cd backend
npm run build
npm start
```

### Docker
```bash
cd backend
docker-compose up --build
```

---

## 📞 Support

- **API Docs:** http://localhost:4000/api/docs
- **Prisma Studio:** http://localhost:5555
- **pgAdmin:** http://localhost:5050

---

**Keep this card handy for quick reference!** 📌

