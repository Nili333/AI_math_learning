"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Home,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Printer,
  ArrowRight,
  MessageSquareText,
  Award,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RadarChart } from "@/components/ui/RadarChart";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { getEvaluationApi, getProjectApi } from "@/services/api";
import type { Evaluation, Project } from "@/types";

export default function EvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { state } = useApp();
  const { showToast } = useToast();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [project, setProject] = useState<Project | null>(state.currentProject);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (state.currentEvaluation?.projectId === projectId) {
          setEvaluation(state.currentEvaluation);
          setLoading(false);
          return;
        }
        const stored = await getEvaluationApi(projectId);
        if (cancelled) return;
        if (!stored) {
          setMissing(true);
          setLoading(false);
          return;
        }
        setEvaluation(stored);
        if (!state.currentProject || state.currentProject.id !== projectId) {
          const p = await getProjectApi(projectId).catch(() => null);
          if (!cancelled) setProject(p);
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : "加载评价失败", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, state.currentEvaluation, state.currentProject, showToast]);

  if (loading) {
    return (
      <MainLayout title="学习评价" subtitle="AI学习评价结果">
        <Loading text="加载学习评价..." />
      </MainLayout>
    );
  }

  if (missing || !evaluation) {
    return (
      <MainLayout title="学习评价" subtitle="尚未生成评价">
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <MessageSquareText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-sm text-slate-600">
              这个项目还没有生成学习评价
            </p>
            <p className="text-xs text-slate-400 mt-1">
              完成项目后，先进行最终讲解，AI 会据此生成多维度评价
            </p>
            <div className="mt-4 flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push(`/project/${projectId}/complete`)}>
                查看项目成果
              </Button>
              <Button onClick={() => router.push(`/project/${projectId}/explain`)}>
                开始最终讲解
              </Button>
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const radarData = evaluation.dimensionScores.map((d) => ({
    label: d.dimensionName,
    value: d.score,
  }));
  const average = Math.round(
    evaluation.dimensionScores.reduce((sum, item) => sum + item.score, 0) /
      Math.max(evaluation.dimensionScores.length, 1)
  );
  const sorted = [...evaluation.dimensionScores].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const grade =
    average >= 85
      ? { label: "优秀", color: "text-green-600", bg: "bg-green-50" }
      : average >= 75
      ? { label: "良好", color: "text-blue-600", bg: "bg-blue-50" }
      : average >= 60
      ? { label: "合格", color: "text-amber-600", bg: "bg-amber-50" }
      : { label: "待提升", color: "text-red-600", bg: "bg-red-50" };

  return (
    <MainLayout title="学习评价结果" subtitle="AI基于你的项目表现生成的学习评价">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        {/* 打印标题 */}
        <div className="hidden print:block text-center mb-4">
          <h1 className="text-xl font-bold">AI数学项目式学习评价报告</h1>
          <p className="text-sm text-slate-500 mt-1">
            {project?.name ?? "项目学习"} · {new Date(evaluation.createTime).toLocaleDateString("zh-CN")}
          </p>
        </div>

        {/* 评价总览 */}
        <Card className="print:shadow-none print:border-0">
          <CardHeader className="print:hidden">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>评价总览</CardTitle>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> 打印报告
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(average / 100) * 327} 327`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-800">{average}</span>
                    <span className="text-xs text-slate-400">综合得分</span>
                  </div>
                </div>
                <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${grade.bg} ${grade.color}`}>
                  <Award className="w-3.5 h-3.5 inline mr-1" />
                  综合评级：{grade.label}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  生成于 {new Date(evaluation.createTime).toLocaleString("zh-CN")}
                </p>
              </div>

              <div>
                <div className="flex justify-center md:justify-start">
                  <RadarChart data={radarData} size={260} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {evaluation.dimensionScores.map((d) => {
                const color =
                  d.score >= 80 ? "text-green-600" : d.score >= 60 ? "text-amber-600" : "text-red-600";
                return (
                  <div key={d.dimensionName} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-600">{d.dimensionName}</p>
                      <span className={`text-sm font-bold ${color}`}>{d.score}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-3">
                      <MathText>{d.description}</MathText>
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                <p className="text-xs text-green-700">
                  <span className="font-semibold">优势维度：</span>
                  {strongest.dimensionName}（{strongest.score} 分）
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">待提升维度：</span>
                  {weakest.dimensionName}（{weakest.score} 分）
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* 已掌握内容 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> 已掌握内容
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.masteredContents.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed"><MathText>{c}</MathText></span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 仍需加强 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> 仍需加强
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.weakContents.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed"><MathText>{c}</MathText></span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* 学习建议 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> 学习建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {evaluation.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed"><MathText>{s}</MathText></span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 学习成长链路 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> 学习成长链路
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />
              {evaluation.growthPath.map((g, i) => (
                <div key={i} className="relative mb-6 last:mb-0">
                  <div
                    className={`absolute -left-4 top-1 w-4 h-4 rounded-full border-2 ${
                      i === 0
                        ? "border-red-400 bg-red-100"
                        : i === evaluation.growthPath.length - 1
                        ? "border-green-400 bg-green-100"
                        : "border-amber-400 bg-amber-100"
                    }`}
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        i === 0 ? "danger" : i === evaluation.growthPath.length - 1 ? "success" : "warning"
                      }
                    >
                      {g.stage}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed"><MathText>{g.content}</MathText></p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 返回首页 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pb-4 print:hidden">
          <Button variant="outline" size="lg" onClick={() => router.push(`/project/${projectId}/chat`)}>
            回看项目对话
          </Button>
          <Button size="lg" onClick={() => router.push("/dashboard")}>
            <Home className="w-4 h-4" /> 返回学习首页
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/upload")}
          >
            继续挑战 <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
