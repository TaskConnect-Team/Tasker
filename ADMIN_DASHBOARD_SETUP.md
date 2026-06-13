# TaskConnect Admin Dashboard - Setup Guide

## Overview
This guide covers the complete setup, configuration, and usage of the TaskConnect Admin Dashboard (MERN Stack).

---

## 📋 Table of Contents
1. [Backend Setup](#backend-setup)
2. [Frontend Setup](#frontend-setup)
3. [Environment Variables](#environment-variables)
4. [Features Overview](#features-overview)
5. [API Endpoints](#api-endpoints)
6. [Troubleshooting](#troubleshooting)

---

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the `backend` directory with the following required variables:

```env
# Port Configuration
PORT=3000

# Database
atlas_URL=mongodb+srv://username:password@cluster.mongodb.net/taskconnect

# JWT Secret (use a strong random string)
JWT_SECRET=your_jwt_secret_key_here

# Admin Credentials (use bcrypt-hashed password)
ADMIN_EMAIL=admin@taskconnect.com
ADMIN_PASSWORD=$2b$10$hashed_password_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com

# Firebase Admin SDK Path
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# Google Maps API Key (for heatmap visualization)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Stripe Keys (if using payment features)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Generate Admin Password Hash
Use bcryptjs to hash your admin password:
```javascript
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash('your_password', 10);
console.log(hashedPassword); // Use this in ADMIN_PASSWORD env var
```

### 4. Start Backend Server
```bash
npm start
# or with nodemon for development
npm run dev
```

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd front-end
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the `front-end` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Important: Google Maps Configuration
In your React app's root component (or where GoogleMap is used), ensure the visualization library is loaded:

```jsx
<GoogleMap
  ...
  libraries={['visualization']} // ✅ CRITICAL for heatmap
/>
```

### 4. Start Frontend Dev Server
```bash
npm run dev
```

---

## Environment Variables Detailed

### Backend Admin Auth
- **ADMIN_EMAIL**: Email used for admin login
- **ADMIN_PASSWORD**: Bcrypt-hashed password (NOT plain text!)
  - Generate with: `bcrypt.hash('password', 10)`

### Google Maps
- **VITE_GOOGLE_MAPS_API_KEY**: 
  - Get from: https://console.cloud.google.com/
  - Enable APIs: Maps JavaScript API, Places API
  - Create API Key with appropriate restrictions

### Firebase Admin SDK
- Place `firebase-service-account.json` in `backend/config/`
- Get from Firebase Console → Project Settings → Service Accounts

### Stripe (if using payments)
- Get from: https://dashboard.stripe.com/
- Test keys for development, live keys for production

---

## Features Overview

### 🔐 Admin Authentication
- **Login**: `/admin/login` - Restricted to admin credentials only
- **JWT Protection**: All admin routes require valid admin JWT
- **Session Management**: 24-hour token expiration

### 📊 Dashboard (`/admin/dashboard`)
**Key Metrics:**
- 💰 **Platform Revenue**: Sum of all platform fees from paid tasks
- 🏦 **Escrow Balance**: Total pending payments
- ⚡ **Urgent Task Ratio**: Percentage of urgent vs normal tasks
- 👥 **Active Taskers**: Available taskers count

**Visualizations:**
- 🗺️ **Heatmap**: Geographic task demand using Google Maps visualization
- 📈 **Cancellation Chart**: Task failure/cancellation trends over time

### 🛡️ Moderation (`/admin/moderation`)
**Unverified Taskers Table:**
- One-click verification toggle
- Shows ratings, reviews, and skill info
- Filters by unverified status

**High-Risk Taskers Alert:**
- Lists taskers with rating < 3.0
- Manual trust score adjuster (0-10)
- Real-time updates

### 💳 Finance (`/admin/finance`)
**Payout Pipeline:**
- Shows all taskers with balance > 0
- Displays individual balances
- Process payout button (resets balance to 0)
- Summary stats: total pending, average payout

### 📢 Marketing (`/admin/marketing`)
**Push Notification Broadcaster:**
- Target audience: All users, Customers only, or Taskers only
- Title + Message input
- Uses Firebase Cloud Messaging (FCM)
- Notification history tracking

### 📈 Analytics (`/admin/analytics`)
- User growth charts (customers vs taskers)
- Role distribution pie chart
- Revenue and task completion stats

---

## API Endpoints

### Admin Authentication
```
POST   /api/admin/login          - Admin login (public)
POST   /api/admin/logout         - Admin logout
GET    /api/admin/verify         - Verify admin token
```

### Dashboard & Analytics
```
GET    /api/admin/kpis           - Get key performance indicators
GET    /api/admin/charts-data    - Get heatmap & cancellation data
GET    /api/admin/analytics      - Get detailed analytics
```

### Trust & Moderation
```
GET    /api/admin/unverified-taskers      - Get unverified taskers
GET    /api/admin/high-risk-taskers       - Get low-rated taskers
PATCH  /api/admin/verify-tasker/:id       - Toggle tasker verification
PATCH  /api/admin/trust-score/:id         - Update trust score
```

### Finance
```
GET    /api/admin/payout-pipeline         - Get taskers with pending balance
POST   /api/admin/process-payout/:id      - Process payout (reset balance)
```

### Marketing
```
POST   /api/admin/send-blast              - Send FCM notification blast
GET    /api/admin/search?q=query          - Search users and tasks
```

### Request/Response Examples

#### Admin Login
```javascript
// Request
POST /api/admin/login
{
  "email": "admin@taskconnect.com",
  "password": "your_password"
}

// Response
{
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "email": "admin@taskconnect.com",
    "role": "admin"
  }
}
```

#### Get KPIs
```javascript
// Request
GET /api/admin/kpis
Authorization: Bearer <admin_token>

// Response
{
  "platformRevenue": 45230.50,
  "escrowTracker": 12450.00,
  "urgentTaskRatio": 15.5,
  "activeTaskerSupply": 87
}
```

#### Send Notification
```javascript
// Request
POST /api/admin/send-blast
{
  "targetRole": "all",
  "title": "New Feature Released!",
  "message": "Check out our new task categories"
}

// Response
{
  "message": "Blast notification sent successfully",
  "details": {
    "targetRole": "all",
    "recipientCount": 1240,
    "tokenCount": 2130,
    "successCount": 2100,
    "failureCount": 30
  }
}
```

---

## Frontend Routes

```
/admin/login           - Admin login page (public)
/admin/dashboard       - Main dashboard (protected)
/admin/moderation      - Trust & moderation panel (protected)
/admin/finance         - Payout management (protected)
/admin/marketing       - Push notifications (protected)
/admin/analytics       - Analytics dashboard (protected)
```

---

## Authentication Flow

```
1. User navigates to /admin/login
2. Enters email & password
3. Backend verifies against ADMIN_EMAIL & ADMIN_PASSWORD
4. On success, returns JWT token
5. Token stored in HTTP-only cookie
6. PrivateAdminRoute verifies token for protected pages
7. Invalid/expired token redirects to login
```

---

## Middleware Chain

```
Request → isAdmin Middleware → Verify JWT → Check admin role → Route Handler
   ↓ (Invalid Token)
   └─→ 401 Unauthorized Response
```

---

## Database Models Used

### User Model Fields (Admin Relevant)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  role: 'customer' | 'tasker',
  isVerified: Boolean,
  averageRating: Number,
  totalReviews: Number,
  trustScore: Number (0-10),
  balance: Number,
  fcmTokens: [String],
  availability: Boolean,
  location: GeoJSON Point,
  ...otherFields
}
```

### Task Model Fields (Admin Relevant)
```javascript
{
  _id: ObjectId,
  title: String,
  price: Number,
  urgency: 'normal' | 'urgent',
  status: 'open' | 'assigned' | 'in-progress' | 'completed' | 'cancelled' | 'paid',
  isPaid: Boolean,
  platformFee: Number,
  paymentStatus: 'none' | 'pending' | 'paid' | 'failed',
  location: GeoJSON Point,
  createdAt: Date,
  customer: ObjectId (ref: User),
  tasker: ObjectId (ref: User),
  ...otherFields
}
```

---

## Security Considerations

### ✅ Implemented Security Measures
- **JWT-based auth**: Tokens expire after 24 hours
- **HTTP-only cookies**: Prevents XSS attacks
- **Environment variables**: No credentials in code
- **CORS protection**: Restricted to allowed origins
- **Role-based access**: Admin-only routes protected
- **Password hashing**: Bcrypt with salt rounds

### 🔒 Best Practices
1. **Change admin credentials regularly**
2. **Use strong, unique passwords**
3. **Rotate JWT_SECRET periodically**
4. **Monitor admin activity logs**
5. **Use HTTPS in production**
6. **Restrict API access with rate limiting**
7. **Keep Firebase service account secure**

---

## Deployment Checklist

### Backend
- [ ] Update `ALLOWED_ORIGINS` with production URL
- [ ] Set strong `JWT_SECRET`
- [ ] Use bcrypt-hashed `ADMIN_PASSWORD`
- [ ] Configure Firebase service account
- [ ] Enable MongoDB network access for prod IP
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URL

### Frontend
- [ ] Update `VITE_API_BASE_URL` to production API
- [ ] Update Google Maps API key for production domain
- [ ] Update Firebase config for production
- [ ] Build with `npm run build`
- [ ] Test all authentication flows
- [ ] Configure environment variables in hosting platform

---

## Troubleshooting

### Admin Login Not Working
**Problem**: "Invalid email or password"
- **Solution**: Ensure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are correctly set in `.env`
- **Check**: Password must be bcrypt-hashed, not plain text

### Heatmap Not Displaying
**Problem**: Heatmap appears blank or throws error
- **Solution**: 
  1. Verify `VITE_GOOGLE_MAPS_API_KEY` is set
  2. Check that `libraries={['visualization']}` is included in GoogleMap
  3. Ensure API key has correct permissions in Google Console

### FCM Notifications Not Sending
**Problem**: "No FCM tokens found" or "Failed to send notification"
- **Solutions**:
  1. Verify users have registered FCM tokens
  2. Check Firebase service account configuration
  3. Ensure users have notification permission granted
  4. Verify target role is correct

### CORS Errors
**Problem**: "CORS blocked for origin"
- **Solution**: Add your frontend URL to `ALLOWED_ORIGINS` in backend `.env`
- **Format**: `http://localhost:5173,http://localhost:3000,https://yourdomain.com`

### Token Expiration
**Problem**: Getting 401 after 24 hours
- **Solution**: Token expires after 24 hours by design. User needs to re-login
- **Note**: Cookie is automatically sent with requests (httpOnly)

### Payout Processing Fails
**Problem**: "Error processing payout"
- **Solutions**:
  1. Verify tasker ID is valid
  2. Check user is actually a tasker
  3. Ensure balance > 0
  4. Check database permissions

---

## Performance Optimization Tips

1. **Pagination**: Add pagination to large tables
2. **Caching**: Cache KPI data for 5 minutes
3. **Lazy Loading**: Load charts on demand
4. **Database Indexes**: Ensure proper indexes on:
   - `User.role`, `User.isVerified`, `User.fcmTokens`
   - `Task.status`, `Task.urgency`, `Task.isPaid`

---

## Support & Resources

- **MongoDB Docs**: https://docs.mongodb.com/
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin/setup
- **Google Maps API**: https://developers.google.com/maps/documentation
- **Recharts**: https://recharts.org/
- **React**: https://react.dev/

---

## Version Info
- Node.js: v18+
- React: v18+
- Express: v4.18+
- MongoDB: v5.0+

---

**Last Updated**: 2024-06-13
**Admin Dashboard v1.0**
