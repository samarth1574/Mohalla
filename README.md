# Mohalla

Mohalla is a web-first hyperlocal social network for Indian neighborhoods. It combines society management, local feeds, marketplace discovery, emergency SOS, community requests, jobs, lost and found, realtime chat, PWA support, AI moderation, and a database-powered community assistant.

This is a website and progressive web app, not a native mobile app. The mobile experience is delivered through responsive web UI, installable PWA behavior, push notifications, and mobile-first navigation.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7 with PostgreSQL
- Clerk authentication
- Supabase Realtime for chat
- Firebase Cloud Messaging for push notifications
- Google Gemini for AI assistance and moderation support
- Mapbox GL JS for community heat maps

## Project Structure

```text
Mohalla/
├── docs/                    Project architecture, status, and roadmap
├── prisma/                  Database schema and migrations
├── public/                  PWA manifest, service worker, icons
├── src/
│   ├── app/                 Next.js routes, route handlers, server actions
│   │   ├── (dashboard)/     Authenticated product routes
│   │   ├── actions/         Server actions grouped by domain
│   │   └── api/             API route handlers
│   ├── components/          Shared app components and UI primitives
│   ├── lib/                 External service clients and domain utilities
│   ├── types/               Shared TypeScript contracts
│   └── proxy.ts             Clerk route protection for Next.js 16
├── package.json
└── next.config.ts
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npx tsc --noEmit
npm run build
npm run lint
```

`tsc` and production build are expected to pass. Lint currently exposes cleanup work in scaffolded UI files, mostly explicit `any`, unused imports, and unescaped JSX text.

## Documentation

- [Project Status](docs/PROJECT_STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Structure Guide](docs/STRUCTURE.md)
