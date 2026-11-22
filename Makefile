# superpowers plugin repository: the install, test, check and pack targets (docs/features.md).
.PHONY: install test check pack

# install acquires the locked dependencies; test, check and pack consume them without installing.
install:
	pnpm install --frozen-lockfile

# test runs this plugin's tests only.
test:
	pnpm test

# check runs the document and command checks of the kit release that package.json pins.
check:
	pnpm exec sok-check docs
	pnpm exec sok-check commands

# pack writes the plugin release with pnpm pack.
pack: check
	@test -n "$(OUT)" || { echo "make pack OUT=<folder>" >&2; exit 2; }
	pnpm pack --pack-destination $(OUT)
