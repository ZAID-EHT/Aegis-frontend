"use client";

import * as React from "react";

import { AegisSignInPage } from "@/components/auth/aegis-signin-page";

export default function HomePage() {
  return (
    <React.Suspense>
      <AegisSignInPage />
    </React.Suspense>
  );
}
