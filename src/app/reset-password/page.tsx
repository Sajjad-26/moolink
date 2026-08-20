'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background cow-patch-bg relative">
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all py-2 px-4 rounded-full border border-border bg-card/80 backdrop-blur-md shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-700" /> Back to Login
        </Link>
      </div>

      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex flex-col items-center hover:opacity-90 transition-opacity">
          <Image src="/logo.png" alt="MooLink" width={64} height={64} className="rounded-2xl shadow-md border border-amber-900/10 mb-2" />
          <h1 className="text-2xl font-black tracking-tight text-foreground">MooLink</h1>
        </Link>
      </div>

      <Card className="w-full max-w-md border-border">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-semibold text-foreground">{email}</span>, a reset link has been sent.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-amber-800 hover:bg-amber-900 text-white" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
