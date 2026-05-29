"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Database, Quote, FileText, Trash2 } from "lucide-react";
import { KnowledgeBase } from "@/types";
import { cn } from "@/lib/utils";

export function InstructorKnowledgeBase() {
  const [kbList, setKbList] = useState<KnowledgeBase[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "manual",
  });

  const fetchKb = async () => {
    const res = await fetch("/api/knowledge-base");
    if (res.ok) {
      setKbList(await res.json());
    }
  };

  useEffect(() => {
    fetchKb();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/knowledge-base", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ title: "", content: "", type: "manual" });
    fetchKb();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这篇知识库文章吗？")) return;
    await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
    fetchKb();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            评卷知识库预训练
          </h1>
          <p className="text-slate-500 mt-1">
            上传 OPC 方法论、作业标准答案、参考案例等，用于校准 AI 评审标准。
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          录入知识库
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {kbList.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm hover:shadow-md transition-shadow h-[280px]"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.type === "manual" ? (
                  <FileText className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Quote className="w-4 h-4 text-purple-500" />
                )}
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded",
                    item.type === "manual"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-purple-50 text-purple-700",
                  )}
                >
                  {item.type === "manual"
                    ? "OPC 手册 / 规则"
                    : "标答 / 范例素材"}
                </span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-hidden flex flex-col">
              <h3 className="font-bold text-slate-800 line-clamp-1 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed flex-1">
                {item.content}
              </p>
            </div>
            <div className="px-5 py-3 border-t border-slate-50 text-xs text-slate-400 font-mono bg-slate-50/50 rounded-b-xl">
              收录于 {format(new Date(item.created_at), "yyyy-MM-dd HH:mm")}
            </div>
          </div>
        ))}
        {kbList.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400">
            <Database className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p>
              知识库是空的，AI 目前采用通用标准评判（可能会有偏差）。
              <br />
              请尽快录入 OPC 特有的评判手册。空降知识库内容到这里。
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-4">录入新知识</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    标题名称
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g. 职业定位三法则 / Day2 满分学员范例"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    知识类型
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="manual">规则 / 手册</option>
                    <option value="standard_answer">标答 / 范例</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  详细内容 (将作为 AI 上下文)
                </label>
                <textarea
                  required
                  rows={10}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono"
                  placeholder="如果是范例，直接粘贴原文。如果是规则，建议分点罗列："
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
                >
                  <Database className="w-4 h-4" /> 保存并生效入队列
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
