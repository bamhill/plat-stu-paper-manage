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
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "首页", icon: LayoutDashboard },
  { href: "/students", label: "学生管理", icon: GraduationCap },
  { href: "/papers", label: "小论文", icon: FileText },
  { href: "/theses", label: "大论文", icon: BookOpen },
  { href: "/submissions", label: "投稿记录", icon: Send },
  { href: "/revisions", label: "返修记录", icon: RefreshCw },
  { href: "/settings", label: "系统设置", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

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
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
