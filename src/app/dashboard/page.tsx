"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookX,
  FolderCheck,
  AlertTriangle,
  Plus,
  ChevronRight,
  Clock,
  ArrowRight,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { getProfileApi, getRecentWrongQuestionsApi } from "@/services/api";
import type { StudentProfile, WrongAnswer } from "@/types";

export default function DashboardPage() {
  const { state } = useApp();
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [recentWrongs, setRecentWrongs] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user) {
      router.push("/");
      return;
    }
    const fetch = async () => {
      try {
        const [p, r] = await Promise.all([getProfileApi(), getRecentWrongQuestionsApi()]);
        setProfile(p);
        setRecentWrongs(r.slice(0, 3));
      } catch {
        showToast("加载学习数据失败", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [state.user, router, showToast]);

  if (loading) {
    return (
      <MainLayout title="学习首页" subtitle="欢迎回来，开始今天的学习吧">
        <Loading text="加载学习数据中..." />
      </MainLayout>
    );
  }

  // 从画像中提取3个维度的掌握度
  const dimensionMap: Record<string, { score: number; label: string }> = {};
  profile?.abilityScores.forEach((a) => {
    dimensionMap[a.abilityName] = { score: a.score, label: a.abilityName };
  });
  const dimensions = ["代数运算", "函数建模", "几何推理"].map((name) => ({
    name,
    score: dimensionMap[name]?.score ?? 70,
  }));

  const weakLabel = (score: number) => {
    if (score >= 80) return { text: "掌握良好", color: "success" as const };
    if (score >= 60) return { text: "基本掌握", color: "info" as const };
    if (score >= 40) return { text: "需要加强", color: "warning" as const };
    return { text: "需要重点加强", color: "danger" as const };
  };

  const statusBadge = (s: WrongAnswer["status"]) => {
    if (s === "analyzed") return <Badge variant="info">已分析</Badge>;
    if (s === "inProject") return <Badge variant="warning">项目中</Badge>;
    return <Badge variant="success">已完成</Badge>;
  };

  return (
    <MainLayout title="学习首页" subtitle={`${state.user?.nickname}，欢迎回来！`}>
      <div className="space-y-6">
        {/* 欢迎区 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold">你好，{state.user?.nickname}同学 👋</h2>
          <p className="text-blue-100 mt-1 text-sm">
            当前学习阶段：{profile?.keyWeakAreas.length ? "重点突破薄弱环节" : "稳步提升中"}
          </p>
        </div>

        {/* 学习概况卡片组 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <BookX className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{profile?.totalAnalyzedWrongQuestions ?? 0}</p>
                <p className="text-sm text-slate-500">已分析错题</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <FolderCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{profile?.totalCompletedProjects ?? 0}</p>
                <p className="text-sm text-slate-500">已完成项目</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 leading-tight">
                  {profile?.keyWeakAreas[0] ?? "暂无"}
                </p>
                <p className="text-sm text-slate-500">当前重点薄弱领域</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 薄弱知识概览 */}
          <Card className="lg:col-span-1">
            <CardContent>
              <h3 className="text-base font-semibold text-slate-800 mb-4">薄弱知识概览</h3>
              <div className="space-y-4">
                {dimensions.map((d) => {
                  const lbl = weakLabel(d.score);
                  return (
                    <div key={d.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-slate-700">{d.name}</span>
                        <span className={`text-xs font-medium ${
                          lbl.color === "success" ? "text-green-600" :
                          lbl.color === "info" ? "text-blue-600" :
                          lbl.color === "warning" ? "text-amber-600" : "text-red-600"
                        }`}>{lbl.text}</span>
                      </div>
                      <ProgressBar
                        value={d.score}
                        color={lbl.color === "success" ? "success" : lbl.color === "warning" ? "warning" : lbl.color === "danger" ? "danger" : "primary"}
                      />
                    </div>
                  );
                })}
              </div>
              <Link href="/weak-points" className="mt-4 flex items-center text-sm text-primary hover:underline">
                查看完整知识画像 <ChevronRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>

          {/* 最近错题列表 */}
          <Card className="lg:col-span-2">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">最近错题</h3>
                <Link href="/wrong-questions" className="text-sm text-primary hover:underline">查看全部</Link>
              </div>
              <div className="space-y-3">
                {recentWrongs.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => router.push(`/analysis?id=${w.id}`)}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <BookX className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{w.question.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{w.createTime}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{w.errorType.name}</span>
                      </div>
                    </div>
                    {statusBadge(w.status)}
                  </div>
                ))}
                {recentWrongs.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">暂无错题记录</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 当前进行中项目 */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800">当前进行中项目</h3>
                <p className="text-sm text-slate-500 mt-1">易拉罐优化设计——利用导数求最值项目</p>
              </div>
              <Link href="/project/proj_demo/chat">
                <span className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  继续学习 <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 悬浮上传错题按钮 */}
      <Link href="/upload">
        <button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-blue-300 flex items-center justify-center hover:bg-blue-700 transition group">
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </Link>
    </MainLayout>
  );
}
