---
description: mumusubject 게임 오브젝트 이미지 생성 — Gemini API로 생성 후 배경제거/리사이징/프레임분리/배치까지 자동화
argument-hint: [오브젝트 설명] (예: "수학 마법사 NPC 할아버지")
---

mumusubject JRPG 게임에 들어갈 오브젝트 이미지를 생성한다.
$ARGUMENTS가 있으면 해당 오브젝트를 만들고, 없으면 현재 게임 맥락을 분석해서 필요한 오브젝트를 먼저 제안한다.

---

## 게임 스펙 (항상 준수)

| 항목 | 값 |
|------|-----|
| 스타일 | 지브리풍 수채화, 따뜻한 파스텔 톤 |
| 시점 | 탑뷰 (top-down) |
| 캐릭터/NPC | 128x128px, 투명 배경 PNG |
| 몬스터 (대) | 128x128px |
| 몬스터 (소) | 64x64px |
| 아이템 | 64x64px |
| 그림자색 | #1a1428 보라 (검정 절대 금지) |
| 외곽선 | 명확한 검정 or 진한 윤곽선 |
| 분위기 | 초등학생 친화적, 따뜻하고 귀엽게 |

---

## 오브젝트 타입별 모드

| 타입 | 생성 모드 | 이미지 스타일 | 설명 |
|------|-----------|--------------|------|
| character | 스프라이트시트 | **픽셀아트** | 4방향 × 4프레임 (512x512) |
| npc | 스프라이트시트 | **픽셀아트** | 4방향 × 4프레임 (512x512) |
| monster | 스프라이트시트 | **픽셀아트** | 4방향 × 4프레임 (512x512) |
| item | 단일 이미지 | **픽셀아트** | 128x128 아이콘 1장 |

**항상 `--pixel` 플래그를 사용한다.** 픽셀아트만이 실제 게임 맵에 배치 가능한 스프라이트다.
지브리풍 일러스트 스타일은 배경 맵 전용이며 오브젝트로 사용하지 않는다.

---

## 실행 단계

### STEP 1 — 오브젝트 계획

$ARGUMENTS가 있으면 해당 설명을 바탕으로 오브젝트를 1개 계획한다.
$ARGUMENTS가 없으면:
- `client/src/scenes/` 와 `SKILLS.md` 를 읽어 현재 개발 중인 씬을 파악한다
- 해당 씬에 필요한 오브젝트 목록을 3~5개 제안한다
- 사용자에게 어떤 것을 먼저 만들지 선택하게 한다

각 오브젝트에 대해 결정한다:
- 이름 (영문 파일명용, 예: `math-wizard-npc`)
- 타입 (character / npc / monster / item)
- 스프라이트시트 여부 (item 제외 모두 스프라이트시트)
- 배치 경로 (예: `client/src/assets/characters/math-wizard-npc.png`)
- 해당 씬에서의 역할

**여러 장 생성 시 일관성 확인 (필수):**
생성할 이미지가 2장 이상이면 반드시 먼저 묻는다:
> "동일 인물인가요?"
- **예** → 첫 번째 이미지 프롬프트에서 캐릭터 외형 묘사(머리색, 눈, 체형, 복장 특징)를 추출해 `[CHARACTER_BASE]`로 저장하고, 이후 모든 이미지 프롬프트 앞에 아래 고정 텍스트를 추가한다:
  ```
  Same character as base: [CHARACTER_BASE]. Only outfit/color scheme changes between versions.
  ```
- **아니요** → 각 이미지를 독립적으로 생성한다.

사용자에게 계획을 보여주고 확인을 한 번 받는다. 확인 후에는 STEP 7까지 중단 없이 자동으로 진행한다.

---

### STEP 2 — Gemini 프롬프트 작성

확인 후 아래 규칙으로 영문 프롬프트를 작성한다.

**프롬프트 필수 포함 요소:**
- 캐릭터/오브젝트 상세 묘사 (외형, 색상, 표정, 복장)
- `top-down view` (탑뷰 명시)
- `Studio Ghibli style, soft watercolor illustration`
- `warm pastel colors, clean outline`
- `transparent background, PNG`
- `child-friendly, cute`
- 교과 세계관 반영 (수학 맵이면 수학 관련 요소 포함)
- 스프라이트시트 모드일 때: 그리드/방향/프레임 정보는 스크립트가 자동 추가하므로 캐릭터 묘사만 작성

작성한 프롬프트를 사용자에게 보여주고 수정사항이 있는지 확인한다.

---

### STEP 3 — 이미지 생성

