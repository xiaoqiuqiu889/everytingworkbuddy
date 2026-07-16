# GitHub 推送 SOP（沙箱 / 无头环境）

> 适用场景：在 WorkBuddy 沙箱里把本地 commit 推到 GitHub，但 `git push` 会卡在 Git Credential Manager 的 GUI 鉴权（沙箱弹不出界面、也没配 SSH key）。
> 本仓库实测可用。（仓库：`xiaoqiuqiu889/everytingworkbuddy` —— 注意原主拼写是 `everyting`，别改。）

---

## 核心原理

沙箱里 `git push` 卡死，是因为它要你手动输密码 / 弹 GUI。解决办法是**不走交互鉴权**，而是：

1. 从本机已存的凭据里**非交互地取出 GitHub token**；
2. 把 token **临时塞进 remote URL** 推一次；
3. 推完**立刻把 URL 还原干净**，token 不落盘、不进 `.git/config` 历史。

---

## 标准推送流程（复制即用）

```bash
cd /d/codebuddycn/EFW

# 0) 先提交（如尚未提交）
git add -A
git commit -m "你的提交说明"

# 1) 非交互取出 token（从 OS 凭据管理器 / GCM 缓存）
TOKEN=$(printf 'protocol=https\nhost=github.com\n' | git credential fill | awk -F= '/^password=/{print $2}')

# 2) 有 token 才推；推完立即还原 URL
if [ -n "$TOKEN" ]; then
  git remote set-url origin "https://x-access-token:$TOKEN@github.com/xiaoqiuqiu889/everytingworkbuddy.git"
  git push origin main
  git remote set-url origin "https://github.com/xiaoqiuqiu889/everytingworkbuddy.git"
  echo "PUSHED"
else
  echo "NO_TOKEN"   # 见下方「token 取不到怎么办」
fi
```

要点：
- `GIT_TERMINAL_PROMPT=0` 可加在命令前防挂起；长传输用 `timeout 300` 包一层。
- 第 2 步的 `set-url` 是临时的，**必须紧跟 push 后还原**。token 只在内存里存在几秒。
- push 成功会打印形如 `05b73e6..a200ffa  main -> main` 的区间，这就是成功标志。

---

## 推送前必做：检查分歧

推送前先确认本地和远端没有分叉，避免 `rejected: fetch first`：

```bash
git fetch origin
git status -sb
```

三种状态怎么处理：

| `git status -sb` 显示 | 含义 | 处理 |
| --- | --- | --- |
| 什么都不显示 | 已同步 | 无需推 |
| `ahead N` | 本地有 N 笔远端没有 | 直接推（快进） |
| `ahead N, behind M` | 两边都有对方没有的提交 | 见下方「分歧处理」 |

---

## 分歧处理（远端有你本地没有的提交时）

**现象**：push 被拒 `! [rejected] ... (fetch first)` / `remote contains work that you do not have locally`。
**原因**：通常是另一处（GitHub 网页、别的机器/会话）也改了并推了，远端领先了。
**原则：绝不 `--force`，先看清再决定。**

```bash
git fetch origin
# 看清远端多出来的提交改了什么（< 本地独有，> 远端独有）
git log --left-right --oneline origin/main...main
git show --stat <远端独有commit哈希>
```

- 如果远端那笔是**无害改动**（如 README 微调），且和你的改动**不冲突**：
  ```bash
  git rebase origin/main      # 把你的提交叠到远端最新之上
  git push origin main        # 此时是快进，能推
  ```
- 如果**有冲突**或不确定：停下，把远端独有提交告诉用户，让他拍板，不要硬 rebase。

> 本次实战就遇到过：用户在 GitHub 网页改了 README（`05b73e6`），本地修复 `cc1ab11` 基于旧 HEAD。
> 处理 = `fetch` → 确认 README 改动无害 → `rebase origin/main` → 再 push，两笔都保留。

---

## token 取不到怎么办（降级方案）

`git credential fill` 返回空 = 沙箱里的 GCM OAuth 缓存过期了（本机有凭证，沙箱读不到）。**不要死循环重试。**

1. 告诉用户：**"沙箱取不到 GitHub token，需要你本机推或给 PAT"**。
2. 方案 A（用户本机终端，最稳）：让用户在自己电脑跑
   ```bash
   git -C D:/codebuddycn/EFW push origin main
   ```
   本机 GCM 有凭证，直接成。
3. 方案 B（提供 PAT）：用户给一个 `repo` 权限的 GitHub PAT，由你临时用
   ```bash
   git remote set-url origin "https://<PAT>@github.com/xiaoqiuqiu889/everytingworkbuddy.git"
   git push origin main
   git remote set-url origin "https://github.com/xiaoqiuqiu889/everytingworkbuddy.git"
   ```
   PAT 仅本次使用、不落盘、推完还原。

---

## 怎么向用户证明"推成功了"

回复里必须给**可核验的证据**，别只说"已推送"：
1. push 输出的提交区间：`05b73e6..a200ffa  main -> main`；
2. 或 `git fetch origin && git status -sb` 显示无 ahead/behind；
3. 或让用户直接看 GitHub Commits 页最新一笔。

**远端 URL 必须是干净的**（`https://github.com/...`，不含 token）—— 每次推完都 `git remote get-url origin` 核对。

---

## 安全红线

- 🚫 绝不 `--force` 共享分支，除非用户明确要求。
- 🚫 绝不让带 token 的 URL 留在 `.git/config`、日志、或推上来的提交里。
- 🚫 不把 token 写进任何文件、不回显到对话。
- ✅ 推完 `set-url` 还原 + `get-url` 核对是固定动作。
- ✅ 敏感信息（PAT）用完即弃，不记忆、不落盘。
