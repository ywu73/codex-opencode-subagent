#!/usr/bin/env node

import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadRoutingConfig } from "./resolve-worker.mjs";

const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const checks = {
  opencode_api_key_present: Boolean(process.env.OPENCODE_API_KEY),
  agents_installed: true,
  agent_provider_configured: true,
  agent_no_plaintext_key: true,
  routing_config_valid: true,
  routing_config_matches_agents: true,
};

try {
  const agentFiles = [
    ["opencode-worker.toml", "opencode_worker", "deepseek-v4-flash"],
    ["opencode-worker-pro.toml", "opencode_worker_pro", "deepseek-v4-pro"],
    ["opencode-worker-glm.toml", "opencode_worker_glm", "glm-5.2"],
    ["opencode-worker-kimi.toml", "opencode_worker_kimi", "kimi-k2.7-code"],
  ];
  for (const [fileName, agentName, model] of agentFiles) {
    const agent = readFileSync(path.join(codexHome, "agents", fileName), "utf8");
    if (!agent.includes(agentName)) {
      checks.agents_installed = false;
    }
    if (
      !(
        agent.includes('model_provider = "opencode_go"') &&
        agent.includes(`model = "${model}"`) &&
        agent.includes('base_url = "https://opencode.ai/zen/go/v1"') &&
        agent.includes('wire_api = "responses"') &&
        agent.includes('env_key = "OPENCODE_API_KEY"')
      )
    ) {
      checks.agent_provider_configured = false;
    }
    if (
      agent.includes("OPENCODE_API_KEY =") ||
      agent.includes("experimental_bearer_token")
    ) {
      checks.agent_no_plaintext_key = false;
    }
  }

  const routing = loadRoutingConfig();
  const expectedRouting = [
    ["fast_read", "opencode_worker", "deepseek-v4-flash"],
    ["deep_reasoning", "opencode_worker_pro", "deepseek-v4-pro"],
    ["alternative_reasoning", "opencode_worker_glm", "glm-5.2"],
    ["code", "opencode_worker_kimi", "kimi-k2.7-code"],
  ];
  if (routing.default_profile !== "fast_read") {
    checks.routing_config_matches_agents = false;
  }
  for (const [profile, agentName, model] of expectedRouting) {
    const worker = routing.workers[profile];
    if (!worker || worker.agent_type !== agentName || worker.model !== model) {
      checks.routing_config_matches_agents = false;
    }
  }

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
    hooksText.includes(
      "^(opencode_worker|opencode_worker_pro|opencode_worker_glm|opencode_worker_kimi)$",
    ) && hooksText.includes("plaintext_handoff.py");
} catch (error) {
  checks.install_checks_failed = error.message;
}

const ready = Object.entries(checks).every(([, value]) => value === true);
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
