'use client';

import { useState, useEffect } from 'react';

/**
 * Returns `true` when the user's OS / browser prefers reduced motion.
 * Used to suppress the flash-pulse animation while keeping value
 * updates instant.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}