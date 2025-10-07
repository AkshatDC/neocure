# Database Migration Guide - Drug Interaction Integration

This guide walks you through migrating your existing NeoCure database to include the new drug interaction features.

---

## 📋 What's Being Added

### New Tables
1. **Prescription** — Store patient prescriptions
2. **DrugInteraction** — Store interaction check results
3. **InteractionLog** — Audit log for all interaction checks

### New Enums
1. **PrescriptionStatus** — ACTIVE, COMPLETED, DISCONTINUED
2. **InteractionSeverity** — NONE, MILD, MODERATE, SEVERE, CRITICAL

### Updated Tables
- **User** — Added relations to `prescriptions` and `drugInteractions`

---

## 🚀 Migration Steps

### Step 1: Backup Current Database

**If using Docker:**
```bash
docker-compose exec db pg_dump -U postgres neocure > backup_$(date +%Y%m%d).sql
```

**If using local PostgreSQL:**
```bash
pg_dump -U postgres neocure > backup_$(date +%Y%m%d).sql
```

### Step 2: Update Prisma Schema

The schema has already been updated in `backend/prisma/schema.prisma`.

**Verify the changes:**
```bash
cd backend
cat prisma/schema.prisma | grep -A 20 "model Prescription"
```

### Step 3: Generate Prisma Client

```bash
npm run prisma:generate
```

This regenerates the Prisma client with new models.

### Step 4: Create Migration

```bash
npm run prisma:migrate
```

**When prompted:**
- Migration name: `add_drug_interactions`
- Confirm: `y`

This will:
1. Create migration SQL file
2. Apply migration to database
3. Update `_prisma_migrations` table

### Step 5: Verify Migration

```bash
npm run prisma:studio
```

Open Prisma Studio and verify:
- ✅ `Prescription` table exists
- ✅ `DrugInteraction` table exists
- ✅ `InteractionLog` table exists
- ✅ Enums `PrescriptionStatus` and `InteractionSeverity` exist

### Step 6: Seed Sample Data

```bash
npm run seed
```

This adds:
- 2 sample prescriptions for test patient
- 1 sample drug interaction

---

## 🔄 Rollback (If Needed)

### Option 1: Rollback Last Migration

```bash
npm run prisma:migrate reset
```

**Warning:** This will reset the entire database!

### Option 2: Restore from Backup

```bash
# Stop the database
docker-compose down

# Restore backup
docker-compose up -d db
docker-compose exec -T db psql -U postgres neocure < backup_YYYYMMDD.sql
```

---

## 🧪 Testing After Migration

### 1. Test Database Connection

```bash
npm run dev
```

Check console for:
```
✅ NeoCure backend listening on port 4000
```

### 2. Test New Endpoints

**Check drug interactions:**
```bash
# First, login to get token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@neocure.com","password":"patient123"}'

# Use the token to check interactions
curl -X POST http://localhost:4000/api/drug-interactions/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drugs":["Warfarin","Aspirin"]}'
```

**Get prescriptions:**
```bash
curl -X GET http://localhost:4000/api/prescriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Run Automated Tests

```bash
npm test drugInteractions
```

Expected output:
```
PASS  src/__tests__/drugInteractions.test.ts
  Drug Interactions API
    ✓ should check drug interactions successfully
    ✓ should return 400 if less than 2 drugs provided
    ✓ should return 401 without auth token
    ✓ should get interaction history
  Prescriptions API
    ✓ should add prescription with auto interaction check
    ✓ should detect interaction when adding second drug
    ✓ should return 403 if patient tries to add prescription
    ✓ should get user prescriptions

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

---

## 📊 Migration SQL (Reference)

The migration creates these tables:

```sql
-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DISCONTINUED');
CREATE TYPE "InteractionSeverity" AS ENUM ('NONE', 'MILD', 'MODERATE', 'SEVERE', 'CRITICAL');

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doctorId" TEXT,
    "drugName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "drugsInvolved" TEXT[],
    "severity" "InteractionSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "saferAlternatives" TEXT[],
    "aiExplanation" TEXT,
    "fdaSource" JSONB,
    "autoChecked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "drugsChecked" TEXT[],
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "responseTime" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugInteraction" ADD CONSTRAINT "DrugInteraction_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugInteraction" ADD CONSTRAINT "DrugInteraction_prescriptionId_fkey" 
    FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

---

## 🔍 Verification Queries

After migration, run these SQL queries to verify:

### Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Prescription', 'DrugInteraction', 'InteractionLog');
```

Expected: 3 rows

### Check Enums Exist

```sql
SELECT typname 
FROM pg_type 
WHERE typname IN ('PrescriptionStatus', 'InteractionSeverity');
```

Expected: 2 rows

### Check Foreign Keys

```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('Prescription', 'DrugInteraction');
```

Expected: 3 foreign keys

### Check Seed Data

```sql
SELECT COUNT(*) FROM "Prescription";
SELECT COUNT(*) FROM "DrugInteraction";
```

Expected: 2 prescriptions, 1 interaction (after seeding)

---

## ⚠️ Common Issues

### Issue: Migration fails with "relation already exists"

**Cause:** Tables already exist from previous migration attempt

**Solution:**
```bash
# Drop tables manually
npm run prisma:studio
# Delete tables: Prescription, DrugInteraction, InteractionLog
# Then re-run migration
npm run prisma:migrate
```

### Issue: Prisma client out of sync

**Error:** `Unknown arg 'prescriptions' in select.user.prescriptions`

**Solution:**
```bash
npm run prisma:generate
# Restart dev server
npm run dev
```

### Issue: Seed script fails

**Error:** `Foreign key constraint failed`

**Solution:**
- Ensure users exist before seeding prescriptions
- Check `patient.id` and `doctor.id` are valid
- Run seed script again: `npm run seed`

---

## 📈 Performance Considerations

### Indexes

The migration automatically creates indexes on:
- `Prescription.userId`
- `DrugInteraction.userId`
- `DrugInteraction.prescriptionId`

### Additional Recommended Indexes

For better query performance, consider adding:

```sql
-- Index for active prescriptions query
CREATE INDEX idx_prescription_status ON "Prescription"(status);

-- Index for interaction severity filtering
CREATE INDEX idx_interaction_severity ON "DrugInteraction"(severity);

-- Index for interaction log queries
CREATE INDEX idx_interaction_log_created ON "InteractionLog"("createdAt" DESC);
```

Add these to a new migration:
```bash
npx prisma migrate dev --name add_performance_indexes
```

---

## 🎯 Next Steps After Migration

1. **Update Frontend**
   - Add prescription management UI
   - Display interaction warnings
   - Show interaction history

2. **Configure Python Module**
   - Install dependencies: `pip install -r requirements.txt`
   - Set OpenAI API key in `.env`
   - Test: `python src/check_interactions.py '["Warfarin","Aspirin"]'`

3. **Enable AI Explanations**
   - Add `OPENAI_API_KEY` to backend `.env`
   - Restart backend
   - Test interaction check endpoint

4. **Monitor Logs**
   - Check `InteractionLog` table regularly
   - Monitor response times
   - Review error messages

---

## 📞 Support

If you encounter issues during migration:

1. Check migration logs: `backend/prisma/migrations/`
2. Review database logs: `docker-compose logs db`
3. Verify Prisma schema: `npx prisma validate`
4. Check this guide's troubleshooting section

---

**Migration Complete!** ✅

Your database now supports drug interaction checking with automatic prescription monitoring.
