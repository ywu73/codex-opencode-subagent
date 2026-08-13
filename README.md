[English](README.en.md)

# codex-opencode-subagent

让 Codex 主任务继续使用当前模型/provider，同时把 OpenCode Go 当作原生 subagent，
用于边界明确的代码、日志、搜索、提取、枚举和大量文本阅读。本实现不调用本地
OpenCode CLI，也不依赖 MCP、插件或 CC Switch。

它直接复用 `codex-deepseek-subagent` 的架构：`opencode_worker` 系列是 Codex 原生
child，每个 Agent TOML 自带 `model_provider`、`model`、`base_url`、`wire_api` 和
`OPENCODE_API_KEY`。Codex 用 `SubagentStart` Hook 把父 Agent 的一次性 plaintext
assignment 注入 child。

每个模型一个 agent type，父 Agent 按任务选择：

| Agent type | 模型 |
| --- | --- |
| `opencode_worker` | `deepseek-v4-flash`（默认） |
| `opencode_worker_pro` | `deepseek-v4-pro` |
| `opencode_worker_glm` | `glm-5.2` |
| `opencode_worker_kimi` | `kimi-k2.7-code` |

## 三步安装

### 1. 设置 OpenCode API key

创建或确认 OpenCode Go 的 key，然后把它保存为环境变量 `OPENCODE_API_KEY`。不要把
key 发进 Codex 聊天、Issue、截图或仓库。

设置后需要让 Codex 进程重新继承该环境变量。macOS/Linux 可以在启动 Codex 的
shell 中设置；Windows 在用户环境变量中新建 `OPENCODE_API_KEY`。

### 2. 让 Codex 安装 subagent

把 [prompts/install-with-codex.md](prompts/install-with-codex.md) 交给 Codex
执行。安装会新增：

- `<codex-home>/agents/opencode-worker.toml`（以及 `-pro`、`-glm`、`-kimi` 三个变体）
- `<codex-home>/skills/use-opencode-worker/`
- `<codex-home>/hooks/codex-opencode-subagent/plaintext_handoff.py`
- 一条 `SubagentStart` Hook，matcher 为
  `^(opencode_worker|opencode_worker_pro|opencode_worker_glm|opencode_worker_kimi)$`
- 个人 `AGENTS.md` 中带 marker 的 `$use-opencode-worker` 索引

它不会切换主模型/provider，也不会在安装阶段调用 OpenCode Go。

### 3. 信任 Hook 并测试

1. 在 Codex 输入 `/hooks`，确认它只匹配 `opencode_worker` 系列四个 agent type，
   命令指向刚安装的 `plaintext_handoff.py`，然后信任。
2. 新开一个 Codex 任务。
3. 把 [prompts/quick-smoke-test.md](prompts/quick-smoke-test.md) 交给新任务。

## 怎样算成功

快速测试应同时满足：

- Codex 暴露独立原生 child，agent type 为你选定的 `opencode_worker` 系列之一；
- child 返回父 Agent 的随机 marker；
- 一次性 pending handoff 已被消费；
- 主任务仍使用原来的模型/provider；
- 没有另起 CLI、直连 API 或换模型冒充成功。

## 文件边界

- `agents/opencode-worker*.toml`：child provider 只存在于这四个独立 Agent 文件。
- `skills/use-opencode-worker/SKILL.md`：父 Agent 按需加载的委派协议。
- `hooks/plaintext_handoff.py`：stage 与 `SubagentStart` Hook。
- `snippets/AGENTS.md`：父 Agent skill 索引。

完整说明见 [SECURITY.md](SECURITY.md)、[docs/advanced.md](docs/advanced.md) 和
[docs/design.md](docs/design.md)。

## 验证

```sh
python3 -m unittest tests.test_plaintext_handoff
```

MIT。
