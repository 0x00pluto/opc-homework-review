"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  RotateCcw,
  Bot,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { WorkloadStatsResponse } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InstructorWorkloadStats({ compact = false }: { compact?: boolean }) {
  const { userId } = useAuth();
  const [data, setData] = useState<WorkloadStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    setLoading(true);
    fetch(`/api/instructors/${encodeURIComponent(userId)}/workload`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className={compact ? "text-slate-400 text-sm animate-pulse" : "py-12 text-slate-400 animate-pulse"}>
        加载工作量统计...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-slate-500 text-sm">无法加载工作量数据</div>
    );
  }

  const weekLabel = `${format(new Date(data.weekRange.start), "MM/dd")} – ${format(new Date(data.weekRange.end), "MM/dd")}`;

  const kpis = [
    {
      title: "本周审核作业",
      value: data.weeklyReviewedCount,
      unit: "份",
      icon: ClipboardList,
      color: "text-blue-600",
    },
    {
      title: "平均审核时长",
      value: data.avgReviewDurationMinutes,
      unit: "分钟",
      icon: Clock,
      color: "text-amber-600",
    },
    {
      title: "打回重评比例",
      value: Math.round(data.reReviewRatio * 100),
      unit: "%",
      icon: RotateCcw,
      color: "text-orange-600",
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.title}
              className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm"
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${k.color}`} />
                {k.title}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {k.value}
                <span className="text-sm font-medium text-slate-400 ml-1">
                  {k.unit}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex gap-1.5",
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            返回仪表盘
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              工作量统计
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              仅展示您的个人审核数据 · 本周 {weekLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.title}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 uppercase text-xs font-semibold tracking-wider">
                  <Icon className={`w-4 h-4 ${k.color}`} />
                  {k.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  {k.value}
                  <span className="text-base font-medium text-slate-400 ml-1">
                    {k.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="w-5 h-5 text-slate-500" />
            补充指标
          </CardTitle>
          <CardDescription>
            AI 多轮评审占比（同一作业存在多条 AI 反馈记录），与讲师主动打回区分
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-slate-900">
            {Math.round(data.aiMultiRoundRatio * 100)}
            <span className="text-base font-medium text-slate-400 ml-1">%</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
