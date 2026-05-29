"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginShell } from "@/components/pages/LoginShell";

export function StudentLogin() {
  const { loginAsStudent } = useAuth();
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !password.trim()) return;

    try {
      const res = await fetch("/api/students/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        loginAsStudent(studentId);
        router.push("/");
      } else {
        alert(data.error || "登录失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  return (
    <LoginShell subtitle="学员登录 · 提交作业与查看反馈">
      <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <UserRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">学员终端</h3>
            <p className="text-sm text-slate-500">使用学号与密码登录</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleStudentLogin}>
          <div>
            <label
              htmlFor="studentId"
              className="block text-sm font-medium text-slate-700"
            >
              学员学号 / ID
            </label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              required
              placeholder="e.g. stu_001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="请输入密码 (默认 123456)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            登录学员终端 <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          你是讲师？{" "}
          <Link
            href="/login/instructor"
            className="text-emerald-600 font-medium hover:text-emerald-700"
          >
            前往讲师登录
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-400">
          <Link href="/login" className="hover:text-slate-600">
            ← 返回登录入口
          </Link>
        </p>
      </div>
    </LoginShell>
  );
}
