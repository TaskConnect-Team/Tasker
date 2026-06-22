# TaskConnect Software Project Documentation

## 1. Executive Summary

TaskConnect is a smart task marketplace web application that connects customers who need local services with taskers who can complete those services. The system supports customer task posting, tasker task discovery, geospatial matching, task lifecycle management, reviews, tasker earnings, platform administration, push notifications, and Stripe-based payment processing.

The project is implemented as a MERN-style application:

- Frontend: React 19, Vite, Tailwind CSS, React Router, Google Maps, Firebase Cloud Messaging, PWA support.
- Backend: Node.js, Express 5, MongoDB, Mongoose, JWT cookie authentication, Stripe, Firebase Admin, Brevo/email OTP.
- Database: MongoDB Atlas-compatible schemas for users, tasks, OTP verification, and reviews.
- Deployment: Dockerized backend and frontend, with a `docker-compose.yml` file intended to run the backend API and frontend static web app.

The application has three major actor groups:

- Customers post tasks, manage orders, browse taskers, and review completed work.
- Taskers configure professional profiles, discover matching tasks, accept/start/complete jobs, and track earnings.
- Administrators monitor platform KPIs, moderate taskers, manage payout readiness, and send marketing notifications.

## 2. Problem Statement

People often need reliable local help for household, maintenance, business, and personal tasks, but finding nearby skilled workers can be slow, informal, and difficult to trust. Similarly, service providers need a structured way to find relevant jobs near them, maintain a professional profile, receive notifications, and track their earnings.

TaskConnect solves this by providing a centralized digital marketplace where customers can publish location-aware tasks and taskers can discover, accept, and complete jobs that match their skills. The platform also adds trust, review, payment, notification, and admin oversight features.

## 3. Objectives

- Provide a role-based task marketplace for customers and taskers.
- Enable customers to post tasks with title, description, budget, urgency, category, city, schedule, and exact map coordinates.
- Match taskers with relevant tasks based on skills/categories and location.
- Allow taskers to accept, start, and complete tasks through controlled workflow transitions.
- Allow customers to cancel open tasks and review completed tasks.
- Maintain tasker profiles with skills, services, portfolio links, hourly rate, location, rating, verification status, and availability.
- Provide dashboard metrics for customers, taskers, and administrators.
- Support push notifications using Firebase Cloud Messaging.
- Support payment intent creation, platform commission calculation, tasker wallet balance, and Stripe webhook processing.
- Provide admin tools for KPIs, tasker verification, trust score updates, high-risk tasker detection, payout pipeline, and broadcast notifications.
- Provide automated tests for critical backend controllers, middleware, utilities, frontend utilities, and selected UI workflows.

## 4. Scope

### In Scope

- User registration with OTP verification by email.
- Login/logout and session validation using secure HTTP-only cookies.
- Customer and tasker role-based routing and API authorization.
- Customer task posting with city, category, urgency, schedule, budget, and geolocation.
- Task browsing, searching, recommendation, and nearby map matching for taskers.
- Task lifecycle: open, assigned, in-progress, completed, reviewed, cancelled, paid.
- Customer order management and tasker active job management.
- Customer-to-tasker review submission and tasker rating aggregation.
- Profile editing, image upload through Cloudinary utility, skills/services selection, and availability updates.
- Public profile viewing.
- Google Maps-powered location picker, task detail map, and matching tasks map.
- Firebase Cloud Messaging registration/removal and foreground notifications.
- Admin login, dashboard, moderation, finance, marketing, and analytics pages.
- Stripe payment intent creation and webhook processing.
- Docker-based deployment structure.

### Out of Scope / Not Fully Implemented

- Real-time chat is represented by a `MessagesPage` route/page but no backend messaging API or persistence is present.
- Notification history page exists, but the backend does not define a dedicated persisted notifications collection.
- Payment UI integration is not fully wired in the frontend API usage found during inspection; backend payment endpoints exist.
- The frontend Dockerfile references `front-end/nginx.conf`, but that file is not present in the current repository listing.
- Admin and some frontend pages use direct `fetch` calls with hardcoded/local base URL patterns in places, while most app code uses the shared Axios client.
- `docker-compose.yml` passes `VITE_API_BASE_URL`, while the frontend Axios client reads `VITE_API_URL`; this should be aligned before production deployment.

