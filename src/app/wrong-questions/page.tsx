"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookX, Clock, Search, Upload, ChevronRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useToast } from "@/components/ui/Toast";
import { getRecentWrongQuestionsApi } from "@/services/api";
import type { WrongAnswer } from "@/types";

type FilterKey = "all" | WrongAnswer["status"];

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "analyzed", label: "已分析" },
  { key: "inProject", label: "项目中" },
  { key: "completed", label: "已订正" },
];

export default function WrongQuestionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [list, setList] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    getRecentWrongQuestionsApi()
      .then(setList)
      .catch(() => showToast("加载错题失败，请刷新重试", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return list.filter((item) => {
      const matchStatus = filter === "all" || item.status === filter;
      if (!matchStatus) return false;
      if (!kw) return true;
      return (
        item.question.content.toLowerCase().includes(kw) ||
        item.errorType.name.toLowerCase().includes(kw) ||
        item.knowledgePoints.some((kp) => kp.name.toLowerCase().includes(kw))
      );
    });
  }, [list, filter, keyword]);

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      all: list.length,
      analyzed: 0,
      inProject: 0,
      completed: 0,
    };
    list.forEach((item) => {
      base[item.status] += 1;
    });
    return base;
  }, [list]);

  if (loading) {
    return (
      <MainLayout title="错题本" subtitle="你的错题记录">
        <Loading text="加载错题本..." />
      </MainLayout>
    );
  }

  const statusBadge = (s: WrongAnswer["status"]) => {
    if (s === "analyzed") return <Badge variant="info">已分析</Badge>;
    if (s === "inProject") return <Badge variant="warning">项目中</Badge>;
    return <Badge variant="success">已订正</Badge>;
  };

  return (
    <MainLayout title="错题本" subtitle="每一道错题，都是一次精准提升的机会">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
                  filter === item.key
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                }`}
              >
                {item.label}
                <span
                  className={`ml-1.5 text-xs ${
                    filter === item.key ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {counts[item.key]}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push("/upload")}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" /> 上传错题
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索题目、错因或知识点..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto">
                <BookX className="w-7 h-7 text-slate-300" />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {list.length === 0 ? "还没有错题记录" : "没有符合条件的错题"}
              </p>
              {list.length === 0 && (
                <button
                  onClick={() => router.push("/upload")}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  上传第一道错题
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((w) => (
              <Card
                key={w.id}
                onClick={() => router.push(`/analysis?id=${w.id}`)}
                className="hover:shadow-md transition group"
              >
                <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <BookX className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium leading-relaxed line-clamp-2">
                      <MathText>{w.question.content}</MathText>
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {w.createTime}
                      </span>
                      <Badge variant="danger">{w.errorType.name}</Badge>
                      <Badge variant="info">
                        {w.knowledgePoints.map((k) => k.name).join("、")}
                      </Badge>
                      {statusBadge(w.status)}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors flex-shrink-0 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
