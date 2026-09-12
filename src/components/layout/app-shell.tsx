"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";

type Teacher = { id: number; name: string; email: string } | null;

export function AppShell({ teacher, children }: { teacher: Teacher; children: React.ReactNode }) {
  const pathname = usePathname();
  const authPage = pathname === "/login" || pathname === "/register";
  if (authPage) return <>{children}</>;
  if (!teacher) return <>{children}</>;
  return (
    <div className="flex min-h-screen">
      <AppSidebar teacher={teacher} />
      <main className="paper-main flex-1 ml-[196px] min-h-screen">{children}</main>
    </div>
  );
}
