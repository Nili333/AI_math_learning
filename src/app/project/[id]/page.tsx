"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Target,
  ListChecks,
  BookOpen,
  Sparkles,
  Play,
  CheckCircle2,
  Circle,
  Lock,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { getProjectApi } from "@/services/api";
import type { Project } from "@/types";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.currentProject?.id === projectId) {
      setProject(state.currentProject);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getProjectApi(projectId);
        if (cancelled) return;
        setProject(data);
        dispatch({ type: "SET_CURRENT_PROJECT", project: data });
      } catch {
        showToast("加载项目失败", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, state.currentProject, dispatch, showToast]);

  if (loading) {
    return (
      <MainLayout title="项目详情" subtitle="项目学习">
        <Loading text="加载项目详情..." />
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout title="项目详情" subtitle="项目学习">
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-sm text-slate-500">项目不存在或已被删除</p>
            <Button className="mt-4" onClick={() => router.push("/projects")}>
              返回项目列表
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const completedCount = project.tasks.filter((t) => t.status === "completed").length;
  const progress = Math.round((completedCount / Math.max(project.tasks.length, 1)) * 100);
  const wrongAnswerId = project.id.startsWith("proj_")
    ? project.id.slice("proj_".length)
    : null;
  const hasWrongAnswer = wrongAnswerId && wrongAnswerId !== "demo" && wrongAnswerId !== "general";

  return (
    <MainLayout title="项目详情" subtitle="了解项目背景与任务要求">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        <button
          onClick={() => router.push("/projects")}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> 返回项目列表
        </button>

        {/* 项目名称卡片 */}
        <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0 overflow-hidden relative">
          <div className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-white/10" />
          <CardContent className="py-6 relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <Badge className="bg-white/20 text-white">项目式学习</Badge>
              <Badge className="bg-white/20 text-white">
                {project.status === "completed" ? "已完成" : "进行中"}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold leading-snug">{project.name}</h2>
            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-xs text-blue-100 mb-1.5">
                <span>项目进度</span>
                <span>{completedCount}/{project.tasks.length} 个任务</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-white transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 项目背景 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> 项目背景
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              <MathText>{project.background}</MathText>
            </p>
            {hasWrongAnswer && (
              <button
                onClick={() => router.push(`/analysis?id=${wrongAnswerId}`)}
                className="mt-3 text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> 查看本项目对应的原始错题
              </button>
            )}
          </CardContent>
        </Card>

        {/* 学习目标 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" /> 学习目标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {project.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed">{obj}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 项目任务 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-green-500" /> 项目任务
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.tasks.map((task) => {
                const isCompleted = task.status === "completed";
                const isActive = task.status === "inProgress" || task.status === "needsGuidance";
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-xl ${
                      isActive
                        ? "bg-blue-50 border border-blue-100"
                        : isCompleted
                        ? "bg-green-50/60"
                        : "bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-primary text-white"
                          : "bg-white border-2 border-slate-200 text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isActive ? (
                        <Circle className="w-4 h-4 fill-white/30" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-800">
                          任务{task.taskNo}：{task.title}
                        </h4>
                        {task.status === "needsGuidance" && (
                          <Badge variant="warning">需要引导</Badge>
                        )}
                        {isCompleted && <Badge variant="success">已完成</Badge>}
                        {task.status === "inProgress" && <Badge variant="info">进行中</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {task.description}
                      </p>
                      {task.objective && (
                        <p className="text-xs text-slate-400 mt-1.5">
                          <span className="font-medium text-slate-500">任务目标：</span>
                          {task.objective}
                        </p>
                      )}
                      {isCompleted && task.studentAnswer && (
                        <div className="mt-2 p-2 rounded-lg bg-white/70 border border-green-100 text-xs text-slate-600">
                          <span className="font-medium text-slate-500">我的结论：</span>
                          <MathText>{task.studentAnswer}</MathText>
                        </div>
                      )}
                      {task.attemptCount > 0 && (
                        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          尝试 {task.attemptCount} 次
                          {task.hintCount > 0 && ` · 获得提示 ${task.hintCount} 次`}
                          {task.selfCorrected && " · 完成过自我纠正"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              任务按顺序解锁，完成上一个任务后自动进入下一个任务。
            </p>
          </CardContent>
        </Card>

        {/* 项目来源 */}
        <Card className="border-l-4 border-l-amber-400">
          <CardContent>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">项目来源</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <MathText>{project.sourceTextbookQuestion.content}</MathText>
                </p>
                <p className="text-xs text-slate-400 mt-1.5">
                  {project.sourceTextbookQuestion.textbookVersion} ·{" "}
                  {project.sourceTextbookQuestion.chapter} · 母题编号{" "}
                  {project.sourceTextbookQuestion.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pb-4">
          {project.status === "completed" ? (
            <>
              <Button variant="outline" size="lg" onClick={() => router.push(`/project/${projectId}/complete`)}>
                查看项目成果
              </Button>
              <Button size="lg" onClick={() => router.push(`/project/${projectId}/evaluation`)}>
                查看学习评价
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={() => router.push(`/project/${projectId}/chat`)}>
              <Play className="w-4 h-4" /> {completedCount > 0 ? "继续项目" : "开始项目"}
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
