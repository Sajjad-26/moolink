import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen cow-patch-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
        <p className="text-sm text-muted-foreground font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}