## 5. User Roles

### Customer

Primary platform user who posts work requests and hires taskers.

Capabilities:

- Register/login/logout.
- Update personal profile and services.
- Post tasks with location, schedule, budget, urgency, and required skills.
- View own dashboard metrics.
- Browse/search taskers.
- View public tasker/customer profiles.
- Track own orders by status.
- Cancel open tasks.
- Confirm/review completed tasks.
- Receive push notifications.

### Tasker

Service provider who accepts and completes posted tasks.

Capabilities:

- Register/login/logout.
- Build professional profile with skills, services, hourly rate, portfolio, location, availability, and profile image.
- View recommended tasks based on skills.
- Search/browse available tasks.
- View nearby matching tasks on Google Maps.
- Accept open tasks.
- Start assigned work.
- Mark work completed.
- Track active jobs, completed work, and earnings.
- Receive push notifications.

### Administrator

Platform operator responsible for monitoring, moderation, finance, and marketing.

Capabilities:

- Login/logout through separate admin authentication.
- Verify admin token.
- View KPIs and charts.
- View heatmap coordinates and cancellation rate data.
- Identify high-risk taskers.
- List unverified taskers.
- Toggle tasker verification.
- Update trust score.
- View payout pipeline and process payouts.
- Search users and tasks.
- Send FCM broadcast notifications by role.

## 6. Functional Requirements

### Authentication and Account Management

- The system shall allow signup for `customer` and `tasker` roles.
- The system shall validate required signup fields and enforce a minimum password length of 8 characters.
- The system shall send a 6-digit OTP to the user email before creating the account.
- The system shall expire OTP records after 10 minutes using MongoDB TTL.
- The system shall hash user passwords and OTP values.
- The system shall authenticate users with email/password.
- The system shall issue JWT authentication tokens in HTTP-only cookies.
- The system shall expose a current-user endpoint for session restoration.
- The system shall support logout by clearing the auth cookie.
- The system shall maintain cached frontend auth state for smoother online/offline behavior.

### Profile Management

- The system shall allow authenticated users to update name, tagline, bio, profile image, location, services, and availability.
- The system shall allow taskers to update skills, hourly rate, and portfolio.
- The system shall expose public profile details without passwords.
- The system shall support tasker search by name, skills, city/location, hourly rate, and minimum rating/trust score.
- The system shall support nearby tasker lookup using geospatial coordinates.
- The system shall allow users to save and remove FCM device tokens.

### Task Management

- The system shall allow only customers to create tasks.
- A task shall include title, description, price, city, geolocation, urgency, category, customer, and optional schedule.
- The system shall require latitude and longitude when creating tasks.
- The system shall notify matching taskers when a new task is posted.
- The system shall allow taskers to list open tasks, filtered by price, location, urgency, city, and search terms.
- The system shall recommend open tasks to taskers based on their skills, prioritizing same-city matches.
- The system shall expose nearby matching tasks using MongoDB geospatial aggregation.
- The system shall allow taskers to accept only open tasks.
- The system shall allow taskers to start only assigned tasks assigned to them.
- The system shall allow taskers to mark only their in-progress tasks as completed.
- The system shall allow customers to cancel only their own open tasks.
- The system shall allow customers to view only their own posted tasks.
- The system shall allow taskers to view tasks assigned to them.
- The system shall expose task details to authenticated customers and taskers.

### Reviews

- The system shall allow customers to review only their own completed tasks.
- The system shall reject reviews for non-completed tasks.
- The system shall allow only one review per task.
- The system shall validate rating values from 1 to 5.
- The system shall update task status to `reviewed` after review submission.
- The system shall update tasker average rating and review count after each review.

### Payments and Earnings

- The system shall allow customers to create a Stripe PaymentIntent for completed unpaid tasks.
- The system shall lock final task price before creating a payment intent.
- The system shall validate that only the task owner can pay.
- The system shall reject payment for non-completed or already paid tasks.
- The system shall calculate a 10 percent platform commission.
- The system shall add the tasker earning to tasker wallet balance.
- The system shall process `payment_intent.succeeded` Stripe webhook events.
- The system shall expose tasker earnings summary, wallet balance, platform fees paid, completed task count, chart data, and recent payouts.

