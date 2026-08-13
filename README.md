# Learner's Guide

> **Student Institute Management System** for administrators, teachers, students, and parents.

Learner's Guide is a role-based institute management platform built for everyday academic operations: student and teacher management, batches and timetables, lecture-based attendance, homework, study materials, fees, announcements, account management, and parent/student portals.

## ✨ Core capabilities

### Admin

- Institute dashboard and operational overview
- Student management with linked login creation
- Teacher management with subject/class assignment
- Batch creation and timetable management
- Lecture-aware attendance supervision
- Homework monitoring
- Exam scheduling
- Study Materials Drive with folders and files
- Fees and fee tracking
- Announcements
- User account status/recovery tools
- Student/teacher profile search

### Teacher

- Home dashboard
- Weekly timetable
- Lecture-based attendance
- Homework assignment
- Study-material upload/download
- Notifications

### Student

- Dashboard
- Timetable
- Attendance history
- Homework
- Study Materials
- Fees
- Exam schedule
- Announcements

### Parent

- Linked-child selection
- Child timetable
- Attendance
- Homework
- Study Materials
- Fees
- Institute announcements

## 🏗️ Architecture

```text
src/
├── admin/              # Admin portal and management modules
├── lg/                 # Shared auth, data, UI and role workflows
├── routes/             # Application and authenticated routes
└── main entry files    # React/Vite bootstrap

supabase/
└── migrations/         # Schema, RLS, triggers and security hardening
```

The application uses a shared Supabase data layer plus role-specific UI workflows. Sensitive authorization belongs in Supabase RLS and server-side/Edge Function logic rather than in browser-only checks.

## 🧰 Technology stack

- React 19
- TypeScript and modern JavaScript
- Vite 8
- TanStack Router
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Responsive UI / installable PWA support
- GitHub + Vercel deployment workflow

## 🔐 Authentication and security

Authentication is handled through Supabase Auth with role-aware portals.

The browser should contain only the public Supabase client configuration required for the application. Never ship:

- Supabase service-role keys
- Private API keys
- Server credentials
- Password databases
- Other privileged secrets

RLS policies and server-side/Edge Function authorization are the security boundary for protected records and privileged operations.

## 📅 Timetable and attendance

Teacher attendance is lecture-aware. A teacher should see the attendance controls only while a scheduled lecture is active. Each lecture gets its own attendance identity so multiple lectures on the same day do not overwrite one another.

## 📚 Study Materials

Study Materials is designed as a Drive-style system with:

- Class/subject-oriented folders
- Subfolders
- Batch targeting
- Secure uploads through Supabase Storage
- Downloads via signed URLs
- Folder management
- Responsive mobile behavior

## ⏱️ Time format

User-facing timetable and lecture times use a **12-hour format** with AM/PM, while database values may use normalized time representations internally.

## 🛠️ Local development

### Requirements

- Node.js 22+
- npm

### Install and run

```bash
git clone https://github.com/Mahin98250/LG-Main-App.git
cd LG-Main-App
npm install
npm run dev
```

### Validate the application

```bash
npm run typecheck
npm run build
```

## 🌎 Environment variables

Environment-specific configuration belongs in deployment settings or local `.env` files, not committed source code.

Typical public client configuration:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The Supabase **service-role key must never be exposed to the frontend**.

## 🚀 Deployment

The repository is designed for a GitHub → Vercel production workflow.

Recommended release process:

1. Work on a feature branch.
2. Make one focused change at a time.
3. Run typecheck and production build.
4. Review affected workflows.
5. Verify database/RLS implications.
6. Merge only verified code into `main`.
7. Confirm the production deployment is successful.
8. Run smoke tests for all affected roles.

## ✅ Production smoke-test checklist

Before describing a release as production-ready, verify:

- Admin login
- Teacher login
- Student login
- Parent login
- Admin student/teacher CRUD
- Batches and timetable creation/editing
- Teacher timetable visibility
- Lecture-based attendance
- Student/parent attendance visibility
- Homework creation and visibility
- Study Materials folders and uploads
- Fees
- Announcements
- Account/session refresh after inactivity
- Mobile layout and navigation
- Production build
- RLS / unauthorized-access behavior

## 📌 Current scope

The product intentionally focuses on institute operations that are currently supported by the application. Removed/retired modules should not be reintroduced into navigation or role workflows without a deliberate product decision.

## 📄 License

Private project. All rights reserved unless a separate license is provided by the project owner.
