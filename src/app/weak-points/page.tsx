"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RadarChart } from "@/components/ui/RadarChart";
import { BarChart } from "@/components/ui/BarChart";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import { getWeakPointsApi } from "@/services/api";
import type { StudentProfile } from "@/types";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const p = await getWeakPointsApi();
        setProfile(p);
      } catch {
        showToast("加载薄弱点数据失败", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [showToast]);

  if (loading || !profile) {
    return (
      <MainLayout title="知识画像" subtitle="我的学习诊断">
        <Loading />
      </MainLayout>
    );
  }

  const radarData = profile.abilityScores.map((a) => ({ label: a.abilityName, value: a.score }));
  const barData = profile.errorTypeStats.map((e) => ({ label: e.errorTypeName, value: e.count }));

  return (
    <MainLayout title="我的学习诊断" subtitle="系统基于你的错题记录，识别出持续性学习问题">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 错因统计区 */}
        <Card>
          <CardHeader>
            <CardTitle>错因统计分析</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">以下统计显示你在各类错因上的出现频次，帮助识别持续性问题</p>
            <BarChart data={barData} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 知识点薄弱情况 */}
          <Card>
            <CardHeader>
              <CardTitle>知识点掌握状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.knowledgeMastery.map((km) => {
                const cfg = masteryConfig[km.masteryLevel];
                return (
                  <div key={km.knowledgePointId} className="p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800">{km.knowledgePointName}</span>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{masteryTip[km.masteryLevel]}</p>
                    <p className="text-xs text-slate-400 mt-1">累计出错 {km.errorCount} 次</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 能力维度雷达图 */}
          <Card>
            <CardHeader>
              <CardTitle>能力维度分析</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <RadarChart data={radarData} />
              <div className="mt-4 space-y-1 text-left">
                {profile.abilityScores.map((a) => (
                  <div key={a.abilityName} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{a.abilityName}</span>
                    <span className={`font-semibold ${a.score >= 70 ? "text-green-600" : a.score >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {a.score}分 {a.score >= 70 ? "（较强）" : a.score >= 50 ? "（中等）" : "（需提升）"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 底部按钮 */}
        <div className="text-center">
          <Button size="lg" onClick={() => router.push("/textbook?wrongAnswerId=wa_001")}>
            查看推荐母题
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
