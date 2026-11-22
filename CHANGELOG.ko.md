# 변경 기록

[English](CHANGELOG.md)

- S5: release build가 obra/superpowers `v7.0.2`를 고정하고(`release/upstream.json`, codeload tarball의 sha256), data module `group/files.js`를 써요. 이 module은 skill 폴더, agent `superpowers`(주 skill 파일), upstream 경로의 Claude plugin 파일을 담아요. `group/superpowers.LICENSE`도 써요. `group()`은 module을 import해서 `files`를 반환해요. `folders`는 upstream 경로를 나열해요. 테스트: `test/release-build.test.mjs`(7개), `test/group-shape.test.mjs`, `test/manifest-shape.test.mjs`. Red: build script와 `groupFrom`이 없었어요.
- S3: Plugin이 `group/superpowers.js`에서 superpowers group을 내보낸다. `group()`은 agents.makers interface의 group 객체를 반환한다. 교정한 plugin 폴더, CLI는 claude만, agent 정의 없음, 스킬 폴더, `.superpowers/` 프로젝트 폴더, plan, spec, worktree 위치 규칙을 담는다. `agents.makers` item은 `id`와 `name`을 담고, `package.json`은 module을 배포한다. `test/group-shape.test.mjs`가 각 멤버를 리터럴 기대값으로 검사한다.
- S4: `agents.makers` item의 range는 `^0.0.1`이다. agents plugin이 선언한 point의 version이다. `test/manifest-shape.test.mjs`가 range를 리터럴 기대값으로 검사한다.
- S1: Plugin이 manifest를 선언한다. `dependencies`는 `@soksak/plugin-agents`를 가리키고, `contributes`는 `agents.makers`의 item 하나(`range`, `module`)를 가진다. Plugin은 surface, sections, sidebars, data를 선언하지 않는다. `test/manifest-shape.test.mjs`가 `plugin.json`과 `package.json`의 멤버를 리터럴 기대값으로 검사한다. `engines.soksak`은 `^0.0.46`이고, `contributes`를 정의하는 spec이 있는 core 버전이다. 아직 release를 만들지 않아서 버전은 0.0.0이다.
