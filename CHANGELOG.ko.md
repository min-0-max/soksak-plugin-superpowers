# 변경 기록

[English](CHANGELOG.md)

- S4: `agents.makers` item의 range는 `^0.0.1`이다. agents plugin이 선언한 point의 version이다. `test/manifest-shape.test.mjs`가 range를 리터럴 기대값으로 검사한다.
- S1: Plugin이 manifest를 선언한다. `dependencies`는 `@soksak/plugin-agents`를 가리키고, `contributes`는 `agents.makers`의 item 하나(`range`, `module`)를 가진다. Plugin은 surface, sections, sidebars, data를 선언하지 않는다. `test/manifest-shape.test.mjs`가 `plugin.json`과 `package.json`의 멤버를 리터럴 기대값으로 검사한다. `engines.soksak`은 `^0.0.46`이고, `contributes`를 정의하는 spec이 있는 core 버전이다. 아직 release를 만들지 않아서 버전은 0.0.0이다.