### Dashboards and Analytics

- The system shall provide customer dashboard counts for open, assigned, in-progress, completed, cancelled tasks, and total spent.
- The system shall provide tasker dashboard counts for assigned, in-progress, completed, cancelled work, and total earned.
- The system shall provide admin KPIs: platform revenue, escrow tracker, urgent task ratio, and active tasker supply.
- The system shall provide admin chart data: heatmap coordinates and cancellation trends.
- The system shall provide admin finance data: payout pipeline and balances.

### Notifications

- The frontend shall request browser notification permission after login.
- The frontend shall register FCM tokens with the backend.
- The backend shall store multiple FCM tokens per user.
- The backend shall notify customers when tasks are accepted, started, completed, or cancelled.
- The backend shall notify taskers when matching tasks are posted or task-related events occur.
- The admin shall be able to send broadcast notifications to customers, taskers, or all users.

### Administration

- The system shall authenticate admins using environment-configured email and bcrypt-hashed password.
- The system shall store admin JWT in a separate HTTP-only cookie.
- The system shall protect admin APIs with admin-only middleware.
- The system shall allow toggling tasker verification.
- The system shall allow manual trust score updates from 0 to 10.
- The system shall list high-risk taskers with low average ratings.
- The system shall list unverified taskers.
- The system shall process tasker payouts by resetting balance to zero.
- The system shall search users and tasks.

## 7. Non Functional Requirements

### Security

- Passwords and OTPs must be hashed with bcrypt.
- JWTs must be signed using `JWT_SECRET`.
- Auth cookies must be HTTP-only, secure, SameSite=None, and path-scoped to `/`.
- CORS must allow only configured origins from `ALLOWED_ORIGINS`.
- Routes must enforce role-based authorization.
- Admin routes must use separate admin authentication and authorization.
- Stripe webhooks must verify Stripe signatures.
- API responses must not expose user passwords.

### Performance

- MongoDB 2dsphere indexes are defined for user and task locations.
- Task and tasker geospatial queries use `$geoNear`.
- Frontend uses Vite for fast builds and dev server.
- PWA workbox image caching is configured.
- Dashboard and admin metrics use aggregation queries.

### Reliability

- Backend has global error-handling middleware.
- Backend logs unhandled promise rejections and exits on uncaught exceptions.
- Auth context supports online/offline session recovery from local storage.
- Push notification sending is queued defensively and failures are logged without breaking task workflows.
- Stripe webhook processing is idempotent for already paid tasks.

### Usability

- Role-based home routing sends taskers to task feed and customers to customer dashboard.
- Main workflows are available through protected React routes.
- Toast notifications communicate success/failure.
- Task status chips and tabs support quick scanning.
- Google Maps integration helps users pick and inspect exact locations.

### Maintainability

- Backend is organized into routes, controllers, models, middleware, and utilities.
- Frontend is organized into pages, components, admin pages, routes, constants, context, and utilities.
- Shared utilities normalize lists, text, geolocation, cookies, user serialization, payment calculation, notifications, and FCM.
- Tests exist for critical controller and middleware behavior.

### Scalability

- Stateless backend authentication via signed JWT cookies can scale horizontally.
- MongoDB Atlas can scale storage and indexes.
- Firebase Cloud Messaging supports push delivery to multiple devices per user.
- Stripe integration separates payment intent creation from webhook confirmation.
- Dockerization supports containerized deployment.

## 8. Use Cases

### UC-01: Customer Signup With OTP

Actor: Customer or Tasker  
Precondition: User has not registered with the email.  
Flow:

1. User enters name, email, password, and role.
2. Backend validates input and role.
3. Backend hashes password and OTP.
4. Backend stores temporary OTP registration record.
5. Backend sends OTP email.
6. User submits email and OTP.
7. Backend verifies OTP and creates user account.
8. Backend issues auth cookie and returns safe user profile.

### UC-02: Customer Posts a Task

Actor: Customer  
Precondition: Customer is authenticated.  
Flow:

1. Customer enters task title, description, required skills/categories, budget, urgency, city, schedule, and location.
2. Frontend submits task data to `POST /api/tasks`.
3. Backend validates customer role and required coordinates.
4. Backend stores task with `open` status.
5. Backend queues notifications to matching taskers.
6. Frontend navigates to task details.

