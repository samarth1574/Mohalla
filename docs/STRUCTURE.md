# Structure Guide

## Current Structure

```text
src/app
├── (dashboard)              Authenticated product area
│   ├── admin                Moderator dashboard and analytics
│   ├── emergency            Emergency SOS workflow
│   ├── feed                 Neighborhood feed
│   ├── heatmap              Community map
│   ├── jobs                 Local jobs board
│   ├── lost-found           Lost and found board
│   ├── marketplace          Hyperlocal marketplace
│   ├── messages             Realtime chat center
│   ├── requests             Community requests
│   └── societies            Society management
├── actions                  Server actions by domain
├── api                      Route handlers for webhooks, FCM, and messages
├── onboarding               First-run profile and location setup
├── sign-in / sign-up        Clerk auth pages
├── layout.tsx               Root providers and PWA shell
└── page.tsx                 Public landing page
```

## Conventions

- Keep route-specific UI next to its route, for example `src/app/(dashboard)/messages/messaging-client.tsx`.
- Keep shared UI primitives in `src/components/ui`.
- Keep cross-route components in `src/components`.
- Keep service clients and reusable domain helpers in `src/lib`.
- Keep shared data contracts in `src/types`.
- Keep database models and migrations in `prisma`.
- Keep generated assets, build output, local editor config, and duplicate starter apps out of the repository.

## Recommended Next Refactor

As features mature, move domain logic toward a feature-module structure without changing routes:

```text
src/features/
├── societies/
│   ├── actions.ts
│   ├── queries.ts
│   └── types.ts
├── messaging/
├── marketplace/
├── emergency/
├── requests/
├── jobs/
├── lost-found/
├── heatmap/
├── moderation/
└── ai/
```

The current route structure is valid for Next.js. A feature-module refactor should be done gradually after lint and UI behavior are stable.
