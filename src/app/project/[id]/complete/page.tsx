"use client";

import { useRouter, useParams } from "next/navigation";
import { PartyPopper, CheckCircle2, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";

export default function ProjectCompletePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { state } = useApp();
  const project = state.currentProject;

  const taskSummaries = [
    "明确了易拉罐设计需要在容积500cm³的约束下求最小表面积",
    "整理出已知条件：容积500cm³，圆柱形，目标是表面积最小",
    "建立了表面积S关于底面半径r的函数关系式：S = 2πr² + 1000/r",
    "通过求导S′(r)=4πr-1000/r²并令其为0，解得r≈4.30时表面积最小，约348.7cm²",
    "解释了方案的实际意义：当高为直径的2倍（h=2r）时用料最省",
  ];

  return (
    <MainLayout title="项目完成" subtitle="恭喜你完成了本次项目学习">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 庆祝提示 */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-8 text-center text-white">
          <PartyPopper className="w-14 h-14 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">🎉 恭喜你完成了本次项目学习！</h2>
          <p className="text-green-50 mt-2">你已经通过项目式学习突破了薄弱知识点</p>
        </div>

        {/* 完成概览 */}
        <Card>
          <CardContent>
            <h3 className="text-base font-semibold text-slate-800 mb-4">项目完成概览</h3>
            <div className="space-y-3">
              {project?.tasks.map((task, idx) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-800">
                      任务{task.taskNo}：{task.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{taskSummaries[idx]}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">项目总结</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                通过本次易拉罐优化设计项目，你学会了如何将实际问题转化为数学函数模型，
                掌握了利用导数求函数最值的方法，并能将数学结果解释回实际情境。
                你在代数运算、函数建模和逻辑推理方面的能力都得到了锻炼和提升。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 核心操作 */}
        <div className="text-center">
          <Button size="lg" onClick={() => router.push(`/project/${projectId}/explain`)}>
            开始最终讲解 <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-slate-400 mt-3">像给老师讲题一样，说说你的解题思路吧</p>
        </div>
      </div>
    </MainLayout>
  );
}
