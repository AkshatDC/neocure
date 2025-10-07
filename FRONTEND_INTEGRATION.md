# Frontend Integration Guide - Drug Interactions

Complete guide for the frontend integration of drug interaction features in NeoCure.

---

## 🎯 Overview

The frontend has been fully integrated with the drug interaction backend, providing:
- **Drug Interaction Checker** — Manual interaction checking
- **Prescription Manager** — Add prescriptions with automatic interaction checking
- **Interaction History** — View past interaction checks
- **Analytics Dashboard** — Visualize interaction statistics
- **AI Chatbot Integration** — Ask about drug interactions in natural language

---

## 📁 New Files Created

### API Layer (`src/api/`)
```
src/api/
├── client.ts                  # Base API client with auth headers
├── auth.ts                    # Authentication API calls
├── drugInteractions.ts        # Drug interaction endpoints
└── prescriptions.ts           # Prescription management endpoints
```

### Components (`src/components/`)
```
src/components/
├── DrugInteractionChecker.tsx      # Manual interaction checker UI
├── PrescriptionManager.tsx         # Prescription management with auto-check
├── InteractionHistory.tsx          # Interaction check history
├── DrugInteractionAnalytics.tsx    # Analytics dashboard
└── ChatBot.tsx                     # Updated with drug interaction queries
```

### Configuration
```
.env.example                   # Environment variables template
```

---

## 🔌 API Integration

### Base API Client

**File:** `src/api/client.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...this.getHeaders(), ...options?.headers },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}
```

**Features:**
- ✅ Automatic JWT token injection from localStorage
- ✅ Centralized error handling
- ✅ Type-safe responses with TypeScript generics
- ✅ Configurable base URL via environment variables

### Drug Interactions API

**File:** `src/api/drugInteractions.ts`

```typescript
export const drugInteractionsApi = {
  check: (drugs: string[]) =>
    apiClient.post<DrugInteractionResult>('/drug-interactions/check', { drugs }),

  getHistory: () =>
    apiClient.get<DrugInteraction[]>('/drug-interactions/history'),

  getById: (id: string) =>
    apiClient.get<DrugInteraction>(`/drug-interactions/${id}`),
};
```

### Prescriptions API

**File:** `src/api/prescriptions.ts`

```typescript
export const prescriptionsApi = {
  getAll: (status?: string) =>
    apiClient.get<Prescription[]>(`/prescriptions${status ? `?status=${status}` : ''}`),

  add: (data: AddPrescriptionData) =>
    apiClient.post<AddPrescriptionResponse>('/prescriptions/add', data),

  update: (id: string, data: Partial<Prescription>) =>
    apiClient.put<Prescription>(`/prescriptions/${id}`, data),

  discontinue: (id: string) =>
    apiClient.post<Prescription>(`/prescriptions/${id}/discontinue`, {}),
};
```

---

## 🎨 UI Components

### 1. Drug Interaction Checker

**Component:** `DrugInteractionChecker.tsx`

**Features:**
- ✅ Multi-drug input fields (dynamic add/remove)
- ✅ Real-time interaction checking
- ✅ Severity-based color coding (Green/Yellow/Red)
- ✅ Safer alternatives display
- ✅ AI-generated explanations
- ✅ Loading states and error handling

**Usage:**
```typescript
import { DrugInteractionChecker } from './components/DrugInteractionChecker';

// In App.tsx
case 'drug-interactions':
  return <DrugInteractionChecker />;
```

**UI Flow:**
1. User enters 2+ drug names
2. Clicks "Check Interactions"
3. System calls `/api/drug-interactions/check`
4. Results displayed with severity badge
5. Safer alternatives shown if available
6. AI explanation rendered in markdown

### 2. Prescription Manager

**Component:** `PrescriptionManager.tsx`

**Features:**
- ✅ List active prescriptions
- ✅ Add new prescription (Doctor/Admin only)
- ✅ **Automatic interaction checking** on add
- ✅ Modal warning if interaction detected
- ✅ Discontinue prescriptions
- ✅ Role-based access control

**Usage:**
```typescript
import { PrescriptionManager } from './components/PrescriptionManager';

case 'prescriptions':
  return <PrescriptionManager />;
```

**Auto-Check Flow:**
1. Doctor fills prescription form
2. Clicks "Add Prescription"
3. Backend creates prescription
4. Backend automatically checks against active meds
5. If interaction: Modal warning displayed
6. Doctor can review or proceed anyway

