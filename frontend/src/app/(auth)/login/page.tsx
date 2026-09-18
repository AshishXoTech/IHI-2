'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getCleanAuthErrorMessage } from '@/lib/auth/errors';
import { getPostLoginRedirectUrl } from '@/lib/auth/roles';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setErrorMessage(getCleanAuthErrorMessage(urlError));
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(getCleanAuthErrorMessage(error));
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const destination = await getPostLoginRedirectUrl(supabase, data.user);
        router.push(destination);
        router.refresh();
      }
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
            Sign in
          </h1>
          <p className="text-sm text-neutral-400">
            Innovative Hack Intelligence
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

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wider text-neutral-400"
            >
              Email
            </label>
            <input
              id="email"
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
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wider text-neutral-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm text-neutral-400">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-white underline underline-offset-4 hover:text-neutral-300">
              Create one
            </Link>
          </p>
          <p>
            Are you a judge?{' '}
            <Link href="/judge-login" className="text-white underline underline-offset-4 hover:text-neutral-300">
              Magic-link sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-neutral-500">
          Loading…
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}