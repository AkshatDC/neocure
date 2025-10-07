# NeoCure Testing Guide

## 🧪 End-to-End Testing Scenarios

### Prerequisites
1. Backend running on `http://localhost:4000`
2. Frontend running on `http://localhost:5173`
3. Valid API keys in `.env` file
4. Firebase and Pinecone configured

---

## Test Scenario 1: Patient Registration & Login

### Steps:
1. Navigate to `http://localhost:5173`
2. Click "Sign Up" or "Register"
3. Fill in patient details:
   - Name: John Doe
   - Email: john.doe@example.com
   - Password: SecurePass123!
   - Role: Patient
4. Click "Create Account"
5. Login with credentials

### Expected Results:
- ✅ User redirected to patient dashboard
- ✅ Dashboard shows stats (0 medications, 0 records initially)
- ✅ JWT token stored in localStorage
- ✅ User profile accessible

---

## Test Scenario 2: Medical Record Upload with OCR

### Steps:
1. Login as patient
2. Navigate to "Medical Records" page
3. Click "Upload Record" button
4. Select a PDF or image file (prescription, lab report, etc.)
5. Wait for upload and OCR processing

### Expected Results:
- ✅ File uploaded to Cloudinary
- ✅ OCR extracts text from document
- ✅ Status shows "COMPLETED" with confidence score
- ✅ Click "View" to see extracted text
- ✅ Document indexed in Pinecone for RAG
- ✅ Dashboard stats updated (Medical Records count increases)

### Test Files:
- Sample prescription PDF
- Lab report image (JPG/PNG)
- Medical history document

