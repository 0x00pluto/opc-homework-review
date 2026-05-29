"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, UserRound, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Login() {
  const { loginAsStudent, loginAsInstructor } = useAuth();
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [instructorId, setInstructorId] = useState("");

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <div className="w-6 h-6 bg-white rounded-sm"></div>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          OPC 评审系统
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          一人公司超级个体训练营专属平台
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UserRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">我是学员</h3>
              <p className="text-sm text-slate-500">
                提交作业并查看 AI 与导师反馈
              </p>
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
              <div className="mt-1">
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  required
                  placeholder="e.g. stu_001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="请输入密码 (默认 123456)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              登录学员终端 <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10 hover:border-emerald-300 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">我是讲师</h3>
              <p className="text-sm text-slate-500">
                阅卷、调度 Agent 与数据分析
              </p>
            </div>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!instructorId.trim()) return;
              loginAsInstructor(instructorId);
              router.push("/");
            }}
          >
            <div>
              <label
                htmlFor="instructorId"
                className="block text-sm font-medium text-slate-700"
              >
                导师工号 / ID
              </label>
              <div className="mt-1">
                <input
                  id="instructorId"
                  name="instructorId"
                  type="text"
                  required
                  placeholder="e.g. teach_001"
                  value={instructorId}
                  onChange={(e) => setInstructorId(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              登录教务后台 <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
