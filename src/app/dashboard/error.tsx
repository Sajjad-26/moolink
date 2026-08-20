'use client';

import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen cow-patch-bg flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🐮</div>
        <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-6">
          We hit an unexpected error. Try refreshing the dashboard.
        </p>
        <Button onClick={reset} className="bg-amber-800 hover:bg-amber-900 text-white">
          Try Again
        </Button>
      </div>
    </div>
  );
}
