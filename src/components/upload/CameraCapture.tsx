"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

type CameraState = "requesting" | "streaming" | "captured" | "error";

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("requesting");
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setCameraState("requesting");
    setErrorMsg("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("当前浏览器不支持摄像头调用");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraState("streaming");
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError" || e.name === "SecurityError") setErrorMsg("摄像头权限被拒绝，请允许访问摄像头，或改用「上传解答」。");
      else if (e.name === "NotFoundError" || e.name === "OverconstrainedError") setErrorMsg("未检测到可用的摄像头设备，请改用「上传解答」。");
      else setErrorMsg(e.message || "无法启动摄像头，请改用「上传解答」。");
      setCameraState("error");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  }, [startCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth; const h = video.videoHeight;
    if (!w || !h) return;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedUrl(dataUrl);
    video.pause();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState("captured");
  };

  const handleRetake = () => { setCapturedUrl(null); startCamera(); };

  const handleConfirm = async () => {
    if (!capturedUrl) return;
    try {
      const res = await fetch(capturedUrl);
      const blob = await res.blob();
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
    } catch { setErrorMsg("图片处理失败，请重试"); setCameraState("error"); }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
        {cameraState === "streaming" && (<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />)}
        {cameraState === "captured" && capturedUrl && (<img src={capturedUrl} alt="拍摄预览" className="w-full h-full object-contain" />)}
        {cameraState === "requesting" && (<p className="text-slate-300 text-sm">正在请求摄像头权限...</p>)}
        {cameraState === "error" && (<div className="text-center px-6"><X className="w-10 h-10 text-red-400 mx-auto mb-2" /><p className="text-slate-200 text-sm">{errorMsg}</p></div>)}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-3 justify-center flex-wrap">
        {cameraState === "streaming" && (<Button size="lg" onClick={handleCapture}><Camera className="w-4 h-4" /> 拍照</Button>)}
        {cameraState === "captured" && (<><Button variant="outline" size="lg" onClick={handleRetake}><RotateCcw className="w-4 h-4" /> 重新拍摄</Button><Button size="lg" onClick={handleConfirm}><Check className="w-4 h-4" /> 使用这张</Button></>)}
        {cameraState === "error" && (<Button variant="outline" size="lg" onClick={startCamera}><RotateCcw className="w-4 h-4" /> 重试</Button>)}
        <Button variant="ghost" size="lg" onClick={onCancel}>取消</Button>
      </div>
    </div>
  );
}
