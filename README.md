# MyGreenPlus Admin Dashboard

An operations dashboard for the MyGreenPlus recycling rewards app — manage
users, drop-offs, RVM machines, rewards, problem reports, and certificates.

Built with Next.js 14 (App Router) + Supabase + Tailwind CSS.

## 1. Run the database migration

Before running the dashboard, open your Supabase project → **SQL Editor** and
run `sql/001_admin_dashboard.sql`. This adds:

- an `is_admin` flag on `app_users`
- a `problem_reports` table (for the app's "Report Issue" flow)
- a `certificates` table (for admin-issued certificates)
- row-level security policies so admin accounts can read/write across tables

It's safe to re-run — every statement is idempotent.

After running it, promote your own account to admin:

```sql
update app_users set is_admin = true
where auth_id = (select id from auth.users where email = 'you@example.com');
```

## 2. Local setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with your Supabase project URL and anon key
(Supabase Dashboard → Project Settings → API).

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`. Sign in
with the Supabase account you marked as admin above.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project**, import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add environment variables (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.

No other config is needed — the project uses the standard Next.js App
Router build output, which Vercel supports natively.

## What's in each section

| Page                  | What it does                                                              |
|------------------------|----------------------------------------------------------------------------|
| **Overview**           | Stat cards (users, kg recycled, points in circulation, open reports) plus RVM status and recent drop-offs. |
| **Users**              | Search users, manually adjust eco points (+50/−50), promote/demote admins. |
| **Drop-offs & RVMs**   | RVM machine status grid + searchable, paginated drop-off history.         |
| **Rewards & Claims**   | Add new rewards, toggle active/out-of-stock, view all reward claims with voucher codes. |
| **Problem Reports**    | Filter by status, open a report to read details, set status, and leave internal admin notes. |
| **Certificates**       | Issue a certificate to any user, view all issued certificates, delete if needed. |

## Notes

- Admin login reuses the same Supabase Auth used by the Flutter app — no
  separate password system. Access is controlled purely by the `is_admin`
  flag on `app_users`.
- All data mutations go through Next.js Server Actions, which run
  server-side with the signed-in admin's session — RLS policies still apply,
  so only accounts with `is_admin = true` can write to these tables.
- The "Adjust points" buttons on the Users page are a quick manual override;
  they don't recompute `total_kg` or affect drop-off history.
- The Drop-offs search assumes the foreign key column in `drop_off_history`
  pointing to `rvm_machines` is named `rvm_id` (it's never named explicitly
  in the Flutter app's service file, since PostgREST auto-detects it for
  embedding). If your actual column has a different name, update the
  `rvm_id.in.(...)` filter in `app/dashboard/dropoffs/page.tsx` to match.
