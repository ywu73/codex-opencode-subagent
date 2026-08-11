# codex-opencode-subagent

Keep the Codex main task on its current model/provider while using OpenCode Go
as a native subagent for bounded code, log, search, extraction, enumeration,
and high-volume text work. This repository does not call a local OpenCode CLI,
and it does not require CC Switch, MCP, a plugin, or another Codex CLI.

It follows the same architecture as
[`codex-deepseek-subagent`](https://github.com/Utopia-V/codex-deepseek-subagent):
`opencode_worker` is a native Codex child whose Agent TOML owns its provider,
model, base URL, wire API, and `OPENCODE_API_KEY`. A `SubagentStart` Hook
delivers the parent's one-shot plaintext assignment into the child.

## Three-step install

### 1. Set the OpenCode API key

Create or confirm an OpenCode Go key and store it as the `OPENCODE_API_KEY`
environment variable. Never paste the key into a Codex chat, Issue, screenshot,
or repository.

Start Codex from a shell that inherits the variable. On Windows, add
`OPENCODE_API_KEY` as a user environment variable and start a new Codex process.

### 2. Install with Codex

Ask Codex to read and follow
[prompts/install-with-codex.md](prompts/install-with-codex.md) from this
repository. The installer adds:

- `<codex-home>/agents/opencode-worker.toml`
- `<codex-home>/skills/use-opencode-worker/`
- `<codex-home>/hooks/codex-opencode-subagent/plaintext_handoff.py`
- one `SubagentStart` Hook matching `^opencode_worker$`
- a marked `$use-opencode-worker` index in the personal `AGENTS.md`

It does not switch the main model/provider and makes no OpenCode Go call during
installation.

### 3. Trust the Hook, then test

1. Enter `/hooks` in Codex and confirm the Hook matches only `opencode_worker`
   and points to the installed `plaintext_handoff.py`, then trust it.
2. Start a new Codex task. A task that was already running is not guaranteed to
   reload the new Hook.
3. Ask the new task to follow
   [prompts/quick-smoke-test.md](prompts/quick-smoke-test.md).

## What success looks like

The quick smoke passes only when all of these are true:

- Codex exposes a distinct native child task whose agent type is
  `opencode_worker`.
- The child returns the parent's exact fresh marker and `arithmetic=323`.
- The one-shot pending handoff is consumed.
- The main task remains on its original model/provider.
- No secondary CLI, direct API call, or substitute model fakes the result.

## If it does not work

- **`opencode_worker` is missing:** start a new task first; if it is still
  missing, restart Codex once.
- **The child says no task arrived:** the Hook is usually untrusted, the current
  task predates installation, or the Hook did not load. Check `/hooks`, then
  start a new task. Do not switch to inherited turns.
- **`OPENCODE_API_KEY` is missing:** check only whether the environment variable
  exists; never paste its value into chat.
- **The installer asks to switch the global provider, start another CLI, or
  install MCP:** stop. That is not this repository's route.

## Advanced users and contributors

- Architecture and configuration boundaries: [docs/advanced.en.md](docs/advanced.en.md)
- Full installation contract: [prompts/install-with-codex.md](prompts/install-with-codex.md)
- Contributor smoke with local tools and SHA-256:
  [prompts/smoke-test.md](prompts/smoke-test.md)
- Credentials, plaintext local state, and the OpenCode Go data boundary:
  [SECURITY.md](SECURITY.md)

## Cost and affiliation

OpenCode Go billing is separate from a ChatGPT/OpenAI subscription. Installation
makes no provider call; the quick smoke and later workers are billed to the
OpenCode Go account.

MIT. This is an independent configuration example and is not affiliated with or
endorsed by OpenAI or OpenCode.
