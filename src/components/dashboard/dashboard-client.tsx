'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsTab } from './settings-tab';
import { LinksTab } from './links-tab';
import { AnalyticsTab } from './analytics-tab';
import type { Profile } from '@/lib/types';
import { Link2, BarChart3, Settings, LogOut, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function DashboardClient({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState('links');
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen cow-patch-bg">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-lg">🐮</span>
              <span className="text-lg font-extrabold tracking-tight text-foreground">
                MooLink
              </span>
            </Link>
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              /{profile.username} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 gap-1">
            <TabsTrigger value="links" className="gap-2 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
              <Link2 className="w-4 h-4" /> Links
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
              <BarChart3 className="w-4 h-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links">
            <LinksTab profile={profile} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab profileId={profile.id} username={profile.username} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
