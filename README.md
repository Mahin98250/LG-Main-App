# 🌟 Learner's Guide

> A production-focused Student Institute Management System for **Admins, Teachers, Students, and Parents**.

Learner's Guide centralizes institute operations into secure role-based portals backed by **Supabase** and a responsive React/Vite application.

## ✨ Core Features

### 👑 Admin
- Dashboard and institute overview
- Student and teacher management
- Class/section/batch selectors
- Batches and timetable management
- Lecture-based attendance management
- Homework management
- Exam schedule management
- Study Materials Drive with folders, subfolders, uploads, and downloads
- Fees and fee tracking
- Announcements
- User account management and recovery tools
- Profile search

### 👨‍🏫 Teacher
- Dashboard
- Personal timetable
- Lecture-aware attendance: attendance opens only during the scheduled lecture
- Homework assignment and management
- Study Materials upload and management
- Notifications

### 🎓 Student
- Dashboard
- Timetable
- Attendance history
- Homework
- Study Materials
- Fees
- Exam schedule
- Announcements

### 👪 Parent
- Linked child selection
- Child timetable
- Attendance
- Homework
- Study Materials
- Fees
- Institute announcements

## 🏗️ Architecture

```text
src/
├── admin/                 # Admin portal and management modules
├── lg/                    # Shared auth, data, UI and role workflows
├── routes/                # App routes and authenticated shell
└── main entry files       # React/Vite bootstrap

supabase/
└── migrations/            # Database schema, RLS, triggers and security hardening
```

## 🧰 Technology Stack

- React 19
- TypeScript / JavaScript
- Vite
- TanStack Router
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Responsive UI / PWA support
- GitHub + CI + Vercel-style deployment

## 🔐 Security Principles

- Browser code should contain only public Supabase client configuration.
- **Never** ship service-role keys, private API keys, passwords, or privileged credentials to the frontend.
- Use Supabase **Row Level Security (RLS)** as the database authorization boundary.
- Use Edge Functions/server-side operations for privileged actions.
- Prefer signed URLs for protected file downloads.
- Keep role-specific data access scoped to the authenticated user.

## 📚 Study Materials

The Study Materials system provides a Drive-style experience with:

- Class/batch-oriented materials
- Folders and subfolders
- File uploads
- Supabase Storage
- Signed downloads
- Rename/delete workflows
- Responsive mobile layout

## 🗓️ Timetable & Attendance

Timetable entries define the teacher's scheduled lectures. Attendance is intentionally **lecture-aware**:

1. Teacher sees today's schedule.
2. Attendance remains locked outside a scheduled lecture.
3. During an active lecture, the teacher can mark Present / Absent / Leave.
4. Separate lectures remain separate attendance records.

## ⚙️ Local Development

### Requirements

- Node.js 22+
- npm

### Install

```bash
git clone https://github.com/Mahin98250/LG-Main-App.git
cd LG-Main-App
npm install
```

### Start development server

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Typecheck

```bash
npm run typecheck
```

## 🌍 Environment Variables

Configure environment-specific values through the deployment platform rather than hard-coding secrets in the repository.

Typical public Supabase client variables are:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

> ⚠️ Never place a Supabase service-role key or another privileged secret in `src/`, `public/`, or browser-delivered JavaScript.

## 🚀 Deployment Workflow

Recommended release flow:

1. Create a feature branch.
2. Implement one focused change at a time.
3. Run `npm run typecheck`.
4. Run `npm run build`.
5. Review affected role workflows.
6. Merge only verified changes into `main`.
7. Confirm production deployment status.
8. Run role-based smoke tests on the deployed app.

## 🧪 Production Smoke Test Checklist

### Authentication
- Admin login
- Teacher login
- Student login
- Parent login
- Session persistence after inactivity
- Logout and re-login

### Admin
- Students
- Teachers
- Batches & Timetable
- Attendance
- Homework
- Exam Schedule
- Study Materials
- Fees
- Announcements
- User Accounts
- Search Profiles

### Teacher
- Home
- Timetable
- Lecture-based attendance
- Homework
- Study Materials
- Notifications

### Student
- Home
- Timetable
- Attendance
- Homework
- Study Materials
- Fees
- Exam Schedule
- Announcements

### Parent
- Child selection
- Timetable
- Attendance
- Homework
- Study Materials
- Fees
- Announcements

### Reliability
- Mobile layout
- Database sync/loading states
- Refresh after inactivity
- RLS / unauthorized-access behavior
- Production build and deployment

## 🧹 Retired Modules

The following modules have intentionally been removed from the user interfaces:

- Messages
- Marks Overview / Marks workflow
- Student Results

The remaining institute workflows are intentionally focused on administration, timetable, attendance, homework, materials, fees, exams, announcements, and role-specific dashboards.

## 📌 Project Status

Learner's Guide is an actively hardened production candidate. A feature is considered complete only after:

- implementation,
- successful typecheck,
- successful production build,
- deployment verification, and
- end-to-end role testing.

## 📄 License

Private project. All rights reserved unless a separate license is provided by the project owner.
