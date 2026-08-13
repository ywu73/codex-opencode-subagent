<!-- codex-opencode-subagent:start -->
- For bounded, preferably read-only code, log, search, extraction, enumeration, or high-volume reading work, the main agent may consider the `opencode_worker` family (`opencode_worker` = deepseek-v4-flash default, `opencode_worker_pro` = deepseek-v4-pro, `opencode_worker_glm` = glm-5.2, `opencode_worker_kimi` = kimi-k2.7-code); delegation remains optional and the parent retains verification and integration.
- Before spawning, continuing, or troubleshooting any `opencode_worker*` type, use `$use-opencode-worker` and follow its stage-and-spawn workflow, staging and spawning the exact same agent type. Do not bypass it with V2 message-only delivery or inherited root turns.
<!-- codex-opencode-subagent:end -->
