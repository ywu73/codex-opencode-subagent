---
name: use-opencode-worker
description: Use the OpenCode Go-backed DeepSeek workers through the installed one-shot plaintext SubagentStart Hook. Use whenever Codex considers spawning, continuing, or troubleshooting these workers; it governs task suitability, plaintext staging, native fork_turns=none spawning and return, one-shot state recovery, and the OpenCode Go provider data boundary.
---

# Use OpenCode Worker

## Choose the worker and model

- Use a worker for bounded, preferably read-only text, code, log, search,
  extraction, enumeration, or high-volume reading work whose raw material is
  much larger than the useful conclusion.
- Read `config/opencode-worker-routing.json` from the current workspace before
  choosing a worker when that file exists. It is the parent-side routing policy;
  the Agent TOMLs and Hook remain the runtime registration and delivery contract.
  If the routing file is absent, the checkout-free quick smoke may select only
  the exact default `opencode_worker_ds_flash`; do not infer or select another profile.
- Resolve the worker in this order:
  1. Respect an explicit enabled user override such as `worker: pro` or
     `model: deepseek-v4-pro`.
  2. Otherwise use the task profile from the routing config.
  3. Otherwise use the config's `default_profile`.
- Use `node scripts/resolve-worker.mjs --profile <name>` when a deterministic
  resolution record is useful. Its output is advisory metadata for the parent;
  the returned `agent_type` is the value that must be staged and spawned.
- Pick the agent type that matches the task's model needs:

| Agent type | Model | Routing status / use |
| --- | --- | --- |
| `opencode_worker_ds_flash` | `deepseek-v4-flash` | Available default; bounded reading and extraction |
| `opencode_worker_ds_pro` | `deepseek-v4-pro` | Available; deeper reasoning |

- Stage and spawn the exact same agent type. The Hook quarantines a staged/spawned
  type mismatch instead of delivering the assignment to the wrong model.
- Never silently fall back when an explicit profile, model, or agent type is
  unavailable. Report the selection failure and keep the parent in control.
- The routing strengths are project policy tags, not a benchmark guarantee;
  keep consequential reasoning and final verification in the parent.
- Keep tightly coupled reasoning, consequential decisions, verification, and
  final integration in the parent.
- Do not send secrets, private source, personal data, or regulated material
  unless the user has authorized the OpenCode Go provider and model data
  boundary.
- Keep the parent and its provider independent from the child transport. Do not
  switch the parent provider or model to delegate.
- Keep provider credentials in the provider environment. Never put credentials
  in the staged assignment, spawn message, or returned content.

## Deliver one self-contained job

1. Build one complete assignment containing child identity, objective, scope,
   exclusions, available permissions, evidence or output contract, and stopping
   condition. Keep it in parent-owned execution state; do not publish it as
   user-visible commentary merely for transport.
2. Pipe the assignment through stdin to the installed handoff script in
   `stage` mode, naming the exact agent type you will spawn:
   - Windows: `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "<codex-home>\hooks\codex-opencode-subagent\plaintext-handoff.ps1" -Mode stage -AgentType opencode_worker_ds_flash`
   - macOS/Linux: `python3 "<codex-home>/hooks/codex-opencode-subagent/plaintext_handoff.py" --mode stage --agent-type opencode_worker_ds_flash`
   (Use the chosen family type, e.g. `opencode_worker_ds_pro`, in both the stage
   command and the spawn below.)
3. Require a successful stage result naming the same agent type you intend to
   spawn. Treat a lock contender, active pending or claimed item, quarantined
   state, or any other non-success result as a transport failure. Never spawn
   after a failed stage.
4. Immediately create the child through Codex's native `spawn_agent` with the
   exact agent type from the stage result and `fork_turns="none"`. Do not
   replace this with a provider CLI, direct API call, local OpenCode CLI, or
   inherited root history.
5. Receive the child through Codex's native wait/callback path. Use one
   task-sized idle wait or callback; do not short-poll, duplicate the child's
   work, or invent another return transport while it runs.
6. Verify the returned contribution in proportion to the parent claim, then
   integrate it in the parent context.

## Respect dispatch and delivery semantics

- Treat delivery as one-shot and at-most-once. Never assume a claimed assignment
  can be replayed or delivered to a replacement child.
- After a worker has received its assignment, it no longer holds the dispatch
  lock; you may stage and spawn the next job before that worker returns.
  Already-running workers continue concurrently.
- Require explicit resolution for malformed or quarantined state. Never delete,
  replace, or overwrite it automatically.

## Fail and continue safely

- Treat a missing Hook assignment, failed stage, unreadable child task, absent
  callback, missing `OPENCODE_API_KEY`, or provider error as a transport
  failure. Do not silently substitute another provider, model, app, CLI, direct
  API call, or inherited root history.
- Multi-agent V1 is an explicit top-level session compatibility choice, not a
  per-spawn switch or silent fallback.
- The staged assignment briefly exists as plaintext in local user state before
  dispatch to OpenCode Go. The Hook is a transport compatibility layer, not a
  confidential channel.
