"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Student } from "@/types";

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [cohorts, setCohorts] = useState<{ id: number; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalId, setOriginalId] = useState("");
  const [form, setForm] = useState({
    student_id: "",
    name: "",
    cohort_name: "",
    password: "",
  });

  const fetchData = async () => {
    const [stRes, coRes] = await Promise.all([
      fetch("/api/students"),
      fetch("/api/cohorts"),
    ]);
    if (stRes.ok) setStudents(await stRes.json());
    if (coRes.ok) {
      const cohortList = await coRes.json();
      setCohorts(cohortList);
      if (cohortList.length > 0 && !form.cohort_name) {
        setForm((f) => ({ ...f, cohort_name: cohortList[0].name }));
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await fetch(`/api/students/${originalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          cohort_name: form.cohort_name,
          new_student_id: form.student_id,
          password: form.password,
        }),
      });
    } else {
      await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm("确认删除该学员？")) return;
    await fetch(`/api/students/${studentId}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">学员管理</h1>
          <p className="text-slate-500 mt-1">
            管理学员信息，包括修改密码及绑定班级
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setForm({
              student_id: "",
              name: "",
              cohort_name: cohorts[0]?.name || "",
              password: "",
            });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          录入新学员
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 font-medium text-slate-600 text-sm">
          <div className="col-span-2">姓名 / 学号</div>
          <div className="text-center">归属班级</div>
          <div className="text-right">操作</div>
        </div>
        <div className="divide-y divide-slate-100">
          {students.map((s) => (
            <div
              key={s.student_id}
              className="grid grid-cols-4 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group"
            >
              <div className="col-span-2">
                <div className="font-medium text-slate-900">{s.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {s.student_id}
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 font-medium rounded">
                  {s.cohort_name}
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setOriginalId(s.student_id);
                    setForm({
                      student_id: s.student_id,
                      name: s.name,
                      cohort_name: s.cohort_name,
                      password: "",
                    });
                    setShowModal(true);
                  }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.student_id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              目前没有任何学员数据
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "编辑学员" : "录入新学员"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  班级 (仅限已创建的班级)
                </label>
                <select
                  value={form.cohort_name}
                  onChange={(e) =>
                    setForm({ ...form, cohort_name: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {cohorts.length === 0 && (
                    <option value="">无班级，请先去创建班级</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  学员姓名
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="如: 张三"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  登录账号 / 学号
                </label>
                <input
                  type="text"
                  required
                  value={form.student_id}
                  onChange={(e) =>
                    setForm({ ...form, student_id: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="如: stu_001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  登录密码 {isEditing && "(不填写则不修改)"}
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="默认: 123456"
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
                  disabled={cohorts.length === 0}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
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
