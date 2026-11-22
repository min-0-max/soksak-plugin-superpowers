// Checks the release build of the superpowers group on a fixture of the upstream layout (obra/superpowers v7.0.2).
// The build checks the sha256 of the release file, copies the Claude plugin files at their upstream paths into
// group/files.js, and ships the LICENSE of the release (scripts/build-release.mjs).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { buildRelease } from "../scripts/build-release.mjs";
import { groupFrom } from "../group/superpowers.js";

const VERSION = "v7.0.2";
const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(here, "fixtures", "upstream-release", "superpowers-fixture");

// Packs a copy of the fixture under one top folder, as the codeload tarball holds it, and returns the release file with its sha256.
function releaseOf(work, mutate = () => {}) {
  const parent = join(work, "src");
  mkdirSync(parent, { recursive: true });
  const top = join(parent, "superpowers-fixture");
  execFileSync("cp", ["-R", FIXTURE, top]);
  mutate(top);
  const releaseFile = join(work, "superpowers-fixture.tar.gz");
  execFileSync("tar", ["-czf", releaseFile, "-C", parent, "superpowers-fixture"]);
  return { releaseFile, sha256: createHash("sha256").update(readFileSync(releaseFile)).digest("hex") };
}

// Runs one case in its own work folder, with the build output under out.
async function withBuild(run, mutate) {
  const work = mkdtempSync(join(tmpdir(), "superpowers-release-test-"));
  try {
    await run({ work, out: join(work, "out"), ...releaseOf(work, mutate) });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

async function dataOf(out) {
  return import(pathToFileURL(join(out, "group", "files.js")).href);
}

test("the build writes the skill folders of the release under .claude/skills/, and no other upstream file", () => withBuild(async ({ releaseFile, sha256, out }) => {
  buildRelease({ releaseFile, sha256, version: VERSION, out });
  const { files } = await dataOf(out);
  assert.deepEqual(files.map((file) => file.path), [
    ".claude/skills/brainstorming/SKILL.md",
    ".claude/skills/brainstorming/scripts/run.sh",
    ".claude/skills/using-superpowers/SKILL.md",
    ".claude/skills/using-superpowers/extra.md",
  ]);
}));

test("the Claude plugin files of the release (plugin manifest, hooks) are not shipped as project files", () => withBuild(async ({ releaseFile, sha256, out }) => {
  buildRelease({ releaseFile, sha256, version: VERSION, out });
  const { files, folders } = await dataOf(out);
  assert.ok(!files.some((file) => /^(\.claude-plugin\/|hooks\/)/.test(file.path)));
}));

test("each file keeps the upstream text, and the cursor hook file is not shipped", () => withBuild(async ({ releaseFile, sha256, out }) => {
  buildRelease({ releaseFile, sha256, version: VERSION, out });
  const { files } = await dataOf(out);
  const text = (path) => files.find((file) => file.path === path).text;
  assert.equal(text(".claude/skills/using-superpowers/SKILL.md"), "---\nname: using-superpowers\n---\nBody\n");
  assert.equal(files.some((file) => file.path.includes("cursor")), false);
}));

test("the data module names the skill folders and the one agent of the group", () => withBuild(async ({ releaseFile, sha256, out }) => {
  buildRelease({ releaseFile, sha256, version: VERSION, out });
  const data = await dataOf(out);
  assert.deepEqual(data.skills, [".claude/skills/brainstorming", ".claude/skills/using-superpowers"]);
  assert.deepEqual(data.agents, [{ name: "superpowers", path: ".claude/skills/using-superpowers/SKILL.md", cli: "claude" }]);
  const group = groupFrom(data);
  assert.deepEqual(group.agents, data.agents);
}));

test("the build ships the LICENSE of the release as group/superpowers.LICENSE", () => withBuild(async ({ releaseFile, sha256, out }) => {
  buildRelease({ releaseFile, sha256, version: VERSION, out });
  assert.equal(readFileSync(join(out, "group", "superpowers.LICENSE"), "utf8"), "MIT fixture license\n");
}));

test("a release file whose sha256 differs from the pin is refused before anything is written", () => withBuild(async ({ releaseFile, out }) => {
  assert.throws(() => buildRelease({ releaseFile, sha256: "0".repeat(64), version: VERSION, out }), /sha256 .* does not match/);
  assert.equal(existsSync(join(out, "group")), false);
}));

test("a release without a LICENSE is refused before anything is written", () => withBuild(async ({ releaseFile, sha256, out }) => {
  assert.throws(() => buildRelease({ releaseFile, sha256, version: VERSION, out }), /LICENSE/);
  assert.equal(existsSync(join(out, "group")), false);
}, (top) => rmSync(join(top, "LICENSE"))));

test("a release without the agent skill file is refused, and names the file", () => withBuild(async ({ releaseFile, sha256, out }) => {
  assert.throws(() => buildRelease({ releaseFile, sha256, version: VERSION, out }), /skills\/using-superpowers\/SKILL\.md/);
}, (top) => rmSync(join(top, "skills", "using-superpowers", "SKILL.md"))));

test("a file that is not UTF-8 text is refused, and the error names it", () => withBuild(async ({ releaseFile, sha256, out }) => {
  assert.throws(() => buildRelease({ releaseFile, sha256, version: VERSION, out }), /skills\/brainstorming\/scripts\/run\.sh/);
}, (top) => writeFileSync(join(top, "skills", "brainstorming", "scripts", "run.sh"), Buffer.from([0xff, 0xfe, 0x00]))));

test("the build marks each file whose upstream header mode has an execute bit with executable true, under any umask of the build", () => withBuild(async ({ releaseFile, sha256, out }) => {
  // A restrictive umask would clear the execute bit of an extraction without the header modes.
  const previous = process.umask(0o077);
  try {
    buildRelease({ releaseFile, sha256, version: VERSION, out });
  } finally {
    process.umask(previous);
  }
  const { files } = await dataOf(out);
  assert.deepEqual(files.filter((file) => "executable" in file).map((file) => file.path), [".claude/skills/brainstorming/scripts/run.sh"]);
  assert.equal(files.find((file) => file.path === ".claude/skills/brainstorming/scripts/run.sh").executable, true);
  assert.equal(groupFrom(await dataOf(out)).files.find((file) => file.path === ".claude/skills/brainstorming/scripts/run.sh").executable, true);
}, (top) => chmodSync(join(top, "skills", "brainstorming", "scripts", "run.sh"), 0o755)));

test("a file whose upstream header mode has no execute bit gets no executable member", () => withBuild(async ({ releaseFile, sha256, out }) => {
  buildRelease({ releaseFile, sha256, version: VERSION, out });
  const { files } = await dataOf(out);
  assert.equal(files.some((file) => "executable" in file), false);
}, (top) => chmodSync(join(top, "skills", "brainstorming", "scripts", "run.sh"), 0o644)));
