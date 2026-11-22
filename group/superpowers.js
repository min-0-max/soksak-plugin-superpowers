// The superpowers group of the agents.makers interface (agents docs/spec/makers.md). The agents plugin imports this module
// and calls group() for each connected item. The release build writes group/files.js, a data module with the skill folders,
// the agent and the files of the skill folders of the pinned obra/superpowers release, each with its project path under .claude/skills/.
// superpowers changes no upstream file: the release build copies the text as the release holds it.

const DATA_URL = new URL("./files.js", import.meta.url);

// The project folders that the group creates; every file path lies inside one of them (agents docs/spec/makers.md).
const FOLDERS = [".superpowers/", ".claude/skills/"];

// Imports the data module that the release build wrote and returns the group object. A missing module, or one that does
// not match the shape, rejects with an error that names the module and the field.
export async function group() {
  return groupFrom(await import(DATA_URL.href));
}

// Builds the group object from a data module namespace with the members agents, skills and files.
export function groupFrom(data) {
  if (!isObject(data)) fail("module", "must export agents, skills and files");
  const files = checkFiles(data);
  const agents = checkAgents(data, files);
  const skills = checkSkills(data);
  return Object.freeze({
    id: "superpowers",
    name: "Superpowers",
    // The group ships no plugin manifest or hooks, so the plugin folder is the project root.
    plugin: ".",
    // The agent of the group is a claude agent.
    clis: ["claude"],
    agents,
    skills,
    variables: Object.freeze({}),
    path: [],
    folders: [...FOLDERS],
    rules: [
      "Write plans to .superpowers/plans/ and specs to .superpowers/specs/.",
      "Create git worktrees in .superpowers/worktrees/.",
      "Do not write to docs/superpowers/ or .worktrees/; the project does not use these folders for this group.",
    ],
    files,
  });
}

function fail(field, reason) {
  throw new Error(`group/files.js: ${field} ${reason}`);
}

// Each entry holds a project path inside a folder of FOLDERS and the text of the file; a path is unique.
function checkFiles(data) {
  if (!Array.isArray(data.files)) fail("files", "must be an array");
  const seen = new Set();
  return data.files.map((file, i) => {
    const field = `files[${i}]`;
    if (!isObject(file)) fail(field, "must be an object");
    if (typeof file.path !== "string" || !FOLDERS.some((folder) => file.path.startsWith(folder)) || !hasPlainSegments(file.path)) {
      fail(`${field}.path`, `${String(file.path)} is not a relative path inside ${FOLDERS.join(" or ")}`);
    }
    if (seen.has(file.path)) fail(`${field}.path`, `${file.path} repeats an earlier entry`);
    seen.add(file.path);
    if (typeof file.text !== "string") fail(`${field}.text`, "must be a string");
    return { path: file.path, text: file.text };
  });
}

// The agent path names an entry of files; the agent is claude, as the group runs claude only.
function checkAgents(data, files) {
  if (!Array.isArray(data.agents) || data.agents.length === 0) fail("agents", "must be a non-empty array");
  const paths = new Set(files.map((file) => file.path));
  return data.agents.map((agent, i) => {
    const field = `agents[${i}]`;
    if (!isObject(agent)) fail(field, "must be an object");
    if (typeof agent.name !== "string" || agent.name === "") fail(`${field}.name`, "must be a non-empty string");
    if (typeof agent.path !== "string" || !paths.has(agent.path)) fail(`${field}.path`, `${String(agent.path)} names no entry of files`);
    if (agent.cli !== "claude") fail(`${field}.cli`, "must be claude");
    return { name: agent.name, path: agent.path, cli: agent.cli };
  });
}

function checkSkills(data) {
  if (!Array.isArray(data.skills)) fail("skills", "must be an array");
  return data.skills.map((skill, i) => {
    if (typeof skill !== "string" || !skill.startsWith(".claude/skills/") || skill.length <= ".claude/skills/".length || !hasPlainSegments(skill)) {
      fail(`skills[${i}]`, "must be a project folder under .claude/skills/");
    }
    return skill;
  });
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// A path is relative, has no empty, . or .. segment and no leading slash.
function hasPlainSegments(value) {
  return !value.startsWith("/") && value.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}
