"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Link as LinkIcon,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { HomeworkRecord, Assignment, Student } from "@/types";
import { cn } from "@/lib/utils";

export function StudentDashboard() {
  const { userId, logout } = useAuth();
  const [data, setData] = useState<HomeworkRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [rankings, setRankings] = useState<
    { student_id: string; name: string; score: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [editingHomework, setEditingHomework] = useState<HomeworkRecord | null>(
    null,
  );
  const [content, setContent] = useState("");

  const fetchData = async () => {
    if (!userId) return;

    let cohort = "";
    const studentRes = await fetch(`/api/students/${userId}`);
    if (studentRes.ok) {
      const profile = await studentRes.json();
      if (profile) {
        setStudentProfile(profile);
        cohort = profile.cohort_name || "";
      }
    }

    const [hwRes, assignRes, rankRes] = await Promise.all([
      fetch(`/api/homeworks/student/${userId}`),
      fetch(
        `/api/assignments${cohort ? `?cohort=${encodeURIComponent(cohort)}` : ""}`,
      ),
      fetch(`/api/students/${userId}/ranking`),
    ]);
    if (hwRes.ok) setData(await hwRes.json());
    if (assignRes.ok) setAssignments(await assignRes.json());
    if (rankRes.ok) {
      const rankData = await rankRes.json();
      setRankings(rankData.rankings || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHomework) {
      await fetch(`/api/homeworks/${editingHomework.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setEditingHomework(null);
    } else if (selectedAssignment) {
      await fetch("/api/homeworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: userId,
          content,
          assignment_id: selectedAssignment.id,
        }),
      });
      setSelectedAssignment(null);
    }
    setContent("");
    fetchData();
  };

  const currentName = studentProfile?.name || userId;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 h-full overflow-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl uppercase">
            {currentName?.[0] || "U"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                你好, {currentName}
              </h1>
              {studentProfile?.cohort_name && (
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-medium text-sm rounded-md border border-blue-100">
                  {studentProfile.cohort_name}
                </span>
              )}
            </div>
            <p className="text-slate-500 mt-1">欢迎来到你的 OPC 个人作业中心。</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
        >
          退出登录
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                待完成的作业任务
              </h2>
            </div>
            <div className="p-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  {a.cohort_name && (
                    <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                      {a.cohort_name}
                    </div>
                  )}
                  <h3 className="font-bold text-slate-900 mb-2 mt-2">
                    {a.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                    {a.description}
                  </p>
                  <button
                    onClick={() => setSelectedAssignment(a)}
                    className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    去写作业
                  </button>
                </div>
              ))}
              {assignments.length === 0 && !loading && (
                <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                  导师目前还没布置任何作业
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">我的提交记录</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.map((hw) => (
                <div
                  key={hw.id}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-slate-400">
                        #{hw.id}
                      </span>
                      <span className="font-medium text-slate-900">
                        {hw.assignment_title || "未分类作业"}
                      </span>
                    </div>
                    <StatusBadge status={hw.status} />
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 whitespace-pre-wrap">
                    {hw.homework_link}
                  </p>

                  <div className="flex items-center justify-between mt-4 text-sm">
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      提交于{" "}
                      {format(new Date(hw.submission_time), "yyyy-MM-dd HH:mm")}
                    </div>

                    {hw.status === "COMPLETED" ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingHomework(hw);
                            setContent(hw.homework_link);
                          }}
                          className="flex items-center gap-1 text-slate-600 font-medium hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" /> 修改重交
                        </button>
                        <Link
                          href={`/homeworks/${hw.id}`}
                          className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-colors"
                        >
                          查阅导师反馈 <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">评审中...</span>
                    )}
                  </div>
                </div>
              ))}

              {data.length === 0 && !loading && (
                <div className="p-12 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LinkIcon className="w-6 h-6 text-slate-300" />
                  </div>
                  <p>暂无提交记录，开启你的第一堂课吧！</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                班级英雄榜
                {studentProfile?.cohort_name && (
                  <span className="text-emerald-600 text-xs font-normal">
                    ({studentProfile.cohort_name})
                  </span>
                )}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {rankings.map((r, i) => (
                <div
                  key={r.student_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                        i === 0
                          ? "bg-amber-100 text-amber-600"
                          : i === 1
                            ? "bg-slate-200 text-slate-600"
                            : i === 2
                              ? "bg-orange-100 text-orange-600"
                              : "bg-slate-50 text-slate-400",
                      )}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        r.student_id === userId
                          ? "text-blue-600 font-bold"
                          : "text-slate-700",
                      )}
                    >
                      {r.name} {r.student_id === userId ? "(你)" : ""}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                    {r.score} 份
                  </div>
                </div>
              ))}
              {rankings.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">
                  榜单暂无数据
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(selectedAssignment || editingHomework) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {editingHomework ? "修改重交作业" : selectedAssignment?.title}
              </h2>
              <div className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded font-mono">
                ID: {userId}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                {!editingHomework && selectedAssignment && (
                  <>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      作业要求
                    </label>
                    <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg leading-relaxed border border-blue-100 mb-4 whitespace-pre-wrap">
                      {selectedAssignment.description}
                    </div>
                  </>
                )}
                {editingHomework && (
                  <div className="mb-4 text-sm text-slate-600">
                    当前正在修改作业记录{" "}
                    <span className="font-mono bg-slate-100 px-1 rounded">
                      #{editingHomework.id}
                    </span>
                  </div>
                )}
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed resize-none"
                  placeholder="在这里开始你的写作之旅..."
                />
              </div>
              <div className="flex justify-end gap-3 font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssignment(null);
                    setEditingHomework(null);
                    setContent("");
                  }}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  草稿箱 / 取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all flex items-center gap-2"
                >
                  确认提交 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cn: string }> = {
    WAITING_REVIEW: { label: "待讲师查阅", cn: "bg-slate-100 text-slate-600" },
    PROCESSING: {
      label: "AI评估中",
      cn: "bg-blue-100 text-blue-700 group-hover:bg-blue-200/50",
    },
    PENDING_AUDIT: { label: "等待导师签发", cn: "bg-amber-100 text-amber-700" },
    COMPLETED: {
      label: "已发回反馈",
      cn: "bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs shadow-sm bg-emerald-50",
    },
    MODIFIED: { label: "已修改重投", cn: "bg-purple-100 text-purple-700" },
  };
  const ui = config[status] || { label: status, cn: "bg-gray-100" };

  return (
    <span
      className={cn(
        "px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider",
        ui.cn,
      )}
    >
      {ui.label}
    </span>
  );
}
