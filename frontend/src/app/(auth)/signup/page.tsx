'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getCleanAuthErrorMessage } from '@/lib/auth/errors';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(getCleanAuthErrorMessage(error));
        setIsLoading(false);
        return;
      }

      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setErrorMessage('An account with this email already exists. Please log in instead.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        'Account created successfully. Check your email for a confirmation link, or sign in if email confirmation is disabled.'
      );
      setIsLoading(false);
    } catch (err) {
      setErrorMessage(getCleanAuthErrorMessage(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-md border border-white/10 bg-neutral-950 p-8 shadow-2xl">
        <div className="mb-8 space-y-2 border-b border-white/10 pb-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            IHI Platform
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Create account
          </h1>
          <p className="text-sm text-neutral-400">
            Join the hackathon operating system
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-6 border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            {successMessage}
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="block text-xs font-medium uppercase tracking-wider text-neutral-400"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="signup-email"
                className="block text-xs font-medium uppercase tracking-wider text-neutral-400"
              >
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="signup-password"
                className="block text-xs font-medium uppercase tracking-wider text-neutral-400"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="block text-xs font-medium uppercase tracking-wider text-neutral-400"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-neutral-400">
          Already have an account?{' '}
          <Link href="/login" className="text-white underline underline-offset-4 hover:text-neutral-300">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}