-- Extensions utiles (Postgres >= 13)
create extension if not exists pgcrypto;

-- 1) Colonnes supplémentaires sur concour_users (compatibles avec l'existant)
alter table public.concour_users
  add column if not exists academy_role text check (academy_role in ('prof','etudiant','staff')) null,
  add column if not exists academy_id uuid null;

-- 2) Tables Académie de base
create table if not exists public.academy_academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_classes (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academy_academies(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.academy_classes(id) on delete cascade,
  user_id uuid not null references public.concour_users(id) on delete cascade,
  role_in_class text not null check (role_in_class in ('prof','etudiant')),
  created_at timestamptz not null default now(),
  unique (class_id, user_id)
);

-- 3) Modules, sous-modules (optionnel), assignations
create table if not exists public.academy_modules (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academy_academies(id) on delete cascade,
  title text not null,
  module_type text not null check (module_type in ('qcm','open_question','rp_scenario','image_analysis','audio_video')),
  description text,
  max_score int not null default 100,
  is_required boolean not null default true,
  order_position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_submodules (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.academy_modules(id) on delete cascade,
  title text not null,
  description text,
  max_score int not null default 0,
  order_position int not null default 0
);

create table if not exists public.academy_module_assignments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.academy_modules(id) on delete cascade,
  class_id uuid not null references public.academy_classes(id) on delete cascade,
  start_at timestamptz,
  end_at timestamptz,
  is_mandatory boolean not null default true,
  unique (module_id, class_id)
);

-- 4) Ressources, évaluations, notes
create table if not exists public.academy_resources (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academy_academies(id) on delete cascade,
  class_id uuid references public.academy_classes(id) on delete set null,
  module_id uuid references public.academy_modules(id) on delete set null,
  title text not null,
  url text not null,
  type text not null check (type in ('link','file')),
  visibility text not null check (visibility in ('class','module','academy')),
  created_by uuid not null references public.concour_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_evaluations (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.academy_modules(id) on delete cascade,
  class_id uuid not null references public.academy_classes(id) on delete cascade,
  title text not null,
  description text,
  total_points int not null default 100,
  evaluator_id uuid not null references public.concour_users(id) on delete set null,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_grades (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.academy_evaluations(id) on delete cascade,
  student_id uuid not null references public.concour_users(id) on delete cascade,
  score int not null,
  feedback text,
  graded_at timestamptz not null default now(),
  grader_id uuid references public.concour_users(id) on delete set null,
  unique (evaluation_id, student_id)
);

-- 5) Niveaux académiques
create table if not exists public.academy_levels (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academy_academies(id) on delete cascade,
  name text not null,
  min_points int not null,
  order_index int not null default 0
);

create table if not exists public.academy_student_levels (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.concour_users(id) on delete cascade,
  current_level_id uuid not null references public.academy_levels(id) on delete cascade,
  current_points int not null default 0,
  updated_at timestamptz not null default now()
);

-- 6) Clé étrangère concour_users -> academy_academies (faite après création de la table)
alter table public.concour_users
  add constraint if not exists concour_users_academy_id_fkey
  foreign key (academy_id) references public.academy_academies(id) on delete set null;


