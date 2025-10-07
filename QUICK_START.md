# NeoCure Quick Start Guide

## 🚨 If You're Experiencing Issues

Run this diagnostic first:
```bash
node diagnose.js
```

---

## ✅ Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (from root)
cd ..
npm install
```

### Step 2: Configure Environment

```bash
# Copy example env file
cd backend
copy .env.example .env

# Edit .env and verify these keys are present:
# OPENAI_API_KEY=sk-proj-...
# PINECONE_API_KEY=pcsk_...
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
```

### Step 3: Start Backend

```bash
cd backend
npm run dev

# You should see:
# ✅ OpenAI API initialized successfully
# ✅ Pinecone index connected: neocure-medical
# ✅ Cloudinary configured successfully
# ✅ Firebase Admin initialized successfully
# Server listening on port 4000
```

### Step 4: Start Frontend

```bash
# In a new terminal, from root directory
npm run dev

# Opens on http://localhost:5173
```

### Step 5: Test the System

1. **Register a user:**
   - Go to http://localhost:5173
   - Click "Sign Up"
   - Fill in details (use role: PATIENT)
   - Click "Create Account"

2. **Verify login:**
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Check if `accessToken` exists

3. **Test API connection:**
   - Open Console tab
   - Run:
   ```javascript
   fetch('http://localhost:4000/api/prescriptions', {
     headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
   }).then(r => r.json()).then(console.log)
   ```
   - Should return `[]` (empty array), not 401 error

---

## 🔧 Fixing Specific Issues

### Issue: Medical Records Upload Failing

**Symptoms:**
- Upload button doesn't work
- Error message appears
- File doesn't appear in list

**Fixes:**

1. **Check if you're logged in:**
   ```javascript
   // In browser console
   console.log(localStorage.getItem('accessToken'))
   // Should show a token, not null
   ```

2. **Check backend logs:**
   - Look for "Error uploading document" or multer errors
   - Verify Cloudinary credentials are correct

3. **Test with small file first:**
   - Use a small PDF (< 1MB)
   - Check browser console for errors

4. **Verify endpoint:**
   ```bash
   curl -X POST http://localhost:4000/api/records/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "document=@test.pdf"
   ```

---

### Issue: Drug Interactions Not Detected

**Symptoms:**
- Checker shows "No interaction" for known interactions
- Returns generic messages
- Fallback data appears

**Fixes:**

1. **This is expected behavior if Python script unavailable**
   - The fallback checker still works for known combinations
   - Try: Warfarin + Aspirin (should show SEVERE)

2. **Test the endpoint directly:**
   ```bash
   curl -X POST http://localhost:4000/api/drug-interactions/check \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"drugs": ["Warfarin", "Aspirin"]}'
   ```

3. **Check backend logs:**
   - Look for "Python drug checker failed, using fallback"
   - This is normal - fallback should still return interaction data

4. **Verify known interactions:**
   The fallback knows these combinations:
   - Warfarin + Aspirin → SEVERE
   - Warfarin + Amoxicillin → MODERATE
   - Metformin + Alcohol → MODERATE
   - Lisinopril + Potassium → MODERATE

---

### Issue: Dashboard Shows Dummy Data

**Symptoms:**
- Stats show "..." or old numbers
- No prescriptions appear
- Interaction alerts empty

**Fixes:**

1. **Check API calls in Network tab:**
   - Open DevTools → Network
   - Filter by "XHR"
   - Navigate to Dashboard
   - Look for calls to `/prescriptions`, `/records`, `/drug-interactions/history`

2. **Check for 401 errors:**
   - If you see 401 Unauthorized, your token expired
   - Solution: Logout and login again

3. **Verify data exists:**
   ```bash
   # Check if you have any prescriptions
   curl http://localhost:4000/api/prescriptions \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Should return array (empty [] if none added yet)
   ```

4. **Add test data:**
   - As a doctor, add a prescription
   - Upload a medical record
   - Check a drug interaction
   - Dashboard should update

---

### Issue: Prescription Auto-Checking Not Working

**Symptoms:**
- Adding prescription doesn't show interaction warning
- No alerts appear
- Interaction not saved

**Fixes:**

1. **Ensure patient has existing medications:**
   - Auto-check only works if patient already has active prescriptions
   - Add first prescription (no check happens)
   - Add second prescription (check runs against first)

2. **Use known interacting drugs:**
   - First prescription: Warfarin 5mg
   - Second prescription: Aspirin 100mg
   - Should trigger SEVERE interaction alert

3. **Check response:**
   ```bash
   curl -X POST http://localhost:4000/api/prescriptions/add \
     -H "Authorization: Bearer DOCTOR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "patientId": "PATIENT_ID",
       "drugName": "Aspirin",
       "dosage": "100mg",
       "frequency": "Once daily"
     }'
   ```
   - Response should include `interactionWarning` object

4. **Verify doctor role:**
   - Only DOCTOR role can add prescriptions
   - Check: `localStorage.getItem('user')` → role should be "DOCTOR"

---

## 🧪 Quick Tests

### Test 1: Authentication Works
```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test User","role":"PATIENT"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Copy accessToken from response
```

### Test 2: Drug Interaction Works
```bash
TOKEN="paste_your_token_here"

