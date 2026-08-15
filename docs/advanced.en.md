# Advanced notes

## Composition boundary

The Codex main task keeps its current model, provider, and login.
The DeepSeek OpenCode worker variants are native Codex children; each child's
Agent TOML owns an OpenCode Go provider configuration. The child is an OpenCode
Go session and can use read-only Codex tools directly.

This repository does not call a local OpenCode CLI and does not install a
plugin, MCP server, wrapper, daemon, or another Codex CLI.

## Why direct provider configuration works

Codex custom providers currently accept only the Responses wire. Setting
`wire_api = "chat"` makes Codex ignore the Agent TOML during discovery, so both
DeepSeek Agent TOMLs use `wire_api = "responses"`. Current probes completed for
both retained models. A direct Chat endpoint success is not a substitute for a
native Codex smoke.

| Agent file | Agent type | Model |
| --- | --- | --- |
| `agents/opencode-worker-ds-flash-v4.toml` | `opencode_worker_ds_flash_v4` | `deepseek-v4-flash` |
| `agents/opencode-worker-ds-pro-v4.toml` | `opencode_worker_ds_pro_v4` | `deepseek-v4-pro` |

### Selection policy

`config/opencode-worker-routing.json` is the parent-side selection policy; it does
not replace Agent TOML runtime registration. It records capability tags, cost
class, validation status, aliases, and task profiles. Selection precedence is an
explicit user profile/agent type/model, then a task profile, then the default
profile. Run `node scripts/resolve-worker.mjs --profile pro` to inspect a
deterministic resolution.

The resolved `agent_type` must be used for both staging and native spawn. Unknown
or unavailable explicit selections fail closed; there is no silent fallback.

Every worker shares:

- provider: `opencode_go`
- base_url: `https://opencode.ai/zen/go/v1`
- wire_api: `responses` (the only Codex-supported value)
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
| `agents/opencode-worker*.toml` | Two custom agents (one per model) and the OpenCode Go provider |
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
| Provider probe | Call `/responses` for the selected model | Returns a compatible Response; this does not replace native smoke |
| Quick smoke | New task follows `quick-smoke-test.md` | Marker, child identity, handoff consumption, and OpenCode Go call succeed |

## Known limits

- The default worker is `opencode_worker_ds_flash_v4` (`deepseek-v4-flash`); this repository
  also ships a standalone worker for `deepseek-v4-pro`.
  Adding a model means adding one standalone Agent TOML
  and revalidating the agent, skill, install prompt, docs, and smoke oracle as
  one set; installed environments must also sync the Hook matcher and
  `scripts/validate-installation.mjs`.
- The Hook quarantines a staged/spawned agent type mismatch (exit code 7)
  instead of delivering the assignment to the wrong model.
- OpenCode Go Responses translation varies by model. Keep per-model probe and
  native-smoke status; never infer another model's compatibility from one model
  or a successful Chat endpoint request.
- The Windows Hook script is ported from the DeepSeek repository and is not
  live-validated on Windows here.

## References

- [codex-deepseek-subagent](https://github.com/Utopia-V/codex-deepseek-subagent)
- OpenCode Go `/v1/models` and `/v1/responses` endpoint probes
