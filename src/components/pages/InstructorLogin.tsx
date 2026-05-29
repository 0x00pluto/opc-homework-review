"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginShell } from "@/components/pages/LoginShell";

export function InstructorLogin() {
  const { loginAsInstructor } = useAuth();
  const router = useRouter();
  const [instructorId, setInstructorId] = useState("");

  const handleInstructorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructorId.trim()) return;
    loginAsInstructor(instructorId);
    router.push("/");
  };

  return (
    <LoginShell subtitle="讲师登录 · 教务后台与作业审核">
      <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">教务后台</h3>
            <p className="text-sm text-slate-500">演示模式，输入工号即可进入</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleInstructorLogin}>
          <div>
            <label
              htmlFor="instructorId"
              className="block text-sm font-medium text-slate-700"
            >
              导师工号 / ID
            </label>
            <input
              id="instructorId"
              name="instructorId"
              type="text"
              required
              placeholder="e.g. teach_001"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            登录教务后台 <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          你是学员？{" "}
          <Link
            href="/login/student"
            className="text-blue-600 font-medium hover:text-blue-700"
          >
            前往学员登录
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
