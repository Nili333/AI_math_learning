# AI 数学错因诊断与项目式学习系统

面向高中「一元函数的导数及其应用」模块的 AI 学习系统。学生上传一道错题，系统会定位错因、更新知识画像、推荐教材母题，并生成一个 5 任务的项目式学习方案，由 AI 导师逐步引导完成，最后给出多维学习评价。

> 技术栈：Next.js 14（App Router）· React 18 · TypeScript · Tailwind CSS · KaTeX · 通义千问（DashScope OpenAI 兼容模式）

---

## 一、功能一览

### 学生端学习闭环

1. **登录 / 会话保持**：演示账号 `student01 / 123456`，会话保存在 localStorage，刷新不丢失。
2. **错题上传**
   - 手动输入题目与答案；
   - 上传题目照片 / 手写解答照片，自动压缩并调用视觉模型 OCR；
   - OCR 结果会按语义自动断句换行：题干、条件、小问、选项、解题步骤分别成行，不再挤成一整段；
   - 支持 LaTeX 公式预览。
3. **AI 错因诊断**
   - 错因类型：运算、概念、审题、建模、公式使用、推理等；
   - 分步骤定位错误，给出错因本质分析、关联知识点与能力、薄弱程度；
   - **同时生成 4~8 步的详细正确解答过程**，每步包含小标题、关键式子、思路解释和最终答案；
   - 分析结果写入错题本并实时更新知识画像。
4. **错题本**
   - 状态筛选（已分析 / 项目中 / 已订正）、关键词搜索；
   - 点击进入错因详情。
5. **知识画像**
   - 错因频次统计、知识点掌握状态、能力雷达图；
   - 根据错题自动计算重点薄弱领域。
6. **教材母题推荐**
   - 根据错题知识点推荐 3 道教材母题；
   - 学生选定母题后作为项目知识锚点。
7. **AI 项目式学习**
   - AI 生成项目背景、学习目标、5 个递进任务与检查点；
   - AI 导师按“提问 → 提示 → 追问 → 局部纠正”的方式引导，不直接给答案；
   - 四级提示逐级升级，记录每次尝试、提示、自我纠正；
   - 支持文字、拍照、手写图片混合作答；
   - 对话与任务进度持久化，刷新 / 重启后可以继续。
8. **项目完成与最终讲解**
   - 展示真实任务完成情况、尝试次数、提示次数、自我纠正次数；
   - 通过 5 个反思问题完成最终讲解，草稿自动保存。
9. **学习评价**
   - 6 个维度评分：知识理解、解题过程、数学表达、推理能力、建模能力、知识迁移；
   - 已掌握内容、仍需加强、学习建议、成长链路；
   - 支持打印报告。
10. **学习报告**
    - 汇总错题、项目、评价与能力画像；
    - 支持打印。
11. **设置与数据**
    - AI 服务状态、模型信息、数据规模；
    - 导出全部数据 JSON；
    - 重置演示数据。

### 页面路由

| 路由 | 说明 |
| --- | --- |
| `/` | 登录 / 产品介绍 |
| `/dashboard` | 学习首页 |
| `/upload` | 上传错题 + OCR |
| `/analysis?id=...` | 错因分析结果 |
| `/wrong-questions` | 错题本 |
| `/weak-points` | 知识画像 |
| `/textbook?wrongAnswerId=...` | 教材母题推荐与选择 |
| `/projects` | 项目列表 |
| `/project/[id]` | 项目详情 |
| `/project/[id]/chat` | AI 导师对话 |
| `/project/[id]/complete` | 项目完成概览 |
| `/project/[id]/explain` | 最终讲解 |
| `/project/[id]/evaluation` | 学习评价 |
| `/report` | 学习报告 |
| `/settings` | 设置与数据 |

---

## 二、快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（可选，不配置则使用 Mock 模式）
copy .env.local.example .env.local

# 3. 启动开发服务器
npm run dev
# 打开 http://localhost:3000
```

演示账号：

```text
账号：student01
密码：123456
```

也可以直接点击登录页的「一键体验演示账号」。

### 生产构建

```bash
npm run build
npm run start
```

### 让团队临时访问

本机保持 `npm run start` 运行时，可以用 Cloudflare Quick Tunnel 生成一个临时公网地址：

```bash
# Windows 下载 cloudflared 后
cloudflared.exe tunnel --url http://localhost:3000
```

命令会输出一个 `https://xxx.trycloudflare.com` 地址，发给团队即可访问。

> 这是临时预览方案：电脑关机或进程停止后链接失效，重新启动会生成新地址。
> 如果需要长期稳定访问，建议使用下面的正式部署方式。

### 正式部署需要准备什么

由于当前演示版使用本地文件存储（`.data/store.json`），不同部署方式的要求不同：

