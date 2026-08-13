# Install with Codex

Copy the prompt below into a Codex task whose workspace is this repository. It
installs the native OpenCode Go custom subagent family, its lazy-loaded handoff
skill, and the one-shot plaintext task Hook while preserving the current
main-agent model and provider.

```text
Install the native opencode_worker custom subagent family (opencode_worker,
opencode_worker_pro, opencode_worker_glm, opencode_worker_kimi) from this
repository into my personal Codex configuration. Use the repository checkout as
the source.

Scope and invariants:
- Preserve my current main model, model provider, ChatGPT login, and provider
  configuration. Creating or updating the standalone custom-agent TOMLs, the
  personal use-opencode-worker skill, the user Hook script/configuration, and
  the compact personal AGENTS.md index is expected; this is not a
  zero-configuration installation.
- Keep the custom-agent registration, model_provider, and
  [model_providers.opencode_go] definition inside each standalone agent TOML. Do
  not add [agents.opencode_worker*] or [model_providers.opencode_go] to the
  top-level config.toml.
- Never ask me to paste an API key into chat, never print an existing key, and
  never write a plaintext key into TOML. The only accepted secret name is the
  environment variable OPENCODE_API_KEY.
- Do not make a paid provider call during installation.
- Use Codex's native SubagentStart Hook mechanism for task delivery. Do not
  install a plugin, MCP adapter, wrapper process, daemon, direct HTTP/SDK call,
  separate Codex CLI process, local OpenCode CLI call, or another application
  as a fallback.

Procedure:
1. Detect the active Codex home without changing it. Respect an existing
   CODEX_HOME; otherwise use ~/.codex. Check `codex --version` when available.
   Recommend Codex CLI 0.145.0 or newer, but do not upgrade software unless I
   separately ask.
2. Inspect the target agents directory, any existing opencode_worker* files, the
   <codex-home>/skills/use-opencode-worker directory, the applicable personal
   AGENTS.md, user hooks.json, inline Hook configuration, and
   <codex-home>/hooks/codex-opencode-subagent before changing anything. Preserve
   unrelated configuration. If an existing agent, skill, or Hook at the intended
   identity serves a different purpose, stop and report the conflict.
3. Install exactly these four agent files from the repository checkout:
   <codex-home>/agents/opencode-worker.toml (opencode_worker,
   deepseek-v4-flash),
   <codex-home>/agents/opencode-worker-pro.toml (opencode_worker_pro,
   deepseek-v4-pro),
   <codex-home>/agents/opencode-worker-glm.toml (opencode_worker_glm,
   glm-5.2), and
   <codex-home>/agents/opencode-worker-kimi.toml (opencode_worker_kimi,
   kimi-k2.7-code).
4. Install skills/use-opencode-worker including its SKILL.md.
5. Install the platform handoff script under
   <codex-home>/hooks/codex-opencode-subagent:
   - On macOS/Linux, require Python 3 and install hooks/plaintext_handoff.py.
   - On Windows, install hooks/plaintext-handoff.ps1.
   If Python 3 is unavailable on POSIX, stop and report that the primary Hook
   path cannot be installed instead of silently making inherited turns the
   default.
6. Install one SubagentStart command Hook whose matcher is exactly
   ^(opencode_worker|opencode_worker_pro|opencode_worker_glm|opencode_worker_kimi)$,
   whose timeout is 10 seconds, whose
   additionalContextLimit is 0, and whose command invokes the absolute path of
   the installed platform handoff script in hook mode. Use the corresponding
   hooks/hooks.*.example.json as the structural source.
   - Preserve every unrelated existing Hook.
   - Merge into <codex-home>/hooks.json, creating valid JSON only when needed.
   - Do not add or alter a trusted hash.
7. Merge snippets/AGENTS.md into the personal AGENTS.md once, preserving the
   start/end markers so future updates are idempotent. Read back the merged
   block and confirm that it tells the parent to load $use-opencode-worker
   before spawning, continuing, or troubleshooting the role.
8. Parse each installed agent file with a real TOML parser. Confirm that the
   four files name opencode_worker, opencode_worker_pro, opencode_worker_glm,
   and opencode_worker_kimi respectively, select model_provider opencode_go and
   respectively the models deepseek-v4-flash, deepseek-v4-pro, glm-5.2, and
   kimi-k2.7-code, use the Responses wire API, declare a 1000000-token
   model context window, default
   to read-only, contain no model_reasoning_effort, each contain their own
   [model_providers.opencode_go] definition, and contain no plaintext
   credential. Confirm that the top-level config.toml did not gain any
   main-model, main-provider, agent-registration, or OpenCode Go provider
   entries.
9. Parse the final Hook source as JSON or TOML and verify its exact matcher,
   command path, timeout, event, and context limit. Run the matching local
   protocol test from the source snapshot against a temporary state directory.
   It must prove collision rejection, exact-role delivery, marker preservation,
   one-shot consumption, replay rejection, and recovery without calling a
   provider.
10. Check only whether OPENCODE_API_KEY is present; report a boolean, never its
    value. On Windows check the user scope used by the installed auth command.
11. Read back the installed configuration with credential-like text redacted,
    then report changed paths, validation performed, whether the key is present,
    and that the Hook is not runnable until I review its exact definition in
    /hooks. Do not bypass Hook trust. After I trust it, start a new Codex task
    before the paid smoke so that both the final Hook definition and custom-agent
    configuration are loaded together. Point me to prompts/quick-smoke-test.md
    as the default test; reserve prompts/smoke-test.md for repository
    contributors.
```
