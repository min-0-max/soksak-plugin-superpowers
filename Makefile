# superpowers plugin repository: the install, test, check and pack targets (docs/features.md).
.PHONY: install test build check pack

# install acquires the locked dependencies; test, check and pack consume them without installing.
install:
	pnpm install --frozen-lockfile

# test runs this plugin's tests only.
test:
	pnpm test

# build writes group/files.js and group/superpowers.LICENSE from the release pinned in release/upstream.json (it fetches the release file when none is given).
build:
	pnpm run release

# check runs the document and command checks of the kit release that package.json pins.
check:
	pnpm exec sok-check docs
	pnpm exec sok-check commands

# pack writes the plugin release with pnpm pack.
pack: check build
	@test -n "$(OUT)" || { echo "make pack OUT=<folder>" >&2; exit 2; }
	pnpm pack --pack-destination $(OUT)
