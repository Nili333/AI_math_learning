"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, BookOpen, Target, Zap } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { getRecentWrongQuestionsApi, generateProjectApi } from "@/services/api";
import type { WrongAnswer } from "@/types";

const weakLevelMap = {
  normal: { text: "正常", color: "success" as const, barColor: "success" as const, score: 80 },
  needStrengthen: { text: "需要加强", color: "warning" as const, barColor: "warning" as const, score: 50 },
  focus: { text: "需要重点加强", color: "danger" as const, barColor: "danger" as const, score: 25 },
};

function AnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [wrongAnswer, setWrongAnswer] = useState<WrongAnswer | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (state.currentWrongAnswer && state.currentWrongAnswer.id === id) {
      setWrongAnswer(state.currentWrongAnswer);
      setLoading(false);
      return;
    }
    // 从最近错题列表中查找
    const fetchData = async () => {
      try {
        const list = await getRecentWrongQuestionsApi();
        const found = list.find((w) => w.id === id);
        if (found) {
          setWrongAnswer(found);
          dispatch({ type: "SET_CURRENT_WRONG_ANSWER", wrongAnswer: found });
        } else {
          showToast("未找到该错题记录", "error");
        }
      } catch {
        showToast("加载失败", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams, state.currentWrongAnswer, dispatch, showToast]);

  const handleViewWeakPoints = () => {
    router.push("/weak-points");
  };

  const handleGenerateProject = async () => {
    if (!wrongAnswer) return;
    setGenerating(true);
    try {
      const project = await generateProjectApi(wrongAnswer.id);
      dispatch({ type: "SET_CURRENT_PROJECT", project });
      showToast("项目生成成功！", "success");
      router.push(`/textbook?wrongAnswerId=${wrongAnswer.id}`);
    } catch {
      showToast("项目生成失败", "error");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="错因分析" subtitle="AI诊断结果">
        <Loading />
      </MainLayout>
    );
  }

  if (!wrongAnswer) {
    return (
      <MainLayout title="错因分析" subtitle="AI诊断结果">
        <p className="text-center text-slate-500 py-20">未找到错题记录</p>
      </MainLayout>
    );
  }

  const wl = weakLevelMap[wrongAnswer.weakLevel];

  return (
    <MainLayout title="错因分析结果" subtitle="AI已为你诊断错题原因">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        {/* 原始题目卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>原始题目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-800 leading-relaxed"><MathText>{wrongAnswer.question.content}</MathText></p>
            <div className="flex gap-4 pt-3 border-t border-slate-100">
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">你的答案</p>
                <p className="text-sm text-red-600 font-medium"><MathText>{wrongAnswer.studentAnswer}</MathText></p>
              </div>
              {wrongAnswer.correctAnswer && (
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">正确答案</p>
                  <p className="text-sm text-green-600 font-medium"><MathText>{wrongAnswer.correctAnswer}</MathText></p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 错因分析卡片 */}
        <Card className="border-l-4 border-l-red-400">
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-600">主要错因：{wrongAnswer.errorType.name}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed"><MathText>{wrongAnswer.errorAnalysis}</MathText></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 错误步骤区 */}
        <Card>
          <CardHeader>
            <CardTitle>错误步骤定位</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wrongAnswer.studentSteps.map((step) => (
              <div
                key={step.stepNo}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  step.isError ? "border-2 border-red-200 bg-red-50" : "bg-slate-50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    step.isError ? "bg-red-500 text-white" : "bg-slate-300 text-white"
                  }`}
                >
                  {step.stepNo}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${step.isError ? "text-red-700" : "text-slate-700"}`}>
                    <MathText>{step.content}</MathText>
                  </p>
                  {step.isError && step.errorHint && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> <MathText>{step.errorHint}</MathText>
                    </p>
                  )}
                </div>
                {step.isError && (
                  <Badge variant="danger">错误步骤</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 关联信息卡片组 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="text-center">
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs text-slate-400">对应知识点</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {wrongAnswer.knowledgePoints.map((k) => k.name).join("、")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <Target className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">对应能力</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{wrongAnswer.relatedAbility}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">薄弱程度</p>
              <div className="mt-2">
                <ProgressBar value={wl.score} color={wl.barColor} />
                <p className="text-xs font-semibold mt-1.5" style={{
                  color: wl.color === "danger" ? "#dc2626" : wl.color === "warning" ? "#f59e0b" : "#16a34a"
                }}>{wl.text}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 底部操作区 */}
        <div className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={handleViewWeakPoints}>
            查看我的薄弱点
          </Button>
          <Button size="lg" onClick={handleGenerateProject} loading={generating}>
            生成针对性项目
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<Loading text="加载中..." />}>
      <AnalysisContent />
    </Suspense>
  );
}
