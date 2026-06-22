# Project Status

## Implemented

### Core App Shell

- Next.js 16 App Router website.
- Clerk authentication with protected dashboard routes through `src/proxy.ts`.
- Responsive dashboard route group with desktop navigation and mobile-oriented screens.
- Light/dark theme provider.
- Public landing page and authenticated dashboard pages.

### Database

- Prisma schema covers first-class users, locations, societies, posts, comments, polls, marketplace listings, events, groups, chat, notifications, reports, blocks, mutes, saved content, recently viewed content, community requests, lost and found, jobs, emergency SOS, businesses, services, trust badges, and moderation status.
- Prisma 7 is wired through the official Postgres adapter.

### Society Management

- Society model exists as a first-class entity.
- Society members, admins, announcements, verification requests, posts, events, and chat group relations exist in schema.
- `/societies` route and server actions exist for the first UI slice.

### Community Requests

- Dedicated `CommunityRequest` and `RequestComment` models.
- `/requests` route exists.
- Request actions and client UI exist.

### Lost & Found

- Dedicated `LostAndFound` model.
- `/lost-found` route exists.
- Client UI exists for listing and status workflows.

### Jobs Board

- `JobListing` and `JobApplication` models exist.
- `/jobs` route exists.
- Jobs client UI exists with category filters, posting, applying, and employer applicant preview.
- `/jobs/[id]` route exists for job detail, local metadata, application submission, and employer applicant review.

### Emergency SOS

- Emergency SOS schema and dashboard route exist.
- Volunteer and update relations exist.
- Emergency push notification hooks are wired through FCM helpers.

### Marketplace

- Marketplace listing schema exists with status, category, media, moderation status, saved items, and seller relation.
- Marketplace route and actions exist.
- AI scam/moderation hooks exist at the action layer.

### Messaging

- Chat groups, members, and messages are modeled.
- `/messages` route exists.
- Server action validates membership and writes messages.
- API route fetches the newest 50 messages in chat order.
- Supabase Realtime client subscribes to active chat threads and supports optimistic sends.

### PWA

- Web manifest exists.
- Required PWA PNG icons exist.
- Service worker registers from the root scope.
- App shell caching excludes missing paths.
- Push and notification click handlers exist.
- Install banner exists.

### Push Notifications

- Firebase Admin helper exists for multicast and single notifications.
- FCM token save API exists.
- PWA register component can request and store FCM tokens.
- Emergency alerts can broadcast to nearby users.
- `/notifications` route exists for in-app notification review and mark-read workflows.

### AI

- Intent classifier exists for business, service, event, society, and general questions.
- AI action queries database context before calling Gemini.
- Local fallback exists when Gemini is unavailable.

### Saved And Recently Viewed

- `/saved` route exists for saved posts, marketplace listings, events, businesses, and services.
- Recently viewed marketplace, business, and service records are tracked by server action.
- Marketplace interactions can record recently viewed items.

### Moderator And Analytics

- Admin dashboard route exists.
- Report queue and content moderation actions exist.
- DAU, MAU, 7-day post activity, content summary, and AI audit log are computed server-side.

## Needs Implementation Or Completion

- Society workflows need deeper UI: admin assignment, member management, verification review, announcement composer, society-only feed filters, society events, and society chat entry points.
- Requests need filters, detail pages, richer discussions, and resolved-state UX.
- Lost and found needs image upload, detail pages, nearby alert notifications, and mark-found/claim workflows.
- Jobs needs stronger employer management, edit/delete flows, and richer location/category filters.
- Heat map needs a true Mapbox density layer. Current UI is closer to marker visualization/fallback than the signature heatmap experience.
- Saved items need more entry points across feed/events/business/service cards.
- Recently viewed needs dedicated listing/business/service detail pages to call the tracking hook consistently.
- AI scam detection should become a reusable moderation service with confidence, reasons, and audit persistence.
- AI assistant should improve prompt quality, streaming UX, and source/context display while staying database-powered.
- Business feeds need business profile pages and owner post composer.
- Notifications need user preferences, mention triggers, event reminders, and richer deep links.
- Trust system needs scoring rules, badge assignment flows, verification UI, and visibility effects.
- Analytics needs event participation, marketplace activity, message volume, SOS resolution rate, growth charts, and exportable audit logs.
- Safety tools need user-facing block/mute/report flows across all content surfaces.
- Mobile-first UX needs stronger bottom navigation, slide-over creation flows, keyboard-safe chat input, and polished empty/loading states.
- Lint cleanup remains across scaffolded UI files.

## Current Verification

- Previous verification passed before this easiest-first feature pass.
- During this pass, `tsc`, `next build`, `next dev`, and targeted ESLint all stalled before producing diagnostics. This appears to be a local toolchain/runtime startup issue rather than a reported source error, but the new files still need a successful verification run.
- Remaining known cleanup debt includes explicit `any`, unused imports, unescaped JSX text, and a few React hook hygiene warnings in scaffolded client components.
