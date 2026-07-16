# Automation Prompt: 研发学习提炼（模板）

> 这是「研发学习提炼」定时任务的 prompt 模板。启用时由 EFW 写入 automation，无需你手动操作。

## Prompt 正文（自包含）

```
回顾今天在本工作区完成的研发工作，做一次「学习提炼」：

1. 阅读今天的工作痕迹（当日的 memory 日志、最近改动的关键文件、遇到并解决的问题）。
2. 提炼出「有长期复用价值」的内容，只保留真正值得沉淀的：
   - 踩过的坑 + 正确解法
   - 验证过的技术方案 / 命令 / 配置
   - 项目约定或偏好
3. 把这些追加到本项目的 .workbuddy/memory/YYYY-MM-DD.md（append-only），
   长期事实并入 .workbuddy/memory/MEMORY.md。
4. 如果某个解决过程是清晰可复用的多步工作流，提示「这可以沉淀为一个 skill」，
   并给出建议的 skill 名与用途（不自动创建，等我确认）。
5. 如果今天没有值得沉淀的研发内容，简短说明「今日无需提炼」即可，不要硬凑。

保持简洁，不记录临时信息（临时路径、一次性报错、搜索结果）。
```

## 建议调度参数

- scheduleType: recurring
- rrule: `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=22;BYMINUTE=0`（工作日 22:00）
- cwds: 你的主力项目目录
- status: ACTIVE
