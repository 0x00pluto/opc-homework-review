"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Bot,
  LogOut,
  BookOpen,
  Database,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function InstructorSidebar() {
  const pathname = usePathname();
  const { logout, userId } = useAuth();

  const navGroups = [
    {
      title: "学习进展分析",
      items: [
        { name: "作业大厅", href: "/homeworks", icon: FileText },
        { name: "学员画像及学习进展", href: "/crm", icon: LineChart },
      ],
    },
    {
      title: "教务配置管理",
      items: [
        { name: "作业库管理 (题目)", href: "/assignments", icon: BookOpen },
        { name: "知识库管理", href: "/kb", icon: Database },
        { name: "仪表盘 (Agents)", href: "/", icon: LayoutDashboard },
      ],
    },
    {
      title: "学员及班级管理",
      items: [
        { name: "班级管理", href: "/cohorts", icon: Users },
        { name: "学员管理", href: "/students-mgmt", icon: Users },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
          <span className="text-white text-xs font-bold">
            {userId?.charAt(0) || "T"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight text-slate-900">
            教务后台
          </span>
          <span className="text-xs text-slate-500">{userId}</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (pathname.startsWith("/homeworks") &&
                    item.href === "/homeworks");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm border border-transparent",
                      isActive
                        ? "bg-blue-50/80 text-blue-700 border-blue-100 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isActive ? "text-blue-600" : "text-slate-400",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          <LogOut className="w-4 h-4" /> 退出管理中心
        </button>
      </div>
    </aside>
  );
}

export function Layout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  const { role } = useAuth();

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {sidebar}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {role === "instructor" && (
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-10 relative shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs uppercase tracking-wider font-bold">
                OPC Core
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-bold">Admin Workspace</span>
            </div>
            <div className="flex gap-3">
              <Bot className="w-5 h-5 text-slate-300" />
            </div>
          </header>
        )}
        <div className="p-8 space-y-6 flex-1 bg-slate-50 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