### UC-03: Tasker Finds and Accepts a Task

Actor: Tasker  
Precondition: Tasker is authenticated and task is open.  
Flow:

1. Tasker views recommended tasks, searches open tasks, or uses matching tasks map.
2. Tasker opens task details.
3. Tasker accepts task.
4. Backend validates task is open and assigns current tasker.
5. Backend updates status to `assigned`.
6. Backend notifies the customer.

### UC-04: Tasker Starts and Completes Work

Actor: Tasker  
Precondition: Task is assigned to current tasker.  
Flow:

1. Tasker clicks Start Work.
2. Backend validates ownership and status.
3. Backend updates status to `in-progress`.
4. Tasker later marks task completed.
5. Backend validates tasker ownership and status.
6. Backend updates status to `completed`.
7. Backend notifies customer.

### UC-05: Customer Reviews Completed Task

Actor: Customer  
Precondition: Task is completed and belongs to customer.  
Flow:

1. Customer opens completed order.
2. Customer submits rating, comment, and tags.
3. Backend validates rating, task ownership, task status, assigned tasker, and duplicate review.
4. Backend creates review.
5. Backend updates task status to `reviewed`.
6. Backend recalculates tasker average rating and review count.

### UC-06: Customer Pays for Completed Task

Actor: Customer  
Precondition: Task belongs to customer, is completed, and is not paid.  
Flow:

1. Customer initiates payment.
2. Backend validates task payment eligibility.
3. Backend creates Stripe PaymentIntent.
4. Stripe confirms payment and calls webhook.
5. Backend calculates commission and tasker earning.
6. Backend updates task payment status and tasker wallet balance.

### UC-07: Admin Verifies a Tasker

Actor: Administrator  
Precondition: Admin is authenticated.  
Flow:

1. Admin opens moderation page.
2. Frontend fetches unverified taskers and high-risk taskers.
3. Admin toggles verification for a tasker.
4. Backend validates admin token and target user.
5. Backend toggles `isVerified`.

### UC-08: Admin Processes Tasker Payout

Actor: Administrator  
Precondition: Admin is authenticated and tasker balance is greater than zero.  
Flow:

1. Admin opens finance page.
2. Frontend fetches payout pipeline.
3. Admin processes payout for selected tasker.
4. Backend validates admin token and tasker.
5. Backend stores previous balance and resets balance to zero.

## 9. User Workflows

### Customer Workflow

1. Signup or login.
2. Complete/edit profile.
3. Post a task with details, schedule, city, and map location.
4. Wait for a tasker to accept.
5. Track task in Orders.
6. Cancel if the task is still open, or allow tasker to start work.
7. Review task after completion.
8. Optionally browse taskers and view public profiles.

### Tasker Workflow

1. Signup or login as tasker.
2. Complete professional profile: skills, services, hourly rate, portfolio, location, availability.
3. View recommended tasks.
4. Browse/search tasks or inspect nearby matching map.
5. Open task detail and accept a task.
6. Start assigned work.
7. Mark task complete.
8. Monitor active jobs and earnings.

### Admin Workflow

1. Login at `/admin/login`.
2. View KPI dashboard and analytics.
3. Moderate taskers from unverified/high-risk lists.
4. Adjust trust scores when needed.
5. Review payout pipeline.
6. Process tasker payouts.
7. Send marketing or operational blast notifications.
8. Search users and tasks for support/moderation.

## 10. Database Design

Database: MongoDB using Mongoose ODM.

### User Collection

Model: `User`

Fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `name` | String, required | User full name |
| `email` | String, required, unique | Login identity |
| `password` | String, required | Hashed password |
| `profileImage` | String | Profile photo URL |
| `tagline` | String | Short profile headline |
| `bio` | String | Profile biography |
| `city` | String | City name |
| `locationLabel` | String | Human-readable location |
| `location` | GeoJSON Point | Longitude/latitude coordinates |
| `skills` | String array | Tasker skill categories |
| `services` | String array | Services offered/needed |
| `isVerified` | Boolean | Admin verification flag |
| `hourlyRate` | Number | Tasker hourly rate |
| `portfolio` | String | Portfolio link |
| `tasksPosted` | Number | Customer task count metric |
| `tasksCompleted` | Number | Completion metric |
| `tasksCancelled` | Number | Cancellation metric |
| `averageRating` | Number | Review-based rating |
| `totalReviews` | Number | Review count |
| `trustScore` | Number | Admin/manual trust score |
| `balance` | Number | Tasker wallet balance |
| `role` | Enum: customer/tasker | Role-based access |
| `availability` | Boolean | Tasker availability |
| `fcmTokens` | String array | Device/browser push tokens |
| `createdAt`, `updatedAt` | Date | Timestamps |

