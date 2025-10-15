# Backend Structure Document

This document outlines the backend setup for the **paws-management** application. It describes the architecture, database, API design, hosting, infrastructure, security, monitoring, and maintenance in clear, everyday language.

## 1. Backend Architecture

**Overview**

The backend is built on **Next.js** using the App Router, which serves both frontend pages and API routes in a single codebase. Core logic lives in the `/app` directory, utilities in `/lib`, and database code in `/db`.

**Key technologies**

- Next.js (App Router) as both frontend and backend framework
- Node.js runtime with TypeScript for type safety
- Drizzle ORM for database access
- Better Auth for authentication flows

**Design patterns and benefits**

- Monolithic structure with clear folders (`/app`, `/components`, `/lib`, `/db`) keeps code organized.
- TypeScript everywhere catches errors early and makes the code more maintainable.
- Serverless API routes on Vercel scale automatically—no manual server management.
- Containerized local environment (Docker) ensures everyone runs the same setup.

**Scalability, maintainability, and performance**

- **Scalability:** API routes are stateless and can spin up on demand in serverless environments.
- **Maintainability:** Consistent folder structure and strong typing make on-boarding new developers easy.
- **Performance:** SSR and SSG pages in Next.js, plus Vercel’s global CDN, deliver fast load times.

## 2. Database Management

**Database type and system**

- Relational (SQL) database
- PostgreSQL as the database engine

**How data is stored and accessed**

- **Drizzle ORM** connects to PostgreSQL using a pool of connections.
- Database schemas are defined in `/db/schema/auth.ts` and map directly to tables.
- A single file (`/db/index.ts`) initializes the ORM and exports a client for queries.

**Data management practices**

- Environment variables (`.env`) store database URL and credentials securely.
- Docker Compose spins up a local Postgres container matching production settings.
- Drizzle supports migrations (can be added later) to evolve the schema without downtime.

## 3. Database Schema

Below is a human-friendly description of the four main tables, followed by their SQL definitions.

**Tables and fields (human readable)**

1. Users
   - `id`: unique user ID (UUID)
   - `name`: display name (text)
   - `email`: user’s email (unique)
   - `emailVerified`: timestamp when email was verified
   - `image`: URL of user’s avatar

2. Sessions
   - `id`: unique session ID (UUID)
   - `userId`: reference to Users table
   - `expires`: timestamp when session ends

3. Accounts (for OAuth)
   - `id`: unique account link ID (UUID)
   - `userId`: reference to Users
   - `type`: provider type (e.g., "oauth")
   - `provider`: name of OAuth provider
   - `providerAccountId`: provider-specific user ID

4. VerificationTokens
   - `identifier`: email or other identifier
   - `token`: one-time token (text)
   - `expires`: timestamp when token expires

**SQL schema (PostgreSQL)**

```sql
-- Users table
drop table if exists users cascade;
create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  "emailVerified" timestamp with time zone,
  image text
);

-- Sessions table
drop table if exists sessions cascade;
create table sessions (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  expires timestamp with time zone not null
);

-- Accounts table (OAuth links)
drop table if exists accounts cascade;
create table accounts (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null
);

-- Verification Tokens table
drop table if exists verification_tokens cascade;
create table verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamp with time zone not null,
  primary key(identifier, token)
);
```  

## 4. API Design and Endpoints

**Approach**

The APIs follow a RESTful style, implemented as Next.js API routes under `/app/api`.

**Key endpoint**

- `POST /api/auth/[...all]`  
  A catch-all route powered by Better Auth. It handles:
  - Sign-up requests
  - Sign-in requests
  - Password resets or email verifications
  - Session checks

**How it works**

1. Client-side code calls helper functions in `/lib/auth-client.ts`.
2. Those functions make fetch requests to `/api/auth`.
3. The API route delegates logic to Better Auth, which uses Drizzle ORM to read/write the database.
4. Responses include session data or error messages.

## 5. Hosting Solutions

**Primary platform**

- **Vercel** for production deployment.

**Local development**

- **Docker & Docker Compose** spin up both the Next.js app and PostgreSQL locally, ensuring parity with production.

**Benefits**

- Vercel automatically scales serverless functions and serves static assets via CDN.
- Zero server maintenance and automatic SSL/TLS.
- Docker keeps environments consistent across developer machines.

## 6. Infrastructure Components

- **Load Balancer:** Implicitly provided by Vercel’s edge network, routing traffic to the nearest serverless function.
- **CDN:** Vercel’s global CDN caches static assets (JS, CSS, images) for fast delivery.
- **Connection Pooling:** Drizzle ORM’s underlying database pool manages connections efficiently.
- **Docker Compose:** Locally orchestrates the app and database containers.

Together, these components ensure smooth performance, high availability, and a responsive user experience.

## 7. Security Measures

- **Authentication & Authorization:** Better Auth handles secure sign-up, sign-in, session management, and protects private routes (e.g., `/dashboard`).
- **Data Encryption:** TLS/SSL in transit (via Vercel) and secure database connections in production. Environment variables keep secrets out of code.
- **Input Validation:** Better Auth validates credentials; additional checks can be added in API routes.
- **Secure Defaults:** HTTP-only cookies for sessions, strict CORS policies, and no leaking of internal errors to clients.
- **Compliance:** Follows best practices to protect user data; can be extended to meet GDPR or other regulations.

## 8. Monitoring and Maintenance

- **Monitoring:** Use Vercel analytics for traffic and performance insights. Console logs in serverless functions help debug issues.
- **Error Tracking:** Integrate Sentry or a similar service for real-time error reporting (recommended).
- **Database Backups:** Set up scheduled backups through the database provider (e.g., AWS RDS or a managed Postgres service).
- **Dependency Updates:** Regularly update npm packages and Docker images, ideally automated via Dependabot or GitHub Actions.
- **CI/CD Pipeline:** Implement GitHub Actions to run tests and linting on each pull request before merging.

## 9. Conclusion and Overall Backend Summary

The **paws-management** backend leverages modern, proven technologies to deliver a secure, scalable, and maintainable foundation:

- **Next.js App Router** unifies frontend and backend in one codebase.
- **TypeScript + Drizzle ORM** ensure type-safe database operations.
- **Better Auth** provides battle-tested authentication workflows.
- **Docker** and **Vercel** guarantee consistent environments, automatic scaling, and global performance.

This setup meets the project’s goals by offering quick developer on-boarding, robust security, and excellent performance out of the box. The clear separation of concerns and standard practices make it easy to extend, maintain, and evolve as requirements grow.