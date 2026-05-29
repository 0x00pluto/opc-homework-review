"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Link as LinkIcon,
  ExternalLink,
  BookOpen,
  ArrowRight,
  LineChart,
  Edit3,
  Clock,
  Paperclip,
  Upload,
  X,
  Download,
  CheckCircle2,
  ListTodo,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  HomeworkRecord,
  Assignment,
  Student,
  HomeworkAttachment,
} from "@/types";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/MarkdownContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function parseAttachments(raw: unknown): HomeworkAttachment[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as HomeworkAttachment[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function allowLateSubmit(a: Assignment) {
  return a.allow_late_submit !== 0 && a.allow_late_submit !== false;
}

function getAssignmentDeadlineInfo(a: Assignment) {
  if (!a.deadline_at) {
    return {
      canSubmit: true,
      badge: null as null | { text: string; cn: string },
      borderClass: "",
    };
  }

  const deadline = new Date(a.deadline_at);
  const now = new Date();
  const msLeft = deadline.getTime() - now.getTime();
  const lateAllowed = allowLateSubmit(a);

  if (msLeft <= 0) {
    return {
      canSubmit: lateAllowed,
      badge: lateAllowed
        ? {
            text: "已超时，仍可补交",
            cn: "bg-orange-100 text-orange-700 border-orange-200",
          }
        : { text: "已截止", cn: "bg-red-100 text-red-700 border-red-200" },
      borderClass: lateAllowed
        ? "border-orange-300"
        : "border-red-200 opacity-80",
    };
  }

  const hoursLeft = msLeft / (1000 * 60 * 60);
  if (hoursLeft <= 2) {
    return {
      canSubmit: true,
      badge: { text: "即将截止", cn: "bg-red-100 text-red-700 border-red-200" },
      borderClass: "border-red-300 ring-1 ring-red-100",
    };
  }
  if (hoursLeft <= 24) {
    return {
      canSubmit: true,
      badge: {
        text: "即将截止",
        cn: "bg-amber-100 text-amber-700 border-amber-200",
      },
      borderClass: "border-amber-200",
    };
  }

  return { canSubmit: true, badge: null, borderClass: "" };
}

export function StudentDashboard() {
  const { userId } = useAuth();
  const [data, setData] = useState<HomeworkRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [rankings, setRankings] = useState<
    { student_id: string; name: string; score: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [editingHomework, setEditingHomework] = useState<HomeworkRecord | null>(
    null,
  );
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<HomeworkAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    if (!userId) return;

    let cohort = "";
    const studentRes = await fetch(`/api/students/${userId}`);
    if (studentRes.ok) {
      const profile = await studentRes.json();
      if (profile) {
        setStudentProfile(profile);
        cohort = profile.cohort_name || "";
      }
    }

    const [hwRes, assignRes, rankRes] = await Promise.all([
      fetch(`/api/homeworks/student/${userId}`),
      fetch(
        `/api/assignments${cohort ? `?cohort=${encodeURIComponent(cohort)}` : ""}`,
      ),
      fetch(`/api/students/${userId}/ranking`),
    ]);
    if (hwRes.ok) setData(await hwRes.json());
    if (assignRes.ok) setAssignments(await assignRes.json());
    if (rankRes.ok) {
      const rankData = await rankRes.json();
      setRankings(rankData.rankings || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- poll homework list
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [userId]);

  const resetModal = () => {
    setSelectedAssignment(null);
    setEditingHomework(null);
    setContent("");
    setAttachments([]);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (res.ok) {
        const uploaded = await res.json();
        setAttachments((prev) => [
          ...prev,
          {
            id: uploaded.id,
            original_name: uploaded.original_name,
            stored_name: uploaded.stored_name,
            mime_type: uploaded.mime_type,
            size: uploaded.size,
          },
        ]);
      } else {
        const err = await res.json();
        alert(err.error || `上传失败: ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const textContent = content.trim();
    if (!textContent && attachments.length === 0) {
      alert("请填写文本内容或上传至少一个附件");
      return;
    }

    if (editingHomework) {
      const res = await fetch(`/api/homeworks/${editingHomework.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textContent, attachments }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "提交失败");
        return;
      }
    } else if (selectedAssignment) {
      const res = await fetch("/api/homeworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: userId,
          content: textContent,
          assignment_id: selectedAssignment.id,
          attachments,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "提交失败");
        return;
      }
    }

    resetModal();
    fetchData();
  };

  const openEdit = (hw: HomeworkRecord) => {
    setEditingHomework(hw);
    setContent(hw.homework_link);
    setAttachments(parseAttachments(hw.attachments));
    setSelectedAssignment(null);
  };

  const currentName = studentProfile?.name || userId;

  const submittedAssignmentIds = new Set(
    data
      .map((hw) => hw.assignment_id)
      .filter((id): id is number => typeof id === "number"),
  );
  const pendingAssignments = assignments.filter(
    (a) => !submittedAssignmentIds.has(a.id),
  );
  const completedCount = data.filter((hw) => hw.status === "COMPLETED").length;

  const submitDialogOpen = !!(selectedAssignment || editingHomework);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          个人作业中心
        </h1>
        <p className="text-slate-500 mt-2">
          你好，{currentName}
          {studentProfile?.cohort_name && (
            <span className="text-slate-400">
              {" "}
              · {studentProfile.cohort_name}
            </span>
          )}
          。在这里提交作业、查看评审进度与导师反馈。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 uppercase text-xs font-semibold tracking-wider">
              <ListTodo className="w-4 h-4 text-amber-500" />
              待完成
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {pendingAssignments.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 uppercase text-xs font-semibold tracking-wider">
              <Send className="w-4 h-4 text-blue-500" />
              已提交
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">{data.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 uppercase text-xs font-semibold tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              已反馈
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {completedCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <BookOpen className="w-5 h-5 text-blue-600" />
                待完成的作业任务
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {pendingAssignments.map((a) => {
                const deadlineInfo = getAssignmentDeadlineInfo(a);
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "border rounded-xl p-5 transition-all relative overflow-hidden",
                      deadlineInfo.borderClass || "border-slate-200",
                    )}
                  >
                    {a.cohort_name && (
                      <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                        {a.cohort_name === "全服" ? "全员" : a.cohort_name}
                      </div>
                    )}
                    <h3 className="font-bold text-slate-900 mb-2 pr-16">
                      {a.title}
                    </h3>
                    <div className="line-clamp-2 overflow-hidden mb-3">
                      <MarkdownContent
                        content={a.description}
                        className="prose-sm prose-p:text-slate-500"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {a.deadline_at && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          截止 {format(new Date(a.deadline_at), "MM-dd HH:mm")}
                        </span>
                      )}
                      {deadlineInfo.badge && (
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-md border font-medium",
                            deadlineInfo.badge.cn,
                          )}
                        >
                          {deadlineInfo.badge.text}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant={deadlineInfo.canSubmit ? "secondary" : "outline"}
                      className="w-full"
                      disabled={!deadlineInfo.canSubmit}
                      onClick={() => {
                        if (!deadlineInfo.canSubmit) return;
                        setSelectedAssignment(a);
                        setEditingHomework(null);
                        setContent("");
                        setAttachments([]);
                      }}
                    >
                      {deadlineInfo.canSubmit ? "去写作业" : "已截止，不可提交"}
                    </Button>
                  </div>
                );
              })}
              {!loading && assignments.length === 0 && (
                <p className="py-8 text-center text-slate-400 text-sm">
                  导师目前还没布置任何作业
                </p>
              )}
              {!loading &&
                assignments.length > 0 &&
                pendingAssignments.length === 0 && (
                  <p className="py-8 text-center text-slate-400 text-sm">
                    当前布置的作业均已提交，可在下方记录中修改或查看反馈
                  </p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-slate-800">我的提交记录</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {data.map((hw) => {
                  const hwAttachments = parseAttachments(hw.attachments);
                  return (
                    <div
                      key={hw.id}
                      className="p-6 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="flex items-center gap-3 flex-wrap min-w-0">
                          <span className="font-mono text-sm text-slate-400 shrink-0">
                            #{hw.id}
                          </span>
                          <span className="font-medium text-slate-900">
                            {hw.assignment_title || "未分类作业"}
                          </span>
                          {(hw.is_late === 1 || hw.is_late === true) && (
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                              逾期提交
                            </span>
                          )}
                        </div>
                        <StatusBadge status={hw.status} />
                      </div>
                      {hw.homework_link && (
                        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 whitespace-pre-wrap">
                          {hw.homework_link}
                        </p>
                      )}
                      {hwAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {hwAttachments.map((att) => (
                            <a
                              key={att.id}
                              href={`/api/uploads/${encodeURIComponent(att.stored_name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100"
                            >
                              <Paperclip className="w-3 h-3" />
                              {att.original_name}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 text-sm flex-wrap gap-3">
                        <div className="text-slate-500 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                          提交于{" "}
                          {format(
                            new Date(hw.submission_time),
                            "yyyy-MM-dd HH:mm",
                          )}
                        </div>

                        {hw.status === "COMPLETED" ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(hw)}
                            >
                              <Edit3 className="w-4 h-4" />
                              修改重交
                            </Button>
                            <Link
                              href={`/homeworks/${hw.id}`}
                              className={cn(
                                buttonVariants({ size: "sm" }),
                                "inline-flex gap-1.5",
                              )}
                            >
                              查阅导师反馈
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            评审中...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {data.length === 0 && !loading && (
                  <div className="p-12 text-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LinkIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <p>暂无提交记录，开启你的第一堂课吧！</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0">
          <Card className="bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <LineChart className="w-5 h-5 text-indigo-600" />
                成长轨迹
              </CardTitle>
              <CardDescription>
                作业历史、得分趋势与能力雷达
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/growth"
                className={cn(
                  buttonVariants(),
                  "w-full inline-flex gap-1.5",
                )}
              >
                查看成长数据
                <ArrowRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-100 bg-emerald-50/50">
              <CardTitle className="text-sm text-slate-800">
                班级英雄榜
                {studentProfile?.cohort_name && (
                  <span className="text-emerald-600 font-normal ml-1">
                    ({studentProfile.cohort_name})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {rankings.map((r, i) => (
                <div
                  key={r.student_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0",
                        i === 0
                          ? "bg-amber-100 text-amber-600"
                          : i === 1
                            ? "bg-slate-200 text-slate-600"
                            : i === 2
                              ? "bg-orange-100 text-orange-600"
                              : "bg-slate-50 text-slate-400",
                      )}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        r.student_id === userId
                          ? "text-blue-600 font-bold"
                          : "text-slate-700",
                      )}
                    >
                      {r.name} {r.student_id === userId ? "(你)" : ""}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded shrink-0">
                    {r.score} 份
                  </div>
                </div>
              ))}
              {rankings.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  榜单暂无数据
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={submitDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetModal();
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingHomework ? "修改重交作业" : selectedAssignment?.title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!editingHomework && selectedAssignment && (
              <>
                <div>
                  <Label className="mb-2">作业要求</Label>
                  <div className="p-4 bg-blue-50 text-blue-900 rounded-lg border border-blue-100 max-h-48 overflow-y-auto">
                    <MarkdownContent
                      content={selectedAssignment.description}
                      className="prose-sm prose-headings:text-blue-900 prose-p:text-blue-800 prose-strong:text-blue-900 prose-li:text-blue-800"
                    />
                  </div>
                </div>
                {selectedAssignment.deadline_at && (
                  <p className="text-sm text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    截止时间：{" "}
                    {format(
                      new Date(selectedAssignment.deadline_at),
                      "yyyy-MM-dd HH:mm",
                    )}
                  </p>
                )}
              </>
            )}
            {editingHomework && (
              <p className="text-sm text-slate-600">
                当前正在修改作业记录{" "}
                <span className="font-mono bg-slate-100 px-1 rounded">
                  #{editingHomework.id}
                </span>
              </p>
            )}
            <div>
              <Label htmlFor="hw-content" className="mb-2">
                文本内容（可选）
              </Label>
              <Textarea
                id="hw-content"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在这里开始你的写作之旅..."
                className="resize-none"
              />
            </div>

            <div>
              <Label className="mb-2">附件上传（PDF / Word / Excel / 图片）</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                {uploading
                  ? "上传中..."
                  : "点击选择文件（可多选，单文件最大 10MB）"}
              </Button>
              {attachments.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      <span className="flex items-center gap-2 truncate text-slate-700">
                        <Download className="w-4 h-4 text-slate-400 shrink-0" />
                        {att.original_name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeAttachment(att.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <DialogFooter className="border-0 bg-transparent p-0 -mx-0 -mb-0">
              <Button type="button" variant="outline" onClick={resetModal}>
                取消
              </Button>
              <Button type="submit" disabled={uploading}>
                确认提交
                <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cn: string }> = {
    WAITING_REVIEW: { label: "待讲师查阅", cn: "bg-slate-100 text-slate-600" },
    PROCESSING: {
      label: "AI评估中",
      cn: "bg-blue-100 text-blue-700",
    },
    PENDING_AUDIT: { label: "等待导师签发", cn: "bg-amber-100 text-amber-700" },
    COMPLETED: {
      label: "已发回反馈",
      cn: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },
    MODIFIED: { label: "已修改重投", cn: "bg-purple-100 text-purple-700" },
  };
  const ui = config[status] || { label: status, cn: "bg-gray-100" };

  return (
    <span
      className={cn(
        "px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider shrink-0",
        ui.cn,
      )}
    >
      {ui.label}
    </span>
  );
}