Indexes:

- `location: 2dsphere`
- `email: unique`

### Task Collection

Model: `Task`

Fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `title` | String, required | Task title |
| `description` | String, required | Task details |
| `price` | Number, required | Customer budget |
| `city` | String, required | Task city |
| `locationLabel` | String | Human-readable location |
| `location` | GeoJSON Point, required | Exact task coordinates |
| `urgency` | Enum: normal/urgent | Priority flag |
| `category` | String array | Required skills/categories |
| `status` | Enum | Workflow state |
| `rating` | Number 1-5 | Stored rating summary |
| `review` | String | Stored review text summary |
| `isPaid` | Boolean | Legacy/paid flag used by some aggregates |
| `paidAt` | Date | Payment timestamp |
| `finalPrice` | Number | Locked payment amount |
| `paymentIntentId` | String | Stripe intent reference |
| `paymentStatus` | Enum: none/pending/paid/failed | Payment lifecycle |
| `platformFee` | Number | Platform commission |
| `taskerEarning` | Number | Net tasker earning |
| `customer` | ObjectId -> User | Posting customer |
| `tasker` | ObjectId -> User | Assigned tasker |
| `scheduledAt` | Date | Scheduled date/time |
| `createdAt`, `updatedAt` | Date | Timestamps |

Status values:

- `open`
- `assigned`
- `in-progress`
- `completed`
- `reviewed`
- `cancelled`
- `paid`

Indexes:

- `location: 2dsphere`

### Review Collection

Model: `Review`

Fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `task` | ObjectId -> Task, required, unique | One review per task |
| `customer` | ObjectId -> User, required | Reviewer |
| `tasker` | ObjectId -> User, required | Reviewed tasker |
| `rating` | Number 1-5, required | Rating |
| `comment` | String | Written feedback |
| `tags` | String array | Review tags |
| `createdAt`, `updatedAt` | Date | Timestamps |

### OTP Collection

Model: `Otp`

Fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `email` | String, required | Signup email |
| `otp` | String, required | Hashed OTP |
| `userData.name` | String | Pending user name |
| `userData.password` | String | Pending hashed password |
| `userData.role` | String | Pending role |
| `createdAt` | Date, TTL 600 seconds | OTP expiry |

### Relationships

- One customer can create many tasks.
- One task can be assigned to one tasker.
- One task can have one review.
- One tasker can receive many reviews.
- One user can store many FCM tokens.

## 11. API Endpoints

Base API prefix: `/api`

### Auth

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | Public | Start signup and send OTP |
| `POST` | `/auth/register` | Public | Alias for signup |
| `POST` | `/auth/verify-otp` | Public | Verify OTP and create account |
| `POST` | `/auth/login` | Public | Login user |
| `POST` | `/auth/logout` | Public/auth cookie | Logout user |
| `GET` | `/auth/me` | Authenticated | Get current user |
| `GET` | `/auth/` | Public | Health/check message |

### Users

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `PUT` | `/users/profile` | Authenticated | Update user profile |
| `POST` | `/users/update-token` | Authenticated | Save FCM token |
| `POST` | `/users/remove-token` | Authenticated | Remove FCM token |
| `GET` | `/users/search-taskers` | Customer | Search taskers |
| `GET` | `/users/nearby-taskers` | Customer/Tasker | Find nearby taskers |
| `GET` | `/users/:id` | Public | Public user profile |

