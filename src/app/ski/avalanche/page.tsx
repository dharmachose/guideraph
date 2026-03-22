"use client";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AvalancheGame } from "@/components/ski/AvalancheGame";

export default function AvalanchePage() {
  return (
    <AppShell>
      <PageHeader icon="🏔️" title="Évite l'Avalanche" backHref="/ski" />
      <div className="overflow-hidden">
        <AvalancheGame />
      </div>
    </AppShell>
  );
}
