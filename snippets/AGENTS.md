<!-- codex-opencode-subagent:start -->
- Models:
  - `opencode_worker` (Flash): search, extraction, enumeration, repository mapping, log classification, summaries, and checklists.
  - `opencode_worker_pro` (Pro): cross-file impact, root-cause and test-gap analysis, deep review, hotspot scanning, and reverse verification.
- Boundary: read-only preliminary input, not independent multi-model corroboration; the parent verifies and decides.
- Workflow: load `$use-opencode-worker`; stage and spawn the same agent type with `fork_turns="none"`. No message fallback or inherited-context bypass.
<!-- codex-opencode-subagent:end -->
