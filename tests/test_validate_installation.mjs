import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const agentFiles = [
  "opencode-worker.toml",
  "opencode-worker-pro.toml",
];

function makeInstallationFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "opencode-installation-"));
  mkdirSync(path.join(root, "agents"), { recursive: true });
  mkdirSync(path.join(root, "skills", "use-opencode-worker"), { recursive: true });
  mkdirSync(path.join(root, "hooks", "codex-opencode-subagent"), { recursive: true });
  for (const fileName of agentFiles) {
    copyFileSync(path.join("agents", fileName), path.join(root, "agents", fileName));
  }
  copyFileSync(
    "skills/use-opencode-worker/SKILL.md",
    path.join(root, "skills", "use-opencode-worker", "SKILL.md"),
  );
  copyFileSync(
    "hooks/plaintext_handoff.py",
    path.join(root, "hooks", "codex-opencode-subagent", "plaintext_handoff.py"),
  );
  writeFileSync(
    path.join(root, "hooks.json"),
    JSON.stringify({
      hooks: {
        SubagentStart: [{
          matcher: "^(opencode_worker|opencode_worker_pro)$",
          hooks: [{ command: "python3 /tmp/plaintext_handoff.py --mode hook" }],
        }],
      },
    }),
  );
  return root;
}

function runValidator(codexHome) {
  return spawnSync(process.execPath, ["scripts/validate-installation.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, CODEX_HOME: codexHome, OPENCODE_API_KEY: "present-for-test" },
  });
}

test("validator rejects chat wire in every installed worker", async (t) => {
  for (const fileName of agentFiles) {
    await t.test(fileName, () => {
      const root = makeInstallationFixture();
      try {
        const target = path.join(root, "agents", fileName);
        const source = readFileSync(target, "utf8").replace(
          'wire_api = "responses"',
          'wire_api = "chat"',
        );
        writeFileSync(target, source);

        const result = runValidator(root);

        assert.equal(result.status, 1, result.stdout || result.stderr);
        assert.equal(
          JSON.parse(result.stdout).checks.agent_provider_configured,
          false,
        );
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });
  }
});

test("validator reports ready for the two live-verified workers", () => {
  const root = makeInstallationFixture();
  try {
    for (const fileName of agentFiles) {
      const target = path.join(root, "agents", fileName);
      writeFileSync(
        target,
        readFileSync(target, "utf8").replace(
          'wire_api = "chat"',
          'wire_api = "responses"',
        ),
      );
    }

    const result = runValidator(root);
    const output = JSON.parse(result.stdout);

    assert.equal(result.status, 0, result.stdout || result.stderr);
    assert.equal(output.status, "ready");
    assert.equal(output.installation_ready, true);
    assert.equal(output.live_smoke_complete, true);
    assert.deepEqual(output.unverified_workers, []);
    assert.equal(output.new_thread_required, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
