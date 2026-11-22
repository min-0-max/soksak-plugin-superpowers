# Superpowers plugin

[English](README.md)

Superpowers plugin: `agents` plugin에 superpowers 메이커 group을 기여한다. Plugin에는 surface가 없다. Plugin 형식은 soksak core spec(`docs/spec/plugins.md`)이 정한다.

```sh
make install                                # 한 번: 고정된 dependency
make test                                   # 이 plugin의 test
make build                                  # 고정된 release의 group/files.js
make check                                  # 고정된 kit release의 document와 command 검사
make pack OUT=<folder>                      # plugin release
```

`make check`는 `package.json`이 pin한 kit의 검사를 실행한다. application은 release를 설치할 때 `plugin.json`을 검증한다.

Checklist는 [docs/features.md](docs/features.md)다.
