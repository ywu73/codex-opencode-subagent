[English](advanced.en.md)

# 高级说明

## 组合边界

Codex 主任务保持当前模型、provider 和登录不变。`opencode_worker` 系列是 Codex 原生
管理的独立 child，每个 child 的 Agent TOML 自带 OpenCode Go provider 配置。child
本身是 OpenCode Go session，可以直接使用 Codex 支持的只读工具。

它不调用本地 OpenCode CLI，也不安装插件、MCP Server、wrapper、daemon 或另一个
Codex CLI。

## 为什么可以直接配置

Codex custom provider 当前只接受 Responses wire；`wire_api = "chat"` 会使整个
Agent TOML 在 discovery 阶段被忽略。因此两个 Agent TOML 都使用
`wire_api = "responses"`。本仓库只保留两个 DeepSeek Agent TOML；OpenCode Go 的
Responses 探针已确认两个模型均可完成请求。直接 Chat endpoint 成功不能替代 Codex
native smoke，也不能作为 Chat wire 的兼容依据。

## 一次任务流程

1. 父 Agent 形成完整、自洽、只读的 assignment。
2. 通过 stdin stage 到单槽本地 state。
3. 以唯一 task name、精确的所选 agent type（`opencode_worker` 系列之一）和
   `fork_turns="none"` 创建 child。
4. 受信任 Hook 原子 claim，并通过 additionalContext 注入 assignment。
5. OpenCode Go child 直接执行 assignment，必要时使用 Codex 只读工具。
6. child 通过 Codex 原生 callback 返回，父 Agent 使用 idle wait。

## Agent 配置

`agents/opencode-worker*.toml` 定义 worker 家族，每个模型一个 agent type：

| Agent 文件 | agent type | model |
| --- | --- | --- |
| `agents/opencode-worker.toml` | `opencode_worker` | `deepseek-v4-flash` |
| `agents/opencode-worker-pro.toml` | `opencode_worker_pro` | `deepseek-v4-pro` |

### 选择配置

`config/opencode-worker-routing.json` 是父 Agent 的选择策略，不替代 Agent
TOML 的运行时注册。它记录模型的能力标签、成本等级、验证状态、别名和 task
profile。选择优先级为：用户显式指定的 profile/agent type/model、task profile、
默认 profile。可用 `node scripts/resolve-worker.mjs --profile pro` 查看解析结果。

解析结果中的 `agent_type` 必须同时用于 stage 和 native spawn；未知或不可用的
显式选择直接失败，不允许静默 fallback。

每个 worker 共用同一组配置：

- provider: `opencode_go`
- base_url: `https://opencode.ai/zen/go/v1`
- wire_api: `responses`（Codex 唯一支持值）
- env_key: `OPENCODE_API_KEY`
- sandbox_mode: `read-only`
- model_context_window: `1000000`

`model_reasoning_effort` 故意不设置，让父 Agent 按任务选择。`read-only` 是
mutation 默认值，不是防泄漏边界。stage 时用 `--agent-type`（Windows 为
`-AgentType`）选择目标 worker；spawn 的 agent type 必须与 stage 一致，Hook
会把类型不匹配的交付 quarantine 而不是送给错误的模型。

## 文件映射

| 路径 | 用途 |
| --- | --- |
| `agents/opencode-worker*.toml` | 两个 Codex custom agent（每模型一个）与 OpenCode Go provider |
| `skills/use-opencode-worker/SKILL.md` | 父 Agent 按需加载的委派协议 |
| `hooks/plaintext_handoff.py` | POSIX stage/Hook 脚本 |
| `hooks/plaintext-handoff.ps1` | Windows stage/Hook 脚本 |
| `hooks/hooks.*.example.json` | Hook 结构模板 |
| `snippets/AGENTS.md` | 父 Agent skill 索引 |
| `prompts/install-with-codex.md` | 安装合同 |
| `prompts/quick-smoke-test.md` | 无 checkout 的快速 smoke |
| `prompts/smoke-test.md` | 仓库内只读 smoke |
| `tests/` | Hook 协议测试 |

Agent registration、`model_provider` 和 `[model_providers.opencode_go]` 只存在于
各个独立 Agent 文件，每个 worker 自带一份 provider 定义。顶层配置不增加
`[agents.opencode_worker*]` 或 `[model_providers.opencode_go]`，主任务 provider
不变。

## 验证矩阵

| 层级 | 验证 | 通过条件 |
| --- | --- | --- |
| Hook 协议 | `python3 -m unittest tests.test_plaintext_handoff` | 32 项协议测试通过 |
| provider 探针 | 对目标模型调用 `/responses` | 返回兼容的 Response；只证明 provider 边界，不等于 native smoke |
| 快速 smoke | 新任务执行 `quick-smoke-test.md` | marker、child identity、handoff 消费、OpenCode Go 调用成功 |

## 已知限制与未来项

- 默认 worker 为 `opencode_worker`（`deepseek-v4-flash`）；仓库还提供
  `deepseek-v4-pro` 的独立 agent 定义。
  新增模型 = 新增一个独立 Agent TOML，并把 agent type、skill、安装 prompt、
  文档和 smoke oracle 作为一个整体重验；已安装环境的 Hook matcher 与
  `scripts/validate-installation.mjs` 也要同步。
- Hook 会 quarantine staged/spawned agent type 不匹配的交付（退出码 7），
  不会把任务送给错误的模型。
- OpenCode Go Responses 转换按模型存在差异。路由层必须保留逐模型 probe 与 live
  smoke 状态；不能从某一个模型或 Chat endpoint 的成功推断其他模型兼容。
- Windows Hook 脚本是从 deepseek 仓库移植的，当前仓库只在本机 macOS/POSIX
  验证。

## 参考

- [codex-deepseek-subagent](https://github.com/Utopia-V/codex-deepseek-subagent)
- OpenCode Go `/v1/models` 与 `/v1/responses` 本机探测
