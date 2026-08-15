import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const promptPaths = [
  "prompts/quick-smoke-test.md",
  "prompts/smoke-test.md",
];

for (const promptPath of promptPaths) {
  test(`${promptPath} keeps one selected agent type through stage, spawn, and oracle`, () => {
    const prompt = readFileSync(promptPath, "utf8");

    assert.match(prompt, /selected_agent_type/);
    assert.match(prompt, /--agent-type <selected_agent_type>/);
    assert.match(prompt, /Spawn the exact agent type <selected_agent_type>/);
    assert.match(prompt, /agent type is <selected_agent_type>/);
    assert.doesNotMatch(prompt, /Spawn the exact agent type opencode_worker_ds_v4_flash/);
    assert.doesNotMatch(prompt, /distinct opencode_worker_ds_v4_flash child/);
    assert.doesNotMatch(prompt, /spawned opencode_worker_ds_v4_flash child/);
    assert.doesNotMatch(prompt, /agent_type opencode_worker_ds_v4_flash/);
    assert.doesNotMatch(prompt, /distinct native `opencode_worker_ds_v4_flash` child/);
  });
}
