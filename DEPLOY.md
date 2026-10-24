# 方案 A 完整部署步骤（GitHub + Vercel + Neon）

> 适用项目：`ai-math-learning`（Next.js 14 + Postgres）
>
> 每一步都写了“检查点”，检查点通过再继续下一步，避免后面出错难排查。

---

## 第 0 步：部署前确认

### 0.1 当前代码状态

| 能力 | 说明 |
| --- | --- |
| 本地文件存储 | 未配置数据库时自动使用 `.data/store.json`，本机演示完全可用 |
| Postgres 存储 | 配置 `DATABASE_URL` 或 `POSTGRES_URL` 后自动启用 |
| 图片存储 | Postgres 模式下上传图片存入数据库；本地模式存 `uploads/chat/` |
| 自动建表 | 首次访问自动创建 `kv`、`images` 两张表并写入演示数据 |

### 0.2 需要准备的东西

1. 可正常登录的 GitHub 账号（**当前 `Nili333` 仍被停用，见第 1 步**）
2. Vercel 账号（用 GitHub 登录即可）
3. Neon（或 Supabase）数据库连接串
4. 百炼 `DASHSCOPE_API_KEY`（本项目 `.env.local` 中已有）

---

## 第 1 步：恢复 GitHub 账号（目前卡在这里）

### 1.1 判断账号状态

```powershell
git -c http.proxy=http://127.0.0.1:7897 ls-remote --heads https://github.com/Nili333/AI_math_learning.git
```

- 输出分支列表 → 账号正常，跳到第 2 步
- 输出 `Your account is suspended` / `403` → 继续下面的恢复流程

### 1.2 提交申诉

1. 打开 https://support.github.com/contact
2. 选择 **Account** → **Suspended account**
3. 填写：
   - 账号名
   - 用途说明：个人学习 / 大学生创新创业项目，非商业用途
   - 说明仓库内容：Next.js 数学学习网站代码，无违规内容
4. 提交后一般 1~3 个工作日回复，期间可正常使用邮箱查收

### 1.3 如果申诉迟迟没有结果

建议**不要连续注册新账号**（容易被判定为规避封禁，风险更高）。可先等待申诉结果，或使用下面的备用方案：

- 使用学校/公司提供的 GitLab（https://gitlab.com）创建仓库
- Vercel 支持导入 GitLab / Bitbucket 仓库，流程与 GitHub 基本相同

> 无论用哪个平台，后面第 4 步的推送命令把仓库地址换掉即可。

---

## 第 2 步：创建 GitHub 仓库（账号恢复后）

### 2.1 新建空仓库

1. 打开 https://github.com/new
2. Repository name 填 `AI_math_learning`
3. 选择 **Private**（推荐，代码不公开）
4. **不要**勾选 `Add a README file`、`.gitignore`、`license`（保持完全空仓库）
5. 点 **Create repository**

### 2.2 检查仓库为空

页面应显示 “Quick setup — if you’ve done this kind of thing before”

### 2.3 修改本地仓库地址

```powershell
git remote set-url origin https://github.com/Nili333/AI_math_learning.git
git remote -v
```

检查点：输出两行 `origin  https://github.com/Nili333/AI_math_learning.git (fetch/push)`

---

## 第 3 步：本地最终准备

### 3.1 确认代码可构建

```powershell
npm run lint
npm run build
```

检查点：`lint` 无警告，`build` 显示 `✓ Compiled successfully`

### 3.2 确认不会提交敏感文件

```powershell
git status --short
```

检查点：**不应出现**以下文件：

- `.env.local`
- `.data/`
- `uploads/`
- `cloudflared.exe`
- `.chrome-profile/`

如果出现了，检查 `.gitignore` 是否包含这些条目。

### 3.3 检查大文件

项目根目录的 `错题*/` 图片文件夹可能有几 GB，**不应该提交**。