| 方案 | 需要准备 | 说明 |
| --- | --- | --- |
| Vercel + 云数据库 | Vercel 账号、GitHub 仓库、Neon/Supabase 等数据库 | 需要把 `serverStore` 替换为数据库读写；适合长期免运维 |
| 云服务器（阿里云/腾讯云） | 服务器 IP、SSH 账号、域名（可选） | 可用 PM2/Docker + Nginx，保留文件存储最简单 |
| Cloudflare 命名隧道 | Cloudflare 账号、自有域名、一台常开的机器 | 不需要公网 IP，链接稳定 |
| Render / Railway | 平台账号、持久化磁盘 | 接近云服务器的部署体验 |

---

## 三、AI 配置

在 `.env.local` 中配置阿里云百炼（DashScope）API Key：

```env
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
# 可选：覆盖默认模型
# QWEN_MODEL=qwen-plus
# QWEN_VL_MODEL=qwen3-vl-plus
# QWEN_PROJECT_TUTOR_MODEL=qwen-plus
```

- **有 Key**：错题分析、教材母题推荐、项目生成、AI 导师、学习评价、OCR 均调用真实大模型。
- **无 Key**：自动降级为本地 Mock 分析 / 模板项目 / 规则判定，完整流程仍可演示。
- 任一 AI 调用失败时也会自动降级，不会导致整个页面不可用。

> 注意：AI 生成项目通常需要 **30~90 秒**（需要输出完整的 5 任务方案）。页面会展示加载状态。

---

## 四、数据持久化

演示版本使用轻量本地存储：

```text
.data/store.json      # 错题、项目、对话、评价、学生画像
uploads/chat/         # 对话中上传的解答图片
```

- 首次启动自动写入演示数据；
- 所有读写经过串行锁与原子写入，避免并发覆盖；
- 可在「设置与数据」中导出 JSON 或重置演示数据；
- `.data/` 与 `uploads/` 已加入 `.gitignore`。

后续接入真实数据库时，只需替换 `src/services/serverStore.ts` 中的读写实现，API 与页面无需改动。

---

## 五、目录结构

```text
src/
├── app/                    # Next.js App Router 页面与 API
│   ├── api/                # Route Handlers
│   ├── dashboard/          # 学习首页
│   ├── upload/             # 上传错题
│   ├── analysis/           # 错因分析
│   ├── wrong-questions/    # 错题本
│   ├── weak-points/        # 知识画像
│   ├── textbook/           # 教材母题
│   ├── projects/           # 项目列表
│   ├── project/[id]/       # 项目详情 / 对话 / 完成 / 讲解 / 评价
│   ├── report/             # 学习报告
│   └── settings/           # 设置与数据
├── components/
│   ├── layout/             # 响应式应用外壳
│   ├── project/            # 项目任务侧边栏
│   ├── ui/                 # Card / Button / Badge / Charts / MathText ...
│   └── upload/             # 摄像头拍照
├── context/                # 登录会话
├── mock/                   # 演示数据
├── services/
│   ├── ai/                 # Qwen 调用、分析、导师、评价、OCR
│   ├── api.ts              # 前端 API 封装
│   ├── serverStore.ts      # 服务端持久化
│   ├── projectBlueprint.ts # 任务蓝图与检查点
│   ├── projectTaskState.ts # 任务状态机
│   └── image.ts            # 图片压缩
└── types/                  # 领域类型
```

---

## 六、核心设计说明

### 1. 任务状态机

`src/services/projectTaskState.ts` 是纯函数模块：

- 检查点通过 → 推进到下一个检查点；
- 任务全部检查点通过 → 完成任务并自动解锁下一个任务；
- 回答不完整但无明确错误 → 保持“进行中”；
- 检测到错误 → 进入“需要引导”，提示级别逐级提升（Level 1~4）；
- 记录每次尝试、提示次数、自我纠正。

### 2. AI 导师

`src/services/ai/projectTutor.ts`：

- 真实模式：把项目背景、任务目标、完成标准、检查点、学习状态与最近对话组织成结构化 Prompt，让 Qwen 输出 JSON 评估；
- Mock 模式：用任务检查点关键词 + 四级提示进行规则判定；
- AI 失败自动降级到 Mock，保证可用性。

### 3. 项目生成

`src/services/ai/projectGenerator.ts` 会生成：

- 项目名称、背景、学习目标、教材母题关联；
- 5 个递进任务，每个任务包含目标、完成标准、2~4 个检查点、每个检查点 4 级提示与判定关键词；
- 生成失败时回退到内置的「易拉罐优化设计」项目模板。

---

## 七、常见问题

**Q：页面一直显示“AI 识别中” / 分析失败？**
A：检查 `.env.local` 中的 `DASHSCOPE_API_KEY` 是否有效，以及网络能否访问 `dashscope.aliyuncs.com`。无 Key 时会自动使用 Mock，不会阻塞流程。

**Q：刷新后登录状态丢失？**
A：会话保存在浏览器 localStorage。如果使用了隐私模式或清理了站点数据，需要重新登录。

**Q：项目对话记录存在哪里？**
A：`.data/store.json` 的 `conversations` 字段。删除该文件或点击“重置演示数据”会恢复初始状态。

**Q：为什么我的新错题没有出现在知识画像中？**
A：新增错题会累加对应错因、知识点错误次数与薄弱领域；如果知识点未在种子数据中，会自动追加。
