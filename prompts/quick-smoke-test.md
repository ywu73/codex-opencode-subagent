# Quick smoke test

Run this from any new Codex task after the Hook has been reviewed and trusted.
No repository checkout is required. The test makes one small OpenCode Go API
request.

```text
Test the installed OpenCode Go subagent through the recommended native Hook
path. Do not ask me for an API key or display its value.

1. Load $use-opencode-worker. In parent-owned execution state, generate a fresh
   unpredictable marker and build one child assignment: return exactly two
   lines, `marker=<the marker>` and `arithmetic=<the result of 17 * 19>`. Do not
   put the marker or assignment in commentary, a file, inherited turns, or the
   spawn message.
2. Stage that assignment through the installed plaintext handoff script:
   python3 "<codex-home>/hooks/codex-opencode-subagent/plaintext_handoff.py" --mode stage
3. Spawn the exact agent type opencode_worker with a unique task name and
   fork_turns="none". Do not set a token budget or reasoning-effort restriction.
4. Use one native task-sized idle wait or callback. Do not short-poll, send a
   follow-up, retry through another transport, or calculate a substitute answer
   in the parent.
5. Pass only if a distinct opencode_worker child returns the exact fresh marker
   once and `arithmetic=323`, the pending handoff is consumed, and the parent
   model/provider configuration remains unchanged.

Do not use inherited-context fallback, direct HTTP/SDK calls, another Codex CLI,
another provider, or a local OpenCode CLI invocation. If any boundary fails,
report the exact failing boundary and stop.
```

This quick test proves custom-agent discovery, Hook task delivery, OpenCode Go
authentication and execution, native child identity, one-shot consumption, and
the result callback. It deliberately does not test local tool access.
Repository contributors can additionally run [smoke-test.md](smoke-test.md) for
the fixture and local tool path.
