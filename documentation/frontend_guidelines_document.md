# Frontend Guideline Document for paws-management

This document outlines the frontend architecture, design principles, and technologies used in the paws-management project. It is written in everyday language to ensure clarity for anyone joining the team.

## 1. Frontend Architecture

### Frameworks and Libraries
- **Next.js (App Router)**: Provides file-based routing, server-side rendering (SSR), and static site generation (SSG) in one framework. It handles both page rendering and API routes.
- **TypeScript**: Adds type safety on top of JavaScript, catching errors early and making the code easier to navigate.
- **Tailwind CSS**: Offers a utility-first approach to styling, speeding up development with pre-built classes.
- **shadcn/ui**: A set of accessible, ready-to-use React components built on Radix UI and styled with Tailwind.
- **next-themes**: Manages light/dark mode toggling with CSS variables and a simple API.

### Scalability, Maintainability, and Performance
- **Modular Routing**: The App Router lets us split pages and layouts into folders under `/app`. Each route is self-contained, making it easy to add or remove features.
- **Component-Based Structure**: Reusable UI pieces (buttons, inputs, cards) live in `/components/ui`. This keeps styling consistent and reduces duplicate code.
- **Type Safety**: TypeScript and Drizzle ORM ensure that database queries and component props match expected shapes.
- **Fast Builds and HMR**: Next.js’s built-in hot module replacement (HMR) and Tailwind’s JIT engine make local development snappy.
- **Lightweight CSS**: Tailwind’s tree-shaking strips out unused styles, keeping bundles small.

## 2. Design Principles

### Usability
- **Clear Feedback**: Buttons show hover and active states. Forms display validation errors inline.
- **Intuitive Layout**: Common actions (sign-in, sign-up, navigating the dashboard) follow predictable patterns.

### Accessibility
- **Keyboard Navigation**: All interactive elements (buttons, links, form fields) are reachable via Tab and have visible focus outlines.
- **ARIA Attributes**: shadcn/ui components include ARIA labels and roles by default.
- **Contrast**: Color choices meet WCAG AA standards for text on backgrounds.

### Responsiveness
- **Mobile-First**: Layouts start with a single-column design and scale up to multi-column on larger screens.
- **Fluid Grids and Flexbox**: Tailwind’s utility classes (`flex`, `grid`, `gap-4`) create adaptable layouts.
- **Breakpoint Consistency**: We use Tailwind’s default breakpoints (sm, md, lg, xl) for all responsive rules.

## 3. Styling and Theming

### Styling Approach
- **Utility-First CSS**: Tailwind classes (e.g., `bg-white`, `text-gray-800`, `p-4`) compose most styles.
- **Component Styling**: shadcn/ui components are styled with Tailwind variants and can be extended via the `cn()` helper for class merging.
- **Custom CSS**: Any project-wide overrides or global styles go into `globals.css`.

### Theming
- **Dark/Light Mode**: Managed by next-themes. We define CSS variables in `:root` and `[data-theme='dark']`.
- **Theme Toggle**: A `ThemeToggle` component switches themes by reading and setting the user’s preference.

### Visual Style
- **Overall Style**: Modern flat design with subtle depth (soft shadows, rounded corners, clean lines).
- **Glassmorphism**: Used sparingly for modals or overlay cards (backdrop blur and semi-transparent backgrounds).

### Color Palette
- **Primary**: Indigo 600 (#4F46E5)
- **Secondary**: Slate 500 (#64748B)
- **Accent**: Emerald 500 (#10B981)
- **Background Light**: Gray 50 (#F9FAFB)
- **Background Dark**: Gray 900 (#111827)
- **Text Dark**: Gray 800 (#1F2937)
- **Text Light**: Gray 200 (#E5E7EB)

### Typography
- **Font Family**: Inter (system fallbacks: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Font Weights**: Regular (400), Medium (500), Bold (700)

## 4. Component Structure

### Organization
- `/components/ui`: Core building blocks (Button, Input, Card, etc.) from shadcn/ui.
- `/components`: App-specific pieces (AppSidebar, AuthButtons, ThemeToggle).

### Reuse and Consistency
- **Atomic Design**: Small, focused components are composed into larger features.
- **Props and Slots**: Components accept well-defined props for text, icons, or children, ensuring consistency.

### Benefits of Component-Based Architecture
- **Maintainability**: Fixing a bug or changing a style in one component updates every place it’s used.
- **Clarity**: Each component has a single responsibility, making it easier to understand and test.

## 5. State Management

### Approach
- **Local Component State**: React’s `useState` for form inputs and UI toggles.
- **Session State**: Better Auth handles authentication state; server components check cookies and session data.
- **Context API (Optional)**: For cross-cutting concerns like theme or user profile data, React Context can be introduced if needed.

### Data Flow
1. User actions update local state (form fields, toggles).
2. Auth client functions send requests to API routes.
3. Server updates session and responds with new state.
4. Components re-render based on updated props or server data.

## 6. Routing and Navigation

### Routing
- **File-Based Routing**: The `/app` folder defines routes:
  - `/app/sign-in` and `/app/sign-up` for authentication.
  - `/app/dashboard` for the protected dashboard.
  - `/app/api/auth/[...all]/route.ts` for all auth API calls.
- **Nested Layouts**: Root `layout.tsx` wraps every page with theme and header; dashboard layout adds sidebar and top bar.

### Navigation
- **Next.js `Link`**: Used for client-side transitions between pages.
- **Sidebar**: Highlights the current route and adapts to mobile screens (collapsible).
- **Redirects**: Unauthenticated users are sent to `/sign-in`; authenticated users landing on `/sign-in` get sent to `/dashboard`.

## 7. Performance Optimization

- **Automatic Code Splitting**: Next.js loads only the code needed for each page.
- **Lazy Loading**: Heavy components or charts can be loaded with `next/dynamic`.
- **Image Optimization**: Next.js Image component (`<Image>`) serves compressed and responsive images.
- **Tailwind JIT**: Generates only the CSS classes in use, reducing bundle size.
- **Caching**: Use HTTP caching headers for static assets and ISR (Incremental Static Regeneration) for data that changes infrequently.

## 8. Testing and Quality Assurance

### Testing Strategies
- **Unit Tests**: Jest + React Testing Library for components and utility functions.
- **Integration Tests**: Test interactions between API routes and the database (using a test database).
- **End-to-End Tests**: Cypress or Playwright for user flows (sign-in, dashboard navigation).

### Tools and Practices
- **ESLint**: Enforces code style and catches common errors.
- **Prettier**: Formats code consistently.
- **Type Checking**: `tsc --noEmit` as part of CI to ensure type safety.
- **Pull Request Reviews**: Checklist for accessibility, performance, and security.

## 9. Conclusion and Overall Frontend Summary

The paws-management frontend is built on a solid, modern stack designed for speed, clarity, and a great developer experience. By combining Next.js, TypeScript, Tailwind CSS, and shadcn/ui, we get a scalable architecture that’s easy to maintain. Our design principles—usability, accessibility, and responsiveness—ensure a polished user experience across devices. Clear component structure, coupled with type safety and robust theming, keeps the codebase consistent and predictable. Finally, our performance optimizations and testing strategies guarantee reliability and fast load times.

Together, these guidelines provide a roadmap for anyone working on the frontend: how to add new features, maintain consistency, and deliver an outstanding application aligned with the goals of paws-management.