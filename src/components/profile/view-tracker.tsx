'use client';

import { useEffect, useRef } from 'react';

export function ViewTracker({ profileId, refTag }: { profileId: string; refTag?: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    fetch('/api/track/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId, refTag }),
    }).catch(() => {
      // ignore tracking errors so they don't break the client
    });
  }, [profileId, refTag]);

  return null;
}
