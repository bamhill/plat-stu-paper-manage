import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentTeacher } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "导师论文工作台",
  description: "学生论文、投稿与返修过程管理",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const teacher = await getCurrentTeacher();
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TooltipProvider>
            <AppShell teacher={teacher}>{children}</AppShell>
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
