import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 pb-[72px]">{children}</main>
      <BottomNav />
    </div>
  );
}
