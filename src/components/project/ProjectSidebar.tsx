"use client";

import {
  CheckCircle2, Circle, Lock, AlertCircle,
  BookOpen, ChevronDown, ChevronUp, X, ListChecks,
} from "lucide-react";
import { useState } from "react";
import type { Project, ProjectTask } from "@/types";

interface ProjectSidebarProps {
  project: Project;
  tasks: ProjectTask[];
  currentTask?: ProjectTask;
  completedCount: number;
  onClose?: () => void; // 移动端抽屉模式下提供
}

export function ProjectSidebar({
  project,
  tasks,
  currentTask,
  completedCount,
  onClose,
}: ProjectSidebarProps) {
  const [showQuestion, setShowQuestion] = useState(true);
  const [showDetail, setShowDetail] = useState(true);

  // 当前任务状态文字（不仅用颜色区分）
  const currentStatusText =
    currentTask?.status === "needsGuidance"
      ? "需要引导"
      : currentTask?.status === "inProgress"
      ? "进行中"
      : "全部完成";

  return (
    <div className="h-full bg-white rounded-xl border border-border p-5 flex flex-col">
      {/* 项目标题区 */}
      <div className="mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800">{project.name}</h3>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 md:hidden">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-primary font-medium mt-1">
          当前任务：{currentTask ? `任务${currentTask.taskNo} ${currentTask.title}` : "全部完成"}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          状态：<span className="font-medium">{currentStatusText}</span>
        </p>

        {/* 题目查看器 */}
        <button
          onClick={() => setShowQuestion((v) => !v)}
          className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-left hover:bg-amber-100 transition"
          aria-expanded={showQuestion}
        >
          <span className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
            <BookOpen className="w-4 h-4" /> 查看项目题目
          </span>
          {showQuestion ? (
            <ChevronUp className="w-4 h-4 text-amber-700 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-700 flex-shrink-0" />
          )}
        </button>
        {showQuestion && (
          <div className="mt-2 p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs text-slate-700 space-y-2">
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-800">【题目】</span>
              {project.sourceTextbookQuestion.content}
            </p>
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-800">【背景】</span>
              {project.background}
            </p>
          </div>
        )}
      </div>

      {/* 当前任务详情：目标 + 完成标准 */}
      {currentTask && (
        <div className="mb-4 pb-4 border-b border-slate-100">
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left"
            aria-expanded={showDetail}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <ListChecks className="w-4 h-4 text-primary" />
              任务{currentTask.taskNo}要求
            </span>
            {showDetail ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {showDetail && (
            <div className="mt-2 space-y-2">
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
                <p className="text-xs font-medium text-slate-700 mb-1">任务目标</p>
                <p className="text-xs text-slate-600 leading-relaxed">{currentTask.objective}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-700 mb-1.5">完成标准</p>
                <ul className="space-y-1">
                  {currentTask.completionCriteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-px" />
                      <span className="leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {currentTask.hintLevel > 0 && (
                <p className="text-xs text-amber-600 px-1">
                  当前提示级别：Level {currentTask.hintLevel}（已提示 {currentTask.hintCount} 次）
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 任务列表 */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((task) => {
          const isCurrent = task.status === "inProgress" || task.status === "needsGuidance";
          const isCompleted = task.status === "completed";
          const needsGuidance = task.status === "needsGuidance";
          return (
            <div
              key={task.id}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                needsGuidance
                  ? "bg-amber-50 border border-amber-200"
                  : task.status === "inProgress"
                  ? "bg-blue-50 border border-blue-200"
                  : isCompleted
                  ? "bg-green-50"
                  : "bg-slate-50 opacity-60"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : needsGuidance ? (
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              ) : task.status === "inProgress" ? (
                <Circle className="w-5 h-5 text-primary fill-blue-100 flex-shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className={isCurrent ? "text-slate-800 font-medium" : "text-slate-600"}>
                  任务{task.taskNo}：{task.title}
                </span>
                {needsGuidance && (
                  <span className="block text-xs text-amber-600">需要引导</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 进度 */}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <p className="text-sm text-slate-500">
          当前进度：<span className="font-bold text-primary">{completedCount}/{tasks.length}</span>
        </p>
      </div>
    </div>
  );
}
