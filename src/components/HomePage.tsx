"use client";

import { useAuth } from "@/context/AuthContext";
import { Dashboard } from "@/components/pages/Dashboard";
import { StudentDashboard } from "@/components/pages/StudentDashboard";

export function HomePage() {
  const { role } = useAuth();
  if (role === "student") return <StudentDashboard />;
  return <Dashboard />;
}
