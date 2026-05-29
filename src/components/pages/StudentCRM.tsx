"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Users2, LineChart } from "lucide-react";
import { Student } from "@/types";

const mockRadarData = [
  { subject: "逻辑自洽", A: 85, fullMark: 100 },
  { subject: "情绪共鸣", A: 65, fullMark: 100 },
  { subject: "执行力", A: 90, fullMark: 100 },
  { subject: "结构化表达", A: 70, fullMark: 100 },
  { subject: "OPC理念理解", A: 80, fullMark: 100 },
];

export function StudentCRM() {
  const [students, setStudents] = useState<Student[]>([]);

  const fetchData = async () => {
    const stRes = await fetch("/api/students");
    if (stRes.ok) setStudents(await stRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            学员画像与成长轨迹
          </h1>
          <p className="text-slate-500 mt-2">
            宏观调控大龄转型人群的心智模型与作业高频错误点反哺。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Users2 className="w-5 h-5 text-blue-500" />
              学员列表概览
            </h2>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {students.map((s) => (
              <div
                key={s.student_id}
                className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{s.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 font-medium rounded">
                      {s.cohort_name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1">
                    学号: {s.student_id}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-700">
                      {s.hw_count} 份
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      历史提交
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {students.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                暂无学员数据
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-900 text-white border border-blue-950 rounded-xl shadow-lg p-6 relative overflow-hidden h-[600px] flex flex-col">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-800 rounded-full opacity-30"></div>
          <h2 className="font-semibold text-white flex items-center gap-2 mb-6 relative z-10">
            <LineChart className="w-5 h-5 text-blue-300" />
            常见问题雷达图 (Global Average)
          </h2>
          <div className="flex-1 relative z-10 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="70%"
                data={mockRadarData}
              >
                <PolarGrid stroke="#1e3a8a" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#bfdbfe", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e3a8a",
                    border: "1px solid #1e40af",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Radar
                  name="平均分"
                  dataKey="A"
                  stroke="#60a5fa"
                  fill="#60a5fa"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-blue-200 text-sm relative z-10">
            本周期普遍{" "}
            <span className="text-white font-bold px-1">情绪共鸣</span>{" "}
            存在短板，建议教研增加共情训练。
          </div>
        </div>
      </div>
    </div>
  );
}
