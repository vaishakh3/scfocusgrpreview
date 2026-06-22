create table if not exists public.sfg_reviewers (
  id text primary key,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sfg_applicants (
  id text primary key,
  source_row integer,
  submitted_at timestamptz,
  name text not null,
  email text,
  phone text,
  branch text,
  year_level text,
  college text,
  interest_statement text,
  volunteering_experience text,
  linkedin_url text,
  data_quality_flags text[] not null default '{}'::text[],
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sfg_reviews (
  applicant_id text not null references public.sfg_applicants(id) on delete cascade,
  reviewer_id text not null references public.sfg_reviewers(id) on update cascade on delete cascade,
  decision text not null default 'pending' check (decision in ('pending', 'shortlisted', 'waitlist', 'rejected')),
  score integer check (score is null or (score between 1 and 5)),
  notes text,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (applicant_id, reviewer_id)
);

create index if not exists sfg_applicants_submitted_at_idx on public.sfg_applicants (submitted_at, id);
create index if not exists sfg_applicants_year_idx on public.sfg_applicants (year_level);
create index if not exists sfg_reviews_reviewer_decision_idx on public.sfg_reviews (reviewer_id, decision, updated_at desc);

create or replace function public.set_sfg_review_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_sfg_reviews_updated_at on public.sfg_reviews;
create trigger set_sfg_reviews_updated_at
before update on public.sfg_reviews
for each row execute function public.set_sfg_review_updated_at();

alter table public.sfg_reviewers enable row level security;
alter table public.sfg_applicants enable row level security;
alter table public.sfg_reviews enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.sfg_reviewers to service_role;
grant select, insert, update, delete on public.sfg_applicants to service_role;
grant select, insert, update, delete on public.sfg_reviews to service_role;

insert into public.sfg_reviewers (id, name, sort_order) values
  ('chapter-team', 'Chapter Team', 1),
  ('reviewer-1', 'Reviewer 1', 2),
  ('reviewer-2', 'Reviewer 2', 3),
  ('reviewer-3', 'Reviewer 3', 4)
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;
