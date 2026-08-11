# Design

## Goal

Model `codex-opencode-subagent` on `codex-deepseek-subagent`: make OpenCode Go a
native Codex subagent provider without calling a local OpenCode CLI, installing
MCP/plugins, or switching the main task provider.

## Success criteria

1. `opencode_worker` is discoverable in a new Codex task.
2. A `fork_turns="none"` child receives the complete Hook-delivered assignment.
3. The child runs as an OpenCode Go session and returns the parent's exact
   random marker.
4. The one-shot pending handoff is consumed.
5. The main task model/provider remains unchanged.
6. No local CLI, direct API call, or another Codex process fakes the result.

## Architecture

```text
Codex main task
  -> $use-opencode-worker
  -> stage assignment
  -> spawn opencode_worker, fork_turns="none"
  -> SubagentStart Hook injects the assignment
  -> OpenCode Go Responses API executes the task
  -> child returns marker and result
  -> main task verifies and integrates
```

Key decisions:

- The Agent TOML owns `model_provider = "opencode_go"`,
  `model = "deepseek-v4-flash"`, `base_url`, `wire_api = "responses"`, and
  `env_key = "OPENCODE_API_KEY"`.
- The plaintext Hook protocol is reused from `codex-deepseek-subagent`.
- The child defaults to `read-only`.
- The repository does not retain a local OpenCode runner.

## Repository structure

| Path | Purpose |
| --- | --- |
| `agents/opencode-worker.toml` | Codex custom agent and OpenCode Go provider |
| `skills/use-opencode-worker/SKILL.md` | Parent-side delegation protocol |
| `hooks/plaintext_handoff.py` | POSIX stage/Hook script |
| `hooks/plaintext-handoff.ps1` | Windows stage/Hook script |
| `prompts/install-with-codex.md` | Installation contract |
| `prompts/quick-smoke-test.md` | Checkout-free smoke |
| `prompts/smoke-test.md` | Repository fixture smoke |
| `tests/` | Hook protocol tests |

## Verification

1. Parse and validate the agent TOML.
2. Run `python3 -m unittest tests.test_plaintext_handoff`.
3. Install into a new Codex task, trust the Hook, and run the quick smoke.

## Risks

| Risk | Handling |
| --- | --- |
| OpenCode Go Responses compatibility | Endpoint is probed; a live smoke is required before claiming full compatibility |
| Model capability | Default is `deepseek-v4-flash`; changing it requires full revalidation |
| API key management | Only `OPENCODE_API_KEY` is used and never stored in the repository |
| Windows | The Hook script is ported; macOS/POSIX is the verified baseline |
