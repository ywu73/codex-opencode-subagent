# Design

## Goal

Model `codex-opencode-subagent` on `codex-deepseek-subagent`: make OpenCode Go a
native Codex subagent provider without calling a local OpenCode CLI, installing
MCP/plugins, or switching the main task provider.

## Success criteria

1. The DeepSeek OpenCode worker family (`opencode_worker_ds_v4_flash`,
   `opencode_worker_ds_v4_pro`) is
   discoverable in a new Codex
   task.
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
  -> stage assignment (--agent-type <worker>)
  -> spawn the exact staged worker type, fork_turns="none"
  -> SubagentStart Hook injects the assignment
  -> OpenCode Go Responses API executes the task
  -> child returns marker and result
  -> main task verifies and integrates
```

Key decisions:

- Each Agent TOML owns `model_provider = "opencode_go"`, its own `model`,
  `base_url`, `wire_api = "responses"`, and `env_key = "OPENCODE_API_KEY"`.
- One agent type per model: `opencode_worker_ds_v4_flash` (deepseek-v4-flash,
  default) and `opencode_worker_ds_v4_pro` (deepseek-v4-pro); the parent picks
  per task.
- `config/opencode-worker-routing.json` is the parent-side selection policy:
  explicit user override, task profile, then default profile. A small resolver
  returns the exact profile, model, and agent type without performing a provider
  call.
- The plaintext Hook protocol is reused from `codex-deepseek-subagent`; the Hook
  quarantines a staged/spawned agent type mismatch instead of delivering the
  assignment to the wrong model.
- The child defaults to `read-only`.
- The repository does not retain a local OpenCode runner.

## Repository structure

| Path | Purpose |
| --- | --- |
| `agents/opencode-worker*.toml` | Codex custom agents (one per model) and the OpenCode Go provider |
| `config/opencode-worker-routing.json` | Model capability tags, aliases, task profiles, and selection defaults |
| `scripts/resolve-worker.mjs` | Pure routing resolver and CLI inspection seam |
| `skills/use-opencode-worker/SKILL.md` | Parent-side delegation protocol |
| `hooks/plaintext_handoff.py` | POSIX stage/Hook script |
| `hooks/plaintext-handoff.ps1` | Windows stage/Hook script |
| `prompts/install-with-codex.md` | Installation contract |
| `prompts/quick-smoke-test.md` | Checkout-free smoke |
| `prompts/smoke-test.md` | Repository fixture smoke |
| `tests/` | Hook protocol tests |

## Verification

1. Parse and validate the agent TOML.
2. Validate the routing config and run `node --test tests/test_resolve_worker.mjs`.
3. Run `python3 -m unittest tests.test_plaintext_handoff`.
4. Install into a new Codex task, trust the Hook, and run the quick smoke.

## Risks

| Risk | Handling |
| --- | --- |
| OpenCode Go Responses compatibility | Probe and native-smoke status are tracked per model; incompatible profiles fail closed |
| Model capability | Default is `deepseek-v4-flash`; the Pro variant provides deeper reasoning, and adding another model requires full revalidation |
| API key management | Only `OPENCODE_API_KEY` is used and never stored in the repository |
| Windows | The Hook script is ported; macOS/POSIX is the verified baseline |
