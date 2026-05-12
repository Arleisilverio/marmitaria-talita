# AI Rules & Tech Stack

This document outlines the project's tech stack and the rules for AI assistants to follow when modifying or extending the codebase.

## Tech Stack

- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/) for fast development and bundling.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type-safe code.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) for utility-first styling.
- **Routing**: [React Router 7](https://reactrouter.com/) for client-side navigation.
- **Icons**: [Lucide React](https://lucide.dev/) for a consistent iconography set.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid UI transitions and animations.
- **Backend**: [Express](https://expressjs.com/) for server-side logic and API endpoints (running via `server.ts`).
- **AI Integration**: [Google Generative AI](https://www.npmjs.com/package/@google/genai) for AI-powered features.
- **Supabase Edge Functions**: For secure AI processing (OpenAI) and Telegram Webhooks.
- **Date Handling**: [date-fns](https://date-fns.org/) for robust date manipulation and formatting.\n- **Utilities**: `clsx` and `tailwind-merge` for clean conditional class management.

## Development Rules

### 1. Component Architecture
- **Pages**: Store all top-level route components in `src/pages/`.
- **Components**: Store reusable UI elements in `src/components/`.
- **UI Library**: Use [shadcn/ui](https://ui.shadcn.com/) components as the primary building blocks.
- **Simplicity**: Prioritize small, focused components over large, monolithic ones.

### 2. Styling Guidelines
- **Tailwind Only**: Use Tailwind CSS utility classes for all styling. Avoid custom CSS files or inline styles unless absolutely necessary.
- **Responsive Design**: Always ensure components are mobile-friendly using Tailwind's responsive prefixes (e.g., `md:`, `lg:`).
- **Consistency**: Use the established color palette and spacing scale from the Tailwind configuration.

### 3. Routing & State
- **Centralized Routes**: Keep all route definitions in `src/App.tsx`.
- **Navigation**: Use the `Link` and `useNavigate` hooks from `react-router-dom` for internal navigation.
- **State Management**: Use React's built-in `useState` and `useContext` for state management. Avoid introducing heavy state libraries (like Redux) unless the complexity justifies it.\n\n### 4. Code Quality
- **TypeScript**: Always provide proper types for props, state, and function parameters. Avoid using `any`.
- **Icons**: Always use `lucide-react` for icons.
- **Clean Code**: Follow the principle of \"minimum complexity.\" Don't over-engineer solutions or add abstractions for one-time use cases.
- **API Calls**: Centralize API logic in `src/lib/api.ts` or similar utility files.

### 5. Interaction
- **Logs**: When debugging, use `console.log` and ask the user to trigger the relevant action in the preview to see the output.
- **Feedback**: If a request is ambiguous, use the `planning_questionnaire` to clarify requirements before implementation.
