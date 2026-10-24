"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookMarked, Star, CheckCircle2, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { generateProjectApi, getTextbookQuestionsApi } from "@/services/api";
import type { TextbookQuestion } from "@/types";

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`难度 ${level} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < level ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

function TextbookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dispatch } = useApp();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<TextbookQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const wrongAnswerId = searchParams.get("wrongAnswerId") || "general";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getTextbookQuestionsApi(wrongAnswerId);
        if (cancelled) return;
        setQuestions(list);
        setSelectedId(list[0]?.id ?? null);
      } catch {
        showToast("加载教材母题失败，请刷新重试", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wrongAnswerId, showToast]);

  const selected = questions.find((q) => q.id === selectedId) ?? questions[0];

  const handleStart = async () => {
    if (!selected) return;
    setStarting(true);
    try {
      const project = await generateProjectApi(wrongAnswerId, selected);
      dispatch({ type: "SET_CURRENT_PROJECT", project });
      showToast("项目已生成，开始你的项目学习吧！", "success");
      router.push(`/project/${project.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "项目生成失败", "error");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="教材母题推荐" subtitle="基于薄弱点匹配的教材母题">
        <Loading text="正在为你匹配教材母题..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="教材母题推荐" subtitle="基于你的薄弱点，从教材中精选母题">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <BookMarked className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 leading-relaxed">
            以下母题来自教材，系统会以你选定的母题为知识锚点，生成一个针对性的项目式学习方案。
            <span className="font-medium text-primary">请选择一道母题</span>，再开始项目。
          </p>
        </div>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <p className="text-sm text-slate-500">暂时没有匹配到教材母题</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/wrong-questions")}>
                返回错题本
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const active = selected?.id === q.id;
                return (
                  <Card
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    className={`transition cursor-pointer ${
                      active
                        ? "ring-2 ring-primary border-primary shadow-md"
                        : "hover:shadow-md hover:border-blue-200"
                    }`}
                  >
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            active ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {active ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-slate-800">
                              母题 {idx + 1}
                              {active && (
                                <span className="ml-2 text-xs font-normal text-primary">已选择</span>
                              )}
                            </h4>
                            <DifficultyStars level={q.difficulty} />
                          </div>
                          <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            <MathText>{q.content}</MathText>
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="info">{q.textbookVersion}</Badge>
                            <Badge variant="default">{q.grade}</Badge>
                            <Badge variant="default">{q.chapter}</Badge>
                            <Badge variant="success">{q.knowledgePoint.name}</Badge>
                          </div>
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                            <p className="text-xs text-amber-700 leading-relaxed">
                              <span className="font-semibold">关联说明：</span>
                              {q.relevance}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center pt-2 pb-4">
              <p className="text-xs text-slate-400 mb-3">
                将基于「母题 {questions.findIndex((q) => q.id === selected?.id) + 1}」生成 5 个递进任务，
                AI 生成通常需要 30~90 秒，请耐心等待
              </p>
              <Button size="lg" onClick={handleStart} loading={starting}>
                <Sparkles className="w-4 h-4" />
                {starting ? "正在生成项目..." : "开始项目学习"}
              </Button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default function TextbookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-background">
          <Loading text="加载中..." />
        </div>
      }
    >
      <TextbookContent />
    </Suspense>
  );
}