### API Calls to Verify:
```bash
# Check upload
curl -X POST http://localhost:4000/api/records/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@sample.pdf"

# Verify record exists
curl http://localhost:4000/api/records \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Test Scenario 3: AI Chatbot with RAG Context

### Steps:
1. Upload at least one medical document (see Test 2)
2. Click chatbot icon (bottom-right)
3. Ask context-aware questions:
   - "What medications am I currently taking?"
   - "Do I have any allergies?"
   - "What were my last test results?"
   - "Can you summarize my medical history?"

### Expected Results:
- ✅ Chatbot retrieves relevant context from uploaded documents
- ✅ Responses reference specific information from records
- ✅ No repetitive generic responses
- ✅ Conversation history maintained
- ✅ Loading indicator during API call
- ✅ Auto-scroll to latest message

### Without Documents:
- Ask: "What is aspirin used for?"
- Expected: General medical information (no patient-specific context)

### API Verification:
```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What medications am I taking?"}'
```

---

## Test Scenario 4: Drug Interaction Checker

### Steps:
1. Navigate to "Drug Interaction Checker"
2. Enter two or more drugs:
   - Drug 1: Warfarin
   - Drug 2: Aspirin
3. Click "Check Interactions"
4. Review results

### Expected Results:
- ✅ Interaction detected: SEVERE
- ✅ Description: "Increased bleeding risk"
- ✅ AI explanation provided
- ✅ Safer alternatives suggested
- ✅ Interaction saved to history

### Test Cases:

#### High-Risk Interaction:
- Warfarin + Aspirin → SEVERE (bleeding risk)
- Metformin + Alcohol → MODERATE (lactic acidosis)

#### No Interaction:
- Vitamin D + Calcium → NONE
- Ibuprofen + Paracetamol → MILD

### API Verification:
```bash
curl -X POST http://localhost:4000/api/drug-interactions/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drugs": ["Warfarin", "Aspirin"]}'
```

---

## Test Scenario 5: Doctor Adds Prescription with Auto-Check

### Prerequisites:
- Login as doctor
- Have at least one patient in system

### Steps:
1. Login as doctor
2. Navigate to "Prescriptions" or patient management
3. Add new prescription:
   - Patient: Select patient
   - Drug Name: Aspirin
   - Dosage: 100mg
   - Frequency: Once daily
   - Notes: For cardiovascular protection
4. Click "Add Prescription"

### Expected Results:
- ✅ Prescription created successfully
- ✅ System automatically checks for interactions with patient's active medications
- ✅ If interaction detected:
  - Warning displayed to doctor
  - Severity level shown (color-coded)
  - AI explanation provided
  - Alert sent to doctor's notification panel
- ✅ Prescription appears in patient's active medications list

### Test with Known Interaction:
1. Patient already taking Warfarin
2. Doctor adds Aspirin
3. Expected: SEVERE interaction alert

### API Verification:
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

---

## Test Scenario 6: Dashboard Live Data

### Patient Dashboard:
1. Login as patient
2. View dashboard

### Verify:
- ✅ Active Medications count matches actual prescriptions
- ✅ Medical Records count matches uploaded documents
- ✅ Risk Alerts count matches critical interactions
- ✅ Drug Interaction Alerts widget shows recent interactions
- ✅ Active Medications list displays real prescriptions

### Doctor Dashboard:
1. Login as doctor
2. View dashboard

### Verify:
- ✅ Total Patients count
- ✅ Critical Alerts for assigned patients
- ✅ Recent patient activity
- ✅ Interaction alerts for all patients

---

## Test Scenario 7: Real-Time Alerts

### Setup:
1. Open two browser windows:
   - Window 1: Doctor logged in
   - Window 2: Patient logged in

### Steps:
1. In patient window: Upload new medical document
2. In doctor window: Check for notification

### Expected Results:
- ✅ Doctor receives "New Document Uploaded" alert
- ✅ Alert appears in notification bell (top-right)
- ✅ Unread count badge updates
- ✅ Click alert to view details

### Critical Interaction Alert:
1. Doctor adds prescription with severe interaction
2. Expected: Immediate alert in doctor's notification panel
3. Alert severity: CRITICAL (red)

---

## Test Scenario 8: RAG Pipeline Verification

### Steps:
1. Upload medical document with specific information
   - Example: "Patient allergic to penicillin"
2. Wait for OCR and indexing (check console logs)
3. Ask chatbot: "Am I allergic to any medications?"

### Expected Results:
- ✅ Chatbot retrieves relevant chunk from Pinecone
- ✅ Response mentions "penicillin allergy"
- ✅ Context is patient-specific (not generic)

### Backend Verification:
Check logs for:
```
✅ Document processed: [documentId]
📄 Created X text chunks
🧮 Generating embeddings for X chunks...
✅ Generated X embeddings
📦 Upserted batch 1/1
✅ Stored X vectors in Pinecone
✅ Document [documentId] fully indexed for RAG
```

### Pinecone Verification:
```bash
# Check vector count in Pinecone dashboard
# Should increase after each document upload
```

---

## Test Scenario 9: Search and Filter

### Medical Records:
1. Upload multiple documents with different names
2. Use search bar to filter:
   - Search: "prescription" → Shows only prescriptions
   - Search: "lab" → Shows only lab reports
3. Click filter button (future enhancement)

### Drug Interaction History:
1. Check multiple drug combinations
2. View history page
3. Filter by severity (CRITICAL, SEVERE, MODERATE)

---

## Test Scenario 10: Error Handling

### Test Cases:

#### Invalid File Upload:
- Upload .exe or unsupported file
- Expected: Error message, no crash

#### Network Error:
- Disconnect internet
- Try to send chat message
- Expected: "Connection error" message

#### Invalid Drug Name:
- Enter gibberish in drug checker
- Expected: Graceful handling, fallback response

#### Expired Token:
- Wait for JWT expiration
- Make API call
- Expected: Redirect to login

---

## Performance Testing

### Load Test:
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test chat endpoint
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  -p chat_payload.json \
  -T application/json \
  http://localhost:4000/api/chat
```

### Expected Performance:
- Chat response: < 3 seconds (with RAG)
- File upload: < 5 seconds (depends on file size)
- OCR processing: < 10 seconds
- Drug interaction check: < 2 seconds

---

## Security Testing

### Test Cases:

