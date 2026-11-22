// Checks the group object that group/superpowers.js exports, with literal expectations, against the group object of the agents.makers interface (agents docs/spec/makers.md).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../plugin.json", import.meta.url), "utf8"));
const item = manifest.contributes["agents.makers"][0];
const { group } = await import("../group/superpowers.js");

test("the module exports the function group", () => {
  assert.equal(typeof group, "function");
});

test("group() returns the superpowers group object with the members of the interface", async () => {
  const value = await group();
  assert.deepEqual(Object.keys(value).sort(), [
    "agents", "clis", "folders", "id", "name", "path", "plugin", "rules", "skills", "variables",
  ]);
});

test("the group id and name are the id and name of the contributed item", async () => {
  const value = await group();
  assert.equal(value.id, item.id);
  assert.equal(value.id, "superpowers");
  assert.equal(value.name, item.name);
  assert.equal(value.name, "Superpowers");
});

test("the plugin folder, skills and agents are relative paths inside the group folder", async () => {
  const value = await group();
  assert.equal(value.plugin, "plugin");
  assert.deepEqual(value.skills, ["skills"]);
  assert.deepEqual(value.agents, []);
  for (const path of [value.plugin, ...value.skills]) {
    assert.ok(!path.startsWith("/") && !path.split("/").includes(".."), path);
  }
});

test("superpowers runs claude only, because its SessionStart hook needs claude", async () => {
  const value = await group();
  assert.deepEqual(value.clis, ["claude"]);
});

test("superpowers sets no variables and prepends no PATH folders", async () => {
  const value = await group();
  assert.deepEqual(value.variables, {});
  assert.deepEqual(value.path, []);
});

test("the group creates only the .superpowers/ folder in the project", async () => {
  const value = await group();
  assert.deepEqual(value.folders, [".superpowers/"]);
});

test("the rules name the plan, spec and worktree locations inside .superpowers/", async () => {
  const value = await group();
  assert.ok(value.rules.some((rule) => rule.includes(".superpowers/plans/")), "plans rule");
  assert.ok(value.rules.some((rule) => rule.includes(".superpowers/specs/")), "specs rule");
  assert.ok(value.rules.some((rule) => rule.includes(".superpowers/worktrees/")), "worktrees rule");
  assert.ok(value.rules.some((rule) => rule.includes("docs/superpowers/") && rule.includes("not")), "no docs/superpowers rule");
  assert.ok(value.rules.some((rule) => rule.includes(".worktrees/") && rule.includes("not")), "no .worktrees rule");
});

test("group() returns the same members on every call", async () => {
  assert.deepEqual(await group(), await group());
});
