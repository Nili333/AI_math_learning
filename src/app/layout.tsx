import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "AI数学错因诊断与项目式学习系统",
  description: "面向学生的AI数学错因诊断与项目式学习系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background">
        <AppProvider>
          <ToastProvider>{children}</ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
