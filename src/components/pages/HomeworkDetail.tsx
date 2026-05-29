"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Bot,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export function HomeworkDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [data, setData] = useState<{
    homework: {
      student_id: string;
      assignment_title?: string;
      homework_link: string;
      status: string;
    };
    feedback?: {
      feedback_content: string;
      is_low_quality: number | boolean;
    };
  } | null>(null);

  useEffect(() => {
    fetch(`/api/homeworks/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  const handlePublish = async () => {
    await fetch(`/api/homeworks/${id}/publish`, { method: "POST" });
    router.push("/homeworks");
  };

  const handleRetrigger = async () => {
    await fetch(`/api/homeworks/${id}/retrigger`, { method: "POST" });
    router.push("/homeworks");
  };

  if (!data)
    return (
      <div className="p-8 animate-pulse text-slate-400">Loading sandbox...</div>
    );

  const { homework, feedback } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              作业详情沙盒
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              学员 {homework.student_id} • 任务:{" "}
              {homework.assignment_title || "未分类作业"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {homework.status === "MODIFIED" && (
            <button
              onClick={handleRetrigger}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <Bot className="w-4 h-4" />
              触发 AI 重新评卷
            </button>
          )}

          {(homework.status === "PENDING_AUDIT" ||
            homework.status === "MODIFIED") && (
            <button
              onClick={handlePublish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              讲师确认无误，下发反馈
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-800">学员原文内容</h3>
          </div>
          <div className="p-6 overflow-y-auto flex-1 prose prose-slate">
            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
              {homework.homework_link}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl flex flex-col shadow-sm overflow-hidden relative">
          <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-800">AI 智能分析与建议</h3>
            </div>
            {feedback?.is_low_quality === 1 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 font-medium text-xs rounded-full border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                质量警告 (可能涉嫌机翻/逻辑矛盾)
              </span>
            )}
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {feedback ? (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="prose prose-slate prose-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {feedback.feedback_content}
                  </div>
                </div>

                {homework.status === "PENDING_AUDIT" && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      讲师批注区 (可选)
                    </p>
                    <textarea
                      className="w-full bg-white border border-blue-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                      placeholder="在此处追加人工反馈..."
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                AI 尚未完成反馈或已失败结束。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
