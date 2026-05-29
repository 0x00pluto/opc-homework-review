"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Bot,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Paperclip,
  Download,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { HomeworkAttachment } from "@/types";

export function HomeworkDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { role, userId } = useAuth();
  const isInstructor = role === "instructor";

  const [data, setData] = useState<{
    homework: {
      student_id: string;
      assignment_title?: string;
      homework_link: string;
      status: string;
      attachments?: HomeworkAttachment[];
    };
    feedback?: {
      feedback_content: string;
      is_low_quality: number | boolean;
      instructor_notes?: string;
    } | null;
  } | null>(null);

  const [instructorNotes, setInstructorNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const fetchData = () => {
    const roleParam = role === "student" ? "?role=student" : "";
    fetch(`/api/homeworks/${id}${roleParam}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        if (res.feedback?.instructor_notes) {
          setInstructorNotes(res.feedback.instructor_notes);
        }
      });
  };

  useEffect(() => {
    if (role) fetchData();
  }, [id, role]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesSaved(false);
    const res = await fetch(`/api/homeworks/${id}/feedback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructor_notes: instructorNotes }),
    });
    setSavingNotes(false);
    if (res.ok) {
      setNotesSaved(true);
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "保存失败");
    }
  };

  const handlePublish = async () => {
    await fetch(`/api/homeworks/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructor_id: userId }),
    });
    router.push("/homeworks");
  };

  const handleRetrigger = async () => {
    await fetch(`/api/homeworks/${id}/retrigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructor_id: userId }),
    });
    router.push("/homeworks");
  };

  if (!data)
    return (
      <div className="p-8 animate-pulse text-slate-400">Loading sandbox...</div>
    );

  const { homework, feedback } = data;
  const attachments = homework.attachments ?? [];
  const canEditNotes =
    isInstructor &&
    (homework.status === "PENDING_AUDIT" || homework.status === "MODIFIED");

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
              {isInstructor ? "作业详情沙盒" : "导师反馈详情"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isInstructor
                ? `学员 ${homework.student_id} • 任务: ${homework.assignment_title || "未分类作业"}`
                : homework.assignment_title || "未分类作业"}
            </p>
          </div>
        </div>

        {isInstructor && (
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
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-800">学员提交内容</h3>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {homework.homework_link ? (
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {homework.homework_link}
              </p>
            ) : (
              <p className="text-slate-400 text-sm italic">（无文本内容）</p>
            )}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4" />
                  附件 ({attachments.length})
                </p>
                {attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`/api/uploads/${encodeURIComponent(att.stored_name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span className="truncate">{att.original_name}</span>
                  </a>
                ))}
              </div>
            )}
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
                质量警告
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

                {(feedback.instructor_notes || canEditNotes) && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <p className="text-sm text-emerald-800 font-medium flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      导师补充评语
                    </p>
                    {canEditNotes ? (
                      <>
                        <textarea
                          value={instructorNotes}
                          onChange={(e) => {
                            setInstructorNotes(e.target.value);
                            setNotesSaved(false);
                          }}
                          className="w-full bg-white border border-emerald-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          rows={4}
                          placeholder="在此处追加人工反馈..."
                        />
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={handleSaveNotes}
                            disabled={savingNotes}
                            className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {savingNotes ? "保存中..." : "保存批注"}
                          </button>
                          {notesSaved && (
                            <span className="text-xs text-emerald-600">
                              已保存
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      feedback.instructor_notes && (
                        <div className="p-3 bg-white rounded-md border border-emerald-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {feedback.instructor_notes}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                {isInstructor
                  ? "AI 尚未完成反馈或已失败结束。"
                  : "导师尚未下发反馈，请耐心等待。"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
