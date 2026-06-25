import Image from "next/image";
import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <article className="mx-auto max-w-[680px]">
        <header className="mb-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/aegis-workspace.png" alt="" width={32} height={32} className="h-8 w-8 rounded-full bg-foreground object-contain" />
            <span className="text-sm font-semibold text-muted-foreground">AEGIS WORKSPACE</span>
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Cookie Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
        </header>
        <section>
          <h2 className="text-lg font-semibold">Strictly necessary cookies</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            AEGIS uses one session cookie for authentication through Supabase. It does not use advertising cookies or tracking cookies. This cookie is required for sign-in and cannot be disabled without logging out.
          </p>
        </section>
        <Link href="/" className="mt-10 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary">
          Back to AEGIS
        </Link>
      </article>
    </main>
  );
}
