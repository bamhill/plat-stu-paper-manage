"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  BookOpen,
  Send,
  RefreshCw,
  Search,
  BarChart3,
  Upload,
  Settings,
  Sun,
  Moon,
  Palette,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "首页", icon: LayoutDashboard },
  { href: "/students", label: "学生管理", icon: GraduationCap },
  { href: "/papers", label: "小论文", icon: FileText },
  { href: "/submissions", label: "　投稿记录", icon: Send, indent: true },
  { href: "/revisions", label: "　返修记录", icon: RefreshCw, indent: true },
  { href: "/theses", label: "大论文", icon: BookOpen },
  { href: "/query", label: "综合查询", icon: Search },
  { href: "/analysis", label: "返修分析", icon: BarChart3 },
  { href: "/import", label: "批量导入", icon: Upload },
  { href: "/settings", label: "系统设置", icon: Settings },
];

const THEMES = ["light", "pro", "dark"] as const;
const THEME_LABELS: Record<string, string> = { light: "浅色模式", pro: "专业蓝调", dark: "深色模式" };
const THEME_ICONS: Record<string, typeof Sun> = { light: Sun, pro: Palette, dark: Moon };

export function AppSidebar() {
  const pathname = usePathname();

  function getTheme(): string {
    if (typeof document === "undefined") return "light";
    const cls = document.documentElement.className;
    if (cls.includes("dark")) return "dark";
    if (cls.includes("pro-theme")) return "pro";
    return "light";
  }

  function cycleTheme() {
    const current = getTheme();
    const idx = THEMES.indexOf(current as typeof THEMES[number]);
    const next = THEMES[(idx + 1) % THEMES.length];

    const html = document.documentElement;
    html.classList.remove("light", "dark", "pro-theme");

    if (next === "dark") {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (next === "pro") {
      html.classList.add("light", "pro-theme");
      localStorage.setItem("theme", "pro");
    } else {
      html.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }

  // On mount, restore saved theme
  function initTheme() {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme") || "light";
    const html = document.documentElement;
    html.classList.remove("light", "dark", "pro-theme");
    if (saved === "dark") html.classList.add("dark");
    else if (saved === "pro") { html.classList.add("light", "pro-theme"); }
    else html.classList.add("light");
  }

  if (typeof window !== "undefined" && !(window as any).__themeInited) {
    (window as any).__themeInited = true;
    initTheme();
  }

  const currentTheme = typeof document !== "undefined" ? getTheme() : "light";
  const ThemeIcon = THEME_ICONS[currentTheme] || Palette;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <GraduationCap className="h-6 w-6 text-blue-600 mr-2" />
        <span className="font-semibold text-sm">论文过程管理</span>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                (item as any).indent && "pl-9",
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {(item as any).indent ? null : <item.icon className="h-4 w-4" />}
              {item.label.trim()}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-4 left-3 right-3">
        <button
          onClick={cycleTheme}
          className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          <ThemeIcon className="h-4 w-4" />
          {THEME_LABELS[currentTheme] || "浅色模式"}
        </button>
      </div>
    </aside>
  );
}