### 3. Interaction History

**Component:** `InteractionHistory.tsx`

**Features:**
- ✅ Chronological list of all checks
- ✅ Severity badges
- ✅ Auto-check indicator
- ✅ Safer alternatives display
- ✅ Timestamp display

**Usage:**
```typescript
import { InteractionHistory } from './components/InteractionHistory';

case 'interaction-history':
  return <InteractionHistory />;
```

### 4. Drug Interaction Analytics

**Component:** `DrugInteractionAnalytics.tsx`

**Features:**
- ✅ Total checks counter (auto + manual)
- ✅ High-risk interaction count
- ✅ Severity distribution chart
- ✅ Most checked drug combinations
- ✅ Visual progress bars

**Usage:**
```typescript
import { DrugInteractionAnalytics } from './components/DrugInteractionAnalytics';

case 'analytics':
  return <DrugInteractionAnalytics />;
```

**Metrics Displayed:**
- Total interaction checks
- Auto vs manual checks
- Critical/Severe count
- Safe checks (no interaction)
- Severity distribution (%)
- Top 5 drug combinations

### 5. AI Chatbot Integration

**Component:** `ChatBot.tsx` (Updated)

**New Features:**
- ✅ Drug name extraction from queries
- ✅ Automatic interaction checking
- ✅ Natural language responses
- ✅ Severity-based formatting

**Example Queries:**
```
User: "Can I take warfarin and aspirin together?"
Bot: ⚠️ Drug Interaction Detected
     Severity: SEVERE
     [Full interaction details]

User: "Is it safe to combine metformin and lisinopril?"
Bot: ✅ Based on available data, metformin and lisinopril
     do not have significant known interactions...
```

**Implementation:**
```typescript
const extractDrugNames = (text: string): string[] => {
  const commonDrugs = ['warfarin', 'aspirin', 'ibuprofen', ...];
  const words = text.toLowerCase().split(/\s+/);
  return words.filter(word => commonDrugs.includes(word));
};

if (lowerQuery.includes('interact') || lowerQuery.includes('combine')) {
  const drugs = extractDrugNames(query);
  if (drugs.length >= 2) {
    const result = await drugInteractionsApi.check(drugs);
    // Format and return response
  }
}
```

---

## 🗺️ Navigation Updates

### Sidebar Menu Items

**File:** `src/components/Sidebar.tsx`

**Patient Menu:**
- Dashboard
- Medical Records
- Allergy Detection
- Medications
- **Drug Interactions** 🆕
- **Prescriptions** 🆕
- **Interaction History** 🆕
- Risk Dashboard
- Reminders
- Profile

**Doctor Menu:**
- Dashboard
- Patients
- **Prescriptions** 🆕
- **Drug Interactions** 🆕
- **Interaction History** 🆕
- Medical Records
- Treatments
- **Analytics** 🆕
- Profile

**Admin Menu:**
- Dashboard
- User Management
- **Drug Analytics** 🆕
- **All Interactions** 🆕
- Profile

---

## ⚙️ Configuration

### Environment Variables

**File:** `.env.example`

```env
# API Base URL (backend endpoint)
VITE_API_URL=http://localhost:4000/api

# Optional: Enable debug mode
VITE_DEBUG=false
```

**Setup:**
```bash
# Copy example to .env
cp .env.example .env

# Edit with your backend URL
VITE_API_URL=http://localhost:4000/api
```

### Vite Configuration

Vite automatically loads `.env` files and exposes variables prefixed with `VITE_`.

**Access in code:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 🔐 Authentication Flow

### Login Process

1. User submits credentials via `Login.tsx`
2. Frontend calls `/api/auth/login`
3. Backend returns `{ user, accessToken }`
4. Token stored in `localStorage`
5. Subsequent API calls include token in `Authorization` header

**Implementation:**
```typescript
// src/api/auth.ts
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  },
};
```

### Protected Routes

All drug interaction and prescription endpoints require authentication:
```typescript
// Automatic token injection in ApiClient
private getHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}
```

---

## 🎨 UI/UX Features

### Glassmorphism Design

All components use consistent glassmorphism styling:
```typescript
className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
```

### Severity Color Coding

```typescript
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': case 'SEVERE': return 'bg-red-500';
    case 'MODERATE': return 'bg-yellow-500';
    case 'MILD': return 'bg-orange-400';
    default: return 'bg-green-500';
  }
};
```

### Loading States

