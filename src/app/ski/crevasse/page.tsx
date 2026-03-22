"use client";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CrevasseGame } from "@/components/ski/CrevasseGame";

export default function CrevassePage() {
  return (
    <AppShell>
      <PageHeader icon="⚡" title="Crevo-Hop" backHref="/ski" />
      <div className="overflow-hidden">
        <CrevasseGame />
      </div>
    </AppShell>
  );
}
