# Backend Structure Document

# Backend Structure Document

This document outlines the comprehensive backend architecture for the **paws-management** production management system. It covers the business logic architecture, database design for inventory and formulations, client-side data operations, and technical infrastructure supporting the complete production workflow.

## 1. Backend Architecture

**Overview**

The backend uses a hybrid architecture combining **Next.js** App Router for authentication with **client-side database operations** for business data. Core authentication logic lives in `/app/api/auth`, while business operations are performed directly from client components. Database schemas and business logic are organized in `/db` and `/lib`.

**Key technologies**

- Next.js (App Router) for authentication and API routes
- Node.js runtime with TypeScript for type safety
- Drizzle ORM for type-safe database operations
- Better Auth for authentication flows
- Client-side database connections for business operations
- Decimal.js for precise financial calculations

**Business Logic Architecture**

The system implements a comprehensive business logic layer:

- **Inventory Management Logic**: Auto-generation of material codes, stock level tracking, cost calculations
- **Formulation Management**: Percentage-based ingredient calculations, version control, cost rollup
- **COGS Calculation Engine**: Real-time cost calculation, pricing rule application, margin analysis
- **Production Tracking**: Batch management, material consumption tracking, variance analysis

**Design patterns and benefits**

- **Client-side Operations**: Direct database connections provide responsive user experience
- **Type Safety**: TypeScript and Drizzle ORM ensure data integrity from database to UI
- **Modular Business Logic**: Separate concerns for inventory, formulations, and production
- **Containerized Development**: Docker ensures consistent environments across team members

**Scalability, maintainability, and performance**

- **Scalability**: Client-side operations reduce server load; database scales independently
- **Maintainability**: Clear separation of business logic, database operations, and UI components
- **Performance**: Real-time calculations and immediate feedback without server round-trips
- **Data Integrity**: Type-safe operations throughout the application prevent business logic errors

## 2. Database Management

**Database type and system**

- Relational (SQL) database optimized for business operations
- PostgreSQL as the database engine with comprehensive business schema

**Comprehensive Business Schema Design**

The database is organized into four main schema modules:

1. **Authentication Schema** (`/db/schema/auth.ts`)
   - Users, sessions, accounts, verification tokens
   - Integrated with Better Auth for secure user management

2. **Inventory Schema** (`/db/schema/inventory.ts`)
   - Categories with auto-generated code prefixes (OIL, WAX, FRAGRANCE)
   - Materials with supplier information, costs, and stock tracking
   - Packaging with size, type, and cost allocation
   - Labels with printing costs and quantity management

3. **Formulas Schema** (`/db/schema/formulas.ts`)
   - Formulas with version control and status management
   - Formula ingredients with percentage-based composition
   - Production batches with material consumption tracking
   - Cost tracking and variance analysis

4. **COGS Schema** (`/db/schema/cogs.ts`)
   - Cost calculations with material, packaging, and labor breakdowns
   - Pricing rules with multiple strategies (percentage, fixed, target margin)
   - Formula pricing with margin analysis
   - Historical cost tracking for trend analysis

**How data is stored and accessed**

- **Drizzle ORM** connects to PostgreSQL using a connection pool optimized for concurrent business operations.
- Database schemas are defined in separate modules for maintainability.
- A centralized database client (`/db/index.ts`) exports all schemas and provides type-safe access.
- Client-side operations use direct database connections for optimal performance.

**Data management practices**

- Environment variables (`.env`) store database URL and credentials securely.
- Docker Compose spins up a local Postgres container with development data seeding.
- Drizzle Kit handles migrations and provides a visual database studio for development.
- Database indexing is optimized for business queries (material lookups, formula searches, cost calculations).
- Decimal precision is maintained throughout for financial calculations.

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

## 4. API Design and Business Operations

**Hybrid Architecture Approach**

The system uses a hybrid approach combining traditional API routes for authentication with client-side database operations for business data.

**Authentication API**
- `POST /api/auth/[...all]`
  A catch-all route powered by Better Auth that handles:
  - Sign-up and sign-in requests
  - Session management and validation
  - Password recovery and email verification
  - Session termination and logout

**Client-Side Business Operations**

All business operations are performed directly from client components:

1. **Inventory Operations**
   - Material CRUD operations with auto-code generation
   - Stock level updates and reorder point notifications
   - Supplier and cost information management

2. **Formulation Operations**
   - Formula creation with percentage validation
   - Ingredient management with drag-and-drop interface
   - Version control and change tracking

3. **COGS Calculations**
   - Real-time cost calculation based on material prices
   - Pricing rule application and margin analysis
   - Historical cost tracking and trend analysis

4. **Production Tracking**
   - Batch creation and material requirement calculations
   - Production recording and variance analysis
   - Cost tracking and efficiency metrics

**How Business Operations Work**

1. Client components call business logic functions in `/lib/business-logic/`
2. These functions use Drizzle ORM for type-safe database operations
3. Decimal.js ensures precision in all financial calculations
4. Real-time validation ensures data integrity and business rule compliance
5. Optimistic updates provide immediate user feedback with rollback on errors

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

## 9. Business Logic Implementation

**Core Business Calculations**

The backend implements sophisticated business logic for production management:

- **Formulation Calculations**: Percentage-based ingredient validation and automatic weight calculations
- **COGS Engine**: Real-time cost calculation including materials, packaging, labor, and overhead allocation
- **Pricing Logic**: Multiple pricing strategies (percentage markup, target margins, fixed pricing)
- **Inventory Algorithms**: Automatic reorder point calculations and stock level optimization

**Data Validation and Integrity**

- **Business Rule Validation**: Ensures formula percentages sum to 100%, prevents negative inventory
- **Financial Precision**: Decimal.js maintains 4-decimal precision for cost per gram calculations
- **Referential Integrity**: Database constraints prevent orphaned records and ensure data consistency
- **Audit Trail**: All business transactions are tracked for compliance and analysis

**Performance Optimizations**

- **Query Optimization**: Database indexes optimized for common business queries
- **Calculation Caching**: Frequently accessed cost calculations are cached for performance
- **Batch Operations**: Bulk updates and imports are optimized for large datasets
- **Connection Pooling**: Database connections are managed efficiently for concurrent users

## 10. Conclusion and Overall Backend Summary

The **paws-management** backend delivers a comprehensive business solution through modern, proven technologies:

- **Hybrid Architecture**: Combines traditional authentication API with client-side business operations for optimal performance
- **Comprehensive Business Schema**: Four-schema design covering authentication, inventory, formulations, and COGS
- **Type Safety**: TypeScript and Drizzle ORM ensure data integrity from database to UI
- **Business Logic Engine**: Sophisticated calculations for formulation management, cost analysis, and production tracking
- **Scalable Infrastructure**: Docker and Vercel provide consistent deployment environments with automatic scaling

This architecture meets the complex needs of production management businesses while maintaining developer experience and operational excellence. The clear separation of concerns, comprehensive business logic, and robust data management provide a solid foundation for business growth and feature expansion.

---
**Document Details**
- **Project ID**: 9abf8165-5741-488d-aa70-1677e11be201
- **Document ID**: 3ebdc74b-e214-4729-bc7f-30ef480e6065
- **Type**: custom
- **Custom Type**: backend_structure_document
- **Status**: completed
- **Generated On**: 2025-10-15T15:41:50.900Z
- **Last Updated**: N/A
