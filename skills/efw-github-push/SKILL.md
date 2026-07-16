---
name: efw-github-push
description: "在沙箱/无头环境把本地 commit 推到 GitHub——git push 卡在凭据 GUI 或读不到密码时用这套非交互流程。当用户说\"推到github/push上去/提交到远端/推送代码/git push 卡住了/推不上去/沙箱推送\"时触发。非交互取 token→临时塞 URL 推一次→立即还原干净，token 不落盘。"
description_zh: "沙箱/无头环境安全推送 GitHub 的标准流程"
description_en: "Push to GitHub from a sandbox/headless env without interactive auth"
version: 1.0.0
agent_created: true
---

# EFW — 沙箱 / 无头环境 GitHub 推送

> 适用场景：在 WorkBuddy / CodeBuddy 沙箱里把本地 commit 推到 GitHub，但 `git push` 会卡在
> Git Credential Manager 的 GUI 鉴权（沙箱弹不出界面、也没配 SSH key）。

## 核心原理

沙箱里 `git push` 卡死，是因为它要交互式输密码 / 弹 GUI。解决办法是**不走交互鉴权**：

1. 从本机已存的凭据里**非交互地取出 GitHub token**；
2. 把 token **临时塞进 remote URL** 推一次；
3. 推完**立刻把 URL 还原干净**，token 不落盘、不进 `.git/config` 历史。

## 标准推送流程（复制即用，仓库地址自动读取，勿写死）

```bash
# 0) 先确认在仓库根，且已提交
git rev-parse --show-toplevel
git add -A && git commit -m "type(scope): 你的提交说明"   # 如尚未提交

# 1) 自动读取当前 remote，拆出干净 URL（不写死任何人的仓库）
CLEAN_URL=$(git remote get-url origin)

# 2) 非交互取出 token（从 OS 凭据管理器 / GCM 缓存）
TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | awk -F= '/^password=/{print $2}')

# 3) 有 token 才推；推完立即还原 URL
if [ -n "$TOKEN" ]; then
  HOSTPATH=$(printf '%s' "$CLEAN_URL" | sed -E 's#^https?://([^@]*@)?##')   # 去掉协议和可能已有的 user@
  GIT_TERMINAL_PROMPT=0 git remote set-url origin "https://x-access-token:${TOKEN}@${HOSTPATH}"
  GIT_TERMINAL_PROMPT=0 timeout 300 git push origin main
  git remote set-url origin "$CLEAN_URL"      # 立即还原，token 只在内存里存在几秒
  git remote get-url origin                   # 核对 URL 已干净（不含 token）
  echo "PUSHED"
else
  echo "NO_TOKEN"    # 见下方「token 取不到怎么办」
fi
```

要点：
- 仓库地址一律用 `git remote get-url origin` 读取，**绝不把某个人的仓库名写进脚本**。
- `GIT_TERMINAL_PROMPT=0` 防挂起；长传输用 `timeout 300` 包一层。
- 第 3 步的 `set-url` 是临时的，**必须紧跟 push 后还原**。
- push 成功会打印形如 `05b73e6..a200ffa  main -> main` 的区间，这就是成功标志。

## 推送前必做：检查分歧

```bash
git fetch origin
git status -sb
```

| `git status -sb` 显示 | 含义 | 处理 |
| --- | --- | --- |
| `## main...origin/main`（无 ahead/behind） | 已同步 | 无需推 |
| `ahead N` | 本地领先 N 笔 | 直接推（快进） |
| `ahead N, behind M` | 两边都有对方没有的提交 | 见「分歧处理」 |

## 分歧处理（远端有你本地没有的提交时）

**现象**：push 被拒 `! [rejected] ... (fetch first)` / `remote contains work that you do not have locally`。
**原因**：通常是 GitHub 网页、别的机器/会话也改了并推了。
**原则：绝不 `--force`，先看清再决定。**

```bash
git fetch origin
git log --left-right --oneline origin/main...main   # < 本地独有，> 远端独有
git show --stat <远端独有commit哈希>
```

- 远端那笔是**无害改动**（如 README 微调）且**不冲突** → `git rebase origin/main` 后再 `git push`（此时是快进）。
- **有冲突或不确定** → 停下，把远端独有提交告诉用户，让他拍板，不要硬 rebase。

## token 取不到怎么办（降级方案）

`git credential fill` 返回空 = 沙箱里的 GCM/WCM 凭据缓存读不到（本机有、沙箱读不到）。
**不要死循环重试，也不要试 PowerShell 花式绕过——直接降级。**

1. 明确告诉用户：**"沙箱取不到 GitHub token，需要你本机推或给 PAT"**。
2. **方案 A（最稳，首选）**：让用户在自己电脑终端跑（本机 GCM 有凭证，直接成）：
   ```bash
   git -C <仓库绝对路径> push origin main
   ```
3. **方案 B（提供 PAT）**：用户给一个 `repo` 权限的 GitHub PAT，由你临时用（复用上面标准流程，把 `$TOKEN` 换成用户给的 PAT），**仅本次使用、不落盘、推完还原**。

## 怎么向用户证明"推成功了"

回复里必须给**可核验的证据**，别只说"已推送"：
1. push 输出的提交区间：`05b73e6..a200ffa  main -> main`；或
2. `git ls-remote origin -h refs/heads/main` 的哈希 = 本地 HEAD；或
3. `git fetch origin && git status -sb` 显示无 ahead/behind；或
4. 让用户直接看 GitHub Commits 页最新一笔。

## 安全红线

- 🚫 绝不 `--force` 共享分支，除非用户明确要求。
- 🚫 绝不让带 token 的 URL 留在 `.git/config`、日志、或推上来的提交里。
- 🚫 不把 token 写进任何文件、不回显到对话。
- ✅ 推完 `set-url` 还原 + `get-url` 核对是固定动作。
- ✅ 敏感信息（PAT）用完即弃，不记忆、不落盘。
