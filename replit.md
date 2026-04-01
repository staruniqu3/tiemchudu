# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Idol Merch Shop - a Vietnamese K-pop/idol fan merch ordering platform with pre-order, shipping tracking, membership, and admin features.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Wouter + TanStack Query + shadcn/ui
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (all business logic)
│   └── idol-shop/          # React + Vite frontend (PWA, mobile-first)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── products.ts
│           ├── members.ts
│           ├── orders.ts
│           ├── shipping.ts
│           └── rewards.ts
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## App Sections

1. **Shop (`/`)** - Browse and order products (pre-order/pickup), cart management
2. **Shipping (`/shipping`)** - Shipping schedule timeline with status updates
3. **Membership (`/membership`)** - Customer lookup by phone, points balance, tier, reward redemption, order history
4. **Admin (`/admin`)** - Password-protected (default: `admin123`), manages products, orders, shipping updates, members, rewards

## PWA Features

- Web app manifest at `artifacts/idol-shop/public/manifest.json`
- Apple/Android "Add to Home Screen" meta tags in `index.html`
- Mobile-first layout with bottom navigation

## Database Tables

- `products` - Merch items (name, price, category, stock, isAvailable, orderType)
- `members` - Fan members (name, phone, points, tier: bronze/silver/gold/platinum)
- `orders` - Customer orders (items JSON, status, pointsEarned)
- `shipping_updates` - Shipping timeline posts
- `rewards` - Redeemable gifts (pointsCost, stock)
- `redemptions` - Reward redemption history

## Tier System

- Bronze: 0-499 points
- Silver: 500-1999 points
- Gold: 2000-4999 points
- Platinum: 5000+ points

Points earned: 1 point per 10,000 VND spent

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- Production migrations handled by Replit. Development: `pnpm --filter @workspace/db run push`

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client + Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/idol-shop run dev` — run frontend
