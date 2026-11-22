# 기능

- [o] S1 — P1: Manifest와 contribution. `plugin.json`은 id `superpowers`, `@soksak/plugin-agents`에 대한 dependency, extension point `agents.makers`의 item 하나(`range`, `module`)를 선언하고, surface, sections, sidebars, data는 선언하지 않는다. 입력: core `docs/spec/plugins.md`의 `plugin.json` 표와 agent workspace plan의 메이커 plugin 규칙. 기대: `plugin.json`에는 `id`, `name`, `description`, `dependencies`, `contributes` 멤버만 있고, `test/manifest-shape.test.mjs`가 각 멤버를 리터럴 기대값으로 검사한다. 진행: manifest, `package.json`, `Makefile`, test가 준비되었고 `pnpm test`가 9개 중 9개 통과한다. `range`는 `^0.0.1`이다(S4).
- [-] S2 — P2: superpowers plugin 폴더의 설치 때 교정. Closed: club.md states that the superpowers plugin folder runs unchanged; the maker contributes it as it is.
- [o] S4 — P2: `agents.makers` item의 range는 `^0.0.1`이다. `agents` plugin이 `extends`에서 point를 version 0.0.1로 선언하고, `test/manifest-shape.test.mjs`가 range를 리터럴 기대값으로 검사한다. 진행: `pnpm test`가 10개 중 10개 통과한다.
- [ ] S3 — P2: Group module. `contributes`가 가리키는 module `group/superpowers.js`가 superpowers group을 내보낸다. 내용은 plugin 폴더, agent 정의, 스킬, 실행 변수, `.superpowers/` 프로젝트 폴더와 그 위치 규칙이다. 대기 조건: agents A9, `agents` plugin이 발행하는 `agents.makers` interface export.
