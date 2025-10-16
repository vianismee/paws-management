# Project Requirements Document

## 1. Project Overview

**paws-management** is a comprehensive production management system for cosmetics and manufacturing businesses, built with Next.js (App Router) and TypeScript. It delivers a complete solution for managing raw materials inventory, product formulations, Cost of Goods Sold (COGS) calculations, and production tracking. The system provides user authentication, type-safe database integration, and a modern UI framework. Developers can clone this repository and immediately have a working login/signup flow, a PostgreSQL-backed data layer via Drizzle ORM, and a responsive UI powered by Tailwind CSS and shadcn/ui components.

The primary goal of this project is to provide a complete business management solution for small to medium-sized manufacturing operations. By bundling authentication (Better Auth), comprehensive database schemas for materials, formulas, and production, theming (light/dark mode), a protected dashboard area, and containerized deployment (Docker & Docker Compose), it delivers enterprise-grade functionality while minimizing setup time. Success is measured by how quickly a business can start managing their inventory, creating formulations, and tracking production costs.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (First Version)**
- Email/password sign-up and sign-in flows using Better Auth.
- Complete inventory management system:
  - Raw materials tracking with categories, suppliers, and stock levels
  - Packaging management with size, type, and cost tracking
  - Label management with printing and cost allocation
- Advanced formulation system:
  - Formula creation with ingredient percentages and weights
  - Version control for formula changes and history tracking
  - Production batch tracking and material consumption
- Cost of Goods Sold (COGS) calculation system:
  - Automatic cost calculation based on material costs and formulas
  - Packaging and label cost allocation
  - Pricing rules and margin analysis
- Type-safe database setup with Drizzle ORM and PostgreSQL for all business entities.
- A responsive, accessible UI using Tailwind CSS and shadcn/ui with built-in dark/light mode via next-themes.
- Protected dashboard pages that only authenticated users can access.
- Advanced data tables with sorting, filtering, and pagination.
- Drag-and-drop functionality for formulation management.
- API routes for all CRUD operations on materials, formulas, and production data.
- Containerization with Dockerfile and docker-compose.yaml (app + Postgres).
- Environment variable management via `.env` file template.
- Deployment readiness targeting Vercel.

**Out-of-Scope (Phase 2+)**
- Password reset and email verification workflows.
- Role-based access control (RBAC) or multi-tenant support.
- Centralized state management library (e.g., Redux, Zustand).
- Automated testing suite (unit/integration/UI tests).
- CI/CD pipelines and automated deployments.
- Advanced reporting and analytics dashboards.
- Integration with accounting software.
- Barcode scanning and inventory automation.
- Supplier management and purchase order workflows.
- Performance optimizations beyond basic profiling (e.g., advanced caching layers).
- Comprehensive security hardening audits (GDPR, OWASP compliance checks).

## 3. User Flow

A new visitor lands on the home page and clicks "Sign Up." They fill out their email and password in a clean form—styled with Tailwind CSS—and submit. The client code invokes the Better Auth API under `/api/auth/signup`, creating a new account in the PostgreSQL database via Drizzle ORM. Upon success, the user is automatically redirected to the `/dashboard` route.

An existing user selects "Sign In," enters credentials, and calls `/api/auth/signin`. The server verifies against the Drizzle schema and returns a session cookie. Once authenticated, the user sees a comprehensive dashboard with:

**Main Navigation Flow:**
1. **Dashboard Overview** - View key metrics, inventory levels, and recent production batches
2. **Inventory Management** - Navigate to Materials, Packaging, or Labels sections:
   - Add new raw materials with cost tracking and supplier information
   - Manage packaging inventory with size and cost allocation
   - Track label stock and printing costs
3. **Formulation Management** - Create and manage product formulas:
   - Build formulas by adding materials with percentage-based composition
   - Track formula versions and change history
   - Calculate costs automatically based on ingredient prices
4. **COGS Analysis** - Review cost breakdowns and pricing calculations:
   - Analyze material costs, packaging costs, and total production costs
   - Set pricing rules and calculate profit margins
   - Generate cost reports for different products

Users can toggle between dark and light themes, navigate between sections using the sidebar, and log out via the "Sign Out" button. All data operations are performed client-side with direct database calls for optimal performance.

## 4. Core Features

**Authentication & Security**
- **Authentication**: Email/password sign-up, sign-in, session management via Better Auth.
- **Protected Routes**: All dashboard pages require authentication with automatic redirects.