Gemini API 키를 확인한다:
- 환경변수 확인: `echo $GEMINI_API_KEY`
- 없으면 사용자에게 요청: "Gemini API 키를 알려주세요 (Google AI Studio에서 발급)"

**아이템 (단일 이미지):**
```bash
node --input-type=module scripts/gemini-generate.js \
  --prompt "[작성한 프롬프트]" \
  --name "[name]" \
  --key "[API_KEY]"
```

**캐릭터/NPC/몬스터 (스프라이트시트):**
```bash
node --input-type=module scripts/gemini-generate.js \
  --prompt "[작성한 프롬프트]" \
  --name "[name]" \
  --spritesheet \
  --dirs 4 \
  --frames 4 \
  --key "[API_KEY]"
```

생성 실패 시 오류 원인을 분석하고 프롬프트를 수정해서 재시도한다 (최대 2회).

---

### STEP 4 — 생성 확인 후 자동 진행

생성 성공 후 이미지 경로를 알리고 바로 STEP 5로 진행한다: `scripts/temp/[name].png`
사용자 승인을 기다리지 않는다.

---

### STEP 5 — 배경 제거 & 리사이징

승인 후:

**아이템:**
```bash
node --input-type=module scripts/resize-asset.js \
  --input "scripts/temp/[name].png" \
  --name "[name]" \
  --type item \
  --dest "client/src/assets/items/[name].png"
```

**캐릭터/NPC/몬스터 (스프라이트시트):**
```bash
node --input-type=module scripts/resize-asset.js \
  --input "scripts/temp/[name].png" \
  --name "[name]" \
  --type character \
  --dest "scripts/temp/[name]_resized.png"
```

배경 제거가 자동으로 실행된다 (코너 픽셀 기준). 결과를 사용자에게 알린다.
배경 제거가 부자연스러우면 `--threshold` 값을 조정해서 재시도한다 (기본 30, 낮추면 더 정밀).

---

### STEP 6 — 프레임 분리 (스프라이트시트만)

아이템은 이 단계를 건너뛴다.

```bash
node --input-type=module scripts/split-spritesheet.js \
  --input "scripts/temp/[name]_resized.png" \
  --name "[name]" \
  --dirs 4 \
  --frames 4 \
  --dest "client/src/assets/characters/[name]-frames"
```

분리 완료 후 Phaser 코드를 출력한다. 사용자에게 분리된 프레임 폴더 경로를 알린다.

---

### STEP 7 — 배치 & Phaser 코드 안내

확인 없이 바로 최종 배치 경로에 저장한다.

배치 완료 후 해당 씬에 추가해야 할 Phaser 코드를 안내한다:

**아이템:**
```javascript
// preload()
this.load.image('[name]', '/assets/items/[name].png');
```

**스프라이트시트:**
```javascript
// preload()
this.load.spritesheet('[name]', '/assets/characters/[name].png', {
  frameWidth: 128, frameHeight: 128
});

// create() — 애니메이션 등록
this.anims.create({ key: '[name]-walk-down',  frames: this.anims.generateFrameNumbers('[name]', { start: 0,  end: 3  }), frameRate: 8, repeat: -1 });
this.anims.create({ key: '[name]-walk-left',  frames: this.anims.generateFrameNumbers('[name]', { start: 4,  end: 7  }), frameRate: 8, repeat: -1 });
this.anims.create({ key: '[name]-walk-right', frames: this.anims.generateFrameNumbers('[name]', { start: 8,  end: 11 }), frameRate: 8, repeat: -1 });
this.anims.create({ key: '[name]-walk-up',    frames: this.anims.generateFrameNumbers('[name]', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });
```

---

## 이력 관리

생성할 때마다 `scripts/temp/log.json`에 자동 기록된다:
- 생성 일시
- 오브젝트 이름 및 타입
- 사용한 프롬프트 (원본 + 최종)
- 출력 파일 경로

비슷한 오브젝트를 다시 만들 때 log.json을 참고해서 프롬프트를 재활용한다.

---

## 주의사항

- 사용자 확인은 STEP 1 계획 단계에서 딱 1회만 받는다. 이후는 자동 진행한다
- 여러 장 생성 시 반드시 "동일 인물인가요?" 를 먼저 묻고, 동일 인물이면 CHARACTER_BASE를 고정해서 일관성을 유지한다
- API 키는 코드에 하드코딩하지 않는다 (환경변수 사용)
- 생성 원본은 `scripts/temp/`에 보관, 최종 파일만 assets에 배치
- 한 번에 1개 오브젝트씩 처리한다
- 재생성 시 기존 프롬프트를 log.json에서 불러와 수정한다
- node 실행 시 `--input-type=module` 플래그를 사용하지 않는다 (오류 발생)
