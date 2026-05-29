"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Activity, ServerCrash, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { AgentLog } from "@/types";
import { cn } from "@/lib/utils";
import { InstructorWorkloadStats } from "@/components/pages/InstructorWorkloadStats";

export function Dashboard() {
  const [data, setData] = useState<{
    activeCount: number;
    logs: AgentLog[];
    stats: { total?: number; success?: number };
  } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch("/api/agents/status");
      if (res.ok) setData(await res.json());
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!data)
    return (
      <div className="p-8 text-slate-500 animate-pulse">
        Initializing Agent Core...
      </div>
    );

  const total = data.stats.total || 0;
  const success = data.stats.success || 0;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 100;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Agent 调度与并发管理引擎
        </h1>
        <p className="text-slate-500 mt-2">
          实时监控底层 AI 评审作业的并发状态与成功率。
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            本周个人工作量
          </h2>
          <Link
            href="/workload"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
          >
            查看详情
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <InstructorWorkloadStats compact />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> 活跃并发线程
          </p>
          <div className="text-2xl font-bold mt-1 text-slate-900 flex items-baseline gap-1">
            {data.activeCount}{" "}
            <span className="text-slate-400 text-sm font-medium">/ 5 MAX</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(data.activeCount / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" /> 处理成功率
          </p>
          <p className="text-2xl font-bold mt-1 text-slate-900">{successRate}%</p>
          <p className="text-xs text-blue-600 mt-2 font-medium">稳定运行中</p>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> 历史总处理量
          </p>
          <p className="text-2xl font-bold mt-1 text-slate-900">{total}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ServerCrash className="w-4 h-4 text-slate-500" />
            最近运行日志 (Agent Threads)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium">Thread ID</th>
                <th className="px-6 py-3 font-medium">Homework ID</th>
                <th className="px-6 py-3 font-medium">Execution Time</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {data.logs.map((log) => (
                <tr key={log.log_id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-600">
                    t_worker_{log.agent_thread_id}
                  </td>
                  <td className="px-6 py-3 text-slate-800">
                    #{log.target_homework_id}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {log.execution_time} ms
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider",
                        log.result_state === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {log.result_state}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400">
                    {format(new Date(log.created_at), "HH:mm:ss")}
                  </td>
                </tr>
              ))}
              {data.logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-400 font-sans"
                  >
                    暂无调度日志
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
