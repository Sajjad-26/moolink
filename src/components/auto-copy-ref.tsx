'use client';

import { useEffect, useRef } from 'react';

export function AutoCopyRef({ refTag }: { refTag?: string }) {
  const hasCopied = useRef(false);

  useEffect(() => {
    if (!refTag || hasCopied.current) return;

    const handleFirstClick = () => {
      try {
        navigator.clipboard.writeText(refTag);
        hasCopied.current = true;
      } catch (e) {
        // Silently fail
      }
      document.removeEventListener('click', handleFirstClick, true);
    };

    document.addEventListener('click', handleFirstClick, true);

    return () => {
      document.removeEventListener('click', handleFirstClick, true);
    };
  }, [refTag]);

  return null;
}
