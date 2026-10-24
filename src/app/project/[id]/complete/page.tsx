"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  PartyPopper,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  MessageSquareText,
  RotateCcw,
  Clock,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { getProjectApi, submitProjectApi } from "@/services/api";
import type { Project } from "@/types";

export default function ProjectCompletePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(state.currentProject);
  const [loading, setLoading] = useState(!state.currentProject);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProjectApi(projectId);
        if (cancelled) return;
        setProject(data);
        dispatch({ type: "SET_CURRENT_PROJECT", project: data });
        if (data.tasks.every((task) => task.status === "completed")) {
          await submitProjectApi(projectId).catch(() => undefined);
        }
      } catch {
        showToast("加载项目成果失败", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, dispatch, showToast]);

  if (loading || !project) {
    return (
      <MainLayout title="项目完成" subtitle="项目成果">
        <Loading text="加载项目成果..." />
      </MainLayout>
    );
  }

  const completedTasks = project.tasks.filter((t) => t.status === "completed");
  const allCompleted = completedTasks.length === project.tasks.length;
  const totalAttempts = project.tasks.reduce((sum, task) => sum + task.attemptCount, 0);
  const totalHints = project.tasks.reduce((sum, task) => sum + task.hintCount, 0);
  const selfCorrected = project.tasks.filter((task) => task.selfCorrected).length;

  if (!allCompleted) {
    return (
      <MainLayout title="项目尚未完成" subtitle="继续完成剩余任务">
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <RotateCcw className="w-10 h-10 text-amber-400 mx-auto" />
            <p className="mt-3 text-sm text-slate-600">
              你还有 {project.tasks.length - completedTasks.length} 个任务没有完成
            </p>
            <Button className="mt-4" onClick={() => router.push(`/project/${projectId}/chat`)}>
              继续学习 <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="项目完成" subtitle="恭喜你完成了本次项目学习">
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        {/* 庆祝提示 */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 sm:p-8 text-center text-white">
          <div className="absolute -left-8 -bottom-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10" />
          <PartyPopper className="w-12 h-12 mx-auto mb-3 relative" />
          <h2 className="text-xl sm:text-2xl font-bold relative">🎉 恭喜你完成了本次项目学习！</h2>
          <p className="text-green-50 mt-2 relative text-sm sm:text-base">
            你通过自己的思考与尝试，完成了「{project.name}」的全部任务
          </p>
        </div>

        {/* 学习过程数据 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "完成任务", value: `${completedTasks.length}/${project.tasks.length}` },
            { label: "主动尝试", value: `${totalAttempts} 次` },
            { label: "获得提示", value: `${totalHints} 次` },
            { label: "自我纠正", value: `${selfCorrected} 次` },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 text-center">
                <p className="text-lg font-bold text-slate-800">{item.value}</p>
                <p className="text-xs text-slate-500 mt-1">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 完成概览 */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">项目完成概览</h3>
            <div className="space-y-3">
              {project.tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-800">
                      任务{task.taskNo}：{task.title}
                    </h4>
                    {task.studentAnswer ? (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        <span className="font-medium text-slate-500">我的结论：</span>
                        <MathText>{task.studentAnswer}</MathText>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        通过检查点 {task.checkpointIndex + 1}，完成本任务
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      尝试 {task.attemptCount} 次
                      {task.completedTime && ` · 完成于 ${new Date(task.completedTime).toLocaleString("zh-CN")}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 bg-blue-50 rounded-xl">
              <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" /> 项目总结
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                你从「{project.sourceTextbookQuestion.knowledgePoint.name}」出发，
                完成了 {project.tasks.length} 个递进任务。在这个过程中，你经历了
                分析问题、建立数学关系、用导数求解、解释结果的实际意义等完整环节。
                接下来，请用你自己的语言把思路讲清楚，这将帮助你真正内化所学。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 核心操作 */}
        <div className="text-center pb-4">
          <Button size="lg" onClick={() => router.push(`/project/${projectId}/explain`)}>
            <MessageSquareText className="w-4 h-4" /> 开始最终讲解
          </Button>
          <p className="text-xs text-slate-400 mt-3">
            像给老师讲题一样，说说你是如何思考和解决问题的
          </p>
          <button
            onClick={() => router.push(`/project/${projectId}/chat`)}
            className="text-xs text-slate-400 hover:text-primary mt-3 inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> 回看项目对话
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