**Inventory Management System**
- **Raw Materials Management**: Complete tracking of ingredients with categories, auto-generated codes, supplier information, cost tracking, and stock level monitoring with reorder points.
- **Packaging Management**: Track containers, bottles, and tubes with size specifications, material types, cost allocation, and inventory levels.
- **Label Management**: Manage product labels with printing costs, size specifications, and stock tracking.

**Formulation Management**
- **Formula Builder**: Dynamic interface for creating product formulations with percentage-based ingredient composition.
- **Version Control**: Track changes to formulas with complete history and rollback capabilities.
- **Material Cost Integration**: Automatic cost calculation based on current material prices.
- **Production Tracking**: Record production batches with actual material consumption and cost tracking.

**Cost of Goods Sold (COGS) System**
- **Automatic Cost Calculation**: Real-time COGS calculation based on material costs, packaging, and labels.
- **Pricing Rules**: Define markup strategies (percentage, fixed, target margin) for product pricing.
- **Cost Analysis**: Detailed breakdown of material costs, labor costs, overhead, and packaging expenses.
- **Margin Analysis**: Calculate profit margins and pricing recommendations.

**User Interface & Experience**
- **Modern UI**: Tailwind CSS utility classes and shadcn/ui component library for consistent styling.
- **Advanced Data Tables**: Sortable, filterable, and paginated tables for all data management.
- **Drag-and-Drop**: Intuitive formulation management with drag-and-drop ingredient ordering.
- **Theming**: Light/dark mode toggle managed by next-themes.
- **Responsive Design**: Mobile-friendly interface that works on all devices.

**Technical Infrastructure**
- **Database Integration**: PostgreSQL with comprehensive Drizzle ORM schemas for all business entities.
- **Client-Side Operations**: All CRUD operations performed directly from the client using supabase-js for optimal performance.
- **Dashboard Layout**: Auth-guarded pages with comprehensive sidebar navigation and organized content areas.
- **Containerization**: Dockerfile + docker-compose.yaml for app and database.
- **Environment Management**: Complete `.env.example` with all required configuration variables.

## 5. Tech Stack & Tools

**Frontend & Backend Framework**
- **Next.js (App Router)**: Full-stack framework with React server/components and API routes.
- **Language**: TypeScript for type safety across the entire application.

**UI & Styling**
- **Styling**: Tailwind CSS, shadcn/ui components (built on Radix UI).
- **Data Tables**: @tanstack/react-table for advanced table functionality.
- **Icons**: @tabler/icons-react for consistent iconography.
- **Drag & Drop**: @dnd-kit/core for interactive formulation management.
- **Forms**: react-hook-form with @hookform/resolvers and zod validation.
- **Theming**: next-themes for easy light/dark mode.

**Data Management**
- **Authentication**: Better Auth for secure user authentication.
- **Database**: PostgreSQL (relational) with comprehensive business schemas.
- **ORM**: Drizzle ORM for type-safe queries and migrations.
- **State Management**: React state with client-side database operations.

**Development & Deployment**
- **Containerization**: Docker & Docker Compose for development and production.
- **Deployment**: Vercel (for Next.js hosting).
- **Database Management**: Drizzle Kit for migrations and database studio.
- **Environment**: dotenv for configuration management.

**Additional Libraries**
- **Date Handling**: date-fns for date manipulation.
- **Decimal Calculations**: decimal.js for precise financial calculations.
- **Charts**: recharts for data visualization.
- **Notifications**: sonner for toast notifications.
- **Animations**: tailwind-merge and tw-animate-css for smooth transitions.

**IDE & Plugins** (optional)
- VSCode with Tailwind CSS IntelliSense, ESLint, Prettier.
- Database browser for PostgreSQL management.

## 6. Non-Functional Requirements

**Performance**
- API response times ≤ 200ms under typical load.
- Initial page load (dashboard) ≤ 1.5s on 3G throttled network (SSG/SSR optimization).
- Client-side database operations with optimal query performance.
- Efficient data table rendering with virtualization for large datasets.

**Security**
- Use HTTPS for all endpoints.
- Secure cookies (HttpOnly, Secure, SameSite).
- Store secrets in env variables, never in code.
- Input validation on both client and server.
- Row-level security for sensitive business data.
- Audit logging for all financial and inventory transactions.

