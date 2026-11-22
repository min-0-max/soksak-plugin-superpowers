// Checks the declarations of plugin.json and package.json with literal expectations.
// The application validates plugin.json when it installs the release.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));
const manifest = JSON.parse(read("plugin.json"));
const pkg = JSON.parse(read("package.json"));

// Every member that the plugin.json table of core docs/spec/plugins.md lists. A member outside this list is an unknown member.
const SPEC_MEMBERS = [
  "id", "name", "description", "surface", "surface.unload", "mark", "icon", "sections", "sidebars", "preview",
  "dependencies", "events", "extends", "contributes", "data", "sessions", "background",
];

test("plugin.json declares exactly id, name, description, dependencies and contributes", () => {
  assert.deepEqual(Object.keys(manifest).sort(), ["contributes", "dependencies", "description", "id", "name"]);
});

test("every member of plugin.json is a member of the plugin specification", () => {
  for (const member of Object.keys(manifest)) {
    assert.ok(SPEC_MEMBERS.includes(member), `unknown member ${member}`);
  }
});

test("the plugin has no surface, sections, sidebars or project data, so it needs no card", () => {
  for (const member of ["surface", "sections", "sidebars", "data", "mark", "icon"]) {
    assert.equal(manifest[member], undefined, `plugin.json declares ${member}`);
  }
});

test("the id is the lowercase identifier superpowers, which is not core", () => {
  assert.equal(manifest.id, "superpowers");
  assert.match(manifest.id, /^[a-z][a-z0-9-]*$/);
  assert.notEqual(manifest.id, "core");
});

test("the description is one or two sentences of 1 to 200 characters", () => {
  assert.ok(manifest.description.length >= 1 && manifest.description.length <= 200, `length ${manifest.description.length}`);
  const sentences = manifest.description.match(/[.!?](?= |$)/g) ?? [];
  assert.ok(sentences.length >= 1 && sentences.length <= 2, `${sentences.length} sentences`);
});

test("dependencies name only the agents plugin, with a version range", () => {
  assert.deepEqual(Object.keys(manifest.dependencies), ["@soksak/plugin-agents"]);
  assert.match(manifest.dependencies["@soksak/plugin-agents"], /^[<>=^~]*\d/);
});

// The plugin contributes to the extension point agents.makers of the agents plugin, so agents must be in dependencies.
test("contributes holds one item of the agents.makers point, with range and module only", () => {
  assert.deepEqual(Object.keys(manifest.contributes), ["agents.makers"]);
  assert.equal(manifest.contributes["agents.makers"].length, 1);
  const [item] = manifest.contributes["agents.makers"];
  assert.deepEqual(Object.keys(item).sort(), ["module", "range"]);
  assert.match(item.range, /^[<>=^~]*\d/);
});

// The agents.makers point is at version 0.0.1 of the agents plugin, so the item states the range ^0.0.1.
test("the agents.makers item states the range ^0.0.1 of the point version", () => {
  assert.equal(manifest.contributes["agents.makers"][0].range, "^0.0.1");
});

test("the contributed module is a relative path to a JavaScript module inside the plugin", () => {
  const [item] = manifest.contributes["agents.makers"];
  assert.match(item.module, /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\.m?js$/, item.module);
  assert.ok(!item.module.split("/").some((segment) => segment === "." || segment === ".."), item.module);
});

test("package.json is a private module that ships plugin.json", () => {
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, "module");
  assert.deepEqual(pkg.files, ["plugin.json"]);
  assert.ok(pkg.files.every((path) => exists(path)), "a file that package.json names does not exist");
});
