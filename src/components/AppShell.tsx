"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  InstructorSidebar,
  StudentSidebar,
} from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

const INSTRUCTOR_ONLY_PATHS = [
  "/cohorts",
  "/students-mgmt",
  "/assignments",
  "/kb",
  "/crm",
  "/workload",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!role) {
      router.replace("/login");
      return;
    }
    if (role === "student") {
      const blocked =
        INSTRUCTOR_ONLY_PATHS.some((p) => pathname === p) ||
        pathname === "/homeworks";
      if (blocked) {
        router.replace("/");
      }
    }
  }, [role, loading, pathname, router]);

  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        加载中...
      </div>
    );
  }

  if (role === "student") {
    return <Layout sidebar={<StudentSidebar />}>{children}</Layout>;
  }

  return <Layout sidebar={<InstructorSidebar />}>{children}</Layout>;
}