**Usability**
- WCAG AA accessibility compliance for forms and navigation.
- Dark/light theme toggle persists in local storage.
- Intuitive drag-and-drop interface for formulation management.
- Responsive design that works on tablets and mobile devices.
- Real-time validation and feedback for data entry.

**Data Accuracy & Integrity**
- Precise decimal calculations for financial data (4 decimal places for cost per gram).
- Automatic validation that formula percentages sum to 100%.
- Inventory level tracking with automatic reorder point notifications.
- Cost calculation audit trail for pricing and COGS analysis.

**Maintainability**
- Strict TypeScript checks enabled (`--strict`).
- Modular file structure following Next.js conventions.
- Comprehensive database schema with proper indexing.
- Type-safe database operations throughout the application.

**Scalability**
- Database schema optimized for queries on large inventories.
- Efficient pagination and filtering for data tables.
- Client-side operations reduce server load.
- Containerized deployment for easy scaling.

## 7. Constraints & Assumptions

**Technical Constraints**
- Better Auth adapter and Drizzle ORM must support the targeted Node.js version (≥16).
- PostgreSQL instance runs locally in Docker; connection string provided via env var.
- Vercel environment will mirror the `.env.example` variables.
- All database operations are performed client-side using direct database connections.
- The system is designed for single-tenant deployment (not multi-tenant SaaS).

**Business Constraints**
- The system assumes Indonesian Rupiah (IDR) as the primary currency.
- Material costs and inventory tracking use metric units (grams, milliliters).
- Formulation percentages must sum to exactly 100% for valid formulations.
- Production batch tracking assumes manual material consumption recording.

**Development Constraints**
- Developers have Docker and Node.js installed.
- No external identity providers (Google, GitHub) in this phase—email/password only.
- Client-side operations require careful handling of sensitive data.
- Database schema changes require migration scripts for production deployments.

**Assumptions**
- Users have basic familiarity with formulation management and inventory concepts.
- Material costs are entered manually and updated regularly.
- Production batch quantities are reasonable for manual tracking (not industrial scale).
- All calculations use decimal.js for precision in financial computations.

## 8. Known Issues & Potential Pitfalls

**Technical Issues**
- **API Rate Limits**: If Better Auth enforces rate limits, implement exponential backoff or user-friendly error messages.
- **Database Migrations**: Drizzle ORM schema changes need manual migration scripts; include a checklist to run `drizzle-kit migrate` after schema updates.
- **Docker Networking**: Ports conflict—ensure `docker-compose.yaml` maps ports without overlap and documents them clearly.
- **SSR vs. Server Components**: Misplaced client-side logic in server components can cause hydration errors; label components with `'use client'` where needed.
- **CSS Purge**: Tailwind's purge settings must include all dynamic class names; otherwise, some utilities might get removed during build.

**Business Logic Issues**
- **Decimal Precision**: Financial calculations require careful handling to avoid floating-point errors; decimal.js is used for precision.
- **Formula Validation**: Ensuring percentages sum to exactly 100% requires real-time validation and user feedback.
- **Cost Calculation**: Material cost updates require recalculation of all dependent formulas and COGS data.
- **Inventory Tracking**: Manual entry of production material consumption may lead to discrepancies between expected and actual usage.

**Performance Issues**
- **Large Dataset Rendering**: Data tables with thousands of records may need virtualization or server-side pagination.
- **Real-time Updates**: Multiple users editing the same formulation could lead to conflicts; optimistic locking may be needed.
- **Database Query Optimization**: Complex COGS calculations may require optimized queries and proper indexing.

**Security Considerations**
- **Client-side Database Access**: Direct database connections from client require careful security configurations.
- **Sensitive Data Exposure**: Cost information and inventory levels should be properly protected from unauthorized access.
- **Data Validation**: All client-side inputs must be validated both client-side and server-side to prevent data corruption.

**Mitigation Strategies**
- Implement comprehensive input validation with real-time feedback.
- Use database transactions for complex operations involving multiple tables.
- Add audit logging for all financial and inventory changes.
- Implement proper error handling and user-friendly error messages.
- Consider adding data export/import functionality for backup and migration.  

---
**Document Details**
- **Project ID**: 9abf8165-5741-488d-aa70-1677e11be201
- **Document ID**: 7f97439e-6e9d-43bd-90eb-fbb9eed59aa2
- **Type**: custom
- **Custom Type**: project_requirements_document
- **Status**: completed
- **Generated On**: 2025-10-15T15:41:13.874Z
- **Last Updated**: N/A
