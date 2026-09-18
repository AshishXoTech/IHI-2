import React from 'react';
import Link from 'next/link';

export default function JudgeQueueStubPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center">
      <div className="w-full max-w-md border border-white/10 bg-neutral-950 p-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Phase 5 target
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Judge Queue — Coming Soon
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          You are authenticated as a judge. The full scoring queue ships in Phase 5.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="text-sm text-white underline underline-offset-4 hover:text-neutral-300"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}