curl -X POST http://localhost:4000/api/drug-interactions/check \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drugs": ["Warfarin", "Aspirin"]}'

# Should return interaction with severity: SEVERE
```

### Test 3: Chat Works
```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me?"}'

# Should return AI response (not generic)
```

### Test 4: Records Endpoint Works
```bash
curl http://localhost:4000/api/records \
  -H "Authorization: Bearer $TOKEN"

# Should return [] (empty array if no records yet)
```

---

## 🐛 Common Errors & Solutions

### Error: "Unauthorized" (401)
**Cause:** No token or invalid token  
**Fix:** Login again to get fresh token

### Error: "Forbidden" (403)
**Cause:** Wrong role (e.g., patient trying to add prescription)  
**Fix:** Login as doctor for doctor-only actions

### Error: "CORS policy"
**Cause:** Backend CORS_ORIGIN doesn't match frontend URL  
**Fix:** Set `CORS_ORIGIN=http://localhost:5173` in backend/.env

### Error: "Network Error"
**Cause:** Backend not running  
**Fix:** Start backend with `cd backend && npm run dev`

### Error: "File upload failed"
**Cause:** Cloudinary credentials invalid or missing  
**Fix:** Check CLOUDINARY_* vars in .env

### Error: "OpenAI API error"
**Cause:** Invalid or missing OPENAI_API_KEY  
**Fix:** Verify key in .env, check OpenAI dashboard for validity

---

## 📊 Expected Behavior

### After Fresh Setup:
- ✅ Backend starts without errors
- ✅ Frontend loads at http://localhost:5173
- ✅ Can register and login
- ✅ Dashboard shows 0 for all stats (no data yet)
- ✅ Chatbot responds (may be generic without uploaded records)
- ✅ Drug checker works with known combinations

### After Adding Data:
- ✅ Upload medical record → appears in list
- ✅ Add prescription → appears in active medications
- ✅ Check drug interaction → shows severity and description
- ✅ Dashboard stats update automatically
- ✅ Chatbot uses context from uploaded records

---

## 🎯 Success Criteria

Your system is working correctly when:

1. **Authentication:**
   - Can register new user
   - Can login
   - Token stored in localStorage
   - Protected routes accessible

2. **Medical Records:**
   - Can upload PDF or image
   - OCR extracts text (check modal view)
   - File appears in records list
   - Search works

3. **Drug Interactions:**
   - Warfarin + Aspirin shows SEVERE
   - Results include description and AI explanation
   - Interaction saved to history

4. **Prescriptions:**
   - Doctor can add prescription
   - Appears in patient's active medications
   - Auto-check runs (if patient has existing meds)
   - Critical interactions show alert

5. **Dashboard:**
   - Stats show real numbers (not "...")
   - Active medications list populated
   - Interaction alerts widget shows data
   - No console errors

6. **Chatbot:**
   - Responds to messages (not timeout)
   - Uses context from uploaded records
   - Conversation history maintained
   - No repetitive responses

---

## 📞 Still Having Issues?

1. **Run diagnostics:**
   ```bash
   node diagnose.js
   ```

2. **Check logs:**
   - Backend: Look at terminal running `npm run dev`
   - Frontend: Browser DevTools → Console tab

3. **Collect info:**
   - Backend logs (copy full output)
   - Browser console errors
   - Network tab (failed requests)
   - Node version: `node --version`

4. **Review documentation:**
   - `CRITICAL_FIXES.md` - Detailed troubleshooting
   - `TESTING_GUIDE.md` - Test scenarios
   - `IMPLEMENTATION_GUIDE.md` - Technical details

---

## 🚀 Next Steps After Setup

1. **Create test users:**
   - 1 patient account
   - 1 doctor account

2. **Add test data:**
   - Upload 2-3 medical documents
   - Add 2-3 prescriptions
   - Check 2-3 drug interactions

3. **Test workflows:**
   - Patient uploads record → chatbot uses context
   - Doctor adds prescription → auto-check runs
   - Critical interaction → alert appears

4. **Verify integrations:**
   - OpenAI responses are contextual
   - OCR extracts text correctly
   - Pinecone retrieves relevant chunks
   - Firebase stores data persistently

---

**Remember:** The system is fully functional. Most issues are due to:
- Missing environment variables
- Backend not running
- Expired authentication token
- CORS misconfiguration

Follow this guide step-by-step and you should have a working system! 🎉
