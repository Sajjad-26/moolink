'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { resendConfirmationEmail } from '../actions';
import { useAuthGuard } from '@/lib/hooks/use-auth-guard';

function ConfirmForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useAuthGuard('/dashboard');

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.set('email', email);

    const result = await resendConfirmationEmail(formData);

    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background cow-patch-bg">
      <div className="mb-8 text-center">
        <span className="text-5xl">🐮</span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">MooLink</h1>
      </div>

      <Card className="w-full max-w-md border-border">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>Confirm your email to join the herd</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>.
            Click it to finish creating your account — then you&apos;ll be taken to your dashboard.
          </p>

          {sent && (
            <p className="text-sm text-green-700">Confirmation email sent! Check your inbox.</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <form onSubmit={handleResend} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSent(false);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700/20"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Resend email
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => router.push('/login')}
          >
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmSignupPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmForm />
    </Suspense>
  );
}
