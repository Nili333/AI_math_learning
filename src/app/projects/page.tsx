"use client";

import { useRouter } from "next/navigation";
import { Layers, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function ProjectsPage() {
  const router = useRouter();

  const demoProjects: {
    id: string;
    name: string;
    status: "notStarted" | "inProgress" | "completed";
    progress: number;
    desc: string;
  }[] = [
    {
      id: "proj_demo",
      name: "易拉罐优化设计——利用导数求最值项目",
      status: "inProgress",
      progress: 40,
      desc: "通过设计用料最省的易拉罐方案，练习导数建模与最值求解",
    },
  ];

  return (
    <MainLayout title="项目学习" subtitle="你的项目式学习">
      <div className="max-w-4xl mx-auto space-y-4">
        {demoProjects.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition cursor-pointer"
            onClick={() => router.push(`/project/${p.id}/chat`)}
          >
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    <Badge variant={p.status === "completed" ? "success" : "warning"}>
                      {p.status === "completed" ? "已完成" : "进行中"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{p.desc}</p>
                  <div className="mt-3">
                    <ProgressBar value={p.progress} color="primary" showValue />
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
