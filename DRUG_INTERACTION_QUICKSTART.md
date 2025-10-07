# Drug Interaction Integration - Quick Start Guide

Get the drug interaction checker running in 5 minutes! 🚀

---

## ✅ Prerequisites

- Backend already running (see main README.md)
- Python 3.8+ installed
- Docker running (if using Docker setup)

---

## 🚀 Quick Setup

### Step 1: Run Database Migration (30 seconds)

```bash
cd backend
npm run prisma:migrate
```

When prompted, enter migration name: `add_drug_interactions`

### Step 2: Seed Sample Data (10 seconds)

```bash
npm run seed
```

This creates:
- 2 sample prescriptions
- 1 sample drug interaction

### Step 3: Setup Python Module (2 minutes)

```bash
cd ../drug-interaction-checker/drug-interaction-checker

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.template .env
# Edit .env and add your OPENAI_API_KEY (optional for testing)
```

### Step 4: Test Python Module (30 seconds)

```bash
python src/check_interactions.py '["Warfarin", "Aspirin"]'
```

Expected output: JSON with interaction analysis

### Step 5: Restart Backend (10 seconds)

```bash
cd ../../backend
npm run dev
```

---

## 🧪 Test the Integration

### Option 1: Using Swagger UI

1. Open http://localhost:4000/api/docs
2. Click **Authorize** and login:
   - Email: `doctor@neocure.com`
   - Password: `doctor123`
3. Try **POST /api/drug-interactions/check**:
   ```json
   {
     "drugs": ["Warfarin", "Aspirin"]
   }
   ```

### Option 2: Using cURL

```bash
# Login as doctor
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@neocure.com","password":"doctor123"}' \
  | jq -r '.accessToken')

# Check drug interactions
curl -X POST http://localhost:4000/api/drug-interactions/check \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drugs":["Warfarin","Aspirin"]}' \
  | jq
```

### Option 3: Using Postman

1. **Login:**
   - POST `http://localhost:4000/api/auth/login`
   - Body: `{"email":"doctor@neocure.com","password":"doctor123"}`
   - Copy `accessToken` from response

2. **Check Interactions:**
   - POST `http://localhost:4000/api/drug-interactions/check`
   - Headers: `Authorization: Bearer YOUR_TOKEN`
   - Body: `{"drugs":["Warfarin","Aspirin"]}`

---

## 📊 Expected Response

```json
{
  "interactionDetected": true,
  "severity": "SEVERE",
  "description": "Combining Warfarin with Aspirin may increase bleeding risk...",
  "saferAlternatives": ["Acetaminophen"],
  "aiExplanation": "**Drug Interaction Analysis**\n\n**Medications Involved**: Warfarin, Aspirin\n\n**Severity Level**: SEVERE...",
  "fdaSource": {
    "Warfarin": { "success": true, "source": "openFDA" },
    "Aspirin": { "success": true, "source": "openFDA" }
  }
}
```

---

## 🎯 Test Auto-Check on New Prescription

```bash
# Add a prescription (auto-checks interactions)
curl -X POST http://localhost:4000/api/prescriptions/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "PATIENT_USER_ID",
    "drugName": "Warfarin",
    "dosage": "5mg",
    "frequency": "Once daily"
  }' \
  | jq
```

**Note:** Replace `PATIENT_USER_ID` with actual patient ID from database or use:

```bash
# Get patient ID
PATIENT_ID=$(curl -s http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.[] | select(.email=="patient@neocure.com") | .id')

# Then add prescription
curl -X POST http://localhost:4000/api/prescriptions/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$PATIENT_ID\",
    \"drugName\": \"Warfarin\",
    \"dosage\": \"5mg\",
    \"frequency\": \"Once daily\"
  }" \
  | jq
```

---

## 🔍 View Results in Database

### Using Prisma Studio

```bash
cd backend
npm run prisma:studio
```

Open http://localhost:5555 and browse:
- **Prescription** table
- **DrugInteraction** table
- **InteractionLog** table

### Using pgAdmin

1. Open http://localhost:5050
2. Login: `admin@neocure.local` / `admin`
3. Connect to database
4. Run queries:

```sql
-- View all prescriptions
SELECT * FROM "Prescription" ORDER BY "createdAt" DESC;

-- View all interactions
SELECT * FROM "DrugInteraction" ORDER BY "createdAt" DESC;

-- View interaction logs
SELECT * FROM "InteractionLog" ORDER BY "createdAt" DESC LIMIT 20;
```

---

## 🐛 Troubleshooting

### Python module not working?

**Fallback mode activated automatically!**

The system will use mock data if Python module fails. Check console for:
```
⚠️  Python drug checker failed, using fallback: ...
```

**To fix:**
1. Verify Python is in PATH: `python --version`
2. Check dependencies: `pip list | grep -E "langchain|openai|faiss"`
3. Test script manually: `python src/check_interactions.py '["test"]'`

### No interactions detected?

This is normal for some drug combinations! Try known interactions:
- Warfarin + Aspirin (SEVERE)
- Metformin + Alcohol (MODERATE)
- Lisinopril + Potassium (MODERATE)

### Database migration failed?

```bash
# Reset and retry
npm run prisma:migrate reset
npm run prisma:migrate
npm run seed
```

---

## 📚 Next Steps

1. **Read Full Documentation:**
   - `backend/DRUG_INTERACTION_INTEGRATION.md` — Complete API reference
   - `backend/MIGRATION_GUIDE.md` — Detailed migration steps

2. **Configure OpenAI:**
   - Add `OPENAI_API_KEY` to `backend/.env`
   - Restart backend for AI-powered explanations

3. **Run Tests:**
   ```bash
   cd backend
   npm test drugInteractions
   ```

4. **Integrate with Frontend:**
   - Add prescription management UI
   - Display interaction warnings
   - Show interaction history

---

## 🎉 Success Indicators

You'll know it's working when:

✅ Migration completes without errors  
✅ Seed creates 2 prescriptions + 1 interaction  
✅ Python script returns JSON (not error)  
✅ API returns interaction data (not 500 error)  
✅ Swagger docs show new endpoints  
✅ Database tables visible in Prisma Studio  

---

## 📞 Need Help?

- Check console logs: `npm run dev` output
- Review Python logs: `drug-interaction-checker/logs/app.log`
- Test endpoints in Swagger: http://localhost:4000/api/docs
- Check database: http://localhost:5555 (Prisma Studio)

---

**You're all set!** The drug interaction checker is now integrated and ready to use. 🎊
