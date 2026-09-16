'use client';

import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Returns `true` for ~300 ms whenever `value` changes, driving a
 * subtle background-color pulse on the metric display.
 *
 * Respects `prefers-reduced-motion`: always returns `false` when
 * the user has requested reduced motion (the value itself still
 * updates instantly — only the animation is suppressed).
 */
export function useFlashOnChange(value: number | string): boolean {
  const [flashing, setFlashing] = useState(false);
  const prevRef = useRef(value);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;

      if (reducedMotion) return; // skip animation, value already updated

      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value, reducedMotion]);

  return flashing;
}