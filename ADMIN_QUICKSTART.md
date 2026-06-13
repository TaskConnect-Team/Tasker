# TaskConnect Admin Dashboard - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Backend Environment Variables

Create `backend/.env`:
```env
PORT=3000
atlas_URL=mongodb+srv://user:pass@cluster.mongodb.net/taskconnect
JWT_SECRET=your_random_secret_key_here_32chars_minimum

# Admin Credentials - Use this command to generate hash:
# node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your_password', 10).then(h => console.log(h));"
ADMIN_EMAIL=admin@taskconnect.com
ADMIN_PASSWORD=$2b$10$... # bcrypt hashed password

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

### Step 2: Generate Admin Password Hash

```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123', 10).then(h => console.log('Hash:', h))"
```
Copy the hash and paste in `ADMIN_PASSWORD` env var.

### Step 3: Frontend Environment Variables

Create `front-end/.env.local`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

### Step 4: Start Services

```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
cd front-end
npm install
npm run dev
```

### Step 5: Access Admin Dashboard

1. Open http://localhost:5173/admin/login
2. Login with your admin credentials
3. You're in! 🎉

---

## 📍 Quick Navigation

| Page | URL | Purpose |
|------|-----|---------|
| Login | `/admin/login` | Authenticate admin |
| Dashboard | `/admin/dashboard` | KPIs, heatmap, charts |
| Moderation | `/admin/moderation` | Verify taskers, trust scores |
| Finance | `/admin/finance` | Manage payouts |
| Marketing | `/admin/marketing` | Send push notifications |
| Analytics | `/admin/analytics` | User growth charts |

---

## 🔑 Key Credentials Flow

```
1. Admin Email + Password
   ↓
2. Backend verifies vs env vars (ADMIN_EMAIL, ADMIN_PASSWORD)
   ↓
3. Returns JWT token
   ↓
4. Frontend stores in HTTP-only cookie
   ↓
5. All requests include token automatically
   ↓
6. Backend middleware validates on each request
```

---

## 🚀 Most Important Features

### 1. Dashboard - Real-Time Metrics
- 💰 Revenue tracked automatically
- ⚡ Urgent task monitoring
- 👥 Active tasker count
- 🗺️ Geographic heatmap of demand

### 2. Moderation - Trust Management
- ✅ One-click tasker verification
- 🔒 Manual trust score adjustment
- ⚠️ High-risk tasker alerts

### 3. Finance - Payout Pipeline
- 💳 View pending balances
- 🎯 Process individual payouts
- 📊 Payout statistics

### 4. Marketing - Notifications
- 📢 Send to all users, customers, or taskers
- 📝 Track notification history
- 📈 View delivery metrics

---

## 🐛 Troubleshooting

### Can't Login?
```
✓ Check ADMIN_EMAIL matches exactly (case-sensitive)
✓ Verify ADMIN_PASSWORD is bcrypt hashed (starts with $2b$)
✓ Ensure JWT_SECRET is set in .env
```

### Heatmap Not Showing?
```
✓ Verify VITE_GOOGLE_MAPS_API_KEY is set
✓ Check Maps JavaScript API is enabled in Google Console
✓ Ensure visualization library is loaded
✓ Check browser console for errors
```

### Notifications Not Sending?
```
✓ Verify Firebase service account is configured
✓ Check users have FCM tokens registered
✓ Ensure ALLOWED_ORIGINS includes frontend URL
```

---

## 📦 What You Get

### Backend
- ✅ 13 secure API endpoints
- ✅ MongoDB aggregation pipelines
- ✅ JWT authentication
- ✅ Firebase integration
- ✅ Error handling

### Frontend
- ✅ 6 admin pages
- ✅ Real-time charts & heatmaps
- ✅ Responsive design
- ✅ Search functionality
- ✅ Loading states

### Database
- ✅ Admin queries optimized
- ✅ Aggregation pipelines ready
- ✅ Indexes configured

---

## 💡 Pro Tips

1. **Search Bar**: Type email/name to find users instantly
2. **Moderation**: Batch verify taskers using the quick toggle
3. **Finance**: Process payouts during low-traffic periods
4. **Marketing**: Send notifications during peak usage hours
5. **Heatmap**: Zoom to specific regions for detailed demand

---

## 🔐 Security Reminders

```
🔒 NEVER commit .env files
🔒 Use strong, unique ADMIN_PASSWORD
🔒 Rotate JWT_SECRET regularly
🔒 Keep Firebase credentials private
🔒 Monitor admin login attempts
🔒 Use HTTPS in production
```

---

## 📊 API Endpoint Summary

```
POST   /api/admin/login              ← Start here
GET    /api/admin/verify             ← Check auth
GET    /api/admin/kpis               ← Get metrics
GET    /api/admin/charts-data        ← Get chart data
GET    /api/admin/unverified-taskers ← Get taskers
PATCH  /api/admin/verify-tasker/:id  ← Verify tasker
PATCH  /api/admin/trust-score/:id    ← Update score
GET    /api/admin/high-risk-taskers  ← Risk alerts
GET    /api/admin/payout-pipeline    ← Get payouts
POST   /api/admin/process-payout/:id ← Process payout
POST   /api/admin/send-blast         ← Send notifications
GET    /api/admin/search?q=...       ← Search users/tasks
```

---

## 📞 Common Commands

```bash
# Generate bcrypt hash
npm run hash-password

# Start dev server
npm run dev

# Build for production
npm run build

# Check for errors
npm run lint

# Start production build
npm start
```

---

## ✅ Installation Verification

After setup, check if everything works:

```bash
# 1. Can you access login page?
http://localhost:5173/admin/login ✓

# 2. Can you login with admin credentials?
Click "Sign In" ✓

# 3. Are you redirected to dashboard?
http://localhost:5173/admin/dashboard ✓

# 4. Do you see KPI cards?
Platform Revenue, Escrow, etc. ✓

# 5. Can you access other pages via sidebar?
Try Moderation, Finance, Marketing ✓
```

If all ✓, you're good to go! 🎉

---

## 📚 Full Documentation

For detailed information, see:
- `ADMIN_DASHBOARD_SETUP.md` - Comprehensive setup guide
- `ADMIN_IMPLEMENTATION_SUMMARY.md` - Technical overview
- Backend file comments - Implementation details
- Frontend component files - UI integration

---

**Ready to manage your platform like a boss! 👑**