```typescript
{loading ? (
  <Loader className="w-5 h-5 animate-spin" />
) : (
  'Check Interactions'
)}
```

### Error Handling

```typescript
try {
  const data = await drugInteractionsApi.check(drugs);
  setResult(data);
} catch (err: any) {
  setError(err.message || 'Failed to check interactions');
}
```

---

## 🧪 Testing the Integration

### Manual Testing

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test Flow:**
   - Login as doctor (`doctor@neocure.com` / `doctor123`)
   - Navigate to "Drug Interactions"
   - Enter: Warfarin, Aspirin
   - Click "Check Interactions"
   - Verify severity badge shows "SEVERE"
   - Check safer alternatives displayed

4. **Test Auto-Check:**
   - Navigate to "Prescriptions"
   - Click "Add Prescription"
   - Enter patient ID and drug details
   - Submit form
   - Verify interaction warning modal appears

5. **Test Chatbot:**
   - Open chatbot (bottom-right)
   - Type: "Can I take warfarin and aspirin together?"
   - Verify interaction details returned

### Browser Console Testing

```javascript
// Test API client
const { drugInteractionsApi } = await import('./src/api/drugInteractions');
const result = await drugInteractionsApi.check(['warfarin', 'aspirin']);
console.log(result);
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   User UI   │
└──────┬──────┘
       │ User Action (e.g., Check Interactions)
       ▼
┌─────────────────────────┐
│  React Component        │
│  (DrugInteractionChecker)│
└──────┬──────────────────┘
       │ drugInteractionsApi.check(drugs)
       ▼
┌─────────────────────────┐
│  API Client             │
│  (src/api/client.ts)    │
└──────┬──────────────────┘
       │ fetch('/api/drug-interactions/check')
       │ + JWT token in headers
       ▼
┌─────────────────────────┐
│  Backend API            │
│  (Express + TypeScript) │
└──────┬──────────────────┘
       │ Python subprocess
       ▼
┌─────────────────────────┐
│  Python Module          │
│  (drug-interaction-     │
│   checker)              │
└──────┬──────────────────┘
       │ FDA API + RAG + LLM
       ▼
┌─────────────────────────┐
│  Response JSON          │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  UI Update              │
│  (Display Results)      │
└─────────────────────────┘
```

---

## 🚀 Deployment Checklist

### Frontend Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables (Production)

```env
VITE_API_URL=https://api.neocure.com/api
VITE_DEBUG=false
```

### CORS Configuration

Ensure backend allows frontend origin:
```typescript
// backend/src/server/config/env.ts
CORS_ORIGIN=https://neocure.com,https://www.neocure.com
```

---

## 📝 Developer Notes

### Adding New Drug Interaction Features

1. **Add API endpoint** in `src/api/drugInteractions.ts`
2. **Create component** in `src/components/`
3. **Add route** in `src/App.tsx`
4. **Update sidebar** in `src/components/Sidebar.tsx`
5. **Test integration** with backend

### Extending the Chatbot

Add new drug names to the extraction list:
```typescript
const commonDrugs = [
  'warfarin', 'aspirin', 'ibuprofen',
  // Add more drugs here
];
```

### Custom Styling

All components use Tailwind CSS with glassmorphism:
```typescript
className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20"
```

---

## 🆘 Troubleshooting

### API Connection Issues

**Error:** `Failed to fetch`

**Solution:**
1. Check backend is running: `http://localhost:4000/health`
2. Verify `VITE_API_URL` in `.env`
3. Check CORS settings in backend

### Authentication Errors

**Error:** `401 Unauthorized`

**Solution:**
1. Check token in localStorage: `localStorage.getItem('accessToken')`
2. Re-login to get fresh token
3. Verify token expiration (default 1 hour)

### No Interactions Detected (Expected)

**Issue:** Known interactions not showing

**Solution:**
1. Check backend logs for Python module status
2. Verify drug names match common drug list
3. Test backend endpoint directly: `curl -X POST http://localhost:4000/api/drug-interactions/check`

---

## ✅ Integration Complete!

The frontend is now fully integrated with the drug interaction backend, providing:

- ✅ Manual drug interaction checking
- ✅ Automatic prescription safety checking
- ✅ Interaction history tracking
- ✅ Analytics dashboard
- ✅ AI chatbot integration
- ✅ Role-based access control
- ✅ Glassmorphic UI design
- ✅ Type-safe API layer
- ✅ Error handling and loading states

**Ready for production deployment!** 🎉
