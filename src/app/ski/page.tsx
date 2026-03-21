"use client";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SkiGame } from "@/components/ski/SkiGame";

export default function SkiPage() {
  return (
    <AppShell>
      <PageHeader icon="🎿" title="Ski avec Raph" />
      <div className="overflow-hidden">
        <SkiGame />
      </div>
    </AppShell>
  );
}
