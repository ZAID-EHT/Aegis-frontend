"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  FolderOpen,
  GitBranch,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/aegis/logo";
import { ThemeToggle } from "@/components/aegis/theme-toggle";

const EASE = [0.16, 1, 0.3, 1] as const;

// Slide-only reveals (no opacity) so nothing can freeze invisible on load.
const rise = { hidden: { y: 12 }, show: { y: 0, transition: { duration: 0.5, ease: EASE } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };

const FEATURES = [
  {
    icon: Sparkles,
    title: "Evidence-weighted skills",
    body: "Self-ratings are checked against real evidence, so confidence is earned — not just claimed.",
  },
  {
    icon: Scale,
    title: "Balanced teams",
    body: "Every team gets the critical skills it needs, with workload shared fairly across members.",
  },
  {
    icon: GitBranch,
    title: "Early warnings",
    body: "Disengagement, uneven effort, and at-risk teams surface before they derail a project.",
  },
  {
    icon: ShieldCheck,
    title: "Tamper-evident governance",
    body: "Every privileged action is recorded in a hash-chained log you can verify end to end.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[36rem]"
        style={{
          background:
            "radial-gradient(58rem 26rem at 50% -10%, color-mix(in oklch, var(--primary) 16%, transparent), transparent)",
        }}
      />

      {/* nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#integrations" className="transition-colors hover:text-foreground">Integrations</a>
          <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition-shadow hover:shadow-card-lg"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto w-full max-w-3xl px-5 pb-14 pt-16 text-center sm:pt-24">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.span
            variants={rise}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-card"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--healthy)]" />
            Capstone allocation, done fairly
          </motion.span>
          <motion.h1
            variants={rise}
            className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-[3.25rem] sm:leading-[1.05]"
          >
            <span className="text-foreground">Fair capstone teams,</span>
            <br />
            <span className="text-muted-foreground">backed by evidence</span>
          </motion.h1>
          <motion.p
            variants={rise}
            className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            AEGIS turns skill claims, preferences, and activity into balanced teams — and flags
            trouble before it derails a project, with an auditable governance layer.
          </motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-lg"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-card transition-shadow hover:shadow-card-lg"
            >
              Sign in
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* integrations — the real stack */}
      <section id="integrations" className="mx-auto w-full max-w-3xl px-5 pb-20">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Runs on your stack
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-card">
            <Database className="h-4 w-4 text-primary" /> Supabase &amp; Postgres RLS
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-card">
            <FolderOpen className="h-4 w-4 text-primary" /> Google Drive workspaces
          </span>
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto w-full max-w-5xl px-5 pb-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={rise} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© 2026 AEGIS · Capstone allocation engine</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
