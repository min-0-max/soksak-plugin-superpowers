# Changelog

[한국어](CHANGELOG.ko.md)

- S1: The plugin declares its manifest: `dependencies` names `@soksak/plugin-agents`, and `contributes` holds one item of `agents.makers` with `range` and `module`. The plugin declares no surface, sections, sidebars or data. `test/manifest-shape.test.mjs` checks the members of `plugin.json` and `package.json` with literal expectations. `engines.soksak` is `^0.0.46`, the core version whose specification defines `contributes`. The version is 0.0.0, because no release is made yet.
