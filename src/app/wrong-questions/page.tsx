"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookX, Clock } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useToast } from "@/components/ui/Toast";
import { getRecentWrongQuestionsApi } from "@/services/api";
import type { WrongAnswer } from "@/types";

export default function WrongQuestionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [list, setList] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentWrongQuestionsApi()
      .then(setList)
      .catch(() => showToast("加载失败", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading) {
    return (
      <MainLayout title="错题本" subtitle="你的错题记录">
        <Loading />
      </MainLayout>
    );
  }

  const statusBadge = (s: WrongAnswer["status"]) => {
    if (s === "analyzed") return <Badge variant="info">已分析</Badge>;
    if (s === "inProject") return <Badge variant="warning">项目中</Badge>;
    return <Badge variant="success">已完成</Badge>;
  };

  return (
    <MainLayout title="错题本" subtitle="查看你的所有错题记录">
      <div className="max-w-4xl mx-auto space-y-4">
        {list.map((w) => (
          <Card
            key={w.id}
            onClick={() => router.push(`/analysis?id=${w.id}`)}
            className="hover:shadow-md transition"
          >
            <CardContent className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <BookX className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-medium"><MathText>{w.question.content}</MathText></p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{w.createTime}
                  </span>
                  <Badge variant="danger">{w.errorType.name}</Badge>
                  <Badge variant="info">{w.knowledgePoints.map((k) => k.name).join("、")}</Badge>
                  {statusBadge(w.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && (
          <p className="text-center text-slate-400 py-20">暂无错题记录</p>
        )}
      </div>
    </MainLayout>
  );
}
