# Advanced notes

## Composition boundary

The Codex main task keeps its current model, provider, and login.
`opencode_worker` and its variants are native Codex children; each child's
Agent TOML owns an OpenCode Go provider configuration. The child is an OpenCode
Go session and can use read-only Codex tools directly.

This repository does not call a local OpenCode CLI and does not install a
plugin, MCP server, wrapper, daemon, or another Codex CLI.

## Why direct provider configuration works

OpenCode Go exposes the Responses wire API used by Codex. The `agents/opencode-worker*.toml` files define the worker family, one agent type per model:

| Agent file | Agent type | Model |
| --- | --- | --- |
| `agents/opencode-worker.toml` | `opencode_worker` | `deepseek-v4-flash` |
| `agents/opencode-worker-pro.toml` | `opencode_worker_pro` | `deepseek-v4-pro` |
| `agents/opencode-worker-glm.toml` | `opencode_worker_glm` | `glm-5.2` |
| `agents/opencode-worker-kimi.toml` | `opencode_worker_kimi` | `kimi-k2.7-code` |

Every worker shares:

- provider: `opencode_go`
- base_url: `https://opencode.ai/zen/go/v1`
- wire_api: `responses`
- env_key: `OPENCODE_API_KEY`
- sandbox_mode: `read-only`
- model_context_window: `1000000`

`model_reasoning_effort` is intentionally absent so the parent can choose it per
task. `read-only` is a mutation default, not a disclosure boundary. Stage with
`--agent-type` (Windows: `-AgentType`) to pick the target worker; the spawned
agent type must match the staged one, and the Hook quarantines a mismatch
instead of delivering the assignment to the wrong model.

## Task flow

1. The parent builds a complete, self-contained, read-only assignment.
2. It stages the assignment through stdin into a single-slot local state.
3. It creates a native child with the exact chosen family agent type and
   `fork_turns="none"`.
4. The trusted Hook atomically claims the assignment and injects it as developer
   context.
5. The OpenCode Go child executes the assignment, using read-only Codex tools as
   needed.
6. The child returns through the native callback; the parent uses an idle wait.

## File map

| Path | Purpose |
| --- | --- |
| `agents/opencode-worker*.toml` | Four custom agents (one per model) and the OpenCode Go provider |
| `skills/use-opencode-worker/SKILL.md` | Parent-side delegation protocol |
| `hooks/plaintext_handoff.py` | POSIX stage/Hook script |
| `hooks/plaintext-handoff.ps1` | Windows stage/Hook script |
| `hooks/hooks.*.example.json` | Hook structure templates |
| `snippets/AGENTS.md` | Parent-side skill index |
| `prompts/install-with-codex.md` | Installation contract |
| `prompts/quick-smoke-test.md` | Checkout-free smoke |
| `prompts/smoke-test.md` | Repository fixture smoke |
| `tests/` | Hook protocol tests |

## Validation matrix

| Layer | Validation | Pass condition |
| --- | --- | --- |
| Hook protocol | `python3 -m unittest tests.test_plaintext_handoff` | 32 protocol tests pass |
| Endpoint | `curl /responses` with an invalid model | Returns a model error, proving the endpoint exists |
| Quick smoke | New task follows `quick-smoke-test.md` | Marker, child identity, handoff consumption, and OpenCode Go call succeed |

## Known limits

- The default worker is `opencode_worker` (`deepseek-v4-flash`); OpenCode Go also
  exposes models such as `glm-5.2`, `deepseek-v4-pro`, and `kimi-k2.7-code`, for
  which this repository ships `opencode_worker_pro`, `opencode_worker_glm`, and
  `opencode_worker_kimi`. Adding a model means adding one standalone Agent TOML
  and revalidating the agent, skill, install prompt, docs, and smoke oracle as
  one set; installed environments must also sync the Hook matcher and
  `scripts/validate-installation.mjs`.
- The Hook quarantines a staged/spawned agent type mismatch (exit code 7)
  instead of delivering the assignment to the wrong model.
- OpenCode Go's Responses implementation may only partially implement some
  request fields. Validate against a live smoke and the current compatibility
  table.
- The Windows Hook script is ported from the DeepSeek repository and is not
  live-validated on Windows here.

## References

- [codex-deepseek-subagent](https://github.com/Utopia-V/codex-deepseek-subagent)
- OpenCode Go `/v1/models` and `/v1/responses` endpoint probes
