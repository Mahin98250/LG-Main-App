# Learner's Guide

**Student Institute Management System** for admins, teachers, students, and parents, built with React, TypeScript/JavaScript, Supabase, and Vite.

## What this project does

Learner's Guide provides a central platform for managing day-to-day institute operations and giving each role a focused portal.

### Admin

- Dashboard and institute overview
- Student management
- Teacher management
- Batches and timetable management
- Lecture-based teacher attendance
- Homework management
- Exam scheduling
- Study Materials / Drive
- Fees and fee tracking
- Announcements
- User account status and recovery tools
- Profile search

### Teacher

- Home dashboard
- Timetable / schedule
- Lecture-based attendance available only during the scheduled lecture
- Homework assignment and management
- Study material upload and management
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

- Child selection when multiple children are linked
- Child timetable
- Attendance
- Homework
- Study Materials
- Fees
- Institute updates

## Architecture

The application is structured around role-specific portals with shared authentication, Supabase data access, reusable UI components, and production-focused error handling.

```text
src/
├── admin/                # Admin portal and management modules
├── lg/                   # Shared data, auth, UI, and role workflows
├── routes/               # Application routes and authenticated shell
└── main entry files      # React/Vite application bootstrap

supabase/
└── migrations/           # Database schema, RLS, triggers, and security hardening
```

## Technology

- React 19
- TypeScript / modern JavaScript
- Vite 8
- TanStack Router
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Responsive web UI / installable PWA support

## Authentication & security

Authentication is handled through Supabase Auth and role-aware application workflows.

The frontend must contain only public client configuration required by Supabase. Service-role credentials, passwords, and other privileged secrets must never be shipped to the browser.

Row Level Security (RLS), database policies, and server-side/Edge Function operations should remain the source of truth for sensitive authorization.

## Data model

The application works with institute entities such as:

- Students
- Teachers
- Parents / linked parent-student relationships
- Batches
- Timetable entries
- Attendance
- Homework
- Study Materials and folders
- Fees
- Announcements
- Notifications
- User account mappings

## Timetable and attendance

Teacher attendance is tied to the active timetable lecture. A teacher should be able to mark attendance only while one of their scheduled lectures is active.

Attendance records are lecture-aware so separate lectures on the same day do not overwrite one another.

## Study Materials

Study Materials uses a Drive-style folder structure with:

- Folders and subfolders
- Batch targeting
- File uploads
- Supabase Storage
- File download
- Folder rename and deletion
- Responsive mobile layout

## Local development

### Requirements

- Node.js 22+
- npm

### Setup

```bash
git clone https://github.com/Mahin98250/LG-Main-App.git
cd LG-Main-App
npm install
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

## Environment configuration

Keep environment-specific values outside committed source files.

Typical public client variables are configured through the deployment environment, for example:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Never place a Supabase service-role key or any other privileged secret in `src/` or other browser-delivered code.

## Deployment

The project is designed for Vercel-style production deployment, with GitHub used as the source repository and CI used to validate changes before release.

Recommended release flow:

1. Develop on a feature branch.
2. Run typecheck and production build.
3. Review changed workflows.
4. Merge only verified changes into `main`.
5. Confirm deployment status after merge.
6. Run role-based smoke tests against the deployed application.

## Production testing checklist

Before calling a release production-ready, verify at minimum:

- Admin login
- Teacher login
- Parent login
- Student login
- Admin CRUD workflows
- Timetable creation/editing
- Teacher timetable visibility
- Lecture-based attendance
- Student/parent attendance visibility
- Homework creation and visibility
- Study Materials folders and uploads
- Fees
- Announcements
- Session refresh after inactivity
- Mobile layout
- Production build
- RLS / unauthorized-access behavior

## Project status

This repository is an actively developed production candidate. A feature should be considered complete only after code review, successful build checks, and end-to-end workflow verification in the deployed environment.

## License

Private project. All rights reserved unless a separate license is provided by the project owner.
