// The superpowers group of the agents.makers interface (agents docs/spec/makers.md).
// The maker copies its upstream files at its own installation into the group folder; the paths below are relative to that folder.

// group returns the group object. superpowers changes no upstream file (club.md: the maker only states output locations in the rules).
export function group() {
  return {
    id: "superpowers",
    name: "Superpowers",
    // The corrected plugin folder: the upstream plugin, unchanged, which the agent CLI loads with its plugin directory option.
    plugin: "plugin",
    // The SessionStart hook of the plugin needs claude, so the group runs claude only.
    clis: ["claude"],
    // The upstream plugin defines no agent definitions of its own for this group.
    agents: [],
    // The skill folder of the upstream plugin, which holds one folder per skill.
    skills: ["skills"],
    variables: {},
    path: [],
    folders: [".superpowers/"],
    rules: [
      "Write plans to .superpowers/plans/ and specs to .superpowers/specs/.",
      "Create git worktrees in .superpowers/worktrees/.",
      "Do not write to docs/superpowers/ or .worktrees/; the project does not use these folders for this group.",
    ],
  };
}
