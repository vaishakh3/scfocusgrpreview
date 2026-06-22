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
  assigned_reviewer_id text references public.sfg_reviewers(id) on update cascade on delete set null,
  data_quality_flags text[] not null default '{}'::text[],
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sfg_reviews (
  applicant_id text not null references public.sfg_applicants(id) on delete cascade,
  reviewer_id text not null references public.sfg_reviewers(id) on update cascade on delete cascade,
  decision text not null default 'pending' check (decision in ('pending', 'shortlisted', 'waitlist', 'rejected')),
  score integer check (score is null or (score between 1 and 5)),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (applicant_id, reviewer_id)
);

alter table public.sfg_applicants
  add column if not exists assigned_reviewer_id text references public.sfg_reviewers(id) on update cascade on delete set null;

alter table public.sfg_reviews
  drop column if exists notes;

create index if not exists sfg_applicants_submitted_at_idx on public.sfg_applicants (submitted_at, id);
create index if not exists sfg_applicants_year_idx on public.sfg_applicants (year_level);
create index if not exists sfg_applicants_assigned_reviewer_idx on public.sfg_applicants (assigned_reviewer_id, submitted_at, id);
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

delete from public.sfg_reviews
where reviewer_id in ('chapter-team', 'reviewer-1', 'reviewer-2', 'reviewer-3');

delete from public.sfg_reviewers
where id in ('chapter-team', 'reviewer-1', 'reviewer-2', 'reviewer-3');

insert into public.sfg_reviewers (id, name, sort_order) values
  ('admin', 'Admin', 1),
  ('vaishakh', 'Vaishakh', 2),
  ('robin', 'Robin', 3),
  ('aleena', 'Aleena', 4),
  ('mrudul', 'Mrudul', 5)
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

with ordered_applicants as (
  select
    id,
    (row_number() over (order by submitted_at nulls last, id) - 1) % 4 as reviewer_slot
  from public.sfg_applicants
)
update public.sfg_applicants as applicant
set assigned_reviewer_id = case ordered_applicants.reviewer_slot
  when 0 then 'vaishakh'
  when 1 then 'robin'
  when 2 then 'aleena'
  else 'mrudul'
end
from ordered_applicants
where applicant.id = ordered_applicants.id;
