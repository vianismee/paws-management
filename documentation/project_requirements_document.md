## 1. Project Overview

**paws-management** is a starter full-stack web application built with Next.js (App Router) and TypeScript. It delivers an out-of-the-box setup for user authentication, a type-safe database integration, and a modern UI framework. Developers can clone this repository and immediately have a working login/signup flow, a PostgreSQL-backed data layer via Drizzle ORM, and a responsive UI powered by Tailwind CSS and shadcn/ui components.

The primary goal of this project is to serve as a boilerplate for teams or individuals who want to accelerate their development process. By bundling authentication (Better Auth), database schemas, theming (light/dark mode), a protected dashboard area, and containerized deployment (Docker & Docker Compose), it minimizes repetitive configuration work. Success is measured by how quickly a new developer can get the app running locally, secure accounts, and see the dashboard without manual setup.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (First Version)**
- Email/password sign-up and sign-in flows using Better Auth.  
- Type-safe database setup with Drizzle ORM and PostgreSQL for user, session, account, and token tables.  
- A responsive, accessible UI using Tailwind CSS and shadcn/ui with built-in dark/light mode via next-themes.  
- Protected dashboard pages that only authenticated users can access.  
- API routes under `/app/api/auth` for all authentication operations.  
- Containerization with Dockerfile and docker-compose.yaml (app + Postgres).  
- Environment variable management via `.env` file template.  
- Deployment readiness targeting Vercel.

**Out-of-Scope (Phase 2+)**
- Password reset and email verification workflows.  
- Role-based access control (RBAC) or multi-tenant support.  
- Centralized state management library (e.g., Redux, Zustand).  
- Automated testing suite (unit/integration/UI tests).  
- CI/CD pipelines and automated deployments.  
- Performance optimizations beyond basic profiling (e.g., advanced caching layers).  
- Comprehensive security hardening audits (GDPR, OWASP compliance checks).

## 3. User Flow

A new visitor lands on the home page and clicks “Sign Up.” They fill out their email and password in a clean form—styled with Tailwind CSS—and submit. The client code invokes the Better Auth API under `/api/auth/signup`, creating a new account in the PostgreSQL database via Drizzle ORM. Upon success, the user is automatically redirected to the `/dashboard` route.

An existing user selects “Sign In,” enters credentials, and calls `/api/auth/signin`. The server verifies against the Drizzle schema and returns a session cookie. Once authenticated, the user sees a sidebar with navigation links and a main content area in the dashboard. They can toggle between dark and light themes, log out via a “Sign Out” button, or explore future pages like profile settings.

## 4. Core Features

- **Authentication**: Email/password sign-up, sign-in, session management via Better Auth.  
- **Database Integration**: PostgreSQL with Drizzle ORM schemas for users, sessions, accounts, and verification tokens.  
- **API Routes**: Next.js App Router API under `/app/api/auth/[...all]` to handle all auth requests.  
- **Modern UI**: Tailwind CSS utility classes and shadcn/ui component library for consistent styling.  
- **Theming**: Light/dark mode toggle managed by next-themes.  
- **Dashboard Layout**: Auth-guarded pages with sidebar navigation and content area.  
- **Containerization**: Dockerfile + docker-compose.yaml for app and database.  
- **Env Management**: `.env.example` to configure DB URL, auth secrets, and ports.

## 5. Tech Stack & Tools

- **Frontend & Backend Framework**: Next.js (App Router) with React server/components.  
- **Language**: TypeScript.  
- **Styling**: Tailwind CSS, shadcn/ui components (built on Radix UI).  
- **Theming**: next-themes for easy light/dark mode.  
- **Authentication**: Better Auth (open-ended adapter).  
- **Database**: PostgreSQL (relational).  
- **ORM**: Drizzle ORM for type-safe queries.  
- **Containerization**: Docker & Docker Compose.  
- **Deployment**: Vercel (for Next.js hosting).  
- **IDE & Plugins** (optional): VSCode with Tailwind CSS IntelliSense, ESLint, Prettier.

## 6. Non-Functional Requirements

- **Performance**:  
  • API response times ≤ 200ms under typical load.  
  • Initial page load (dashboard) ≤ 1.5s on 3G throttled network (SSG/SSR optimization).  
- **Security**:  
  • Use HTTPS for all endpoints.  
  • Secure cookies (HttpOnly, Secure, SameSite).  
  • Store secrets in env variables, never in code.  
  • Input validation on both client and server.  
- **Usability**:  
  • WCAG AA accessibility compliance for forms and navigation.  
  • Dark/light theme toggle persists in local storage.  
- **Maintainability**:  
  • Strict TypeScript checks enabled (`--strict`).  
  • Modular file structure following Next.js conventions.

## 7. Constraints & Assumptions

- Better Auth adapter and Drizzle ORM must support the targeted Node.js version (≥16).  
- PostgreSQL instance runs locally in Docker; connection string provided via env var.  
- Vercel environment will mirror the `.env.example` variables.  
- Developers have Docker and Node.js installed.  
- No external identity providers (Google, GitHub) in this phase—email/password only.

## 8. Known Issues & Potential Pitfalls

- **API Rate Limits**: If Better Auth enforces rate limits, implement exponential backoff or user-friendly error messages.  
- **Database Migrations**: Drizzle ORM schema changes need manual migration scripts; include a checklist to run `drizzle-kit migrate` after schema updates.  
- **Docker Networking**: Ports conflict—ensure `docker-compose.yaml` maps ports without overlap and documents them clearly.  
- **SSR vs. Server Components**: Misplaced client-side logic in server components can cause hydration errors; label components with `'use client'` where needed.  
- **CSS Purge**: Tailwind’s purge settings must include all dynamic class names; otherwise, some utilities might get removed during build.  

Mitigation guidelines and small scripts (e.g., a health-check endpoint, migration helper) can be added later but are not required in Version 1.  