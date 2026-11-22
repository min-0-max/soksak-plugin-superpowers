// Checks the group object that group/superpowers.js builds from the data module, with literal expectations, against the
// group object of the agents.makers interface (agents docs/spec/makers.md).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { groupFrom } from "../group/superpowers.js";

const manifest = JSON.parse(readFileSync(new URL("../plugin.json", import.meta.url), "utf8"));
const item = manifest.contributes["agents.makers"][0];

const AGENT = "skills/using-superpowers/SKILL.md";

function data(overrides = {}) {
  return {
    agents: [{ name: "superpowers", path: AGENT, cli: "claude" }],
    skills: ["skills/brainstorming", "skills/using-superpowers"],
    files: [
      { path: ".claude-plugin/plugin.json", text: "{}\n" },
      { path: "hooks/hooks.json", text: "{}\n" },
      { path: "hooks/run-hook.cmd", text: "#!/bin/sh\n" },
      { path: "hooks/session-start", text: "#!/bin/sh\n" },
      { path: "skills/brainstorming/SKILL.md", text: "---\nname: brainstorming\n---\n" },
      { path: AGENT, text: "---\nname: using-superpowers\n---\n" },
    ],
    ...overrides,
  };
}

test("the module exports the functions group and groupFrom", async () => {
  const module = await import("../group/superpowers.js");
  assert.equal(typeof module.group, "function");
  assert.equal(typeof module.groupFrom, "function");
});

test("groupFrom returns the superpowers group object with the members of the interface", () => {
  assert.deepEqual(Object.keys(groupFrom(data())).sort(), [
    "agents", "clis", "files", "folders", "id", "name", "path", "plugin", "rules", "skills", "variables",
  ]);
});

test("the group id and name are the id and name of the contributed item", () => {
  const value = groupFrom(data());
  assert.equal(value.id, item.id);
  assert.equal(value.id, "superpowers");
  assert.equal(value.name, item.name);
  assert.equal(value.name, "Superpowers");
});

test("the one agent names its main skill file, which is an entry of files", () => {
  const value = groupFrom(data());
  assert.deepEqual(value.agents, [{ name: "superpowers", path: AGENT, cli: "claude" }]);
  assert.ok(value.files.some((file) => file.path === AGENT));
});

test("an agent path that names no entry of files is refused, and the error names the agent field", () => {
  const files = data().files.filter((file) => file.path !== AGENT);
  assert.throws(() => groupFrom(data({ files })), /agents\[0\]\.path/);
});

test("a file outside the project folders is refused, and the error names the file", () => {
  const files = [...data().files, { path: "docs/README.md", text: "x" }];
  assert.throws(() => groupFrom(data({ files })), /files\[6\]\.path.*docs\/README\.md/);
});

test("a repeated file path is refused", () => {
  const files = [...data().files, { path: "hooks/hooks.json", text: "again" }];
  assert.throws(() => groupFrom(data({ files })), /files\[6\]\.path.*repeats/);
});

test("the folders are the project paths that the upstream files and the .superpowers rules use", () => {
  assert.deepEqual(groupFrom(data()).folders, [".superpowers/", ".claude-plugin/", "hooks/", "skills/"]);
});

test("superpowers runs claude only, because its SessionStart hook needs claude", () => {
  assert.deepEqual(groupFrom(data()).clis, ["claude"]);
});

test("the skill folders are project paths of the files", () => {
  assert.deepEqual(groupFrom(data()).skills, ["skills/brainstorming", "skills/using-superpowers"]);
});

test("superpowers sets no variables and prepends no PATH folders", () => {
  const value = groupFrom(data());
  assert.deepEqual(value.variables, {});
  assert.deepEqual(value.path, []);
});

test("the rules name the plan, spec and worktree locations inside .superpowers/", () => {
  const { rules } = groupFrom(data());
  assert.ok(rules.some((rule) => rule.includes(".superpowers/plans/")), "plans rule");
  assert.ok(rules.some((rule) => rule.includes(".superpowers/specs/")), "specs rule");
  assert.ok(rules.some((rule) => rule.includes(".superpowers/worktrees/")), "worktrees rule");
  assert.ok(rules.some((rule) => rule.includes("docs/superpowers/") && rule.includes("not")), "no docs/superpowers rule");
  assert.ok(rules.some((rule) => rule.includes(".worktrees/") && rule.includes("not")), "no .worktrees rule");
});
