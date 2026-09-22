-- ============================================================================
-- IHI OPERATING SYSTEM — CENTRAL DATABASE MIGRATION (DEV 1 SOLE OWNER)
-- Includes: Auth Roles, Events, Registrations, Teams, Submissions, Rubrics,
--           Judge Invites/Assignments, Scores (Immutable), Corrections, Audit
-- ============================================================================

-- 0. Extensions & Schemas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Identity & Role Assignments
CREATE TABLE IF NOT EXISTS public.role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'judge', 'participant', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Event Configuration (Pillar 1)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'registration_open', 'team_formation', 'live', 'submission_open', 'submission_closed', 'judging', 'results_published')),
  max_team_size INT NOT NULL DEFAULT 4,
  max_participants INT,
  submission_deadline TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  registration_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Participant Registrations (Pillar 1/2)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn')),
  display_name TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- 4. Teams & Submissions (Dev 2 Handoff Contracts)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  skills_needed TEXT[] DEFAULT '{}',
  max_size INT NOT NULL DEFAULT 4,
  member_count INT NOT NULL DEFAULT 0,
  lead_user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'locked', 'forming')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, name)
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'locked', 'final')),
  submitted_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Judging Rubrics & Criteria (Pillar 4)
CREATE TABLE IF NOT EXISTS public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  title TEXT NOT NULL DEFAULT 'Main Evaluation Rubric',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  max_score INT NOT NULL DEFAULT 10 CHECK (max_score > 0),
  weight NUMERIC(5,2) NOT NULL CHECK (weight > 0 AND weight <= 100),
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Judge Invites & Round-Robin Assignments
CREATE TABLE IF NOT EXISTS public.judge_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

CREATE TABLE IF NOT EXISTS public.judge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  judge_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, judge_user_id, submission_id)
);

-- 7. Scores (APPEND-ONLY / IMMUTABLE) & Corrections
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criteria_scores JSONB NOT NULL,
  total_score NUMERIC(5,2) NOT NULL,
  corrects_score_id UUID REFERENCES public.scores(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, judge_user_id)
);

-- DATABASE-LEVEL IMMUTABILITY: Revoke UPDATE and DELETE on scores
REVOKE UPDATE, DELETE ON TABLE public.scores FROM PUBLIC, authenticated, anon;

CREATE TABLE IF NOT EXISTS public.correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_score_id UUID NOT NULL REFERENCES public.scores(id) ON DELETE CASCADE,
  proposed_criteria_scores JSONB NOT NULL,
  proposed_total_score NUMERIC(5,2) NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 20),
  status TEXT NOT NULL DEFAULT 'pending_organizer_review'
    CHECK (status IN ('pending_organizer_review', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Permanent Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Row-Level Security Policies
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Local Development
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Auth manage events" ON public.events FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage registrations" ON public.registrations FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage teams" ON public.teams FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage submissions" ON public.submissions FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage rubrics" ON public.rubrics FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage criteria" ON public.rubric_criteria FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage invites" ON public.judge_invites FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage assignments" ON public.judge_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Judges read scores" ON public.scores FOR SELECT TO authenticated USING (judge_user_id = auth.uid());
CREATE POLICY "Judges insert scores" ON public.scores FOR INSERT TO authenticated WITH CHECK (judge_user_id = auth.uid());
CREATE POLICY "Judges manage corrections" ON public.correction_requests FOR ALL TO authenticated USING (judge_user_id = auth.uid());
CREATE POLICY "Auth read audit" ON public.audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert audit" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());