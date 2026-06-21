import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/aegis/logo";
import { ThemeToggle } from "@/components/aegis/theme-toggle";

export const metadata = {
  title: "Privacy Policy · AEGIS",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5">
        <Link href="/" aria-label="AEGIS home">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-2xl px-5 pb-24 pt-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated 20 June 2026</p>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          AEGIS is a capstone team-allocation tool used within your institution. This policy explains
          what we collect, why, and how it is protected. It applies to students and supervisors who
          use the AEGIS workspace.
        </p>

        <Section title="Information we collect">
          <p>
            <span className="font-medium text-foreground">Account details</span> — your name, email
            address, and role (student or supervisor), provided when you create an account.
          </p>
          <p>
            <span className="font-medium text-foreground">Coursework data</span> — skill
            self-assessments and their supporting evidence, project preferences, preferred teammates,
            and availability you submit for allocation.
          </p>
          <p>
            <span className="font-medium text-foreground">Contribution signals</span> — activity and
            milestone progress used to assess team health (for example, task completion and
            engagement over a sprint).
          </p>
        </Section>

        <Section title="How we use your data">
          <p>
            Your data is used only to run the allocation: to weigh skills against evidence, form
            balanced teams, and surface alerts when a team or member needs support. Supervisors see
            this information for the cohorts they are responsible for. We never sell your data or use
            it for advertising.
          </p>
        </Section>

        <Section title="How we protect it">
          <p>
            Access is governed by row-level security with a default-deny posture: you can only see
            records you are entitled to. Account roles cannot be changed by ordinary users. Data is
            encrypted in transit, and privileged actions are recorded in a hash-chained audit log
            that is tamper-evident — any alteration breaks the chain and is detected.
          </p>
        </Section>

        <Section title="Who processes your data">
          <p>
            Data is stored with our infrastructure provider (Supabase) on your institution&apos;s
            behalf. Administrative access uses server-side credentials that are never exposed to the
            browser. Demonstrations use synthetic data rather than real student records.
          </p>
        </Section>

        <Section title="Retention">
          <p>
            Coursework data is kept for the duration of the module and any academic-record period
            your institution requires, after which it is deleted or anonymised. You can request
            earlier deletion as described below.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You may request access to, correction of, or deletion of your personal data. To exercise
            these rights, contact your module supervisor or the AEGIS administrator for your cohort,
            who can action the request through the governance console.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy as the tool evolves. Material changes will be communicated
            through the workspace, and the date above will be revised.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy or your data can be directed to your module supervisor or the
            AEGIS administrator for your institution.
          </p>
        </Section>

        <div className="mt-12 border-t border-border/60 pt-6 text-sm">
          <Link href="/signup" className="font-medium text-primary hover:underline">
            ← Back to sign up
          </Link>
        </div>
      </article>
    </main>
  );
}
