import { NextRequest, NextResponse } from "next/server";
import { mockUser } from "@/mock";
import type { LoginRequest } from "@/types";

// ============================================
// POST /api/auth/login
// 学生登录（Mock）
// 未来替换为真实认证接口
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body: LoginRequest = await req.json();
    const { username, password } = body;

    // Mock账号验证：student01 / 123456
    if (username === "student01" && password === "123456") {
      return NextResponse.json({
        user: mockUser,
        token: "mock_token_" + Date.now(),
      });
    }

    return NextResponse.json(
      { message: "账号或密码错误" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { message: "请求参数错误" },
      { status: 400 }
    );
  }
}
