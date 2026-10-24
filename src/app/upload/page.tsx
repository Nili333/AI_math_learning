"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Wand2,
  Loader2,
  RefreshCw,
  ImagePlus,
  Sparkles,
  X,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { analyzeQuestionApi, recognizeOcrApi } from "@/services/api";
import { compressImageFile } from "@/services/image";
import { MathText } from "@/components/ui/MathText";

const DEMO_QUESTION = "求函数 y = x³ - 3x² + 2 的导数 y′。";
const DEMO_ANSWER = "y′ = 3x² - 3x";
const DEMO_CORRECT = "y′ = 3x² - 6x";

export default function UploadPage() {
  const router = useRouter();
  const { dispatch } = useApp();
  const { showToast } = useToast();

  const [questionContent, setQuestionContent] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const [answerImageUrl, setAnswerImageUrl] = useState("");
  const [answerOcrLoading, setAnswerOcrLoading] = useState(false);

  const [questionPreview, setQuestionPreview] = useState(false);
  const [answerPreview, setAnswerPreview] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setImageUrl(dataUrl);
      showToast("图片已压缩，正在识别题目...", "info");
      await handleOcrRecognize(dataUrl, "question");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "图片处理失败", "error");
    }
  };

  const handleAnswerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setAnswerImageUrl(dataUrl);
      showToast("图片已压缩，正在识别作答...", "info");
      await handleOcrRecognize(dataUrl, "answer");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "图片处理失败", "error");
    }
  };

  const handleOcrRecognize = async (imgData: string, type: "question" | "answer") => {
    const loadingState = type === "question" ? setOcrLoading : setAnswerOcrLoading;
    loadingState(true);
    try {
      const result = await recognizeOcrApi(imgData, type);
      if (result.success && result.text) {
        if (type === "question") {
          setQuestionContent((prev) => (prev.trim() ? `${prev}\n${result.text}` : result.text!));
          setQuestionPreview(true);
          showToast("题目识别成功，可切换为「编辑」继续修改", "success");
        } else {
          setStudentAnswer((prev) => (prev.trim() ? `${prev}\n${result.text}` : result.text!));
          setAnswerPreview(true);
          showToast("作答识别成功，可切换为「编辑」继续修改", "success");
        }
      } else {
        showToast(
          result.message || `${type === "question" ? "题目" : "作答"}识别失败，请手动输入`,
          "error"
        );
      }
    } catch {
      showToast("识别失败，请手动输入", "error");
    } finally {
      loadingState(false);
    }
  };

  const handleAnalyze = async () => {
    if (!questionContent.trim()) {
      showToast("请填写题目内容", "error");
      return;
    }
    if (!studentAnswer.trim() && !answerImageUrl) {
      showToast("请填写你的答案，或上传答案图片", "error");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeQuestionApi({
        questionContent: questionContent.trim(),
        questionImage: imageUrl || undefined,
        studentAnswer: studentAnswer.trim(),
        studentAnswerImage: answerImageUrl || undefined,
        correctAnswer: correctAnswer.trim() || undefined,
      });
      dispatch({ type: "SET_CURRENT_WRONG_ANSWER", wrongAnswer: result });
      showToast("分析完成！", "success");
      router.push(`/analysis?id=${result.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "分析失败，请重试", "error");
      setAnalyzing(false);
    }
  };

  const fillDemo = () => {
    setQuestionContent(DEMO_QUESTION);
    setStudentAnswer(DEMO_ANSWER);
    setCorrectAnswer(DEMO_CORRECT);
    setQuestionPreview(false);
    setAnswerPreview(false);
    showToast("已填入示例错题", "info");
  };

  if (analyzing) {
    return (
      <MainLayout title="错题分析中" subtitle="AI正在分析你的错题">
        <div className="max-w-2xl mx-auto mt-12 sm:mt-20">
          <Card>
            <CardContent className="py-10">
              <Loading text="AI 正在阅读题目、定位错误步骤并生成诊断，请稍候..." size="lg" />
              <p className="text-center text-xs text-slate-400 mt-2">
                通常需要 5~30 秒，请勿关闭页面
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="上传错题" subtitle="上传你的错题，AI将为你智能分析错因">
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <button
            onClick={fillDemo}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" /> 填入示例错题
          </button>
        </div>

        {/* 题目区域 */}
        <Card>
          <CardContent>
            <h3 className="text-base font-semibold text-slate-800 mb-4">题目内容</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  题目图片（可选，上传后自动识别）
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition relative">
                  {imageUrl ? (
                    <div className="relative w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="题目"
                        className="max-h-48 mx-auto rounded-lg object-contain"
                      />
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setImageUrl("");
                        }}
                        className="absolute top-0 right-0 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500"
                        role="button"
                        aria-label="移除题目图片"
                      >
                        <X className="w-4 h-4" />
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">点击上传题目照片</span>
                      <span className="text-xs text-slate-400 mt-1">
                        支持 JPG、PNG、WebP，自动压缩并 OCR 识别
                      </span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {imageUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOcrRecognize(imageUrl, "question")}
                      disabled={ocrLoading}
                      className="text-xs"
                    >
                      {ocrLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 识别中...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" /> 重新识别
                        </>
                      )}
                    </Button>
                    <span className="text-xs text-slate-400">识别结果会追加到题目文字中</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    题目文字 <span className="text-red-500">*</span>
                    {ocrLoading && (
                      <span className="ml-2 text-xs text-primary inline-flex items-center gap-1">
                        <Wand2 className="w-3 h-3" /> AI 识别中...
                      </span>
                    )}
                  </label>
                  {questionContent.trim() && (
                    <button
                      type="button"
                      onClick={() => setQuestionPreview((v) => !v)}
                      className="text-xs text-primary hover:underline"
                    >
                      {questionPreview ? "编辑" : "预览公式"}
                    </button>
                  )}
                </div>
                {questionPreview ? (
                  <div className="w-full min-h-[110px] px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 leading-relaxed">
                    <MathText>{questionContent}</MathText>
                  </div>
                ) : (
                  <textarea
                    value={questionContent}
                    onChange={(e) => setQuestionContent(e.target.value)}
                    placeholder="上传图片后会自动识别题目，也可手动输入或修改。数学公式可用 LaTeX，如 $f'(x)=3x^2$"
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                  />
                )}
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  答案图片（手写解答拍照上传）
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition relative">
                  {answerImageUrl ? (
                    <div className="relative w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={answerImageUrl}
                        alt="答案"
                        className="max-h-44 mx-auto rounded-lg object-contain"
                      />
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAnswerImageUrl("");
                        }}
                        className="absolute top-0 right-0 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500"
                        role="button"
                        aria-label="移除答案图片"
                      >
                        <X className="w-4 h-4" />
                      </span>
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="w-7 h-7 text-slate-400 mb-1.5" />
                      <span className="text-sm text-slate-500">点击上传你的解答图片</span>
                      <span className="text-xs text-slate-400 mt-1">
                        纸质作业可拍照上传，AI 会识别手写过程并分析
                      </span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAnswerImageUpload} />
                </label>
                {answerImageUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOcrRecognize(answerImageUrl, "answer")}
                      disabled={answerOcrLoading}
                      className="text-xs"
                    >
                      {answerOcrLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 识别中...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" /> 重新识别
                        </>
                      )}
                    </Button>
                    <span className="text-xs text-slate-400">已上传图片，文字答案可选填</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    你的答案
                    {!answerImageUrl && <span className="text-red-500 ml-0.5">*</span>}
                    {answerOcrLoading && (
                      <span className="ml-2 text-xs text-primary inline-flex items-center gap-1">
                        <Wand2 className="w-3 h-3" /> AI 识别中...
                      </span>
                    )}
                  </label>
                  {studentAnswer.trim() && (
                    <button
                      type="button"
                      onClick={() => setAnswerPreview((v) => !v)}
                      className="text-xs text-primary hover:underline"
                    >
                      {answerPreview ? "编辑" : "预览公式"}
                    </button>
                  )}
                </div>
                {answerPreview ? (
                  <div className="w-full min-h-[84px] px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 leading-relaxed">
                    <MathText>{studentAnswer}</MathText>
                  </div>
                ) : (
                  <textarea
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder={
                      answerImageUrl
                        ? "已上传答案图片，可补充文字说明（可选）"
                        : "请输入你的答案或解答过程..."
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                  />
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {answerImageUrl
                    ? "AI 将结合答案图片与文字说明分析错因"
                    : "可手动输入，也可上传手写解答图片"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  正确答案（选填）
                </label>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="如果知道正确答案，可以填写在这里，AI 分析会更准确"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交 */}
        <div className="text-center pb-4">
          <p className="text-xs text-slate-400 mb-3">
            {answerImageUrl
              ? "AI 将结合图片和文字定位错因，约 5~30 秒"
              : "AI 将分析你的错因，约 5~30 秒"}
          </p>
          <Button size="lg" onClick={handleAnalyze} loading={analyzing}>
            <Sparkles className="w-4 h-4" /> 开始分析
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
