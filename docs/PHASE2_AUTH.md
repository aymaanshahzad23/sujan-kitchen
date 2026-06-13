# Phase 2 — Authentication & Security

Phase 1 uses permissive RLS policies (`USING (true)`) on all tables. **Do not deploy to production** until Phase 2 is complete.

## Planned Schema Addition

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  camp_id text REFERENCES camps(id),
  role text NOT NULL CHECK (role IN ('chef', 'sous_chef', 'admin', 'hq')),
  display_name text,
  created_at timestamptz DEFAULT now()
);
```

## Role Model

| Role | Access |
|------|--------|
| `chef` / `sous_chef` | Single camp — read/write own camp data |
| `admin` | Single camp — full camp management |
| `hq` | All camps — read/write across JAWAI, Sherbagh, The Serai |

Kitchen `staff` records remain separate from auth users. Staff are HR records; `profiles` are login accounts.

## RLS Policy Pattern (Phase 2)

Replace dev policies with camp-scoped rules:

```sql
-- Example for dishes
CREATE POLICY "camp_read_dishes" ON dishes FOR SELECT
  USING (
    camp_id = (SELECT camp_id FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'hq'
  );
```

## Frontend Changes

1. Add `src/pages/Login.tsx` using `supabase.auth.signInWithPassword`
2. Wrap `App` in auth guard — redirect unauthenticated users to login
3. Store `camp_id` and `role` from `profiles` in React context
4. Default camp tab to user's `camp_id` (HQ sees all camps)
5. Remove anon permissive policies from production Supabase project

## Environment

No additional env vars needed — Supabase Auth uses the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Migration Checklist

- [ ] Enable Supabase Auth (email/password or SSO)
- [ ] Create `profiles` table + trigger on `auth.users` insert
- [ ] Replace all `dev_all_*` RLS policies with camp-scoped policies
- [ ] Add login screen and session persistence
- [ ] Test cross-camp isolation (JAWAI user cannot read Sherbagh KOTs)
- [ ] HQ user can switch camps and export all reports
