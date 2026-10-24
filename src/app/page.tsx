"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Sparkles,
  Brain,
  Target,
  Layers,
  ArrowRight,
} from "lucide-react";
import { loginApi } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    icon: Brain,
    title: "错因智能诊断",
    desc: "识别运算、概念、建模等错因，定位到具体出错步骤",
  },
  {
    icon: Target,
    title: "薄弱知识画像",
    desc: "从错题中提炼薄弱知识点与能力短板，给出提升方向",
  },
  {
    icon: Layers,
    title: "项目式学习",
    desc: "AI 导师分步引导，在真实问题中真正掌握导数应用",
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, state, hydrated } = useApp();
  const { showToast } = useToast();

  useEffect(() => {
    if (hydrated && state.user) {
      router.replace("/dashboard");
    }
  }, [hydrated, state.user, router]);

  const submit = async (account: string, pwd: string) => {
    if (!account || !pwd) {
      showToast("请输入账号和密码", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi({ username: account, password: pwd });
      login(res.user, res.token);
      showToast("登录成功，欢迎回来！", "success");
      router.push("/dashboard");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "账号或密码错误", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit(username.trim(), password);
  };

  const handleDemoLogin = () => {
    setUsername("student01");
    setPassword("123456");
    void submit("student01", "123456");
  };

  if (!hydrated || state.user) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <p className="text-sm text-slate-500">
          {state.user ? "正在进入学习空间..." : "正在加载..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-14">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
          {/* 左侧品牌与介绍 */}
          <section className="order-2 lg:order-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-primary">
                  AI MATH LEARNING
                </p>
                <h2 className="text-sm font-medium text-slate-500">AI数学错因诊断与项目式学习系统</h2>
              </div>
            </div>

            <h1 className="mt-8 text-3xl sm:text-4xl lg:text-[42px] font-bold text-slate-900 leading-tight text-balance">
              不是多刷一道题，
              <br />
              而是真正弄懂<span className="text-primary">错在哪里</span>。
            </h1>
            <p className="mt-4 text-slate-500 leading-relaxed max-w-xl">
              上传一道错题，AI 会帮你定位错因、生成知识画像，并设计一个可以动手完成的项目，
              在解决问题的过程中把薄弱点补上。
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-white/70 backdrop-blur rounded-2xl border border-white p-4 shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-800">{feature.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              支持文字、拍照与手写解答识别，AI 会结合你的解题过程给出引导
            </div>
          </section>

          {/* 右侧登录卡片 */}
          <section className="order-1 lg:order-2 w-full">
            <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/60 border border-slate-100 p-6 sm:p-8">
                <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold tracking-wide text-slate-500">
                    AI 数学错因诊断与项目式学习
                  </span>
                </div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">欢迎回来</h2>
                  <p className="text-sm text-slate-500 mt-1">登录后继续你的学习计划</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                      账号
                    </label>
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入账号"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                      密码
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="请输入密码"
                        className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 px-3.5 text-slate-400 hover:text-slate-600"
                        aria-label={showPassword ? "隐藏密码" : "显示密码"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" loading={loading} size="lg" className="w-full">
                    登 录
                  </Button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-xs text-slate-400">或</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full border-blue-200 text-primary hover:bg-blue-50"
                  onClick={handleDemoLogin}
                  disabled={loading}
                >
                  <Sparkles className="w-4 h-4" />
                  一键体验演示账号
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-xs text-slate-400 text-center">
                    演示账号：
                    <span className="font-mono text-slate-600">student01</span>
                    {" / "}
                    <span className="font-mono text-slate-600">123456</span>
                  </p>
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 mt-6">
                © {new Date().getFullYear()} AI数学错因诊断与项目式学习系统
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
