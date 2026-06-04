# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`cd backend`)
```bash
npm run dev        # tsx watch — hot reload for development
npm run build      # tsc — compile to dist/
npm run start      # node dist/index.js — run compiled output
npm run test       # vitest run — run all tests once
npm run test:watch # vitest — watch mode
```

### Frontend (`cd frontend`)
```bash
npm run dev    # vite dev server
npm run build  # tsc -b && vite build
npm run lint   # eslint
```

### Docker (production / staging)
```bash
# After any code change, restart is NOT enough — rebuild:
docker compose up --build -d backend      # rebuild + restart backend only
docker compose up --build -d frontend     # rebuild + restart frontend only
docker compose up --build -d              # rebuild everything
docker compose logs -f backend            # tail backend logs
```

## Architecture

### High-level layout
```
TzsPixelsSite/
├── backend/      Express 5 + TypeScript ESM + Prisma (PostgreSQL)
├── frontend/     React 19 + Vite + TailwindCSS
├── nginx/        Reverse proxy config
└── docker-compose.yml
```

Nginx routes `/api/*` and `/webhooks/*` to `backend:5000`; everything else to `frontend:80` (SPA).

### Backend structure

**Entry:** `src/index.ts` — registers all routes, starts cron jobs, initializes DB tables.

**Routes → Services pattern:** Each route file in `src/routes/` delegates to a service. No business logic in routes.

**Key services:**

| Service | Purpose |
|---|---|
| `messaging/ConversationOrchestrator` | Central dispatcher for all incoming platform messages |
| `messaging/adapterRegistry` | Maps platform name → `MessagingAdapter` (Facebook / Instagram) |
| `chatbot/ChatbotService` | LLM-agnostic AI agent; provider switched via `LLM_PROVIDER` env var |
| `chatbot/tools.ts` | Tool declarations + handlers injected into the AI agent |
| `commerce/index.ts` | `getActiveProvider()` returns the active `CommerceProvider` |
| `fraudDetectionService` | Heuristic fraud scoring; also calls BDCourier for courier fraud |

**LLM providers** (`LLM_PROVIDER` env): `gemini` (default) | `openai` | `groq`. All share the same tool-calling interface; `ChatbotService.processMessage()` dispatches to the right method.

**Commerce providers** (`CMS` env): `shopify` | `woocommerce`. Both implement the `CommerceProvider` interface (`src/services/commerce/types.ts`). `getActiveProvider()` auto-detects if `CMS` is unset.

**Messaging adapters:** `FacebookAdapter` and `InstagramAdapter` both implement `MessagingAdapter`. Webhooks arrive at `/webhooks/facebook` (POST), parsed, then passed to `ConversationOrchestrator.handleIncomingMessage()`.

**Database:** Prisma with PostgreSQL. Client generated to `src/generated/prisma`. Run `npx prisma generate` after schema changes, `npx prisma migrate dev` for local migrations.

**Auth:** `POST /api/auth/login` validates a shared `ACCESS_TOKEN` from `.env` and returns a 7-day JWT signed with `JWT_SECRET`. All frontend API calls attach `Authorization: Bearer <token>` via an axios interceptor.

**Cron jobs** (in `index.ts`): fraud scan every 30 min, abandoned checkout scan every 30 min (Shopify only).

### Frontend structure

**Router:** `App.tsx` — all dashboard routes are wrapped in `ProtectedRoute` which redirects to `/login` if no JWT in `localStorage`.

**API layer:** `src/services/api.ts` — all axios calls live here. A global interceptor injects the auth token on every request.

**State:** Zustand stores in `src/store/` (`useUIStore` for sidebar state).

**Styling:** TailwindCSS + CSS custom properties (`tokens.css`) for theme colors (`--color-accent`, `--color-success`, `--color-danger`, etc.).

### Environment variables (backend `.env`)

| Variable | Purpose |
|---|---|
| `LLM_PROVIDER` | `gemini` / `openai` / `groq` |
| `CMS` | `shopify` / `woocommerce` |
| `ACCESS_TOKEN` | Shared secret users enter on login screen |
| `JWT_SECRET` | Signs JWTs issued after login |
| `FRONTEND_ORIGIN` | CORS allowed origin(s), comma-separated |
| `DATABASE_URL` | PostgreSQL connection string |

Frontend build-time env: `VITE_API_BASE_URL` (injected as Docker build arg, defaults to `https://scalefybd.com/api`).
