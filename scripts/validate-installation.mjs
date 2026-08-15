#!/usr/bin/env node

import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadRoutingConfig } from "./resolve-worker.mjs";

function stringAssignments(text, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...text.matchAll(new RegExp(`^${escapedKey}\\s*=\\s*"([^"]*)"\\s*$`, "gm"))]
    .map((match) => match[1]);
}

function integerAssignments(text, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...text.matchAll(new RegExp(`^${escapedKey}\\s*=\\s*(\\d+)\\s*$`, "gm"))]
    .map((match) => Number(match[1]));
}

function hasExactAssignment(text, key, expected) {
  const values = typeof expected === "number"
    ? integerAssignments(text, key)
    : stringAssignments(text, key);
  return values.length === 1 && values[0] === expected;
}

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
    ["opencode-worker-ds-flash.toml", "opencode_worker_ds_flash", "deepseek-v4-flash", 1000000],
    ["opencode-worker-ds-pro.toml", "opencode_worker_ds_pro", "deepseek-v4-pro", 1000000],
  ];
  for (const [fileName, agentName, model, contextWindow] of agentFiles) {
    const agent = readFileSync(path.join(codexHome, "agents", fileName), "utf8");
    if (stringAssignments(agent, "name")[0] !== agentName) {
      checks.agents_installed = false;
    }
    if (
      !(
        hasExactAssignment(agent, "model_provider", "opencode_go") &&
        hasExactAssignment(agent, "model", model) &&
        hasExactAssignment(agent, "model_context_window", contextWindow) &&
        hasExactAssignment(agent, "base_url", "https://opencode.ai/zen/go/v1") &&
        hasExactAssignment(agent, "wire_api", "responses") &&
        hasExactAssignment(agent, "env_key", "OPENCODE_API_KEY")
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
    ["fast_read", "opencode_worker_ds_flash", "deepseek-v4-flash", 1000000, "responses"],
    ["deep_reasoning", "opencode_worker_ds_pro", "deepseek-v4-pro", 1000000, "responses"],
  ];
  if (routing.default_profile !== "fast_read") {
    checks.routing_config_matches_agents = false;
  }
  for (const [profile, agentName, model, contextWindow, wireApi] of expectedRouting) {
    const worker = routing.workers[profile];
    if (
      !worker ||
      worker.agent_type !== agentName ||
      worker.model !== model ||
      worker.model_context_window !== contextWindow ||
      worker.wire_api !== wireApi
    ) {
      checks.routing_config_matches_agents = false;
    }
  }

  const skillPath = path.join(codexHome, "skills", "use-opencode-worker", "SKILL.md");
  const skill = readFileSync(skillPath, "utf8");
  checks.skill_installed = skill.includes("use-opencode-worker");

  const hookDir = path.join(codexHome, "hooks", "codex-opencode-subagent");
  const handoff = readFileSync(path.join(hookDir, "plaintext_handoff.py"), "utf8");
  checks.hook_script_installed =
    handoff.includes("opencode_worker_ds_flash") &&
    handoff.includes("opencode_worker_ds_pro");

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
      "^(opencode_worker_ds_flash|opencode_worker_ds_pro)$",
    ) && hooksText.includes("plaintext_handoff.py");
} catch (error) {
  checks.install_checks_failed = error.message;
}

const installationReady = Object.entries(checks).every(([, value]) => value === true);
let liveSmokeComplete = false;
let unverifiedWorkers = [];
try {
  const routing = loadRoutingConfig();
  unverifiedWorkers = Object.values(routing.workers)
    .filter((worker) => worker.validation?.live_smoke !== "verified")
    .map((worker) => worker.agent_type);
  liveSmokeComplete = unverifiedWorkers.length === 0;
} catch {
  // A routing parse failure is already represented in the installation checks.
}
const status = !installationReady
  ? "failed"
  : liveSmokeComplete
    ? "ready"
    : "installed-unverified";
process.stdout.write(
  `${JSON.stringify(
    {
      status,
      codex_home: codexHome,
      checks,
      installation_ready: installationReady,
      live_smoke_complete: liveSmokeComplete,
      unverified_workers: unverifiedWorkers,
      new_thread_required: installationReady,
    },
    null,
    2,
  )}\n`,
);
if (!installationReady) process.exitCode = 1;
