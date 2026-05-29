"use client";

import { useEffect, useState } from "react";
import { Users2, Plus, Edit2, Trash2 } from "lucide-react";

export function InstructorCohorts() {
  const [cohorts, setCohorts] = useState<{ id: number; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: 0, name: "" });

  const fetchCohorts = async () => {
    const res = await fetch("/api/cohorts");
    if (res.ok) {
      setCohorts(await res.json());
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.id) {
      await fetch(`/api/cohorts/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      });
    } else {
      await fetch("/api/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      });
    }
    setShowModal(false);
    setForm({ id: 0, name: "" });
    fetchCohorts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除该班级？这不会同时删除该班级下已有的学员。"))
      return;
    await fetch(`/api/cohorts/${id}`, { method: "DELETE" });
    fetchCohorts();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">班级管理</h1>
          <p className="text-slate-500 mt-1">创建和维护不同期次的营期信息</p>
        </div>
        <button
          onClick={() => {
            setForm({ id: 0, name: "" });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 新建班级
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 font-medium text-slate-600 text-sm">
          <div className="col-span-2">班级名称</div>
          <div className="text-right">操作</div>
        </div>
        <div className="divide-y divide-slate-100">
          {cohorts.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-3 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-2 flex items-center gap-3 font-medium text-slate-800">
                <Users2 className="w-4 h-4 text-slate-400" />
                {c.name}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setForm({ id: c.id, name: c.name });
                    setShowModal(true);
                  }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {cohorts.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              目前没有任何班级数据
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {form.id ? "编辑班级" : "新建班级"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  班级名称
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="如: 第1期"
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
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
