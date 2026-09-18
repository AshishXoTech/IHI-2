'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getCleanAuthErrorMessage } from '@/lib/auth/errors';

function JudgeLoginFormContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setErrorMessage(getCleanAuthErrorMessage(urlError));
    }
  }, [searchParams]);

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/judge/queue`,
          shouldCreateUser: false,
        },
      });

      if (error) {
        setErrorMessage(getCleanAuthErrorMessage(error));
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        'Magic link sent. Check your inbox and open the link to enter the Judge Queue.'
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
            Judge portal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Magic-link sign in
          </h1>
          <p className="text-sm text-neutral-400">
            Enter your invited judge email. No password required.
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
          <form onSubmit={handleMagicLink} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="judge-email"
                className="block text-xs font-medium uppercase tracking-wider text-neutral-400"
              >
                Judge email
              </label>
              <input
                id="judge-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="judge@domain.com"
                className="w-full border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Sending link…' : 'Send magic link'}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-neutral-400">
          Organizer or participant?{' '}
          <Link href="/login" className="text-white underline underline-offset-4 hover:text-neutral-300">
            Password sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function JudgeLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-neutral-500">
          Loading…
        </div>
      }
    >
      <JudgeLoginFormContent />
    </Suspense>
  );
}