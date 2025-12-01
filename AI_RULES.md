# AI Development Rules

This document outlines the rules and conventions for AI-driven development of this application. Following these guidelines ensures consistency, maintainability, and adherence to the project's architecture.

## Tech Stack Overview

This project is built with a modern, type-safe, and component-based architecture. Key technologies include:

*   **Framework**: React (with Vite for a fast development experience).
*   **Language**: TypeScript for static typing and improved code quality.
*   **UI Library**: shadcn/ui, providing accessible and beautifully designed components built on Radix UI.
*   **Styling**: Tailwind CSS for a utility-first styling approach.
*   **Backend & Database**: Supabase for authentication, database (PostgreSQL), and storage.
*   **Routing**: React Router for all client-side navigation.
*   **Data Fetching**: TanStack Query for managing server state, caching, and data synchronization.
*   **Forms**: React Hook Form and Zod for robust and type-safe form handling.
*   **Icons**: Lucide React for a consistent and clean icon set.

## Library Usage and Conventions

To maintain a clean and predictable codebase, adhere to the following rules for using specific libraries.

### 1. UI and Components

*   **Primary Library**: **ALWAYS** use components from `shadcn/ui` (located in `@/components/ui/*`) for all UI elements like buttons, cards, inputs, dialogs, etc.
*   **Custom Components**: If a required component is not available in `shadcn/ui`, create a new custom component in the `@/components/` directory. Style it using Tailwind CSS.
*   **Prohibition**: **DO NOT** install or use other UI component libraries (e.g., Material-UI, Ant Design, Chakra UI).

### 2. Styling

*   **Method**: Use Tailwind CSS utility classes directly in your JSX for all styling.
*   **Custom CSS**: Avoid writing custom CSS files. Global styles are defined in `src/index.css` and should only be modified for base styles and theme variables.
*   **Consistency**: Adhere to the design system defined in `tailwind.config.ts` and `src/index.css` (colors, spacing, fonts, etc.).

### 3. Backend and Data

*   **Backend Service**: All backend operations (database, auth, storage) **MUST** go through the Supabase client (`@/integrations/supabase/client.ts`).
*   **Server State**: Use TanStack Query (`useQuery`, `useMutation`) for all asynchronous operations that involve fetching or mutating data from Supabase. This handles caching, re-fetching, and loading/error states.
*   **Client State**:
    *   For local component state, use React's `useState` and `useReducer` hooks.
    *   For global client-side state (e.g., shopping cart, theme), use React Context, following the pattern in `@/hooks/useCart.tsx`. Do not introduce libraries like Redux or Zustand.

### 4. Routing

*   **Library**: Use `react-router-dom` for all page navigation.
*   **Configuration**: All application routes are centralized in `src/App.tsx`. Add new page routes here.
*   **Navigation**: Use the `<Link>` component for declarative navigation and the `useNavigate` hook for programmatic navigation.

### 5. Forms

*   **Form Management**: Use `react-hook-form` for handling form state, submission, and validation.
*   **Validation**: Use `zod` to define validation schemas and connect them to `react-hook-form` via `@hookform/resolvers/zod`.

### 6. Icons

*   **Icon Set**: **ONLY** use icons from the `lucide-react` package. This ensures visual consistency across the application.

### 7. Notifications

*   **Standard Toasts**: Use the custom `useToast` hook (`@/hooks/use-toast.ts`) for standard, non-intrusive notifications that follow the `shadcn/ui` style.
*   **Modern Toasts**: For more dynamic notifications (e.g., promises, rich content), use the `sonner` library, which is also integrated.