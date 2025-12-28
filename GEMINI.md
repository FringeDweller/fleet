# GEMINI.md - Fleet Management System

## Project Overview

**Fleet** is a comprehensive enterprise platform designed to optimize asset lifecycle management, streamline maintenance operations, and maximize fleet efficiency. It is built using a modern full-stack TypeScript architecture.

### Main Technologies
- **Meta-Framework:** [Nuxt 4](https://nuxt.com/) (running in compatibility mode)
- **Frontend:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`), [Nuxt UI v4](https://ui.nuxt.com/), [Pinia](https://pinia.vuejs.org/)
- **Backend:** [Nitro](https://nitro.unjs.io/) (Nuxt's server engine), [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via `postgres.js`)
- **Cache & Queues:** [Redis](https://redis.io/), [BullMQ](https://docs.bullmq.io/)
- **Mobile & PWA:** [Capacitor](https://capacitorjs.com/) (Android/iOS), [Vite PWA](https://vite-pwa-org.netlify.app/frameworks/nuxt.html)
- **Runtime:** [Bun](https://bun.sh/)
- **Linting & Formatting:** [Biome](https://biomejs.dev/)

### Key Architectural Patterns
- **Full-Stack TypeScript:** Shared types between frontend and backend.
- **Offline-First Mobile Operations:** Uses `IndexedDB` for local storage and a sync queue with **Hybrid Logical Clocks (HLC)** for conflict resolution.
- **API-First:** Server API routes in `server/api/` using Nitro.
- **Modular Services:** Backend logic organized into services in `server/services/`.
- **Drizzle ORM:** Type-safe database schema and migrations.

## Building and Running

### Development
```bash
# Install dependencies
bun install

# Start development server
bun dev
```

### Database Operations
```bash
# Generate migrations from schema
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Seed the database
bun run db:seed

# Open Drizzle Studio
bun run db:studio
```

### Mobile Development (Capacitor)
```bash
# Sync web build to native projects
bun run cap:sync

# Run on Android
bun run cap:run:android

# Run on iOS
bun run cap:run:ios
```

### Quality Gates
```bash
# Lint and check code
bun run lint

# Fix linting issues
bun run lint:fix

# Type check
bun run typecheck

# Run unit tests
bun run test

# Run E2E tests (requires dev server running)
bun run test:e2e

# Install Playwright browsers (if needed)
npx playwright install
```

## Development Conventions

- **Code Style:** Strictly enforced by **Biome**. Follow the established rules in `biome.json`.
- **SSR:** Disabled (`ssr: false` in `nuxt.config.ts`) as this is a SPA/PWA dashboard.
- **Components:** Use [Nuxt UI v4](https://ui.nuxt.com/) components. Custom components should be placed in `app/components/`.
- **Composables:** Logic reuse via the `use*` pattern in `app/composables/`.
- **Server API:** Nitro routes in `server/api/`. Use the `defineEventHandler` pattern.
- **Service Layer:** Business logic belongs in `server/services/`.
- **Database Schema:** Define tables in `server/database/schema/*.ts`.
- **Testing:**
    - **Unit Tests:** Vitest (configured in `package.json` and `.nuxt/test-utils`).
    - **E2E Tests:** Playwright (inferred).

## Key Directories
- `app/`: Frontend application code (Nuxt 4 structure).
- `server/api/`: Backend API routes.
- `server/database/schema/`: Drizzle ORM table definitions.
- `server/services/`: Backend business logic services.
- `server/utils/`: Server-side utility functions (db, redis, hlc).
- `android/` & `ios/`: Native mobile platform projects.