#### Authentication:
```bash
# Try accessing protected endpoint without token
curl http://localhost:4000/api/records
# Expected: 401 Unauthorized

# Try with invalid token
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:4000/api/records
# Expected: 401 Unauthorized
```

#### Authorization:
```bash
# Patient tries to access another patient's records
curl -H "Authorization: Bearer PATIENT_A_TOKEN" \
  http://localhost:4000/api/records?patientId=PATIENT_B_ID
# Expected: 403 Forbidden or empty results
```

#### SQL Injection:
- Try entering SQL in search fields
- Expected: Sanitized, no database errors

#### XSS:
- Try entering `<script>alert('xss')</script>` in chat
- Expected: Escaped, not executed

---

## Integration Testing Checklist

- [ ] User registration and login
- [ ] Medical record upload and OCR
- [ ] RAG indexing after upload
- [ ] Chatbot with context retrieval
- [ ] Drug interaction checking
- [ ] Prescription creation with auto-check
- [ ] Dashboard live data updates
- [ ] Real-time alerts (polling)
- [ ] Search and filter functionality
- [ ] Error handling and edge cases
- [ ] API authentication and authorization
- [ ] File upload size limits
- [ ] Rate limiting
- [ ] CORS configuration

---

## Debugging Tips

### Backend Issues:

#### Chatbot returns generic responses:
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Check Pinecone connection
# Look for "✅ Pinecone index connected" in logs

# Check RAG retrieval
# Look for "🔍 Retrieved X relevant chunks" in logs
```

#### OCR not working:
```bash
# Check Cloudinary credentials
echo $CLOUDINARY_CLOUD_NAME

# Check file upload logs
# Look for "📄 Processing medical document"
```

#### Drug interactions show fallback:
```bash
# Check Python script path
ls ../drug-interaction-checker/drug-interaction-checker/src/check_interactions.py

# Look for "Python drug checker failed, using fallback" in logs
```

### Frontend Issues:

#### API calls failing:
```javascript
// Check browser console
// Look for CORS errors or 401/403 responses

// Verify API URL
console.log(import.meta.env.VITE_API_URL)

// Check token
console.log(localStorage.getItem('accessToken'))
```

#### Components not updating:
```javascript
// Check React DevTools
// Verify state updates
// Check useEffect dependencies
```

---

## Automated Testing (Future)

### Unit Tests:
```bash
cd backend
npm run test

# Test coverage
npm run test:coverage
```

### E2E Tests (Playwright):
```bash
cd frontend
npx playwright test

# Run specific test
npx playwright test tests/chatbot.spec.ts
```

---

## Test Data Setup

### Sample Users:
```sql
-- Patient
INSERT INTO users (email, password, role, name) VALUES
('patient@test.com', 'hashed_password', 'PATIENT', 'John Doe');

-- Doctor
INSERT INTO users (email, password, role, name) VALUES
('doctor@test.com', 'hashed_password', 'DOCTOR', 'Dr. Jane Smith');
```

### Sample Prescriptions:
```javascript
// Via API or Firebase console
{
  patientId: "patient_id",
  doctorId: "doctor_id",
  drugName: "Lisinopril",
  dosage: "10mg",
  frequency: "Once daily",
  status: "ACTIVE"
}
```

---

## Success Criteria

### ✅ System is fully functional when:
1. Chatbot provides context-aware responses (not repetitive)
2. Medical records upload, store, and display with OCR text
3. Drug interactions are detected and displayed with severity
4. Prescriptions trigger automatic interaction checks
5. Dashboards show real-time data from database
6. Alerts appear for doctors when critical interactions detected
7. RAG pipeline retrieves relevant context from uploaded documents
8. All API endpoints return real data (no mock responses)
9. Frontend components fetch and display live data
10. Error handling prevents crashes and shows user-friendly messages

---

## Reporting Issues

When reporting bugs, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser console logs
4. Backend server logs
5. Network tab (API calls)
6. Environment details (OS, browser, Node version)

---

**Last Updated:** 2025-10-07
