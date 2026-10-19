"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Send, Bot, User, ArrowRight,
  Camera as CameraIcon, ImagePlus, X, Menu,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { chatApi, getProjectApi, uploadChatImageApi } from "@/services/api";
import { CameraCapture } from "@/components/upload/CameraCapture";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import type { Message, ProjectTask, Project } from "@/types";

export default function ProjectChatPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { state, dispatch } = useApp();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectCompleted, setProjectCompleted] = useState(false);

  // 图片相关
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // 任务过渡提示 + 移动端侧边栏
  const [transitionNotice, setTransitionNotice] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationId = useRef(`conv_${projectId}_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载项目并初始化对话
  useEffect(() => {
    const init = async () => {
      try {
        let proj = state.currentProject;
        if (!proj || proj.id !== projectId) {
          proj = await getProjectApi(projectId);
          dispatch({ type: "SET_CURRENT_PROJECT", project: proj });
        }
        setProject(proj);
        setTasks(proj.tasks);

        await chatApi(projectId, {
          message: "__init__",
          conversationId: conversationId.current,
        }).catch(() => {});
      } catch {
        // 初始化失败时使用本地欢迎消息
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || sending) return;
    const studentMsg = input.trim();
    setSending(true);
    setTransitionNotice(null);

    let imageUrl: string | undefined = undefined;

    if (pendingImage) {
      try {
        const uploadRes = await uploadChatImageApi(projectId, pendingImage);
        imageUrl = uploadRes.imageUrl;
      } catch (err) {
        showToast(err instanceof Error ? err.message : "图片上传失败", "error");
        setSending(false);
        return;
      }
    }

    const tempStudentMsg: Message = {
      id: `temp_${Date.now()}`,
      conversationId: conversationId.current,
      role: "student",
      type: imageUrl && studentMsg ? "text_and_image" : imageUrl ? "image" : "text",
      content: studentMsg || (imageUrl ? "[图片]" : ""),
      imageUrl,
      sendTime: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempStudentMsg]);
    setInput("");
    setPendingImage(null);
    setPendingImageUrl(null);

    try {
      const res = await chatApi(projectId, {
        message: studentMsg,
        conversationId: conversationId.current,
        imageUrl,
      });

      setMessages((prev) => [...prev, res.message]);
      setTasks(res.updatedTasks);
      dispatch({ type: "UPDATE_PROJECT_TASKS", tasks: res.updatedTasks });

      if (res.transitionNotice) {
        setTransitionNotice(res.transitionNotice);
      }
      if (res.projectCompleted) {
        setProjectCompleted(true);
      }
    } catch {
      showToast("AI回复失败，请重试", "error");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("请选择图片文件", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("图片过大，请上传小于 10MB 的图片", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingImage(file);
      setPendingImageUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCameraCapture = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingImage(file);
      setPendingImageUrl(ev.target?.result as string);
      setShowCamera(false);
    };
    reader.readAsDataURL(file);
  };

  const handleClearPendingImage = () => {
    setPendingImage(null);
    setPendingImageUrl(null);
  };

  if (loading) {
    return (
      <MainLayout title="AI项目学习" subtitle="AI导师引导式对话">
        <Loading text="正在加载项目..." />
      </MainLayout>
    );
  }

  // 当前任务：进行中 或 需要引导
  const currentTask =
    tasks.find((t) => t.status === "inProgress") ??
    tasks.find((t) => t.status === "needsGuidance");
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <MainLayout title="AI项目学习" subtitle="在AI导师引导下完成项目任务">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* 桌面端侧边栏 */}
        {project && (
          <div className="w-[30%] hidden md:block">
            <ProjectSidebar
              project={project}
              tasks={tasks}
              currentTask={currentTask}
              completedCount={completedCount}
            />
          </div>
        )}

        {/* 移动端侧边栏抽屉 */}
        {mobileSidebarOpen && project && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[82%] p-3">
              <ProjectSidebar
                project={project}
                tasks={tasks}
                currentTask={currentTask}
                completedCount={completedCount}
                onClose={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* 右侧主区域：对话 */}
        <div className="flex-1 bg-white rounded-xl border border-border flex flex-col min-w-0">
          {/* 移动端顶部条 */}
          <div className="md:hidden flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600"
              aria-label="打开任务进度"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {currentTask ? `任务${currentTask.taskNo}：${currentTask.title}` : "全部任务已完成"}
              </p>
              <p className="text-xs text-slate-400">
                进度 {completedCount}/{tasks.length}
                {currentTask?.status === "needsGuidance" && " · 需要引导"}
              </p>
            </div>
          </div>

          {/* 对话区 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-[75%] bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm text-slate-800">
                    欢迎来到本次项目学习！我们现在开始第一个任务：请你先说说，这个易拉罐设计问题里，我们已知哪些条件，需要求解什么呢？
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.role === "student" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "ai" ? "bg-primary" : "bg-slate-300"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                    msg.role === "ai"
                      ? "bg-slate-100 rounded-tl-sm text-slate-800"
                      : "bg-primary text-white rounded-tr-sm"
                  }`}
                >
                  {msg.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.imageUrl}
                      alt="解答图片"
                      className="rounded-lg mb-2 max-h-60 object-contain cursor-zoom-in hover:opacity-90 transition"
                      onClick={() => setPreviewImageUrl(msg.imageUrl!)}
                    />
                  )}
                  {msg.content && msg.content !== "[图片]" && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap"><MathText>{msg.content}</MathText></p>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1.5">正在查看你的解答……</p>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {projectCompleted && (
              <div className="text-center pt-4">
                <Button size="lg" onClick={() => router.push(`/project/${projectId}/complete`)}>
                  前往项目完成页 <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div className="border-t border-slate-100 p-3 sm:p-4">
            {/* 任务过渡提示横幅 */}
            {transitionNotice && (
              <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="flex-1 text-sm text-green-800 leading-relaxed">{transitionNotice}</p>
                <button
                  onClick={() => setTransitionNotice(null)}
                  className="text-green-500 hover:text-green-700 flex-shrink-0"
                  aria-label="关闭提示"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 待发送图片预览 */}
            {pendingImageUrl && (
              <div className="mb-3 inline-flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200 max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingImageUrl} alt="待发送" className="w-16 h-16 object-cover rounded flex-shrink-0" />
                <div className="text-xs text-slate-500">已选图片，可附文字说明</div>
                <button
                  onClick={handleClearPendingImage}
                  className="ml-1 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-100 hover:text-red-500 transition flex-shrink-0"
                  aria-label="移除图片"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              {/* 📷 拍照解答 */}
              <button
                onClick={() => setShowCamera(true)}
                disabled={sending}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 h-11 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary hover:bg-blue-50 transition disabled:opacity-50 text-sm font-medium"
                title="拍照解答"
              >
                <CameraIcon className="w-5 h-5" />
                <span className="hidden sm:inline">拍照解答</span>
              </button>

              {/* 🖼 上传图片 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 h-11 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary hover:bg-blue-50 transition disabled:opacity-50 text-sm font-medium"
                title="上传图片"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="hidden sm:inline">上传图片</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleSelectImage}
              />

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={pendingImage ? "可添加文字说明（可选）..." : "输入你的回答，按Enter发送..."}
                rows={2}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition resize-none text-sm"
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !pendingImage) || sending}
                loading={sending}
                className="self-end flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2 hidden sm:block">
              可拍照或上传你的手写解答，AI导师会结合当前任务进行引导。
            </p>
          </div>
        </div>
      </div>

      {/* 📷 摄像头拍照模态框 */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <CameraIcon className="w-5 h-5 text-primary" /> 拍照解答
              </h3>
              <button onClick={() => setShowCamera(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <CameraCapture
              onCapture={handleCameraCapture}
              onCancel={() => setShowCamera(false)}
            />
          </div>
        </div>
      )}

      {/* 图片大图预览模态框 */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="关闭预览"
          >
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImageUrl}
            alt="图片预览"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </MainLayout>
  );
}
