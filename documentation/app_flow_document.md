# App Flow Document

# Paws-Management App Flow Document

## Onboarding and Sign-In/Sign-Up
When a new visitor arrives at the application's root URL, the system checks whether they have an active session. If they do not, the visitor is automatically shown the sign-in page. From there, the visitor has the option to switch to the sign-up page by clicking the link labeled "Create an account." On the sign-up page, the user enters an email address, a password, and then confirms the password. When they submit the form, the client code calls the `/api/auth` endpoint, which uses Better Auth and Drizzle ORM to create a new user in the PostgreSQL database. Upon successful account creation, the user is redirected to the dashboard.

Existing users can go straight to the sign-in page where they enter their email and password. The form submission again routes to `/api/auth`, and if the credentials match a record in the database, the user is granted a session and taken to the dashboard. If a user ever wants to sign out, they click the "Sign Out" button in the application header, which calls the sign-out API and returns them to the sign-in page.

## Main Dashboard and Business Overview
Once authenticated, users land on a comprehensive dashboard designed for production management. The dashboard features a sidebar navigation organized into business functions:

**PAW System Section** (Primary Business Operations):
- **Raw Materials** - View and manage ingredient inventory
- **Packaging** - Track containers, bottles, and packaging supplies
- **Labels** - Manage product labels and printing costs
- **Formulas** - Create and manage product formulations
- **COGS Analysis** - Review cost calculations and pricing

The main dashboard displays key business metrics including inventory levels, recent production batches, and cost analysis summaries. All data operations are performed client-side for optimal performance, with direct database calls through Drizzle ORM.

## Detailed Business Feature Flows

### Inventory Management Workflows

**Raw Materials Management:**
1. User navigates to `/dashboard/inventory/materials` via the sidebar
2. The page loads with a sortable, filterable data table showing all materials
3. Each material displays: auto-generated code (e.g., "OIL-001"), name, category, supplier, current stock, cost per unit, and reorder point
4. User can add new materials through a form that automatically generates codes based on category prefixes
5. Stock levels are color-coded: green (healthy), yellow (low), red (critical)
6. When stock falls below reorder point, the system highlights the material for reordering

**Packaging and Labels Management:**
1. Similar workflow to materials but with packaging-specific fields (size, type, material)
2. Tracks packaging costs per unit and allocates them to product costs
3. Label management includes printing costs and quantity tracking

### Formulation Management Workflow

**Creating New Formulas:**
1. User navigates to `/dashboard/formulas` and clicks "Create New Formula"
2. A drag-and-drop interface allows adding ingredients from the materials database
3. User sets percentages for each ingredient with real-time validation that totals must equal 100%
4. The system automatically calculates ingredient weights based on total batch size
5. Material costs are automatically pulled to calculate formula cost per unit
6. User can save formula as draft or active, with automatic version control

**Formula Version Control:**
1. When modifying existing formulas, the system creates a new version
2. All versions are accessible with change history and reasons for modifications
3. Production batches are linked to specific formula versions for traceability

### COGS Analysis Workflow

**Real-Time Cost Calculation:**
1. When material costs are updated, all dependent formulas automatically recalculate
2. The COGS page shows cost breakdowns: materials, packaging, labels, labor, overhead
3. Users can set pricing rules (percentage markup, target margins, fixed prices)
4. The system calculates selling prices and profit margins
5. Interactive charts show cost trends and margin analysis

### Production Tracking Workflow

**Creating Production Batches:**
1. User selects a formula and creates a new production batch
2. System generates unique batch numbers and calculates required material quantities
3. User records actual material consumption and any variances
4. The system calculates actual vs. planned costs for variance analysis
5. Production history is maintained for quality control and cost tracking

### Data Operations and Performance

**Client-Side Database Operations:**
All CRUD operations are performed directly from the client using database connections:
1. Form submissions directly call database functions via Drizzle ORM
2. Real-time validation provides immediate feedback
3. Data tables update instantly without page refreshes
4. Complex calculations (COGS, pricing) happen client-side for responsive experience
5. All operations maintain data integrity through proper database transactions

**Navigation and User Experience:**
1. Sidebar navigation provides quick access to all business functions
2. Breadcrumb navigation shows current location within the application
3. Search and filtering capabilities allow finding specific materials, formulas, or batches
4. Theme toggle persists user preference across sessions
5. Responsive design ensures functionality on tablets and mobile devices

## Settings and Account Management
Users manage their account mainly through the authentication system and the theme toggle. The application header always offers the toggle for dark or light mode, with preference persistence across sessions. Business settings are integrated into the relevant workflows:

- Material categories and code prefixes are managed within the materials section
- Pricing rules and cost allocations are configured in the COGS analysis section
- Production settings are handled within the formulation management interface

## Error States and Data Validation

**Authentication Errors:**
- Incorrect email/password during sign-in displays specific error messages
- Duplicate email detection during sign-up with clear guidance
- Network timeouts with retry options and user-friendly messaging

**Business Logic Validation:**
- Form formulation validation ensures percentages sum to exactly 100%
- Material cost validation prevents negative values and ensures proper decimal formatting
- Inventory level validation prevents stock levels below zero
- Production batch validation ensures material availability before batch creation

**Data Integrity Errors:**
- Database transaction failures trigger automatic rollbacks with user notification
- Concurrent editing detection warns users when multiple users modify the same record
- Calculation errors in COGS are caught and displayed with specific error details

**System Errors:**
- Database connection issues display service availability status with retry functionality
- Client-side operation failures provide clear error messages and recovery options
- Import/export failures show specific data format requirements and validation errors

## Business User Journey Summary

A typical business user journey demonstrates the comprehensive production management capabilities:

1. **Initial Setup**: User signs up and lands on the dashboard overview showing business metrics
2. **Inventory Configuration**: User sets up material categories, suppliers, and initial inventory levels
3. **Formulation Development**: User creates product formulations using drag-and-drop interface with real-time cost calculations
4. **Production Planning**: User creates production batches with automatic material requirement calculations
5. **Cost Analysis**: User reviews COGS breakdowns and sets pricing rules for profitability
6. **Ongoing Operations**: User continuously updates material costs, monitors inventory levels, and tracks production efficiency

The application provides a complete business workflow from raw material procurement through production to cost analysis and pricing decisions. All operations are optimized for performance with client-side database interactions and real-time calculations, ensuring business users can make informed decisions quickly and accurately.

---
**Document Details**
- **Project ID**: 9abf8165-5741-488d-aa70-1677e11be201
- **Document ID**: 809bc341-e448-4e26-84df-0aa4dd2b77a8
- **Type**: custom
- **Custom Type**: app_flow_document
- **Status**: completed
- **Generated On**: 2025-10-15T15:42:12.946Z
- **Last Updated**: N/A
