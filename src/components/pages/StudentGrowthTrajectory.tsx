"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  LineChart as LineChartIcon,
  History,
  Radar as RadarIcon,
  Lightbulb,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import type { GrowthStatsResponse } from "@/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_LABELS: Record<string, { label: string; cn: string }> = {
  WAITING_REVIEW: { label: "等待判作业", cn: "bg-slate-100 text-slate-600" },
  PROCESSING: { label: "AI 评审中", cn: "bg-amber-100 text-amber-700" },
  PENDING_AUDIT: { label: "等待审核", cn: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "已发布", cn: "bg-emerald-100 text-emerald-700" },
  MODIFIED: { label: "已修改重投", cn: "bg-purple-100 text-purple-700" },
};

export function StudentGrowthTrajectory() {
  const { userId } = useAuth();
  const [data, setData] = useState<GrowthStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    setLoading(true);
    fetch(`/api/students/${userId}/growth`)
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
      <div className="max-w-6xl text-slate-400 animate-pulse">
        加载成长轨迹...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl text-slate-500">
        无法加载成长数据，请稍后重试。
      </div>
    );
  }

  const radarChartData = data.radar.map((d) => ({
    subject: d.dimension,
    score: d.score,
    fullMark: 100,
  }));

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          成长轨迹
        </h1>
        <p className="text-slate-500 mt-2">
          系统自动汇总作业历史、得分趋势与能力画像，无需手动填写。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-blue-600" />
            得分趋势
          </CardTitle>
          <CardDescription>已发布作业的 AI 综合得分变化</CardDescription>
        </CardHeader>
        <CardContent>
          {data.scoreTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              暂无已发布作业的得分数据，完成作业并经导师发布后可查看趋势。
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(new Date(v), "MM/dd")}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(v) =>
                      format(new Date(String(v)), "yyyy-MM-dd")
                    }
                    formatter={(value, _name, item) => [
                      `${value} 分`,
                      (item?.payload as { assignmentTitle?: string })
                        ?.assignmentTitle || "作业",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RadarIcon className="w-5 h-5 text-indigo-600" />
              能力雷达图
            </CardTitle>
            <CardDescription>近 5 次已发布作业各维度平均分</CardDescription>
          </CardHeader>
          <CardContent>
            {data.radar.every((d) => d.score === 0) ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                暂无能力维度数据
              </p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="能力分"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              能力提升建议
            </CardTitle>
            <CardDescription>根据薄弱维度自动生成</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-700 leading-relaxed pl-3 border-l-2 border-amber-200"
                >
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            作业完成历史
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">作业</th>
                  <th className="px-4 py-3 text-left font-medium">状态</th>
                  <th className="px-4 py-3 text-left font-medium">提交时间</th>
                  <th className="px-4 py-3 text-right font-medium">得分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.history.map((h) => {
                  const st = STATUS_LABELS[h.status] || {
                    label: h.status,
                    cn: "bg-slate-100 text-slate-600",
                  };
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {h.assignment_title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-md font-medium",
                            st.cn,
                          )}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {format(new Date(h.submission_time), "yyyy-MM-dd HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {h.score != null ? `${h.score}` : "—"}
                      </td>
                    </tr>
                  );
                })}
                {data.history.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      暂无作业记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
