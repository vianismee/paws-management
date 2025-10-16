**Project Goal:**
Build a web application component for creating and managing product formulations using Next.js, TypeScript, Supabase, and Zustand.

**Core Architectural Constraint:**
The application must perform all CRUD (Create, Read, Update, Delete) operations directly on the client-side. **Do not use Next.js API routes or server-side route handlers.** All database interactions should be managed by calling the `supabase-js` library functions directly from the React components or the Zustand store.

**State Management (Zustand):**
Create a single Zustand store (`formulationStore.ts`) to handle all application state and business logic. The store should manage:
- The current formulation's data (e.g., name, list of raw materials).
- The state of each raw material (e.g., `id`, `name`, `percentage`).
- Loading and error states for asynchronous database operations.
- All CRUD functions (e.g., `fetchFormulation`, `addRawMaterial`, `updatePercentage`, `deleteRawMaterial`) that contain the Supabase client calls.

**Key Feature: Formulation Builder UI**
- The main UI should be a dynamic table where users can add/remove rows.
- Each row represents a "raw material" and should contain:
    1.  An input for the material's name.
    2.  An input for its percentage value (as a number).
    3.  A "delete" button to remove that row.
- Below the table, display the "Total Percentage" which automatically sums the percentages from all rows.
- Implement a simple validation to indicate if the total percentage exceeds 100%.

**Request:**
Please provide the code for:
1.  The Zustand store (`formulationStore.ts`).
2.  The main React component for the formulation table (`FormulationTable.tsx`).
3.  An example of how to use the component on a Next.js page (`page.tsx`).