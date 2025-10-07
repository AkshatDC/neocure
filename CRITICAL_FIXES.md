# Critical Fixes Required

## Issues Identified

1. ❌ Medical record upload failing
2. ❌ Drug interactions not being detected
3. ❌ Dashboard showing dummy data
4. ❌ Prescription auto-checking not working

---

## Root Causes & Fixes

### Issue 1: Medical Record Upload Failing

**Likely Causes:**
- Multer middleware not properly configured
- CORS issues with file upload
- Authentication token not being sent
- Cloudinary credentials invalid

**Fix 1: Check Frontend Upload Code**
The upload in `MedicalRecords.tsx` uses raw fetch instead of apiClient, which might not include proper headers.

**Fix 2: Verify Backend Multer Setup**
The `upload` middleware needs to be properly exported and configured.

**Fix 3: Test Upload Endpoint**
```bash
# Test if endpoint is accessible
curl -X POST http://localhost:4000/api/records/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@test.pdf"
```

---

### Issue 2: Drug Interactions Not Detected

**Likely Causes:**
- Python script path incorrect
- Fallback logic not working
- API endpoint not being called
- Frontend not sending correct data format

**Fix: Verify Drug Interaction Flow**

1. Check if `/api/drug-interactions/check` endpoint works:
```bash
curl -X POST http://localhost:4000/api/drug-interactions/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drugs": ["Warfarin", "Aspirin"]}'
```

2. Check backend logs for:
   - "Python drug checker failed, using fallback"
   - Fallback should still return interaction data

---

### Issue 3: Dashboard Showing Dummy Data

**Likely Causes:**
- API calls failing silently
- Authentication not working
- CORS blocking requests
- Backend not running

**Fix: Debug API Calls**

1. Open browser DevTools → Network tab
2. Check if API calls are being made
3. Look for 401/403/500 errors
4. Verify `localStorage.getItem('accessToken')` exists

**Quick Test:**
```javascript
// In browser console
fetch('http://localhost:4000/api/prescriptions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
}).then(r => r.json()).then(console.log)
```

---

### Issue 4: Prescription Auto-Checking Not Working

**Likely Causes:**
- Prescription add endpoint not calling interaction checker
- Patient has no existing prescriptions to check against
- Drug interaction service failing silently

**Fix: Verify Prescription Flow**

The `addPrescription` controller should:
1. Create prescription
2. Call `EnhancedDrugInteractionChecker.checkPrescriptionInteractions()`
3. Return interaction warning

---

## Immediate Action Items

### 1. Verify Backend is Running
```bash
cd backend
npm run dev
# Should see: "Server listening on port 4000"
```

### 2. Check Environment Variables
```bash
# In backend directory
cat .env
# Verify all keys are present and valid
```

### 3. Test Authentication
```bash
# Register a user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "PATIENT"
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
# Copy the accessToken from response
```

### 4. Test Each Endpoint

**Test Records:**
```bash
TOKEN="your_access_token_here"

# List records
curl http://localhost:4000/api/records \
  -H "Authorization: Bearer $TOKEN"
```

**Test Drug Interactions:**
```bash
curl -X POST http://localhost:4000/api/drug-interactions/check \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drugs": ["Warfarin", "Aspirin"]}'
```

**Test Prescriptions:**
```bash
curl http://localhost:4000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Error Messages & Solutions

### "Unauthorized" or 401 Error
**Solution:** 
- Check if token exists: `localStorage.getItem('accessToken')`
- Re-login to get fresh token
- Verify JWT_SECRET matches between login and verification

### "CORS Error"
**Solution:**
- Check `CORS_ORIGIN` in backend `.env`
- Should be: `http://localhost:5173`
- Restart backend after changing

### "Network Error" or "Failed to Fetch"
**Solution:**
- Verify backend is running on port 4000
- Check `VITE_API_URL` in frontend
- Disable browser extensions (ad blockers)

### "File upload failed"
**Solution:**
- Check Cloudinary credentials
- Verify file size < 10MB
- Check file format (PDF, JPG, PNG only)
- Look for multer errors in backend logs

### "Drug interaction returns null"
**Solution:**
- This is expected if Python script unavailable
- Fallback should still work for known combinations
- Check backend logs for "using fallback"

---

## Step-by-Step Debugging

### Step 1: Verify Backend Health
```bash
curl http://localhost:4000/health
# Expected: {"ok":true,"service":"neocure-backend"}
```

### Step 2: Check Frontend API URL
```javascript
// In browser console on http://localhost:5173
console.log(import.meta.env.VITE_API_URL)
// Expected: "http://localhost:4000/api"
```

### Step 3: Test Authentication Flow
1. Open http://localhost:5173
2. Register new user
3. Login
4. Open DevTools → Application → Local Storage
5. Verify `accessToken` exists

### Step 4: Test API Calls
1. Open DevTools → Network tab
2. Navigate to Dashboard
3. Look for API calls to `/prescriptions`, `/records`, `/drug-interactions/history`
4. Check response status (should be 200, not 401/403)

### Step 5: Check Backend Logs
Look for:
- ✅ "OpenAI API initialized successfully"
- ✅ "Pinecone index connected"
- ✅ "Cloudinary configured successfully"
- ✅ "Firebase Admin initialized"
- ❌ Any error messages

---

## Quick Fixes to Apply

### Fix 1: Ensure Auth Token is Sent
In `src/api/client.ts`, verify:
```typescript
private getHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}
```

### Fix 2: Add Error Logging
In `src/components/Dashboard.tsx`, add:
```typescript
const fetchDashboardData = async () => {
  try {
    // ... existing code
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    // Check if it's auth error
    if (error.message.includes('401')) {
      alert('Session expired. Please login again.');
    }
  }
};
```

### Fix 3: Verify Drug Interaction Fallback
In `backend/src/services/drugInteractionChecker.ts`, the fallback should always return data even if Python fails.

---

## Testing Checklist

After applying fixes, test:

- [ ] Backend starts without errors
- [ ] Health endpoint returns 200
- [ ] User can register and login
- [ ] Token is stored in localStorage
- [ ] Dashboard makes API calls (check Network tab)
- [ ] API calls return 200 (not 401/403)
- [ ] Drug interaction checker returns results
- [ ] File upload shows progress
- [ ] OCR processing completes
- [ ] Chatbot responds (not generic)

---

## If Still Not Working

### Collect Debug Information:

1. **Backend logs** (full output from `npm run dev`)
2. **Browser console errors** (F12 → Console tab)
3. **Network tab** (F12 → Network, filter by XHR)
4. **Environment variables** (sanitize API keys)
5. **Node version** (`node --version`)
6. **NPM version** (`npm --version`)

### Check These Files:

- `backend/.env` - All keys present?
- `backend/src/server/config/env.ts` - Correct defaults?
- `src/api/client.ts` - API_BASE_URL correct?
- Browser localStorage - Token exists?

---

## Emergency Fallback

If nothing works, try this minimal test:

```bash
# Start backend
cd backend
npm run dev

# In another terminal, test directly
curl http://localhost:4000/health

# If that works, test auth
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test","role":"PATIENT"}'

# If that works, the issue is in frontend
```

Then check frontend:
```bash
# Start frontend
npm run dev

# Open http://localhost:5173
# Open DevTools → Console
# Look for errors
```

---

**Next Steps:**
1. Run backend and check for startup errors
2. Test health endpoint
3. Test authentication
4. Test each API endpoint individually
5. Check browser console for frontend errors
6. Verify API calls in Network tab
