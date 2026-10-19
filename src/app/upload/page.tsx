"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Image as ImageIcon } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { analyzeQuestionApi } from "@/services/api";

export default function UploadPage() {
  const router = useRouter();
  const { dispatch } = useApp();
  const { showToast } = useToast();

  const [questionContent, setQuestionContent] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImageUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!questionContent.trim() || !studentAnswer.trim()) {
      showToast("请填写题目和你的答案", "error");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeQuestionApi({
        questionContent,
        questionImage: imageUrl || undefined,
        studentAnswer,
        correctAnswer: correctAnswer || undefined,
      });
      dispatch({ type: "SET_CURRENT_WRONG_ANSWER", wrongAnswer: result });
      showToast("分析完成！", "success");
      router.push(`/analysis?id=${result.id}`);
    } catch {
      showToast("分析失败，请重试", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <MainLayout title="错题分析中" subtitle="AI正在分析你的错题">
        <div className="max-w-2xl mx-auto mt-20">
          <Card>
            <CardContent>
              <Loading text="AI正在分析你的错题，请稍候..." size="lg" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="上传错题" subtitle="上传你的错题，AI将为你智能分析错因">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </button>

        {/* 题目区域 */}
        <Card>
          <CardContent>
            <h3 className="text-base font-semibold text-slate-800 mb-4">题目内容</h3>
            <div className="space-y-4">
              {/* 图片上传 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">题目图片</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 cursor-pointer hover:border-primary transition">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="题目" className="max-h-48 rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">点击上传题目图片</span>
                      <span className="text-xs text-slate-400 mt-1">支持 JPG、PNG 格式</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> OCR功能即将上线，当前请手动输入题目文字
                </p>
              </div>
              {/* 题目文字 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">题目文字</label>
                <textarea
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  placeholder="请输入题目内容..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 学生作答区域 */}
        <Card>
          <CardContent>
            <h3 className="text-base font-semibold text-slate-800 mb-4">作答信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">你的答案 <span className="text-red-500">*</span></label>
                <textarea
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="请输入你的答案或解答过程..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">正确答案（选填）</label>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="如果知道正确答案，可以填写在这里"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交 */}
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-3">系统将模拟AI分析过程，约2秒后展示结果</p>
          <Button size="lg" onClick={handleAnalyze}>
            开始分析
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
