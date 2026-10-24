"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Target, TrendingUp } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RadarChart } from "@/components/ui/RadarChart";
import { BarChart } from "@/components/ui/BarChart";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import { getRecentWrongQuestionsApi, getWeakPointsApi } from "@/services/api";
import type { StudentProfile, WrongAnswer } from "@/types";

const masteryConfig: Record<string, { label: string; variant: "success" | "info" | "warning" | "danger" }> = {
  mastered: { label: "已掌握", variant: "success" },
  basic: { label: "基本掌握", variant: "info" },
  needStrengthen: { label: "需要加强", variant: "warning" },
  focus: { label: "需要重点加强", variant: "danger" },
};

const masteryTip: Record<string, string> = {
  mastered: "该知识点掌握较好，可尝试更高难度题目",
  basic: "基础概念已掌握，需加强综合应用练习",
  needStrengthen: "存在明显薄弱，建议针对性复习与练习",
  focus: "高频出错知识点，需重点突破，建议结合项目学习",
};

export default function WeakPointsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWeakPointsApi(), getRecentWrongQuestionsApi()])
      .then(([p, list]) => {
        setProfile(p);
        setWrongAnswers(list);
      })
      .catch(() => showToast("加载薄弱点数据失败，请刷新重试", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading || !profile) {
    return (
      <MainLayout title="知识画像" subtitle="我的学习诊断">
        <Loading text="正在生成知识画像..." />
      </MainLayout>
    );
  }

  const radarData = profile.abilityScores.map((a) => ({ label: a.abilityName, value: a.score }));
  const barData = profile.errorTypeStats.map((e) => ({ label: e.errorTypeName, value: e.count }));

  // 选择与最薄弱知识点关联的错题，用于推荐母题
  const weakest = [...profile.knowledgeMastery].sort((a, b) => b.errorCount - a.errorCount)[0];
  const relatedWrong =
    wrongAnswers.find((item) =>
      item.knowledgePointIds.includes(weakest?.knowledgePointId ?? "")
    ) ?? wrongAnswers[0];

  const totalErrors = profile.errorTypeStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <MainLayout
      title="我的学习诊断"
      subtitle="系统基于你的错题记录，识别出持续性学习问题"
    >
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        {/* 画像摘要 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "累计错题", value: profile.totalAnalyzedWrongQuestions, unit: "道" },
            { label: "错因次数", value: totalErrors, unit: "次" },
            {
              label: "待突破知识点",
              value: profile.knowledgeMastery.filter(
                (km) => km.masteryLevel === "focus" || km.masteryLevel === "needStrengthen"
              ).length,
              unit: "个",
            },
            { label: "已完成项目", value: profile.totalCompletedProjects, unit: "个" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-slate-800">
                  {item.value}
                  <span className="text-xs font-normal text-slate-400 ml-1">{item.unit}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 错因统计区 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> 错因统计分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              以下统计显示你在各类错因上的出现频次，帮助识别持续性问题
            </p>
            {barData.length > 0 ? (
              <BarChart data={barData} />
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">暂无错因数据</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* 知识点薄弱情况 */}
          <Card>
            <CardHeader>
              <CardTitle>知识点掌握状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.knowledgeMastery.map((km) => {
                const cfg = masteryConfig[km.masteryLevel] ?? masteryConfig.basic;
                return (
                  <div key={km.knowledgePointId} className="p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800">
                        {km.knowledgePointName}
                      </span>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{masteryTip[km.masteryLevel] ?? ""}</p>
                    <p className="text-xs text-slate-400 mt-1">累计出错 {km.errorCount} 次</p>
                  </div>
                );
              })}
              {profile.knowledgeMastery.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">暂无知识点数据</p>
              )}
            </CardContent>
          </Card>

          {/* 能力维度雷达图 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" /> 能力维度分析
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center">
                <RadarChart data={radarData} />
              </div>
              <div className="mt-4 space-y-1 text-left">
                {profile.abilityScores.map((a) => (
                  <div key={a.abilityName} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{a.abilityName}</span>
                    <span
                      className={`font-semibold ${
                        a.score >= 70
                          ? "text-green-600"
                          : a.score >= 50
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {a.score}分 {a.score >= 70 ? "（较强）" : a.score >= 50 ? "（中等）" : "（需提升）"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 推荐行动 */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  建议优先突破：{weakest?.knowledgePointName ?? "导数运算"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  从你的错题出发，匹配教材母题并生成一个针对性项目。
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                router.push(
                  relatedWrong
                    ? `/textbook?wrongAnswerId=${relatedWrong.id}`
                    : "/textbook"
                )
              }
              className="flex-shrink-0"
            >
              查看推荐母题 <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
