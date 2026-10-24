"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Bot,
  Database,
  Download,
  RotateCcw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Info,
  Trash2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import {
  DATA_EXPORT_URL,
  getSystemStatusApi,
  resetDemoDataApi,
} from "@/services/api";
import type { SystemStatus } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { state, logout } = useApp();
  const { showToast } = useToast();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    getSystemStatusApi()
      .then(setStatus)
      .catch(() => showToast("加载系统状态失败", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleLogout = () => {
    logout();
    showToast("已退出登录", "info");
    router.push("/");
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "确定要重置演示数据吗？\n\n这会删除你新上传的错题、生成的项目、对话记录和学习评价，并恢复为初始演示数据。"
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      await resetDemoDataApi();
      showToast("演示数据已重置", "success");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      showToast("重置失败，请重试", "error");
      setResetting(false);
    }
  };

  return (
    <MainLayout title="设置与数据" subtitle="账号信息、AI 配置与数据管理">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        {/* 账号 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> 账号信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {state.user?.nickname?.[0] || "学"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-semibold text-slate-800">
                    {state.user?.nickname}
                  </p>
                  <Badge variant="info">{state.user?.grade}</Badge>
                  <Badge variant="success">演示账号</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  账号：{state.user?.username} · 用户 ID：{state.user?.id}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  注册时间：{state.user?.createTime}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex-shrink-0">
                <LogOut className="w-4 h-4" /> 退出登录
              </Button>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-slate-50 text-xs text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              当前为单机演示版本，账号体系使用本地 Mock 登录。接入学校统一认证后，可实现多学生账号与真实班级数据。
            </div>
          </CardContent>
        </Card>

        {/* AI 状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-500" /> AI 服务状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-400">正在检测 AI 服务...</p>
            ) : status ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    {status.aiConfigured ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {status.aiConfigured ? "已连接通义千问" : "未配置 API Key"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {status.aiConfigured
                          ? "错题分析、项目生成、AI 导师与评价均由真实大模型驱动"
                          : "当前使用本地 Mock 分析；配置 DASHSCOPE_API_KEY 后自动切换为真实 AI"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.aiConfigured ? "success" : "warning"}>
                    {status.aiConfigured ? "运行中" : "Mock 模式"}
                  </Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-400">文本模型</p>
                    <p className="text-sm font-medium text-slate-700 mt-1 font-mono">
                      {status.model}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-400">视觉 / OCR 模型</p>
                    <p className="text-sm font-medium text-slate-700 mt-1 font-mono">
                      {status.visionModel}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-slate-600 leading-relaxed">
                  配置方式：本地开发在项目根目录的 <code className="font-mono">.env.local</code> 中填写
                  <code className="font-mono"> DASHSCOPE_API_KEY</code>；线上部署在 Vercel 项目的
                  Environment Variables 中配置，修改后重新部署即可生效。详细说明见项目 README。
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">暂时无法获取 AI 服务状态</p>
            )}
          </CardContent>
        </Card>

        {/* 数据概览 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" /> 数据概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "错题", value: status.counts.wrongAnswers, unit: "道" },
                    { label: "项目", value: status.counts.projects, unit: "个" },
                    { label: "会话", value: status.counts.conversations, unit: "个" },
                    { label: "评价", value: status.counts.evaluations, unit: "份" },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-slate-50 text-center">
                      <p className="text-xl font-bold text-slate-800">
                        {item.value}
                        <span className="text-xs font-normal text-slate-400 ml-1">{item.unit}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  {status.storage === "postgres" ? (
                    <>
                      数据保存在云端 Postgres 数据库（包含上传的解答图片），所有设备共享同一份学习数据。
                    </>
                  ) : (
                    <>
                      数据保存在本地 <code className="font-mono">.data/store.json</code>。
                    </>
                  )}{" "}
                  最后更新于 {new Date(status.updatedAt).toLocaleString("zh-CN")}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">加载中...</p>
            )}

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <a href={DATA_EXPORT_URL} download className="sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="w-4 h-4" /> 导出全部数据（JSON）
                </Button>
              </a>
              <Button
                variant="danger"
                onClick={handleReset}
                loading={resetting}
                className="sm:w-auto"
              >
                <RotateCcw className="w-4 h-4" /> 重置演示数据
              </Button>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-red-50/70 border border-red-100 flex items-start gap-2">
              <Trash2 className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600/90 leading-relaxed">
                重置操作不可撤销，会清空你上传的错题、生成的项目、对话与评价，并恢复初始演示数据。
                如需保留，请先导出 JSON 备份。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 关于 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-500" /> 关于系统
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2 leading-relaxed">
            <p>AI数学错因诊断与项目式学习系统 · v1.0</p>
            <p className="text-xs text-slate-400">
              面向高中「一元函数导数及其应用」模块，提供错题诊断、知识画像、教材母题推荐、
              项目式学习与多维评价的完整学习闭环。
            </p>
            <p className="text-xs text-slate-400">
              技术栈：Next.js 14 · React 18 · TypeScript · Tailwind CSS · KaTeX · 通义千问
              （DashScope）
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
