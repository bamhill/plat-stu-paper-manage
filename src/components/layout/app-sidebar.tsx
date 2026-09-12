"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
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
  LogOut,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "日常工作",
    items: [
      { href: "/dashboard", label: "首页", icon: Home },
      { href: "/students", label: "学生", icon: Users },
      { href: "/papers", label: "小论文", icon: FileText },
      { href: "/theses", label: "大论文", icon: BookOpen },
    ],
  },
  {
    label: "过程管理",
    items: [
      { href: "/submissions", label: "投稿记录", icon: Send },
      { href: "/revisions", label: "返修记录", icon: RefreshCw },
      { href: "/query", label: "综合查询", icon: Search },
      { href: "/analysis", label: "返修统计", icon: BarChart3 },
    ],
  },
  {
    label: "系统",
    items: [
      { href: "/import", label: "批量导入", icon: Upload },
      { href: "/settings", label: "系统设置", icon: Settings },
    ],
  },
];

export function AppSidebar({ teacher }: { teacher: { name: string; email: string } }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    const nextDark = saved === "dark";
    document.documentElement.classList.toggle("dark", nextDark);
    setDark(nextDark);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    setDark(nextDark);
  }

  const ThemeIcon = dark ? Moon : Sun;

  return (
    <aside className="paper-sidebar fixed left-0 top-0 z-40 h-screen w-[196px]">
      <div className="paper-brand">
        <div className="paper-brand-mark">P</div>
        <div className="min-w-0">
          <div className="paper-brand-title">导师论文工作台</div>
          <div className="paper-brand-subtitle">学生 · 投稿 · 返修</div>
        </div>
      </div>

      <nav className="paper-nav">
        {navGroups.map((group) => (
          <div className="paper-nav-group" key={group.label}>
            <div className="paper-nav-label">{group.label}</div>
            <div className="paper-nav-items">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("paper-nav-link", isActive && "paper-nav-link-active")}
                  >
                    <item.icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="paper-sidebar-footer">
        <div className="paper-account">
          <div className="paper-account-avatar">{teacher.name.slice(0, 1)}</div>
          <div className="paper-account-text">
            <strong>{teacher.name}</strong>
            <span title={teacher.email}>{teacher.email}</span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="paper-logout" type="submit" title="退出登录" aria-label="退出登录">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
        <button onClick={toggleTheme} className="paper-theme-button" type="button">
          <ThemeIcon className="h-4 w-4" />
          <span>{dark ? "深色模式" : "浅色模式"}</span>
          <span className={cn("paper-theme-switch", dark && "paper-theme-switch-on")}>
            <i />
          </span>
        </button>
      </div>
    </aside>
  );
}
