"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  BookOpen,
  Target,
  Zap,
  Image as ImageIcon,
  ArrowRight,
  X,
  BookOpenCheck,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { getRecentWrongQuestionsApi } from "@/services/api";
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      setLoading(false);
      return;
    }
    if (state.currentWrongAnswer?.id === id) {
      setWrongAnswer(state.currentWrongAnswer);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await getRecentWrongQuestionsApi();
        if (cancelled) return;
        const found = list.find((item) => item.id === id);
        if (found) {
          setWrongAnswer(found);
          dispatch({ type: "SET_CURRENT_WRONG_ANSWER", wrongAnswer: found });
        } else {
          showToast("未找到该错题记录", "error");
        }
      } catch {
        showToast("加载错题失败", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, state.currentWrongAnswer, dispatch, showToast]);

  if (loading) {
    return (
      <MainLayout title="错因分析" subtitle="AI诊断结果">
        <Loading text="正在读取错因分析..." />
      </MainLayout>
    );
  }

  if (!wrongAnswer) {
    return (
      <MainLayout title="错因分析" subtitle="AI诊断结果">
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-sm text-slate-500">未找到这道错题的记录</p>
            <div className="mt-4 flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push("/wrong-questions")}>
                返回错题本
              </Button>
              <Button onClick={() => router.push("/upload")}>上传新错题</Button>
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const wl = weakLevelMap[wrongAnswer.weakLevel] ?? weakLevelMap.needStrengthen;

  return (
    <MainLayout title="错因分析结果" subtitle="AI已为你诊断错题原因">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
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
          <CardContent className="space-y-4">
            <p className="text-slate-800 leading-relaxed">
              <MathText>{wrongAnswer.question.content}</MathText>
            </p>

            {(wrongAnswer.question.imageUrl || wrongAnswer.studentAnswerImage) && (
              <div className="grid sm:grid-cols-2 gap-3">
                {wrongAnswer.question.imageUrl && (
                  <button
                    onClick={() => setPreviewImage(wrongAnswer.question.imageUrl!)}
                    className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 text-left group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={wrongAnswer.question.imageUrl}
                      alt="题目图片"
                      className="w-full h-40 object-contain group-hover:opacity-90 transition"
                    />
                    <span className="absolute left-2 bottom-2 text-[11px] bg-slate-900/70 text-white px-2 py-0.5 rounded">
                      <ImageIcon className="w-3 h-3 inline mr-1" />
                      题目原图
                    </span>
                  </button>
                )}
                {wrongAnswer.studentAnswerImage && (
                  <button
                    onClick={() => setPreviewImage(wrongAnswer.studentAnswerImage!)}
                    className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 text-left group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={wrongAnswer.studentAnswerImage}
                      alt="学生作答图片"
                      className="w-full h-40 object-contain group-hover:opacity-90 transition"
                    />
                    <span className="absolute left-2 bottom-2 text-[11px] bg-slate-900/70 text-white px-2 py-0.5 rounded">
                      <ImageIcon className="w-3 h-3 inline mr-1" />
                      我的作答
                    </span>
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-slate-100">
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">你的答案</p>
                <p className="text-sm text-red-600 font-medium">
                  <MathText>{wrongAnswer.studentAnswer || "（见作答图片）"}</MathText>
                </p>
              </div>
              {wrongAnswer.correctAnswer && (
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">正确答案</p>
                  <p className="text-sm text-green-600 font-medium">
                    <MathText>{wrongAnswer.correctAnswer}</MathText>
                  </p>
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
                <h3 className="text-lg font-bold text-red-600">
                  主要错因：{wrongAnswer.errorType.name}
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  <MathText>{wrongAnswer.errorAnalysis}</MathText>
                </p>
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
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${step.isError ? "text-red-700" : "text-slate-700"}`}>
                    <MathText>{step.content}</MathText>
                  </p>
                  {step.isError && step.errorHint && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-start gap-1">
                      <Zap className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span><MathText>{step.errorHint}</MathText></span>
                    </p>
                  )}
                </div>
                {step.isError && <Badge variant="danger">错误步骤</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 正确解答过程 */}
        <Card className="border-l-4 border-l-green-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-green-600" /> 正确解答过程
              {wrongAnswer.correctSolution && wrongAnswer.correctSolution.length > 0 && (
                <Badge variant="success">详细解析</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wrongAnswer.correctSolution && wrongAnswer.correctSolution.length > 0 ? (
              <div className="space-y-4">
                {wrongAnswer.correctSolution.map((step, index) => (
                  <div key={`${step.stepNo}-${index}`} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {step.stepNo || index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800">
                        {step.title || `第 ${index + 1} 步`}
                      </h4>
                      <div className="mt-1 text-sm text-slate-700 leading-relaxed">
                        <MathText>{step.content}</MathText>
                      </div>
                      {step.explanation && (
                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-lg px-3 py-2">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 inline mr-1 -mt-0.5" />
                          <MathText>{step.explanation}</MathText>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {wrongAnswer.correctAnswer && (
                  <div className="mt-2 p-3 rounded-xl bg-green-50 border border-green-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">最终答案：</span>
                      <MathText>{wrongAnswer.correctAnswer}</MathText>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 text-sm text-slate-500 leading-relaxed">
                <Lightbulb className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                <p>
                  本次分析暂未生成详细解答。你可以在「正确步骤」的基础上先独立订正，
                  或重新分析这道题以获取完整解答过程。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 关联信息卡片组 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="text-center p-5">
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs text-slate-400">对应知识点</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {wrongAnswer.knowledgePoints.map((k) => k.name).join("、") || "未标注"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center p-5">
              <Target className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">对应能力</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {wrongAnswer.relatedAbility}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center p-5">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">薄弱程度</p>
              <div className="mt-2">
                <ProgressBar value={wl.score} color={wl.barColor} />
                <p
                  className="text-xs font-semibold mt-1.5"
                  style={{
                    color:
                      wl.color === "danger"
                        ? "#dc2626"
                        : wl.color === "warning"
                        ? "#f59e0b"
                        : "#16a34a",
                  }}
                >
                  {wl.text}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 底部操作区 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" size="lg" onClick={() => router.push("/weak-points")}>
            查看我的薄弱点
          </Button>
          <Button
            size="lg"
            onClick={() => router.push(`/textbook?wrongAnswerId=${wrongAnswer.id}`)}
          >
            查看推荐母题 <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="关闭预览"
          >
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="图片预览"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </MainLayout>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-background">
          <Loading text="加载中..." />
        </div>
      }
    >
      <AnalysisContent />
    </Suspense>
  );
}
