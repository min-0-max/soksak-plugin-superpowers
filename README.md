# Superpowers plugin

[한국어](README.ko.md)

Superpowers plugin: contributes the superpowers maker group to the `agents` plugin. The plugin has no surface. The plugin format is defined in the soksak core specification (`docs/spec/plugins.md`).

```sh
make install                                # once: the locked dependencies
make test                                   # tests of this plugin
make build                                  # group/files.js from the pinned release
make check                                  # document and command checks of the pinned kit release
make pack OUT=<folder>                      # the plugin release
```

`make check` runs the checks of the kit that `package.json` pins. The application validates `plugin.json` when it installs the release.

The checklist is [docs/features.md](docs/features.md).
