#!/usr/bin/env node
// Builds the generated files of the superpowers group from the obra/superpowers release pinned in release/upstream.json:
//   group/superpowers.js        the contributed module: the constant DATA with the skill folders (.claude/skills/<name> with
//                               SKILL.md), the agent (the main skill file) and every file of those folders with its project
//                               path and text, then the text of src/group.js, then group(). Core grants the page of the
//                               providing plugin only this file (core docs/spec/plugins.md), so the module imports nothing.
//   group/superpowers.LICENSE   the LICENSE of the release
// The skill folders of the release are skills/<name>, and the project copy lies under .claude/skills/, where Claude Code reads
// project skills. The plugin manifest and the hooks are a Claude Code plugin install concern, so they are not project files.
// The release file must equal its sha256 pin before anything is extracted or written. The build reads no other network address.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The project folder of each upstream skill folder, and the agent: the main skill file of the using-superpowers skill.
const SKILL_FOLDER = ".claude/skills";
const AGENT_FILE = `${SKILL_FOLDER}/using-superpowers/SKILL.md`;

// listFiles returns the paths of the files under folder, relative to it, with a slash between the parts.
function listFiles(folder, prefix = "") {
  return readdirSync(join(folder, prefix), { withFileTypes: true }).flatMap((entry) => {
    const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    return entry.isDirectory() ? listFiles(folder, path) : [path];
  });
}

// readText returns the UTF-8 text of a file; a file that is not UTF-8 text is an error that names it.
function readText(path, file) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path));
  } catch {
    throw new Error(`${file} is not UTF-8 text`);
  }
}

// buildRelease checks the release file and writes group/superpowers.js and group/superpowers.LICENSE under out. Every check runs before the first write.
export function buildRelease({ releaseFile, sha256, version, out }) {
  if (typeof version !== "string" || version === "") throw new Error("buildRelease requires the release version");
  const digest = createHash("sha256").update(readFileSync(releaseFile)).digest("hex");
  if (digest !== sha256) throw new Error(`release file sha256 ${digest} does not match the pinned ${sha256}: ${releaseFile}`);

  const work = mkdtempSync(join(tmpdir(), "superpowers-release-"));
  try {
    // -p restores the header modes exactly. Without it, the umask of the build clears the execute bit of an upstream file.
    execFileSync("tar", ["-xzpf", releaseFile, "-C", work]);
    const top = readdirSync(work);
    if (top.length !== 1) throw new Error(`release file must hold one top folder, found: ${top.join(", ")}`);
    const source = join(work, top[0]);

    const license = join(source, "LICENSE");
    if (!existsSync(license)) throw new Error(`release file holds no LICENSE at its top: ${releaseFile}`);

    const files = [];
    const skillSource = join(source, "skills");
    const skills = readdirSync(skillSource, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(skillSource, entry.name, "SKILL.md")))
      .map((entry) => entry.name)
      .sort();
    if (!skills.includes("using-superpowers")) throw new Error(`release file holds no skills/using-superpowers/SKILL.md`);
    for (const name of skills) {
      for (const file of listFiles(join(skillSource, name)).sort()) {
        const upstream = join(skillSource, name, file);
        const entry = { path: `${SKILL_FOLDER}/${name}/${file}`, text: readText(upstream, `skills/${name}/${file}`) };
        // A file whose header mode has an execute bit carries executable true, so the import sets the bit of the project file.
        if ((statSync(upstream).mode & 0o111) !== 0) entry.executable = true;
        files.push(entry);
      }
    }

    const agents = [{ name: "superpowers", path: AGENT_FILE, cli: "claude" }];
    const data = { agents, skills: skills.map((name) => `${SKILL_FOLDER}/${name}`), files };
    const module = `const DATA = ${JSON.stringify(data, null, 2)};\n\n${readFileSync(join(ROOT, "src", "group.js"), "utf8")}\n// Returns the group object of the data that the release build wrote.\nexport async function group() {\n  return groupFrom(DATA);\n}\n`;

    mkdirSync(join(out, "group"), { recursive: true });
    writeFileSync(join(out, "group", "superpowers.js"), module);
    copyFileSync(license, join(out, "group", "superpowers.LICENSE"));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--") || argv[i + 1] === undefined) throw new Error("usage: build-release.mjs [--release-file <file>] [--out <folder>]");
    args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

async function main(argv) {
  const args = parseArgs(argv);
  const pin = JSON.parse(readFileSync(join(ROOT, "release", "upstream.json"), "utf8"));
  let releaseFile = args["release-file"];
  if (!releaseFile) {
    const response = await fetch(pin.url);
    if (!response.ok) throw new Error(`fetch ${pin.url}: HTTP ${response.status}`);
    const folder = mkdtempSync(join(tmpdir(), "superpowers-release-file-"));
    releaseFile = join(folder, basename(pin.url));
    writeFileSync(releaseFile, Buffer.from(await response.arrayBuffer()));
  }
  buildRelease({ releaseFile, sha256: pin.sha256, version: pin.tag, out: args.out ?? ROOT });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
