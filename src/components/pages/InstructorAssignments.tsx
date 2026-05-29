"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, BookOpen, Pencil, Trash2, Clock, FileText, Eye } from "lucide-react";
import { Assignment } from "@/types";
import { MarkdownContent } from "@/components/MarkdownContent";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

function getDefaultDeadlineLocal() {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T20:00`;
}

function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return getDefaultDeadlineLocal();
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = () => ({
  title: "",
  description: "",
  cohort_name: "全员",
  deadline_at: getDefaultDeadlineLocal(),
  allow_late_submit: true,
});

export function InstructorAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cohorts, setCohorts] = useState<{ id: number; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());

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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (a: Assignment) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      description: a.description,
      cohort_name: a.cohort_name === "全服" ? "全员" : a.cohort_name || "全员",
      deadline_at: toDatetimeLocalValue(a.deadline_at),
      allow_late_submit:
        a.allow_late_submit !== 0 && a.allow_late_submit !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该作业？已有学员提交时将无法删除。")) return;
    const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "删除失败");
      return;
    }
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      cohort_name: form.cohort_name,
      deadline_at: new Date(form.deadline_at).toISOString(),
      allow_late_submit: form.allow_late_submit,
    };

    const res = editingId
      ? await fetch(`/api/assignments/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "保存失败");
      return;
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
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
          onClick={openCreate}
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
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 line-clamp-1">
                  {a.title}
                </h3>
              </div>
              {a.cohort_name && (
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium border border-slate-200 shrink-0 ml-2">
                  {a.cohort_name === "全服" ? "全员" : a.cohort_name}
                </span>
              )}
            </div>
            <div className="line-clamp-3 overflow-hidden mb-4">
              <MarkdownContent content={a.description} className="prose-sm" />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {a.deadline_at && (
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  截止 {format(new Date(a.deadline_at), "MM-dd HH:mm")}
                </span>
              )}
              <span className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded-md border border-slate-100">
                {a.allow_late_submit === 0 || a.allow_late_submit === false
                  ? "超时不可提交"
                  : "超时仍可补交"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400 font-mono">
                创建于: {format(new Date(a.created_at), "yyyy-MM-dd HH:mm")}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(a)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="编辑"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "编辑作业" : "发布新作业"}
            </h2>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  作业要求明细
                  <span className="text-slate-400 font-normal ml-1">
                    （支持 Markdown）
                  </span>
                </label>
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="edit" className="flex-1 gap-1.5">
                      <FileText className="size-4" />
                      编辑
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex-1 gap-1.5">
                      <Eye className="size-4" />
                      预览
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" keepMounted className="mt-3">
                    <textarea
                      required
                      rows={10}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring/50 focus:border-ring outline-none resize-none font-mono bg-background"
                      placeholder={
                        "支持 Markdown，例如：\n## 任务目标\n- 完成个人品牌定位\n- **不少于 200 字**\n\n> 参考 Day2 手册第三页"
                      }
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-3">
                    <div className="min-h-[240px] rounded-lg border border-input bg-muted/30 p-4 overflow-y-auto">
                      {form.description.trim() ? (
                        <MarkdownContent
                          content={form.description}
                          className="prose-sm"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-12">
                          暂无内容，请先在「编辑」页输入 Markdown
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  截止时间
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.deadline_at}
                  onChange={(e) =>
                    setForm({ ...form, deadline_at: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  新建时默认当天 20:00
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allow_late_submit}
                  onChange={(e) =>
                    setForm({ ...form, allow_late_submit: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                允许逾期提交（超时后标记为逾期，由讲师决定是否收取）
              </label>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  {editingId ? "保存修改" : "确认发布"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
