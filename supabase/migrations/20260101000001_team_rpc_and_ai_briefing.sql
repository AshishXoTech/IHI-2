-- Migration: 20260101000001_team_rpc_and_ai_briefing.sql
-- Description: Concurrency-safe team joining RPC, team messaging, and AI briefing table

-- 1. Create teams schema tables if not present
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    skills_needed TEXT[] DEFAULT '{}',
    max_size INTEGER NOT NULL DEFAULT 4,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_team_name_per_event UNIQUE(event_id, name)
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_per_team UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_flagged BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.looking_for_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_looking_per_event UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.ai_briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    repo_url TEXT NOT NULL,
    project_summary TEXT NOT NULL,
    detected_tech TEXT[] DEFAULT '{}',
    duplicate_risk TEXT NOT NULL DEFAULT 'low' CHECK (duplicate_risk IN ('low', 'medium', 'high')),
    duplicate_details TEXT,
    confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_briefing_per_submission UNIQUE(submission_id)
);

-- 2. Concurrency-Safe Atomic Join Team RPC Function
CREATE OR REPLACE FUNCTION public.join_team(
    p_team_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'member'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team RECORD;
    v_current_count INTEGER;
    v_existing_membership RECORD;
    v_event_id UUID;
BEGIN
    -- 1. Lock the team row exclusively to prevent race conditions on last-slot joins
    SELECT id, event_id, max_size, is_locked
    INTO v_team
    FROM public.teams
    WHERE id = p_team_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team not found');
    END IF;

    IF v_team.is_locked THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team is locked and cannot accept new members');
    END IF;

    v_event_id := v_team.event_id;

    -- 2. Check if user is already in ANY team for this event
    SELECT tm.id INTO v_existing_membership
    FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    WHERE t.event_id = v_event_id AND tm.user_id = p_user_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User is already a member of a team in this event');
    END IF;

    -- 3. Check current team member count
    SELECT COUNT(*)
    INTO v_current_count
    FROM public.team_members
    WHERE team_id = p_team_id;

    IF v_current_count >= v_team.max_size THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team is already full');
    END IF;

    -- 4. Atomically insert member
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (p_team_id, p_user_id, p_role);

    -- 5. Remove from looking_for_team pool if they were listed
    DELETE FROM public.looking_for_team
    WHERE event_id = v_event_id AND user_id = p_user_id;

    -- 6. Check if team became full with this join and lock if full
    IF (v_current_count + 1) >= v_team.max_size THEN
        UPDATE public.teams
        SET is_locked = true, updated_at = now()
        WHERE id = p_team_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'team_id', p_team_id,
        'user_id', p_user_id,
        'member_count', v_current_count + 1,
        'max_size', v_team.max_size
    );
END;
$$;

-- 3. Enable RLS and Realtime
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.looking_for_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_briefings ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read messages" ON public.team_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read looking_for_team" ON public.looking_for_team FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read ai_briefings" ON public.ai_briefings FOR SELECT TO authenticated USING (true);

-- Allow writes
CREATE POLICY "Allow insert teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow insert messages" ON public.team_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);