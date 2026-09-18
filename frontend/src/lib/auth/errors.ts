export interface AuthErrorResponse {
  message: string;
  code?: string;
}

/**
 * Translates Supabase Auth errors, URL query error codes, and unexpected exceptions
 * into clean, user-friendly messages without exposing database internals or stack traces.
 */
export function getCleanAuthErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Handle URL error query codes (e.g. from /auth/callback redirects)
  if (typeof error === 'string') {
    switch (error.toLowerCase()) {
      case 'invalid_link':
      case 'expired_link':
      case 'pkce_error':
      case 'otp_expired':
        return 'Your login or confirmation link has expired or has already been used. Please request a new one.';
      case 'access_denied':
        return 'Access was denied. Please try logging in again.';
      case 'session_missing':
        return 'Unable to establish a secure session. Please log in again.';
      default:
        return error;
    }
  }

  // Handle object-based errors (Supabase AuthError / Error / Fetch errors)
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; status?: number; code?: string };
    const rawMessage = (err.message || '').toLowerCase();

    // Invalid credentials
    if (
      rawMessage.includes('invalid login credentials') ||
      rawMessage.includes('invalid_grant') ||
      rawMessage.includes('invalid email or password')
    ) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }

    // Existing user on signup
    if (
      rawMessage.includes('user already registered') ||
      rawMessage.includes('already exists')
    ) {
      return 'An account with this email already exists. Please log in instead.';
    }

    // Rate limits
    if (
      err.status === 429 ||
      rawMessage.includes('rate limit') ||
      rawMessage.includes('too many requests')
    ) {
      return 'Too many attempts. Please wait a few minutes before trying again.';
    }

    // Password requirements
    if (rawMessage.includes('password') && rawMessage.includes('least')) {
      return 'Password must be at least 8 characters long.';
    }

    // Expired or invalid token/magic-link
    if (
      rawMessage.includes('token has expired') ||
      rawMessage.includes('invalid token') ||
      rawMessage.includes('otp expired')
    ) {
      return 'This verification link has expired. Please request a new one.';
    }

    // Network & Fetch failures
    if (
      rawMessage.includes('failed to fetch') ||
      rawMessage.includes('network error')
    ) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
  }

  // Generic fallback for unhandled 500s / database trigger errors
  return 'Unable to complete your request. Please try again or contact support.';
}