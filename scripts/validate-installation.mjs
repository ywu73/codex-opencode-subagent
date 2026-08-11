#!/usr/bin/env node

import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const checks = {
  opencode_api_key_present: Boolean(process.env.OPENCODE_API_KEY),
};

try {
  const agentPath = path.join(codexHome, "agents", "opencode-worker.toml");
  const agent = readFileSync(agentPath, "utf8");
  checks.agent_installed = agent.includes("opencode_worker");
  checks.agent_provider_configured =
    agent.includes('model_provider = "opencode_go"') &&
    agent.includes('model = "deepseek-v4-flash"') &&
    agent.includes('base_url = "https://opencode.ai/zen/go/v1"') &&
    agent.includes('wire_api = "responses"') &&
    agent.includes("env_key = \"OPENCODE_API_KEY\"");
  checks.agent_no_plaintext_key = !agent.includes("OPENCODE_API_KEY =") &&
    !agent.includes("experimental_bearer_token");

  const skillPath = path.join(codexHome, "skills", "use-opencode-worker", "SKILL.md");
  const skill = readFileSync(skillPath, "utf8");
  checks.skill_installed = skill.includes("use-opencode-worker");

  const hookDir = path.join(codexHome, "hooks", "codex-opencode-subagent");
  const handoff = readFileSync(path.join(hookDir, "plaintext_handoff.py"), "utf8");
  checks.hook_script_installed = handoff.includes("opencode_worker");

  let hooksText = "";
  for (const candidate of [
    path.join(codexHome, "hooks.json"),
    path.join(codexHome, "config.toml"),
  ]) {
    try {
      hooksText += readFileSync(candidate, "utf8");
    } catch {
      // The hook may live in only one of the supported files.
    }
  }
  checks.hook_registered =
    hooksText.includes("^opencode_worker$") &&
    hooksText.includes("plaintext_handoff.py");
} catch (error) {
  checks.install_checks_failed = error.message;
}

const ready = Object.values(checks).every(Boolean);
process.stdout.write(
  `${JSON.stringify(
    {
      status: ready ? "ready" : "failed",
      codex_home: codexHome,
      checks,
      new_thread_required: ready,
    },
    null,
    2,
  )}\n`,
);
if (!ready) process.exitCode = 1;
