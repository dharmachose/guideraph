"use client";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { DvaGame } from "@/components/ski/DvaGame";

export default function DvaPage() {
  return (
    <AppShell>
      <PageHeader icon="📡" title="DVA Search" backHref="/ski" />
      <div className="overflow-hidden">
        <DvaGame />
      </div>
    </AppShell>
  );
}
