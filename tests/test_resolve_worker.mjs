import assert from "node:assert/strict";
import test from "node:test";

import {
  loadRoutingConfig,
  resolveSelection,
  validateRoutingConfig,
} from "../scripts/resolve-worker.mjs";

const config = loadRoutingConfig();

test("defaults to the configured fast reading worker", () => {
  const result = resolveSelection(config);

  assert.equal(result.selected_profile, "fast_read");
  assert.equal(result.agent_type, "opencode_worker_ds_v4_flash");
  assert.equal(result.model, "deepseek-v4-flash");
  assert.equal(result.wire_api, "responses");
  assert.equal(result.selection_source, "default_profile");
});

test("resolves an explicit profile alias", () => {
  const result = resolveSelection(config, { profile: "pro" });

  assert.equal(result.selected_profile, "deep_reasoning");
  assert.equal(result.agent_type, "opencode_worker_ds_v4_pro");
  assert.equal(result.selection_source, "explicit_profile");
});

test("resolves an exact model id", () => {
  const result = resolveSelection(config, { model: "deepseek-v4-pro" });

  assert.equal(result.selected_profile, "deep_reasoning");
  assert.equal(result.agent_type, "opencode_worker_ds_v4_pro");
  assert.equal(result.selection_source, "explicit_model");
});

test("resolves the versioned DeepSeek aliases", () => {
  assert.equal(
    resolveSelection(config, { profile: "ds_v4_flash" }).agent_type,
    "opencode_worker_ds_v4_flash",
  );
  assert.equal(
    resolveSelection(config, { profile: "ds_v4_pro" }).agent_type,
    "opencode_worker_ds_v4_pro",
  );
});

test("uses the Codex-supported Responses wire for every configured model", () => {
  for (const worker of Object.values(config.workers)) {
    assert.equal(worker.wire_api, "responses");
  }
});

test("rejects a routing config that names an unsupported wire API", () => {
  const invalid = structuredClone(config);
  invalid.workers.fast_read.wire_api = "chat";

  assert.throws(
    () => validateRoutingConfig(invalid),
    /unsupported wire API/,
  );
});

test("rejects conflicting selectors instead of guessing", () => {
  assert.throws(
    () => resolveSelection(config, { profile: "pro", model: "deepseek-v4-pro" }),
    /Choose only one selector/,
  );
});

test("rejects unknown selections without fallback", () => {
  assert.throws(
    () => resolveSelection(config, { profile: "not-configured" }),
    /Unknown worker profile/,
  );
  assert.throws(
    () => resolveSelection(config, { task: "not-configured" }),
    /Unknown task profile/,
  );
});
