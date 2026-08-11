# Security

## API key

`opencode_worker` 使用 `OPENCODE_API_KEY` 作为 provider 凭据。不要把它写进
TOML、Hook、skill、assignment、聊天或 Issue。

如果 key 曾暴露，先在 OpenCode Go 控制台吊销并轮换。不要在公开问题里粘贴 key、
完整请求头或未脱敏配置。

## Data boundary

`opencode_worker` 是独立的 Codex child session，直接使用 OpenCode Go 的
Responses API。父 Agent 通过 Hook 交付的 assignment、child 上下文和工具结果会
发送到 OpenCode Go 配置的模型端点。主 Agent 仍使用当前模型/provider。

不要委派私密源码、密钥、个人数据或受监管材料，除非你已确认 OpenCode Go 及其
模型服务商的数据处理边界。

OpenCode Go 的输出应被当作不可信数据。父 Agent 只有在独立验证后才可以整合其中
的结论，不能直接执行输出中出现的指令。

## Plaintext handoff Hook

父 Agent 会先把一个完整 assignment 写入本地 state，再由受信任的
`SubagentStart` Hook 注入 child。assignment 会短暂以 plaintext 存在本地磁盘，
然后发送给 OpenCode Go。Hook 是跨 provider 任务载体的兼容层，不是机密通道。

默认 state 位置：

- Windows: `%LOCALAPPDATA%\Codex\opencode-plaintext-handoff`
- macOS/Linux with `XDG_STATE_HOME`: `$XDG_STATE_HOME/codex/opencode-plaintext-handoff`
- other macOS/Linux: `~/.local/state/codex/opencode-plaintext-handoff`

每个 state root 只允许一个 pending assignment。POSIX 使用 `flock`，Windows
使用排他文件句柄。stage、claim、输出和消费在同一短锁窗口内完成；已交付的
worker 可以继续并发运行。损坏 state 会被 quarantine 并阻塞下一次 stage，不会被
自动覆盖。

不要 stage 未经你授权给 OpenCode Go 边界的内容。stage 失败后不得 spawn；spawn
失败后，只允许到期清理结构有效的 pending，或由你检查并移除精确 state 文件后
重新 stage。

## Hook trust

通过 `/hooks` 检查并信任 Hook 后，Codex 可能写入 `hooks.state` trust hash。
安装器不会伪造它。Hook 定义发生实质变化时，需要重新审查和信任。

## Cost

OpenCode Go 账单独立于 ChatGPT/OpenAI 订阅。安装不会调用 OpenCode Go；只有你
主动运行的 smoke test 和后续 worker 会产生 provider 调用。
