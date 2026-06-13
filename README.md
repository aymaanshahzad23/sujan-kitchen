# SUJÁN Kitchen Dashboard

Vite + React + TypeScript kitchen operations dashboard backed by Supabase.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```

3. **Run database migrations** — in the Supabase SQL editor, run in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_enable_realtime.sql`
   - `supabase/migrations/003_dish_cost_price.sql`
   - `supabase/migrations/004_guest_identity_kot_tent.sql`
   - `supabase/migrations/005_guest_status_vocabulary.sql`

4. **Seed data:**
   ```bash
   npm run db:apply   # pushes demo data to Supabase (uses .env.local)
   # or: npm run db:seed && paste supabase/seed.sql in SQL editor
   ```

5. **Start dev server:**
   ```bash
   npm install
   npm run dev
   ```

## Project Structure

```
src/
├── components/     StatCard, PBar
├── context/        AppContext (data provider)
├── hooks/          Supabase CRUD hooks per entity
├── tabs/           UI tabs (KOT, Analysis, Food Cost, Staff, etc.)
├── utils/          BCG helpers, leave logic, CSV export
├── data/           Seed data constants + UUID mappers
└── lib/            Supabase client, row mappers
supabase/
├── migrations/     Postgres schema
└── seed.sql        Initial data (dishes, staff, ingredients, sample KOTs)
docs/
└── PHASE2_AUTH.md  Auth & RLS hardening plan
```

## Deploy on Netlify

1. Push this repo to GitHub and connect it in [Netlify](https://app.netlify.com).
2. Build settings are in `netlify.toml` (`npm run build` → `dist`).
3. Add environment variables in Netlify → **Site settings → Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Redeploy after adding env vars.

## Phase 1 Security Note

All tables use permissive RLS for development. See [docs/PHASE2_AUTH.md](docs/PHASE2_AUTH.md) before production deployment.

## Original Reference

The single-file prototype remains at `../sujan-dashboard.html` for reference.
