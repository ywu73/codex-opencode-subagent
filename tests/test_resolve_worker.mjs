import assert from "node:assert/strict";
import test from "node:test";

import {
  loadRoutingConfig,
  resolveSelection,
} from "../scripts/resolve-worker.mjs";

const config = loadRoutingConfig();

test("defaults to the configured fast reading worker", () => {
  const result = resolveSelection(config);

  assert.equal(result.selected_profile, "fast_read");
  assert.equal(result.agent_type, "opencode_worker");
  assert.equal(result.model, "deepseek-v4-flash");
  assert.equal(result.selection_source, "default_profile");
});

test("resolves an explicit profile alias", () => {
  const result = resolveSelection(config, { profile: "pro" });

  assert.equal(result.selected_profile, "deep_reasoning");
  assert.equal(result.agent_type, "opencode_worker_pro");
  assert.equal(result.selection_source, "explicit_profile");
});

test("resolves an exact agent type", () => {
  const result = resolveSelection(config, { agent_type: "opencode_worker_kimi" });

  assert.equal(result.selected_profile, "code");
  assert.equal(result.model, "kimi-k2.7-code");
  assert.equal(result.selection_source, "explicit_agent_type");
});

test("resolves an exact model id", () => {
  const result = resolveSelection(config, { model: "glm-5.2" });

  assert.equal(result.selected_profile, "alternative_reasoning");
  assert.equal(result.agent_type, "opencode_worker_glm");
  assert.equal(result.selection_source, "explicit_model");
});

test("resolves a task profile", () => {
  const result = resolveSelection(config, { task: "code" });

  assert.equal(result.selected_profile, "code");
  assert.equal(result.selection_source, "task_profile");
});

test("rejects conflicting selectors instead of guessing", () => {
  assert.throws(
    () => resolveSelection(config, { profile: "pro", model: "glm-5.2" }),
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
