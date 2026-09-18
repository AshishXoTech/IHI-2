import { SupabaseClient, User } from '@supabase/supabase-js';

export type UserRole = 'organizer' | 'judge' | 'participant' | 'admin';

interface RoleAssignmentRow {
  role: UserRole;
}

/**
 * Queries identity.role_assignments to determine the authenticated user's destination.
 * - Organizers & Admins -> /dashboard
 * - Judges -> /judge/queue
 * - Fallback / Participants -> /dashboard
 */
export async function getPostLoginRedirectUrl(
  supabase: SupabaseClient,
  user: User
): Promise<string> {
  try {
    // Check role assignments. Query schema if configured or public view.
    const { data: assignments, error } = await supabase
      .from('role_assignments')
      .select('role')
      .eq('user_id', user.id);

    if (error || !assignments || assignments.length === 0) {
      // If no explicit role is assigned or error occurs, safely default to /dashboard
      return '/dashboard';
    }

    const roles = (assignments as RoleAssignmentRow[]).map((r) => r.role);

    if (roles.includes('judge') && !roles.includes('organizer') && !roles.includes('admin')) {
      return '/judge/queue';
    }

    return '/dashboard';
  } catch {
    return '/dashboard';
  }
}