# Software Focus Group Review Dashboard

Review dashboard for IEEE Sensors Council Kerala Chapter Software Focus Group applicants.

## What It Does

- Loads applicant data from Supabase through server-side Next.js API routes
- Falls back to anonymized sample data when Supabase env vars are not set
- Lets reviewers filter applicants, shortlist, waitlist, reject, score, and add notes
- Keeps the real student data out of the GitHub repo

## Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase env vars, the app runs in sample mode and saves sample reviews in browser local storage.

For local review with real names before Supabase is configured, place normalized private data at:

```text
private/applicants.json
```

That folder is gitignored so student data does not get pushed.

## Supabase Setup

Run `supabase/schema.sql` in the Supabase SQL editor, then run the private seed SQL generated from the form CSV.

Required Vercel env vars:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The dashboard never exposes the Supabase service role key to the browser. All reads and writes go through `/api/bootstrap` and `/api/reviews`.

If the Supabase project has explicit Data API exposure enabled, expose `sfg_reviewers`, `sfg_applicants`, and `sfg_reviews` in Project Settings -> Data API after running the SQL.
