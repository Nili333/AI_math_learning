"use client";

import { useCallback, useEffect, useState } from "react";
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
  Layers,
  Upload,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import {
  getProfileApi,
  getRecentWrongQuestionsApi,
  listProjectsApi,
} from "@/services/api";
import type { ProjectSummary, StudentProfile, WrongAnswer } from "@/types";

const masteryScore: Record<string, number> = {
  mastered: 90,
  basic: 72,
  needStrengthen: 48,
  focus: 28,
};

const masteryMeta: Record<
  string,
  { label: string; text: string; color: "success" | "primary" | "warning" | "danger" }
> = {
  mastered: { label: "已掌握", text: "text-green-600", color: "success" },
  basic: { label: "基本掌握", text: "text-blue-600", color: "primary" },
  needStrengthen: { label: "需要加强", text: "text-amber-600", color: "warning" },
  focus: { label: "需重点加强", text: "text-red-600", color: "danger" },
};

export default function DashboardPage() {
  const { state } = useApp();
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [recentWrongs, setRecentWrongs] = useState<WrongAnswer[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [p, r, ps] = await Promise.all([
        getProfileApi(),
        getRecentWrongQuestionsApi(),
        listProjectsApi(),
      ]);
      setProfile(p);
      setRecentWrongs(r.slice(0, 4));
      setProjects(ps);
    } catch {
      showToast("加载学习数据失败，请刷新重试", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <MainLayout title="学习首页" subtitle="欢迎回来，开始今天的学习吧">
        <Loading text="加载学习数据中..." />
      </MainLayout>
    );
  }

  const activeProjects = projects.filter((p) => p.status !== "completed");
  const currentProject = activeProjects[0];
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const weakPoints = [...(profile?.knowledgeMastery ?? [])]
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 4);

  const statusBadge = (s: WrongAnswer["status"]) => {
    if (s === "analyzed") return <Badge variant="info">已分析</Badge>;
    if (s === "inProject") return <Badge variant="warning">项目中</Badge>;
    return <Badge variant="success">已订正</Badge>;
  };

  return (
    <MainLayout
      title="学习首页"
      subtitle={`${state.user?.nickname ?? "同学"}，欢迎回来！`}
    >
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
        {/* 欢迎区 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-5 sm:p-6 text-white">
          <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute right-16 -bottom-14 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">
                {profile?.keyWeakAreas[0]
                  ? `当前重点突破：${profile.keyWeakAreas.slice(0, 2).join("、")}`
                  : "今天也从一道错题开始吧"}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold mt-1.5">
                你好，{state.user?.nickname}同学 👋
              </h2>
              <p className="text-blue-100/90 text-sm mt-2 max-w-xl leading-relaxed">
                把错题真正弄懂，比多刷十道题更有效。上传一道错题，让 AI 帮你找到问题根源。
              </p>
            </div>
            <Link href="/upload" className="flex-shrink-0">
              <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-primary rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-50 transition">
                <Upload className="w-4 h-4" />
                上传错题
              </span>
            </Link>
          </div>
        </div>

        {/* 学习概况卡片组 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 sm:p-5 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <BookX className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-800">
                  {profile?.totalAnalyzedWrongQuestions ?? 0}
                </p>
                <p className="text-xs text-slate-500 truncate">已分析错题</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-5 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <FolderCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-800">
                  {completedProjects}
                </p>
                <p className="text-xs text-slate-500 truncate">已完成项目</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-5 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-800">
                  {activeProjects.length}
                </p>
                <p className="text-xs text-slate-500 truncate">进行中项目</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-5 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 leading-tight line-clamp-2">
                  {profile?.keyWeakAreas[0] ?? "暂无"}
                </p>
                <p className="text-xs text-slate-500 truncate">重点薄弱领域</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* 薄弱知识概览 */}
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">薄弱知识概览</h3>
                <Link href="/weak-points" className="text-xs text-primary hover:underline">
                  详情
                </Link>
              </div>
              <div className="space-y-4">
                {weakPoints.map((km) => {
                  const meta = masteryMeta[km.masteryLevel];
                  return (
                    <div key={km.knowledgePointId}>
                      <div className="flex justify-between items-center gap-2 mb-1.5">
                        <span className="text-sm text-slate-700 truncate">
                          {km.knowledgePointName}
                        </span>
                        <span className={`text-xs font-medium flex-shrink-0 ${meta.text}`}>
                          {meta.label}
                        </span>
                      </div>
                      <ProgressBar value={masteryScore[km.masteryLevel]} color={meta.color} />
                      <p className="text-[11px] text-slate-400 mt-1">
                        累计出错 {km.errorCount} 次
                      </p>
                    </div>
                  );
                })}
                {weakPoints.length === 0 && (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    还没有薄弱点数据，先上传一道错题吧
                  </p>
                )}
              </div>
              <Link
                href="/weak-points"
                className="mt-5 flex items-center text-sm text-primary hover:underline"
              >
                查看完整知识画像 <ChevronRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>

          {/* 最近错题列表 */}
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">最近错题</h3>
                <Link href="/wrong-questions" className="text-sm text-primary hover:underline">
                  查看全部
                </Link>
              </div>
              <div className="space-y-2">
                {recentWrongs.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => router.push(`/analysis?id=${w.id}`)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <BookX className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 line-clamp-1">
                        {w.question.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {w.createTime}
                        </span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{w.errorType.name}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">{statusBadge(w.status)}</div>
                  </button>
                ))}
                {recentWrongs.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-400">暂无错题记录</p>
                    <Link href="/upload" className="text-sm text-primary hover:underline mt-2 inline-block">
                      上传第一道错题
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 当前进行中项目 */}
        <Card>
          <CardContent className="p-5">
            {currentProject ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-800 truncate">
                        {currentProject.name}
                      </h3>
                      <Badge variant="warning">进行中</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      当前任务：{currentProject.currentTaskTitle ?? "准备开始"}
                      {" · "}
                      已完成 {currentProject.completedTasks}/{currentProject.totalTasks} 个任务
                    </p>
                    <div className="mt-2 max-w-md">
                      <ProgressBar value={currentProject.progress} color="primary" showValue />
                    </div>
                  </div>
                </div>
                <Link href={`/project/${currentProject.id}/chat`} className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                    继续学习 <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">还没有进行中的项目</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      从一道错题出发，生成一个针对性的项目式学习方案。
                    </p>
                  </div>
                </div>
                <Link href="/upload" className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                    开始一个项目 <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 行动建议 */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/weak-points" className="block">
            <Card className="hover:shadow-md transition h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">查看知识画像</p>
                  <p className="text-xs text-slate-500 truncate">找到最需要突破的薄弱点</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/report" className="block">
            <Card className="hover:shadow-md transition h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">查看学习报告</p>
                  <p className="text-xs text-slate-500 truncate">回顾成长轨迹与项目成果</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 悬浮上传错题按钮 */}
      <Link href="/upload" aria-label="上传错题">
        <button className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-blue-300 flex items-center justify-center hover:bg-blue-700 transition group z-20">
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </Link>
    </MainLayout>
  );
}
