"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, MailCheck, UserPlus } from "lucide-react";

import { AuthFrame, FIELD } from "@/components/auth/auth-frame";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("student");
  const [agree, setAgree] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) {
      setError("Please accept the Privacy Policy to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // If email confirmation is on, there is no session yet — tell them to check mail.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setSent(true);
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <AuthFrame
        title="Check your email"
        subtitle={`We sent a confirmation link to ${email}. Click it to activate your account.`}
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            New accounts are reviewed by a supervisor before access is granted. You&apos;ll be
            notified once approved.
          </p>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Create your account"
      subtitle="Join your cohort's AEGIS workspace."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <GoogleButton label="Sign up with Google" />
        <OrDivider />
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && (
          <div
            className="flex items-start gap-2 rounded-xl border p-3 text-sm"
            style={{
              borderColor: "color-mix(in oklch, var(--critical) 35%, transparent)",
              backgroundColor: "color-mix(in oklch, var(--critical) 8%, transparent)",
              color: "var(--critical)",
            }}
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nadeesha Perera"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
            />
          </div>
          <div>
            <Label htmlFor="role">I am a</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={FIELD}
            >
              <option value="student">Student</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-[var(--primary)]"
          />
          <span className="leading-relaxed">
            I agree to the{" "}
            <Link href="/privacy" className="font-medium text-foreground hover:underline">
              Privacy Policy
            </Link>{" "}
            and consent to my coursework data being processed for team allocation.
          </span>
        </label>

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {busy ? "Creating account…" : "Create account"}
        </Button>
        </form>
      </div>
    </AuthFrame>
  );
}
