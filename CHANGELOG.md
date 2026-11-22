# Changelog

[한국어](CHANGELOG.ko.md)

- S3: The plugin exports the superpowers group from `group/superpowers.js`. `group()` returns the group object of the agents.makers interface: the corrected plugin folder, claude as the only CLI, no agent definitions, the skill folder, the `.superpowers/` project folder and the location rules for plans, specs and worktrees. The `agents.makers` item states `id` and `name`, and `package.json` ships the module. `test/group-shape.test.mjs` checks each member with literal expectations.
- S4: The `agents.makers` item states the range `^0.0.1`, the version of the point that the agents plugin declares. `test/manifest-shape.test.mjs` checks the range with a literal expectation.
- S1: The plugin declares its manifest: `dependencies` names `@soksak/plugin-agents`, and `contributes` holds one item of `agents.makers` with `range` and `module`. The plugin declares no surface, sections, sidebars or data. `test/manifest-shape.test.mjs` checks the members of `plugin.json` and `package.json` with literal expectations. `engines.soksak` is `^0.0.46`, the core version whose specification defines `contributes`. The version is 0.0.0, because no release is made yet.
