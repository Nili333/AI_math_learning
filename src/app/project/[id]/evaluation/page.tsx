"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Home, CheckCircle2, AlertCircle, Lightbulb, TrendingUp } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RadarChart } from "@/components/ui/RadarChart";
import { Loading } from "@/components/ui/Loading";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { generateEvaluationApi } from "@/services/api";
import type { Evaluation } from "@/types";

export default function EvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.currentEvaluation) {
      setEvaluation(state.currentEvaluation);
      setLoading(false);
      return;
    }
    // 如果没有缓存的评价，尝试生成（兜底）
    const fallback = async () => {
      try {
        const ev = await generateEvaluationApi(projectId, {
          answers: ["已完成分析", "导数运算", "建模方法", "建立函数关系", "表面积最小"],
        });
        setEvaluation(ev);
        dispatch({ type: "SET_CURRENT_EVALUATION", evaluation: ev });
      } catch {
        showToast("加载评价失败", "error");
      } finally {
        setLoading(false);
      }
    };
    fallback();
  }, [projectId, state.currentEvaluation, dispatch, showToast]);

  const handleBackHome = () => {
    dispatch({ type: "INCREMENT_COMPLETED_PROJECTS" });
    showToast("学习数据已更新", "success");
    router.push("/dashboard");
  };

  if (loading || !evaluation) {
    return (
      <MainLayout title="学习评价" subtitle="AI学习评价结果">
        <Loading />
      </MainLayout>
    );
  }

  const radarData = evaluation.dimensionScores.map((d) => ({
    label: d.dimensionName,
    value: d.score,
  }));

  return (
    <MainLayout title="学习评价结果" subtitle="AI基于你的项目表现生成的学习评价">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 评价总览 */}
        <Card>
          <CardHeader>
            <CardTitle>评价总览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex justify-center">
                <RadarChart data={radarData} size={280} />
              </div>
              <div className="space-y-2">
                {evaluation.dimensionScores.map((d) => {
                  const color = d.score >= 80 ? "text-green-600" : d.score >= 60 ? "text-amber-600" : "text-red-600";
                  return (
                    <div key={d.dimensionName} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-700">{d.dimensionName}</span>
                      <span className={`text-sm font-bold ${color}`}>{d.score}分</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {evaluation.dimensionScores.map((d) => (
                <div key={d.dimensionName} className="p-2 bg-slate-50 rounded">
                  <p className="text-xs font-medium text-slate-600">{d.dimensionName}</p>
                  <p className="text-xs text-slate-500 mt-1">{d.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span>{c}</span>
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
                    <span>{c}</span>
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
                  <span className="text-sm text-slate-700">{s}</span>
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
                      i === 0 ? "border-red-400 bg-red-100" : i === 1 ? "border-amber-400 bg-amber-100" : "border-green-400 bg-green-100"
                    }`}
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={i === 0 ? "danger" : i === 1 ? "warning" : "success"}>{g.stage}</Badge>
                  </div>
                  <p className="text-sm text-slate-700">{g.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 返回首页 */}
        <div className="text-center">
          <Button size="lg" onClick={handleBackHome}>
            <Home className="w-4 h-4" /> 返回学习首页
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
