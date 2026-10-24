"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  BookX,
  Layers,
  CheckCircle2,
  TrendingUp,
  Award,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RadarChart } from "@/components/ui/RadarChart";
import { BarChart } from "@/components/ui/BarChart";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useToast } from "@/components/ui/Toast";
import { getReportApi } from "@/services/api";
import type { ReportData } from "@/types";

const masteryScore: Record<string, number> = {
  mastered: 90,
  basic: 72,
  needStrengthen: 48,
  focus: 28,
};

const masteryLabel: Record<string, string> = {
  mastered: "已掌握",
  basic: "基本掌握",
  needStrengthen: "需要加强",
  focus: "需重点加强",
};

const masteryColor: Record<string, "success" | "info" | "warning" | "danger"> = {
  mastered: "success",
  basic: "info",
  needStrengthen: "warning",
  focus: "danger",
};

const masteryProgressColor: Record<string, "success" | "primary" | "warning" | "danger"> = {
  mastered: "success",
  basic: "primary",
  needStrengthen: "warning",
  focus: "danger",
};

export default function ReportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportApi()
      .then(setData)
      .catch(() => showToast("加载学习报告失败，请刷新重试", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading || !data) {
    return (
      <MainLayout title="学习报告" subtitle="我的学习成长轨迹">
        <Loading text="正在生成学习报告..." />
      </MainLayout>
    );
  }

  const { profile, projects, wrongAnswers, evaluations } = data;
  const completedProjects = projects.filter((p) => p.status === "completed");
  const averageEval = evaluations.length
    ? Math.round(evaluations.reduce((sum, e) => sum + e.averageScore, 0) / evaluations.length)
    : null;
  const sortedMastery = [...profile.knowledgeMastery].sort((a, b) => b.errorCount - a.errorCount);
  const barData = profile.errorTypeStats.map((e) => ({
    label: e.errorTypeName,
    value: e.count,
  }));
  const radarData = profile.abilityScores.map((a) => ({
    label: a.abilityName,
    value: a.score,
  }));

  return (
    <MainLayout title="学习报告" subtitle="回顾你的错题、项目与成长轨迹">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        {/* 报告头 */}
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CalendarDays className="w-4 h-4" />
                {new Date().toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mt-2">
                {profile.keyWeakAreas.length > 0
                  ? `正在突破：${profile.keyWeakAreas.join("、")}`
                  : "持续积累，稳步提升"}
              </h2>
              <p className="text-sm text-slate-300 mt-1.5">
                共分析 {profile.totalAnalyzedWrongQuestions} 道错题，完成{" "}
                {completedProjects.length} 个项目
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 print:hidden self-start"
            >
              <Printer className="w-4 h-4" /> 打印报告
            </Button>
          </CardContent>
        </Card>

        {/* 核心数据 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "已分析错题",
              value: profile.totalAnalyzedWrongQuestions,
              suffix: "道",
              icon: BookX,
              color: "bg-blue-50 text-primary",
            },
            {
              label: "已完成项目",
              value: completedProjects.length,
              suffix: "个",
              icon: CheckCircle2,
              color: "bg-green-50 text-green-600",
            },
            {
              label: "进行中项目",
              value: projects.filter((p) => p.status !== "completed").length,
              suffix: "个",
              icon: Layers,
              color: "bg-indigo-50 text-indigo-500",
            },
            {
              label: "综合评价",
              value: averageEval ?? "—",
              suffix: averageEval ? "分" : "",
              icon: Award,
              color: "bg-amber-50 text-amber-500",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 mt-2">
                    {item.value}
                    <span className="text-xs font-normal text-slate-400 ml-1">{item.suffix}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* 知识点掌握 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> 知识点掌握
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedMastery.map((km) => (
                <div key={km.knowledgePointId}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm text-slate-700">{km.knowledgePointName}</span>
                    <Badge variant={masteryColor[km.masteryLevel] ?? "info"}>
                      {masteryLabel[km.masteryLevel] ?? "基本掌握"}
                    </Badge>
                  </div>
                  <ProgressBar
                    value={masteryScore[km.masteryLevel] ?? 60}
                    color={masteryProgressColor[km.masteryLevel] ?? "primary"}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">累计出错 {km.errorCount} 次</p>
                </div>
              ))}
              {sortedMastery.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">暂无知识点数据</p>
              )}
            </CardContent>
          </Card>

          {/* 能力雷达 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> 能力画像
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <RadarChart data={radarData} size={280} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 错因分布 */}
        <Card>
          <CardHeader>
            <CardTitle>错因分布</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <BarChart data={barData} />
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">暂无错因数据</p>
            )}
          </CardContent>
        </Card>

        {/* 项目成果 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>项目学习成果</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/projects")}>
                全部项目 <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.map((p) => {
                const evaluation = evaluations.find((e) => e.projectId === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      router.push(
                        p.status === "completed" ? `/project/${p.id}/complete` : `/project/${p.id}/chat`
                      )
                    }
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        p.status === "completed" ? "bg-green-50" : "bg-indigo-50"
                      }`}
                    >
                      {p.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Layers className="w-5 h-5 text-indigo-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                        <Badge variant={p.status === "completed" ? "success" : "warning"}>
                          {p.status === "completed" ? "已完成" : "进行中"}
                        </Badge>
                        {evaluation && (
                          <Badge variant="info">评价 {evaluation.averageScore} 分</Badge>
                        )}
                      </div>
                      <div className="mt-2 max-w-md">
                        <ProgressBar
                          value={p.progress}
                          color={p.status === "completed" ? "success" : "primary"}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {p.completedTasks}/{p.totalTasks} 个任务 · 创建于 {p.createTime.slice(0, 10)}
                      </p>
                    </div>
                  </button>
                );
              })}
              {projects.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">还没有项目记录</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 最近错题 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最近错题</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/wrong-questions")}>
                全部错题 <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wrongAnswers.slice(0, 5).map((w) => (
                <button
                  key={w.id}
                  onClick={() => router.push(`/analysis?id=${w.id}`)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 text-left"
                >
                  <BookX className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 line-clamp-1">
                      <MathText>{w.question.content}</MathText>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {w.createTime} · {w.errorType.name} ·{" "}
                      {w.knowledgePoints.map((k) => k.name).join("、")}
                    </p>
                  </div>
                </button>
              ))}
              {wrongAnswers.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">还没有错题记录</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
