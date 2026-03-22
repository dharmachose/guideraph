"use client";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GuideGame } from "@/components/ski/GuideGame";

export default function GuidePage() {
  return (
    <AppShell>
      <PageHeader icon="🗺️" title="Suit Raph le Guide" backHref="/ski" />
      <div className="overflow-hidden">
        <GuideGame />
      </div>
    </AppShell>
  );
}
