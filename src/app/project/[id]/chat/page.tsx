"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Send,
  Bot,
  User,
  ArrowRight,
  Camera as CameraIcon,
  ImagePlus,
  X,
  ListChecks,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { MathText } from "@/components/ui/MathText";
import { ChatText } from "@/components/ui/ChatText";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import {
  chatApi,
  getChatHistoryApi,
  uploadChatImageApi,
} from "@/services/api";
import { compressImageToFile } from "@/services/image";
import { CameraCapture } from "@/components/upload/CameraCapture";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { getCheckpointsForTask } from "@/services/projectBlueprint";
import type { Message, ProjectTask, Project } from "@/types";

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export default function ProjectChatPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { dispatch } = useApp();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projectCompleted, setProjectCompleted] = useState(false);

  // 图片相关
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [transitionNotice, setTransitionNotice] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationId = useRef(`conv_${projectId}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const loadConversation = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const history = await getChatHistoryApi(projectId);
      setProject(history.project);
      setTasks(history.tasks);
      setMessages(history.messages);
      setProjectCompleted(history.projectCompleted);
      conversationId.current = history.conversationId;
      dispatch({ type: "SET_CURRENT_PROJECT", project: history.project });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "加载项目失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    // 只滚动消息容器，避免 scrollIntoView 连带滚动整个页面（移动端尤其明显）
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, sending]);

  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || sending || projectCompleted) return;
    const studentMsg = input.trim();
    setSending(true);
    setTransitionNotice(null);

    let imageUrl: string | undefined = undefined;

    if (pendingImage) {
      try {
        const compressed = await compressImageToFile(pendingImage);
        const uploadRes = await uploadChatImageApi(projectId, compressed);
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
    const previousImage = pendingImage;
    const previousImageUrl = pendingImageUrl;
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

      if (res.transitionNotice) setTransitionNotice(res.transitionNotice);
      if (res.projectCompleted) setProjectCompleted(true);
    } catch (err) {
      // 失败时移除乐观消息，避免界面与实际会话不一致
      setMessages((prev) => prev.filter((m) => m.id !== tempStudentMsg.id));
      setInput(studentMsg);
      setPendingImage(previousImage);
      setPendingImageUrl(previousImageUrl);
      showToast(err instanceof Error ? err.message : "AI回复失败，请重试", "error");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
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

  const currentTask =
    tasks.find((t) => t.status === "inProgress") ??
    tasks.find((t) => t.status === "needsGuidance");
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const currentCheckpointCount = currentTask
    ? getCheckpointsForTask(currentTask).length
    : 0;

  if (loading) {
    return (
      <MainLayout title="AI项目学习" subtitle="AI导师引导式对话">
        <Loading text="正在恢复项目学习进度..." />
      </MainLayout>
    );
  }

  if (loadError || !project) {
    return (
      <MainLayout title="AI项目学习" subtitle="AI导师引导式对话">
        <div className="max-w-lg mx-auto mt-10">
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-300 mx-auto" />
            <p className="mt-3 text-sm text-slate-600">{loadError || "项目不存在"}</p>
            <div className="mt-4 flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push("/projects")}>
                返回项目列表
              </Button>
              <Button onClick={loadConversation}>重试</Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="AI项目学习" subtitle="在AI导师引导下完成项目任务">
      <div className="flex gap-4 h-[calc(100dvh-10rem)] lg:h-[calc(100dvh-8rem)] min-h-[480px]">
        {/* 桌面端侧边栏 */}
        <div className="w-[30%] max-w-[340px] hidden md:block flex-shrink-0">
          <ProjectSidebar
            project={project}
            tasks={tasks}
            currentTask={currentTask}
            completedCount={completedCount}
          />
        </div>

        {/* 移动端侧边栏抽屉 */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[86%] max-w-[340px] p-3">
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
          <div className="md:hidden flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 flex-shrink-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="h-9 px-2.5 rounded-lg border border-slate-200 flex items-center gap-1 text-slate-600 text-xs font-medium flex-shrink-0"
              aria-label="打开任务进度"
            >
              <ListChecks className="w-4 h-4" /> 任务
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

          {/* 桌面端任务状态条 */}
          <div className="hidden md:flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {currentTask
                  ? `任务${currentTask.taskNo} · ${currentTask.title}`
                  : "🎉 全部任务已完成"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {projectCompleted
                  ? "可以前往项目完成页查看成果"
                  : `已完成 ${completedCount}/${tasks.length} 个任务${
                      currentTask && currentCheckpointCount > 0
                        ? ` · 检查点 ${Math.min(
                            currentTask.checkpointIndex + 1,
                            currentCheckpointCount
                          )}/${currentCheckpointCount}`
                        : ""
                    }`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentTask?.status === "needsGuidance" ? (
                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  需要引导
                </span>
              ) : currentTask ? (
                <span className="text-xs text-primary bg-blue-50 px-2.5 py-1 rounded-full">
                  进行中
                </span>
              ) : (
                <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  已完成
                </span>
              )}
            </div>
          </div>

          {/* 对话区 */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === "student" ? "flex-row-reverse" : ""
                }`}
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
                <div className="max-w-[82%] sm:max-w-[75%] min-w-0">
                  <div
                    className={`px-4 py-3 rounded-2xl overflow-hidden ${
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
                        className="rounded-lg mb-2 max-h-60 object-contain cursor-zoom-in hover:opacity-90 transition bg-white/40"
                        onClick={() => setPreviewImageUrl(msg.imageUrl!)}
                      />
                    )}
                    {msg.content && msg.content !== "[图片]" && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.role === "ai" ? (
                          <ChatText>{msg.content}</ChatText>
                        ) : (
                          <MathText>{msg.content}</MathText>
                        )}
                      </p>
                    )}
                  </div>
                  <p
                    className={`text-[10px] text-slate-400 mt-1 ${
                      msg.role === "student" ? "text-right" : ""
                    }`}
                  >
                    {formatTime(msg.sendTime)}
                  </p>
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

            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div className="border-t border-slate-100 p-3 sm:p-4 flex-shrink-0">
            {transitionNotice && (
              <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="flex-1 text-sm text-green-800 leading-relaxed">
                  {transitionNotice}
                </p>
                <button
                  onClick={() => setTransitionNotice(null)}
                  className="text-green-500 hover:text-green-700 flex-shrink-0"
                  aria-label="关闭提示"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {pendingImageUrl && (
              <div className="mb-3 inline-flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200 max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingImageUrl}
                  alt="待发送"
                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                />
                <div className="text-xs text-slate-500">已选图片，可附文字说明</div>
                <button
                  onClick={() => {
                    setPendingImage(null);
                    setPendingImageUrl(null);
                  }}
                  className="ml-1 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-100 hover:text-red-500 transition flex-shrink-0"
                  aria-label="移除图片"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {projectCompleted ? (
              <div className="text-center py-2">
                <p className="text-sm text-slate-500">
                  项目已全部完成，去完成最终讲解，生成你的学习评价吧。
                </p>
                <Button
                  className="mt-2"
                  onClick={() => router.push(`/project/${projectId}/complete`)}
                >
                  前往项目完成页 <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 items-end">
                  <button
                    onClick={() => setShowCamera(true)}
                    disabled={sending}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 h-11 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary hover:bg-blue-50 transition disabled:opacity-50 text-sm font-medium"
                    title="拍照解答"
                  >
                    <CameraIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">拍照解答</span>
                  </button>

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
                    placeholder={pendingImage ? "可添加文字说明（可选）..." : "输入你的回答，按 Enter 发送"}
                    rows={2}
                    className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition resize-none text-sm"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={(!input.trim() && !pendingImage) || sending}
                    loading={sending}
                    className="self-end flex-shrink-0"
                    aria-label="发送"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2 hidden sm:block">
                  可拍照或上传你的手写解答，AI 导师会结合当前任务进行引导。遇到困难时，直接说出你的困惑即可。
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 摄像头拍照模态框 */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <CameraIcon className="w-5 h-5 text-primary" /> 拍照解答
              </h3>
              <button
                onClick={() => setShowCamera(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="关闭"
              >
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
