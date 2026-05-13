# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # TypeScript check + production build
npm run lint         # ESLint (warnings allowed)
npm run lint:ci      # ESLint (zero warnings — used in CI)
npm run preview      # Preview production build locally
npm run bundle:check # Check bundle size against limits
```

There is no test suite. `npm run check` is an alias for `npm run build` and is used as the type/build check.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_MAINTENANCE_MODE=false
```

## Path Alias

`@/` maps to `src/`. Use this in all imports (configured in `vite.config.js`).

## Architecture

### Data Layer: Supabase + TanStack Query

All database access goes through `src/lib/supabase.js` (a single client instance). Every domain has a dedicated hook file in `src/hooks/` that wraps Supabase queries with `useQuery`/`useMutation` from TanStack Query.

**Query key conventions** — keys are arrays: `['visits', filters]`, `['person', id]`, `['attendance', date, gradeFilters]`. Mutations call `queryClient.invalidateQueries` in `onSuccess` to keep the cache fresh.

Global QueryClient defaults (set in `main.jsx`): 5-minute `staleTime`, `refetchOnWindowFocus: false`, `retry: 1`.

### Auth

`useAuth` (Context + Provider in `src/hooks/useAuth.js`) wraps Supabase Auth. It exposes `user`, `profile`, `isAdmin`, `isProgramManager`, `loading`. The `profile` comes from the `user_profiles` table (role field determines permissions).

Route guards: `ProtectedRoute` redirects to `/login` if unauthenticated; `AdminRoute` additionally requires `isAdmin`. Maintenance mode (read from `VITE_MAINTENANCE_MODE` env + DB) blocks non-admins with a full-screen page.

### Routing

All routes are lazy-loaded via `React.lazy`. The route tree in `App.jsx` nests program routes under the `DashboardLayout` (sidebar + header + `<Outlet>`). Route structure:

- `/` — Dashboard
- `/educare` — Students, attendance, awards, health
- `/legacy` — Women's empowerment participants + attendance
- `/clinicare` — Medical visits, patient history, facilities
- `/food` — Distribution events + per-event detail + history
- `/emergency-relief` — Emergency distributions
- `/community-outreach` — Outreach events
- `/families/:id` — Cross-program family profile
- `/admin/users` — Admin-only user management
- `/reports` — Cross-program reports

### Database Schema: Key Relationships

The `people` table is the universal master record for every person (students, guardians, women, patients). Soft-delete via `deleted_at` — always filter `.is('deleted_at', null)` on `people` queries.

**`relationships` table direction**: `person_id` = guardian/parent, `related_person_id` = student (child). When querying a student's guardians, filter `WHERE related_person_id = studentId` and join via `relationships_person_id_fkey`.

**Educare FK hint**: when joining `people` from `educare_enrollment`, use the explicit FK hint `people!educare_enrollment_child_id_fkey` to avoid ambiguous join errors.

**`student_details` view** (migration 039): `id` = `educare_enrollment.id` (enrollment id), `person_id` = `people.id`. Always use `student.person_id` when passing a student to any FK that references `people` (e.g. `child_id`, `related_person_id`). Using `student.id` for React keys or local UI state is fine since enrollment ids are unique — but never send `student.id` to the database as a people reference.

**`award_recipients`**: `person_id` is canonical (post-migration 035). The `student_award_rankings` view exposes both `student_id` (enrollment id) and `person_id`.

**`food_recipients`**: `is_collected` is the canonical collected field (synced from `collected` in migration 036).

**`notification_reads`**: `(user_id, notification_key)` unique pair with RLS per user. Used by `useNotifications` to persist read state across sessions.

### Notification System

`useNotifications` (`src/hooks/useNotifications.js`) fetches live data from four sources in parallel — overdue/upcoming/undated follow-ups, recent Educare enrollments, recent Legacy enrollments, and upcoming food distributions with uncollected hampers. It merges this with per-user read state from `notification_reads`. The `Header` uses `unreadCount` to show/hide the red dot.

### UI Components

`src/components/ui/` — shadcn/ui components (Radix UI primitives + Tailwind). Do not edit these directly; they are the component library base.

`src/components/shared/` — reusable cross-program components (PageHeader, StatsCard, SortableTable, GlobalSearchDialog, NotificationsPopover, ConfirmDialog, etc.).

Feature components live under `src/components/{clinicare,educare,legacy,food,community-outreach,emergency-relief,records,family}/`.

### Toasts

Use `sonner` — import `{ toast }` from `'sonner'` and call `toast.success(...)`, `toast.error(...)`.

### Constants

Shared enums (grade levels, enrollment status, attendance status, user roles, etc.) live in `src/lib/constants.js`.

## Database Migrations

Migrations are in `supabase/migrations/` numbered sequentially (currently up to `040_`). Run them through the Supabase dashboard or CLI. Never modify existing migrations; always add a new numbered file.
