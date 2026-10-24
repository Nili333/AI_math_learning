import type { Metadata, Viewport } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: {
    default: "AI数学错因诊断与项目式学习系统",
    template: "%s · AI数学学习",
  },
  description:
    "面向高中生的 AI 数学错因诊断与项目式学习系统：错题智能分析、知识画像、教材母题推荐、AI 导师项目学习与多维评价。",
  keywords: ["数学学习", "错题分析", "项目式学习", "导数", "AI教育"],
  authors: [{ name: "AI数学学习" }],
  applicationName: "AI数学学习",
  creator: "AI数学学习",
  formatDetection: { telephone: false },
  openGraph: {
    title: "AI数学错因诊断与项目式学习系统",
    description: "从一道错题出发，找到错因、生成项目、完成真正的学习闭环。",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">
        <AppProvider>
          <ToastProvider>{children}</ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
