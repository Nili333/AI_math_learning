"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookMarked, Star } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { getTextbookQuestionsApi } from "@/services/api";
import type { TextbookQuestion } from "@/types";

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
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

  useEffect(() => {
    const wrongAnswerId = searchParams.get("wrongAnswerId") || "wa_001";
    const fetch = async () => {
      try {
        const list = await getTextbookQuestionsApi(wrongAnswerId);
        setQuestions(list);
      } catch {
        showToast("加载母题失败", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [searchParams, showToast]);

  const handleStart = async () => {
    const wrongAnswerId = searchParams.get("wrongAnswerId") || "wa_001";
    setStarting(true);
    try {
      const { generateProjectApi } = await import("@/services/api");
      const project = await generateProjectApi(wrongAnswerId);
      dispatch({ type: "SET_CURRENT_PROJECT", project });
      showToast("项目准备就绪！", "success");
      router.push(`/project/${project.id}`);
    } catch {
      showToast("项目生成失败", "error");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="教材母题推荐" subtitle="基于薄弱点匹配的教材母题">
        <Loading />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="教材母题推荐" subtitle="基于你的薄弱点，从教材中精选母题">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
          <BookMarked className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">
            以下母题来自官方教材，系统将基于这些母题改编为针对性学习项目，帮助你突破薄弱环节。
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-800">母题 {q.id}</h4>
                      <DifficultyStars level={q.difficulty} />
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed mb-3"><MathText>{q.content}</MathText></p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="info">{q.textbookVersion}</Badge>
                      <Badge variant="default">{q.grade}</Badge>
                      <Badge variant="default">{q.chapter}</Badge>
                      <Badge variant="success">{q.knowledgePoint.name}</Badge>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                      <p className="text-xs text-amber-700">
                        <span className="font-semibold">关联说明：</span>{q.relevance}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-slate-400 mb-3">系统将基于以上母题为你生成针对性学习项目</p>
          <Button size="lg" onClick={handleStart} loading={starting}>
            开始项目学习
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

export default function TextbookPage() {
  return (
    <Suspense fallback={<Loading text="加载中..." />}>
      <TextbookContent />
    </Suspense>
  );
}
