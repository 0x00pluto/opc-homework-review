"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, BookOpen } from "lucide-react";
import { Assignment } from "@/types";

export function InstructorAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cohorts, setCohorts] = useState<{ id: number; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    cohort_name: "全员",
  });

  const fetchData = async () => {
    const [assRes, coRes] = await Promise.all([
      fetch("/api/assignments"),
      fetch("/api/cohorts"),
    ]);
    if (assRes.ok) setAssignments(await assRes.json());
    if (coRes.ok) setCohorts(await coRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ title: "", description: "", cohort_name: "全员" });
    fetchData();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            作业库管理
          </h1>
          <p className="text-slate-500 mt-1">创建和管理分发给学员的作业任务。</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建新作业
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 line-clamp-1">
                  {a.title}
                </h3>
              </div>
              {a.cohort_name && (
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium border border-slate-200">
                  {a.cohort_name}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
              {a.description}
            </p>
            <div className="text-xs text-slate-400 font-mono">
              创建于: {format(new Date(a.created_at), "yyyy-MM-dd HH:mm")}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-4">发布新作业</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  班级 (留空默认全员)
                </label>
                <select
                  value={form.cohort_name}
                  onChange={(e) =>
                    setForm({ ...form, cohort_name: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="全员">所有人 (全员)</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  作业标题
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g. Day 3: 个人品牌定位"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  作业要求明细
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="在这里输入作业的具体要求和注意事项..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  确认发布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
