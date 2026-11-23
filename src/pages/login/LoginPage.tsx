import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { navigate } from '@/lib/router';
import { Logo } from '@/components/common/Logo';
import { useSession } from '@/services/session';

function getMagicLinkError() {
  const hash = window.location.hash;
  const params = hash.startsWith('#error=')
    ? new URLSearchParams(hash.slice(1))
    : new URLSearchParams(window.location.search);
  const description = params.get('error_description');
  const code = params.get('error_code');
  if (!description && !code) return null;

  if (code === 'otp_expired' || /expired|invalid/i.test(description ?? '')) {
    return 'This sign-in link has expired or is invalid. Request a new one.';
  }
  return description ?? 'Could not complete sign-in. Please request a new link.';
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);
  const [magicLinkError] = useState(getMagicLinkError);
  const { status, error: sessionError, profile, signIn } = useSession();

  useEffect(() => {
    if (magicLinkError) {
      window.history.replaceState(null, '', `${window.location.pathname}#/login`);
    }
  }, [magicLinkError]);

  useEffect(() => {
    if (status === 'authenticated' && profile) {
      navigate(profile.role === 'supplier' ? '/supplier' : '/manager');
    }
  }, [status, profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setLinkSent(false);
    try {
      await signIn(email);
      setLinkSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel />

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo showTagline />
          </div>

          <div className="mt-2 lg:mt-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in to your portal</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Northstar Logistics operations, for managers and supplier partners.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your workspace is selected automatically from your account profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@northstarlogistics.com"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFormError(null);
                  setLinkSent(false);
                }}
                className="h-11 border-border bg-card"
              />
            </div>

            {(formError || magicLinkError || (status === 'error' && sessionError)) && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                {formError ?? magicLinkError ?? sessionError}
              </p>
            )}
            {linkSent && (
              <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
                Check your email for your sign-in link.
              </p>
            )}
            {status === 'loading' && !submitting && (
              <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Checking your saved session…
              </p>
            )}

            <Button type="submit" disabled={submitting} className="h-11 w-full gap-2 text-sm font-semibold">
              {submitting ? 'Sending sign-in link…' : 'Email me a sign-in link'}
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Password-free sign-in for authorized Northstar Logistics personnel and partners.
          </p>
        </div>
      </div>

    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden border-r border-border bg-muted lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(0 0% 0%) 1px, transparent 1px), linear-gradient(to bottom, hsl(0 0% 0%) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />
      <div className="relative">
        <Logo showTagline />
      </div>

      <div className="relative max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Supplier and logistics operations</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-foreground">
          Every inbound shipment, watched from arrival to receipt.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          LogiGuard AI flags delays, customs holds, and quantity variances early, and keeps suppliers aligned on every update.
        </p>

        <div className="mt-10 rounded-xl border border-border bg-card/80 p-5 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">A secure operations workspace</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Coordinate inbound shipments, supplier updates, and operational risk in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="relative text-xs text-muted-foreground">Northstar Logistics, Dallas, TX</p>
    </div>
  );
}