```powershell
Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt 5MB -and $_.FullName -notmatch 'node_modules|\.next' } |
  Select-Object FullName, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}
```

检查点：如果输出中包含 `错题1-50` 等目录，需要先加入 `.gitignore`：

```powershell
Add-Content .gitignore "`n# 本地素材（体积较大，不提交）`n/错题*/`n/*.docx`n/*.pdf`n/*.xlsx"
```

---

## 第 4 步：推送代码到 GitHub

### 4.1 配置代理（网络受限时）

```powershell
git config --global credential.helper manager
# 仅当 github.com 无法直连时才需要：
git config --global http.https://github.com.proxy http://127.0.0.1:7897
```

### 4.2 提交

```powershell
git add src .github README.md .env.local.example .gitignore package.json package-lock.json tailwind.config.ts tsconfig.json next.config.mjs postcss.config.mjs .eslintrc.json
git commit -m "feat: 完整学习闭环 + 方案A 部署适配（Postgres 存储）"
```

> 建议使用 `git add` 指定文件，而不是 `git add .`，避免把大素材一起提交。

### 4.3 推送

```powershell
git push -u origin main
```

- 第一次推送会弹出 GitHub 登录窗口（Git Credential Manager）
- 选择 **Sign in with your browser**，完成授权

检查点：GitHub 仓库页面能看到 `src/`、`package.json` 等文件

### 4.4 如果提示 `push declined due to email privacy restrictions`

```powershell
git config user.email "你的GitHub账号邮箱"
git commit --amend --reset-author --no-edit
git push -u origin main
```

---

## 第 5 步：创建 Neon 数据库

### 5.1 注册并建库

1. 打开 https://neon.com ，用 GitHub 或邮箱注册
2. 点 **Create project**
3. Project name：`ai-math-learning`
4. Region：**Singapore (ap-southeast-1)**（国内访问更快）
5. Postgres version 保持默认（16 或 17 均可）
6. 点 **Create**

### 5.2 获取连接串

1. 进入项目 → 左侧 **Dashboard** → **Connect**
2. Connection string 选 **Pooled connection**
3. 复制完整连接串，形如：

```text
postgresql://neondb_owner:AbCd1234@ep-cool-name-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

检查点：连接串中必须包含 `-pooler` 和 `sslmode=require`

### 5.3 可选：本地验证连接

如果本机装了 psql 可以直接测试；没装可以先跳过，Vercel 部署后会自动验证。

---

## 第 6 步：创建 Vercel 项目

### 6.1 注册 / 登录

1. 打开 https://vercel.com/signup
2. 选择 **Continue with GitHub** 并授权

### 6.2 导入仓库

1. 进入控制台，点 **Add New… → Project**
2. 在 **Import Git Repository** 找到 `AI_math_learning`
3. 如果找不到，点 **Adjust GitHub App Permissions** → 授权该仓库
4. 点击 **Import**

### 6.3 构建配置

保持默认即可：

| 配置项 | 值 |
| --- | --- |
| Framework Preset | Next.js |
| Build Command | `next build` |
| Output Directory | 默认（`.next`） |
| Install Command | `npm install` |
| Node.js Version | 20.x |

---

## 第 7 步：配置环境变量

在 Vercel 项目页 → **Settings → Environment Variables** 添加：

| 变量名 | 值 | 环境 |
| --- | --- | --- |
| `DATABASE_URL` | 第 5 步的 Neon 连接串 | Production、Preview |
| `DASHSCOPE_API_KEY` | 百炼 Key（`sk-...`） | Production、Preview |

> 加完之后点 **Save**。已经部署过的项目需要 **Redeploy** 才会生效。

### 7.1 关于 Hobby 计划超时

Vercel Hobby 计划的 Serverless 函数默认最长执行 60 秒。

当前各功能耗时参考：

