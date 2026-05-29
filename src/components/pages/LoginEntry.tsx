"use client";

import Link from "next/link";
import { GraduationCap, Bot, ArrowRight } from "lucide-react";
import { LoginShell } from "@/components/pages/LoginShell";

export function LoginEntry() {
  return (
    <LoginShell subtitle="请选择你的登录入口">
      <div className="space-y-4">
        <Link
          href="/login/student"
          className="block bg-white py-6 px-6 shadow-sm border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900">学员登录</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                提交作业、查看 AI 与导师反馈
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
          </div>
        </Link>

        <Link
          href="/login/instructor"
          className="block bg-white py-6 px-6 shadow-sm border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <Bot className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900">讲师登录</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                阅卷审核、调度 Agent 与教务管理
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
          </div>
        </Link>
      </div>
    </LoginShell>
  );
}
