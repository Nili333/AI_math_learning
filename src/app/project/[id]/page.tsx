"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Target, ListChecks, BookOpen, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { getProjectApi } from "@/services/api";
import type { Project } from "@/types";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.currentProject && state.currentProject.id === projectId) {
      setProject(state.currentProject);
      setLoading(false);
      return;
    }
    const fetch = async () => {
      try {
        const p = await getProjectApi(projectId);
        setProject(p);
        dispatch({ type: "SET_CURRENT_PROJECT", project: p });
      } catch {
        showToast("加载项目失败", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [projectId, state.currentProject, dispatch, showToast]);

  if (loading || !project) {
    return (
      <MainLayout title="项目详情" subtitle="项目学习">
        <Loading />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="项目详情" subtitle="了解项目背景与任务要求">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        {/* 项目名称卡片 */}
        <Card className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-0">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <Badge className="bg-white/20 text-white">项目式学习</Badge>
            </div>
            <h2 className="text-2xl font-bold">{project.name}</h2>
          </CardContent>
        </Card>

        {/* 项目背景 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> 项目背景
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{project.background}</p>
          </CardContent>
        </Card>

        {/* 学习目标 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" /> 学习目标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {project.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700">{obj}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 项目任务 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-green-500" /> 项目任务
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-primary text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {task.taskNo}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-800">{task.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">任务将按顺序解锁，完成上一个任务后才能进入下一个任务。</p>
          </CardContent>
        </Card>

        {/* 项目来源 */}
        <Card className="border-l-4 border-l-amber-400">
          <CardContent>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">项目来源</h4>
                <p className="text-sm text-slate-600">
                  本项目改编自教材母题 —{" "}
                  <span className="text-amber-600 font-medium">
                    {project.sourceTextbookQuestion.textbookVersion} · {project.sourceTextbookQuestion.chapter}
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-1">母题编号：{project.sourceTextbookQuestion.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 开始按钮 */}
        <div className="text-center">
          <Button size="lg" onClick={() => router.push(`/project/${projectId}/chat`)}>
            开始项目
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
