# CLAUDE.md - Guidelines for Agentic Coding

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines

### General
- This is a Next.js 15 project with React 19 and Tailwind CSS
- Uses App Router structure (src/app directory)
- Follow ESLint rules from "next/core-web-vitals"

### Imports
- Use absolute imports with `@/` alias for src directory
- Group imports: React/Next, then external libraries, then internal components/utils

### Components
- Use functional components with default exports
- Prefer explicit props destructuring
- Use Geist Sans and Geist Mono fonts

### Styling
- Use Tailwind CSS for styling
- Reference `globals.css` for theme variables and color scheme
- Follow mobile-first responsive design with Tailwind breakpoints (sm, md, lg)

### JavaScript/TypeScript
- Use modern JavaScript features (ES6+)
- Add appropriate prop types or TypeScript types
- Handle promises with async/await

### Error Handling
- Use try/catch blocks for error handling
- Provide meaningful error messages
- Implement fallbacks for potential failures