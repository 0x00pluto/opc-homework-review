"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { HomeworkRecord } from "@/types";
import { cn } from "@/lib/utils";

export function HomeworkCenter() {
  const [data, setData] = useState<HomeworkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await fetch("/api/homeworks");
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            作业大厅
          </h1>
          <p className="text-slate-500 mt-1">
            全局检视所有学员提交的 OPC 作业记录。
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">ID / 作业</th>
              <th className="px-6 py-4">学员ID</th>
              <th className="px-6 py-4">提交时间</th>
              <th className="px-6 py-4">状态</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((hw) => (
              <tr key={hw.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-slate-400 text-xs mb-0.5">
                    #{hw.id}
                  </div>
                  <div className="font-medium text-slate-800 line-clamp-1">
                    {hw.assignment_title || "未分类作业"}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {hw.student_id}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {format(new Date(hw.submission_time), "yyyy-MM-dd HH:mm")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={hw.status} />
                    {(hw.is_late === 1 || hw.is_late === true) && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                        逾期
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {hw.status !== "WAITING_REVIEW" &&
                    hw.status !== "PROCESSING" && (
                      <Link
                        href={`/homeworks/${hw.id}`}
                        className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100"
                      >
                        查阅分析沙盒
                      </Link>
                    )}
                  {hw.status === "WAITING_REVIEW" && (
                    <span className="text-slate-400 text-sm">
                      等待调度中...
                    </span>
                  )}
                  {hw.status === "PROCESSING" && (
                    <span className="text-emerald-500 text-sm font-bold flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>{" "}
                      AI 批阅中
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  目前没有任何作业提交
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cn: string }> = {
    WAITING_REVIEW: { label: "待处理", cn: "bg-slate-100 text-slate-600" },
    PROCESSING: { label: "AI批阅中", cn: "bg-blue-100 text-blue-700" },
    PENDING_AUDIT: { label: "等待审核", cn: "bg-amber-100 text-amber-700" },
    COMPLETED: { label: "已发布", cn: "bg-emerald-100 text-emerald-700" },
    MODIFIED: { label: "已修改", cn: "bg-purple-100 text-purple-700" },
  };
  const ui = config[status] || { label: status, cn: "bg-gray-100" };

  return (
    <span
      className={cn("px-2.5 py-1 text-xs font-medium rounded-full", ui.cn)}
    >
      {ui.label}
    </span>
  );
}