### Tasks

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/tasks` | Customer | Create task |
| `GET` | `/tasks` | Tasker | List open tasks with filters |
| `GET` | `/tasks/search` | Tasker | Search/filter tasks |
| `GET` | `/tasks/recommended` | Tasker | Skill-based recommendations |
| `GET` | `/tasks/matching-nearby` | Tasker | Geospatial skill/location matching |
| `GET` | `/tasks/dashboard/customer` | Customer | Customer dashboard metrics |
| `GET` | `/tasks/dashboard/tasker` | Tasker | Tasker dashboard metrics |
| `GET` | `/tasks/earnings` | Tasker | Earnings dashboard |
| `GET` | `/tasks/my` | Customer | Customer's tasks |
| `GET` | `/tasks/assigned` | Tasker | Assigned tasks |
| `GET` | `/tasks/tasker` | Tasker | All tasker tasks |
| `PATCH` | `/tasks/:id/accept` | Tasker | Accept open task |
| `PATCH` | `/tasks/:id/start` | Tasker | Start assigned task |
| `PATCH` | `/tasks/:id/finish` | Tasker | Mark in-progress task completed |
| `PATCH` | `/tasks/:id/status` | Tasker | Generic status transition |
| `PATCH` | `/tasks/:id/complete` | Customer | Customer completion/review shortcut |
| `PATCH` | `/tasks/:id/cancel` | Customer | Cancel open task |
| `GET` | `/tasks/:id` | Customer/Tasker | Task details |

### Reviews

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/reviews` | Customer | Submit review for completed task |

### Payments

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/payments/create-intent/:id` | Customer | Create Stripe PaymentIntent |
| `POST` | `/payments/:id` | Customer | Manual/synchronous payment finalization |

### Stripe Webhook

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/stripe` | Stripe | Process webhook events |

### Admin

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/admin/login` | Public | Admin login |
| `POST` | `/admin/logout` | Admin | Admin logout |
| `GET` | `/admin/verify` | Admin | Verify admin session |
| `GET` | `/admin/kpis` | Admin | Platform KPIs |
| `GET` | `/admin/charts-data` | Admin | Heatmap and cancellation chart data |
| `GET` | `/admin/high-risk-taskers` | Admin | Low-rated taskers |
| `GET` | `/admin/unverified-taskers` | Admin | Unverified taskers |
| `GET` | `/admin/payout-pipeline` | Admin | Taskers with balance |
| `GET` | `/admin/search?q=...` | Admin | Search users/tasks |
| `PATCH` | `/admin/verify-tasker/:id` | Admin | Toggle tasker verification |
| `PATCH` | `/admin/trust-score/:id` | Admin | Update trust score |
| `POST` | `/admin/process-payout/:id` | Admin | Process payout |
| `POST` | `/admin/send-blast` | Admin | Send broadcast notification |

## 12. Technology Stack

### Frontend

- React 19
- Vite 7
- React Router DOM 7
- Tailwind CSS 4
- Framer Motion
- Lucide React icons
- React Hot Toast
- Axios
- Google Maps via `@vis.gl/react-google-maps`
- Deck.gl packages for map/aggregation capability
- Firebase Web SDK for messaging
- Vite PWA plugin and Workbox
- Recharts for admin/earnings visualization
- Vitest, Testing Library, Cypress

### Backend

- Node.js 22
- Express 5
- MongoDB and Mongoose
- JWT
- bcrypt/bcryptjs
- cookie-parser
- cors
- dotenv
- Stripe SDK
- Firebase Admin SDK
- Brevo SDK and nodemailer/resend-related email utilities
- Jest and Supertest

### Infrastructure and External Services

- MongoDB Atlas or compatible MongoDB connection
- Stripe payments and webhooks
- Firebase Cloud Messaging
- Google Maps API
- Cloudinary image upload utility
- Docker and Docker Compose
- Nginx intended for serving frontend production build

## 13. Security Features

- Password hashing with bcrypt/bcryptjs.
- OTP hashing before storage.
- OTP TTL expiry after 600 seconds.
- JWT-based authentication.
- Separate user and admin cookies: `token` and `adminToken`.
- HTTP-only, secure, SameSite=None cookies.
- Role middleware for customer/tasker authorization.
- Admin middleware verifies JWT role is `admin`.
- CORS allowlist through `ALLOWED_ORIGINS`.
- Password excluded from user responses.
- Stripe webhook signature verification.
- Payment middleware verifies ownership, task completion, and unpaid status.
- Regex escaping for search inputs.
- Geolocation normalization helpers.
- FCM dead token cleanup utility in push notification service.

## 14. Testing Features

### Backend Test Coverage Areas

- Auth controller:
  - Signup validation.
  - Email service configuration.
  - Duplicate users.
  - OTP verification.
  - Login success/failure.
  - Current user and logout.
- Auth middleware:
  - Missing/invalid token.
  - User not found.
  - Valid token flow.
- Admin auth middleware:
  - Missing token.
  - Invalid token.
  - Non-admin role rejection.
  - Valid admin token.
- Role middleware:
  - Missing user.
  - Role rejection.
  - Customer/tasker role helpers.
- Task controller:
  - Task creation.
  - Missing coordinates.
  - Get task details.
  - Accept task.
  - Status transitions.
  - Cancellation.
  - Task search.
- Review controller:
  - Required task ID.
  - Rating validation.
  - Ownership validation.
  - Duplicate review prevention.
  - Rating aggregate update.
- Payment controller:
  - Stripe PaymentIntent creation.
  - Final price lock.
  - Commission and tasker payment.
- Payment validation middleware:
  - Task not found.
  - Unauthorized payer.
  - Non-completed task.
  - Already paid task.
- Notification utilities:
  - Push payload creation.
  - Token de-duplication.
  - Dead token cleanup.
  - Task/customer/tasker notification routing.
- User model validation.

### Frontend Test Coverage Areas

- Route constants and dashboard-home helper.
- `cn` class name utility.
- Login form rendering.
- Schedule picker interaction.
- Cypress login workflow.

### Test Commands

- Backend: `npm test` from `backend`
- Frontend: `npm test` from `front-end`
- Frontend E2E: Cypress configured through `cypress.config.js`

## 15. Deployment Architecture

### Local Development

Frontend:

- Runs with Vite dev server.
- Default frontend dev port is typically `5173`.
- Axios uses `VITE_API_URL` if configured, otherwise `http://localhost:3000` in development.