| 功能 | 耗时 |
| --- | --- |
| 错题分析 | 10~35 秒 |
| 教材母题推荐 | 5~15 秒 |
| 项目生成 | 30~90 秒 ⚠️ 可能超时 |
| AI 导师对话 | 5~15 秒 |
| 学习评价 | 15~35 秒 |

如果项目生成频繁超时：

1. 升级 Vercel Pro（函数可执行 300 秒），或
2. 在 Vercel 项目设置中把 **Function Region** 设为 `Singapore (sin1)`，减少网络往返，或
3. 先使用内置模板项目（不配置 Key 时自动走 Mock，几秒内返回）

---

## 第 8 步：首次部署

1. 回到项目页，点 **Deploy**
2. 等待构建完成（约 1~2 分钟）
3. 出现 🎉 页面后拿到地址：`https://ai-math-learning-xxx.vercel.app`

### 8.1 部署失败排查

| 报错 | 原因 | 解决 |
| --- | --- | --- |
| `Module not found: pg-pool` | 依赖未安装 | 确认 `package.json` 中有 `pg-pool`，重新推送 |
| `DATABASE_URL is not set` | 环境变量没配 | Settings → Environment Variables 添加后 Redeploy |
| `self-signed certificate` | 连接串缺少 `sslmode=require` | 重新复制 Neon 的 Pooled 连接串 |
| `relation "kv" does not exist` | 正常现象 | 首次访问会自动建表，多刷新一次 |

---

## 第 9 步：线上验收清单

打开 Vercel 地址，按顺序检查：

- [ ] 登录页正常显示，`student01 / 123456` 能登录
- [ ] 学习首页显示 8 道演示错题、1 个演示项目
- [ ] 上传错题 → 识别题目 → 给出错因分析与详细解答
- [ ] 错题本、知识画像数据正确
- [ ] 教材母题可推荐、可选择
- [ ] 生成项目 → AI 导师对话能推进任务
- [ ] 刷新页面后任务进度与对话记录仍在（验证 Postgres 生效）
- [ ] 设置页显示“数据保存在云端 Postgres 数据库”
- [ ] 换一个浏览器登录，看到的是同一份数据

---

## 第 10 步：日常更新

```powershell
git add .
git commit -m "fix: 修改说明"
git push
```

Vercel 检测到 `main` 分支更新后自动重新部署，无需手动操作。

---

## 第 11 步：常见问题

**Q：团队访问慢？**
把 Vercel 项目的 Function Region 改成 `sin1`（新加坡），并使用 Neon 新加坡区域。

**Q：数据被改乱了想恢复？**
打开「设置与数据」→ 重置演示数据；或直接在 Neon 控制台执行 `DELETE FROM kv; DELETE FROM images;` 后刷新页面。

**Q：想绑定自己的域名？**
Vercel → Settings → Domains → 添加域名，按提示到域名服务商配置 CNAME。国内访问建议使用已备案域名。

**Q：图片会不会太大？**
上传前前端会自动压缩到最长边 1400px 的 JPEG，单张约 100~300KB，存入数据库没有问题。

**Q：以后要换成多用户账号体系？**
当前是演示版单账号。接入需要：`users` 表 + 登录接口 + 各接口按 `userId` 过滤数据，可另开迭代。

---

## 附：如果暂时无法恢复 GitHub，可使用备用链路

1. 在 GitLab（https://gitlab.com）新建空项目
2. `git remote set-url origin https://gitlab.com/你的用户名/ai_math_learning.git`
3. 推送后，在 Vercel 导入时选择 GitLab 账号并授权
4. 其余步骤（第 5~11 步）完全一致

---

## 附：本地与线上行为差异

| 项目 | 本地未配数据库 | 线上（配置 DATABASE_URL） |
| --- | --- | --- |
| 数据存储 | `.data/store.json` | Postgres `kv` 表 |
| 图片存储 | `uploads/chat/` | Postgres `images` 表 |
| 多设备共享 | 否 | 是 |
| 重启后数据 | 保留 | 保留 |
