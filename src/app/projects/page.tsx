"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  Upload,
  PlayCircle,
  FileText,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import { listProjectsApi } from "@/services/api";
import type { ProjectSummary } from "@/types";

export default function ProjectsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjectsApi()
      .then(setProjects)
      .catch(() => showToast("加载项目失败，请刷新重试", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading) {
    return (
      <MainLayout title="项目学习" subtitle="你的项目式学习">
        <Loading text="加载项目列表..." />
      </MainLayout>
    );
  }

  const active = projects.filter((p) => p.status !== "completed");
  const completed = projects.filter((p) => p.status === "completed");

  return (
    <MainLayout title="项目学习" subtitle="在真实问题中，把薄弱知识真正用起来">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{projects.length}</p>
              <p className="text-xs text-slate-500 mt-1">全部项目</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{active.length}</p>
              <p className="text-xs text-slate-500 mt-1">进行中</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{completed.length}</p>
              <p className="text-xs text-slate-500 mt-1">已完成</p>
            </CardContent>
          </Card>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto">
                <Layers className="w-7 h-7 text-indigo-400" />
              </div>
              <p className="mt-3 text-sm text-slate-500">还没有项目</p>
              <p className="text-xs text-slate-400 mt-1">
                从一道错题出发，AI 会为你设计一个针对性的项目
              </p>
              <Button onClick={() => router.push("/upload")} className="mt-4">
                <Upload className="w-4 h-4" /> 上传错题
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {[...active, ...completed].map((p) => {
              const isCompleted = p.status === "completed";
              return (
                <Card key={p.id} className="hover:shadow-md transition">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? "bg-green-50" : "bg-indigo-50"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <Layers className="w-6 h-6 text-indigo-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800 leading-snug">{p.name}</h3>
                          <Badge variant={isCompleted ? "success" : "warning"}>
                            {isCompleted ? "已完成" : "进行中"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {isCompleted
                            ? `已完成全部 ${p.totalTasks} 个任务`
                            : `当前任务：${p.currentTaskTitle ?? "准备开始"}`}
                        </p>
                        <div className="mt-3 max-w-lg">
                          <ProgressBar
                            value={p.progress}
                            color={isCompleted ? "success" : "primary"}
                            showValue
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            创建于 {p.createTime.slice(0, 10)}
                          </span>
                          <span>·</span>
                          <span>
                            已完成 {p.completedTasks}/{p.totalTasks} 个任务
                          </span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant={isCompleted ? "outline" : "primary"}
                          onClick={() =>
                            router.push(
                              isCompleted
                                ? `/project/${p.id}/complete`
                                : `/project/${p.id}/chat`
                            )
                          }
                        >
                          {isCompleted ? (
                            <>
                              <FileText className="w-3.5 h-3.5" /> 查看成果
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-3.5 h-3.5" /> 继续学习
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/project/${p.id}`)}
                        >
                          详情 <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