Backend:

- Runs Express server on `PORT` or `3000`.
- Connects to MongoDB using `atlas_URL`.
- Requires configured `ALLOWED_ORIGINS`.

### Containerized Deployment

The repository includes:

- `backend/Dockerfile`
- `front-end/Dockerfile`
- `docker-compose.yml`

Deployment shape:

1. Frontend container builds static React assets with Vite.
2. Frontend runner serves built assets using Nginx on port `80`.
3. Backend container runs Node.js Express API on port `3000`.
4. Backend loads environment variables from `backend/.env`.
5. Frontend depends on backend in Docker Compose.
6. External services remain managed services: MongoDB Atlas, Stripe, Firebase, Google Maps, Cloudinary, email provider.

### Required Environment Variables

Backend:

- `atlas_URL`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `BREVO_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ALLOWED_ORIGINS`
- `PORT`

Frontend:

- `VITE_API_URL`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_VAPID_KEY`
- Firebase project configuration variables used by `firebaseConfig.js`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

### Deployment Notes

- The frontend Dockerfile copies `nginx.conf`, but the file is not present in the current repository listing. Add it before building production frontend image.
- Align `docker-compose.yml` frontend build arg `VITE_API_BASE_URL` with the application variable `VITE_API_URL`.
- The backend requires `ALLOWED_ORIGINS`; startup intentionally fails if it is missing.
- Since cookies are configured as `secure: true` and `sameSite: none`, production should use HTTPS. Local HTTP development may require adjusted cookie settings or HTTPS local setup.

## 16. Implemented Feature Inventory

### Authentication

- Customer/tasker signup.
- OTP email verification.
- OTP expiry through TTL.
- Password hashing.
- Login with email and password.
- JWT cookie session.
- Current user endpoint.
- Logout and cookie clearing.
- Frontend auth context and protected routes.
- Role-based frontend route protection.
- Offline cached auth state.

### Customer Features

- Customer dashboard metrics.
- Post task form.
- Skill/category selection for tasks.
- City autocomplete.
- Schedule date/hour picker.
- Google Maps location picker.
- Task detail view.
- Own orders grouped by status.
- Cancel open tasks.
- Browse taskers.
- Search/filter taskers.
- Public profile viewing.
- Review completed tasks.
- Profile update.
- Profile image upload utility.
- Services selection.
- Push notification registration.

### Tasker Features

- Tasker feed/recommended tasks.
- Browse/search tasks.
- Nearby matching tasks map.
- Task detail with map/directions link.
- Accept task.
- Start assigned task.
- Mark in-progress task completed.
- Active jobs route.
- Earnings page backed by earnings API.
- Professional profile editing.
- Skills selection.
- Services selection.
- Hourly rate.
- Portfolio link.
- Availability toggle.
- Public profile support.
- Push notification registration.

### Task and Matching Features

- Task creation with geolocation.
- Task search by query/category/status/location/price.
- Open task listing.
- Skill-based recommended tasks.
- Nearby task matching using `$geoNear`.
- Task detail serialization with both label and GeoJSON location.
- Status workflow validation.
- City-based open task filtering.
- Customer/tasker task listing.

### Review and Trust Features

- One review per task.
- Rating validation.
- Comment and tags.
- Task marked as reviewed.
- Tasker average rating recalculation.
- Total review count update.
- Admin trust score update.
- Admin high-risk tasker listing.
- Admin verification flag.

### Payment and Finance Features

- Payment eligibility middleware.
- Stripe PaymentIntent creation.
- Final price lock.
- Stripe webhook processing.
- 10 percent platform commission calculation.
- Tasker earning calculation.
- Tasker wallet balance update.
- Tasker earnings dashboard data.
- Admin payout pipeline.
- Admin process payout.
- Platform revenue KPI.
- Escrow tracker KPI.

### Admin Features

- Admin login with environment credentials.
- Admin bcrypt password check.
- Admin JWT cookie.
- Admin session verification.
- Admin dashboard route protection.
- KPI cards.
- Heatmap/cancellation chart data endpoint.
- High-risk tasker list.
- Unverified tasker list.
- Tasker verification toggle.
- Trust score update.
- Payout pipeline.
- Payout processing.
- Broadcast push notifications.
- Search users and tasks.
- Admin pages: Dashboard, Moderation, Finance, Marketing, Analytics, Login.

### Notification Features

- Firebase client messaging setup.
- Service worker/PWA messaging integration.
- FCM token save/remove endpoints.
- Foreground browser notifications.
- Notification click navigation.
- Matching tasker notification when task is created.
- Customer notifications for accept/start/completion.
- Tasker notifications for cancellation/completion.
- Admin broadcast notification by role.

### Map and Location Features

- Google Maps task location picker.
- Task details map modal.
- Driving directions link.
- Matching tasks map with current/geolocated tasker position.
- Nearby matching task markers.
- GeoJSON storage for task and user location.
- MongoDB 2dsphere indexes.

### Frontend Application Features

- Responsive protected app shell/layout.
- Top bar, sidebar, bottom navigation.
- Customer and tasker role home routing.
- Login and signup screens.
- OTP verification screen.
- Orders page.
- Notifications page.
- Settings page.
- Privacy page.
- Not found page.
- Skeleton/loading states.
- Toast feedback.
- PWA manifest and image caching.

### Testing and Quality Features

- Jest backend unit/controller/middleware tests.
- Supertest dependency for API testing.
- Vitest frontend tests.
- Testing Library frontend component tests.
- Cypress E2E login workflow.
- ESLint configuration.
- Node syntax/build scripts.
- Dockerfiles for frontend and backend.

## 17. Future Enhancements

- Add full payment UI flow on the frontend using Stripe Elements.
- Add persisted notifications collection and notification read/unread status.
- Implement real-time chat between customer and tasker.
- Add task dispute handling and admin resolution workflow.
- Add cancellation reasons and refund logic.
- Add task image attachments.
- Add stronger tasker onboarding and document verification.
- Add wallet withdrawal history instead of only resetting balance.
- Add customer payment history and invoices.
- Add rating breakdown and review display on public profiles.
- Add advanced recommendation scoring using distance, trust score, availability, skills, and price.
- Add rate limiting and brute-force protection for login/OTP endpoints.
- Add refresh token or session rotation strategy.
- Add audit logs for admin actions.
- Add production-ready Nginx configuration and CI/CD pipeline.
- Add centralized environment validation.
- Add OpenAPI/Swagger documentation.
- Add API integration tests with an in-memory MongoDB test setup.
- Add accessibility testing and keyboard navigation audits.
- Add localization/currency support for Pakistan-focused usage.
- Add background jobs for payout processing and notification retries.

