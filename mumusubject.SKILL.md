---
name: mumusubject-pixel-rpg
description: 초등학생 전 교과 교육용 JRPG 개발 스킬. 지브리풍 배경 + 성검전설3 픽셀 오브젝트 + 토토로 분위기로 "놀이처럼 배우는" 게임 제작. 수학/국어/사회/과학/영어/음악/미술/체육/도덕/실과 교과별 맵과 퀘스트 개발에 특화.
---

# 🎮 mumusubject Pixel RPG — 스킬 개요

## 이 스킬의 철학

> **교육이 놀이가 되는 JRPG**

세 가지 레이어가 하나의 교육 세계를 만든다:

```
[ 나노바나나2 배경 ]  ← 지브리 수채화 일러스트 (교과별 세계관)
        +
[ 128x128 픽셀 오브젝트 ]  ← 성검전설3 방식 (캐릭터, NPC, 몬스터)
        +
[ 토토로 분위기 오버레이 ]  ← 먼지, 빛, 따뜻함 (학습 몰입감)
        ↓
   초등학생 전 교과 교육용 JRPG
```

---

## 핵심 스펙 (mumusubject 최적화)

| 항목 | 값 | 이유 |
|------|-----|------|
| 오브젝트 타일 | **128x128px** | 성검전설 방식 + 지브리 디테일 충분 |
| 렌더 scale | `PX = 4` | 실제 512x512 표시 (초등학생 시력 고려) |
| 씬 캔버스 | W=384, H=216 | 16:9, 실제 1536x864 |
| 배경 | 나노바나나2 생성 이미지 | 수채화 지브리풍 (따뜻한 학습 환경) |
| 노이즈 | 0.03~0.06 | 따뜻한 색조만 (차가운 느낌 배제) |
| 그림자 | #1a1428 (보라) | 검정 절대 금지 (지브리 스타일) |
| image-rendering | pixelated 필수 | |
| 타겟 연령 | 초등 1~6학년 | 직관적 UI, 명확한 색 구분 |

---

## 교과별 세계관 설정

### 수학 세계관
```
맵: "숫자 마법사의 탑"
배경: 나노바나나2 "마법사의 탑, 따뜻한 분위기, 숫자 기호 장식"
NPC: 수학 마법사 (지혜로운 할아버지)
몬스터: 숫자 몬스터 (1~9), 도형 몬스터 (삼각형, 사각형, 원)
퀘스트: 사칙연산 처치, 도형 미로 탈출, 측정 미션
```

### 국어 세계관
```
맵: "이야기 숲"
배경: 나노바나나2 "숲 속 도서관, 책장 나무, 따뜻한 햇살"
NPC: 책장 지기 (친근한 도서관 사서)
몬스터: 단어 몬스터, 문장 몬스터
퀘스트: 단어 맞추기, 문장 만들기, 이야기 쓰기
```

### 과학 세계관
```
맵: "발명가의 작업실"
배경: 나노바나나2 "과학 실험실, 나무 책상, 약병 진열대"
NPC: 발명가 할아버지
몬스터: 원소 몬스터, 식물 몬스터
퀘스트: 실험 도우미, 식물 키우기, 물질 변화 관찰
```

---

## 레이어 시스템 (교육용 최적화)

```
Layer 0: 나노바나나2 배경 이미지
         → 교과별 세계관 배경

Layer 1: 바닥/지면 (픽셀)
         → 나무마루, 돌바닥, 흙길, 교실 바닥

Layer 2: 배경 오브젝트 (픽셀 128x128)
         → 선반, 나무, 책장, 실험 도구 등

Layer 3: 빛 효과 (Canvas globalAlpha)
         → 창문 역광, 등불 글로우, 실험실 빛

Layer 4: 캐릭터/NPC (픽셀)
         → 학년별 플레이어, 교사 NPC, 친구 NPC

Layer 5: 전경 오브젝트 (픽셀)
         → 교과 도구, 퀘스트 아이템, 상호작용 오브젝트

Layer 6: 파티클 (토토로 분위기)
         → 먼지 (빛 속에서만), 나비, 반딧불이
         → 학습 보상 파티클 (별, 하트)

Layer 7: 몽환 오버레이
         → rgba(255,240,180,0.04) 앰버 (따뜻함)
         → 비네팅 (집중력 향상)
```

---

## 학년별 난이도 & 디자인

### 1~2학년 (기초)
- 캐릭터: 귀여운 동물 귀 (토토로 느낌)
- 색상: 밝고 선명한 색 (빨강, 노랑, 파랑)
- 퀘스트: 단순 터치, 드래그
- UI: 큰 아이콘, 명확한 피드백

### 3~4학년 (중급)
- 캐릭터: 모험가 복장
- 색상: 자연색 중심 (초록, 갈색)
- 퀘스트: 퍼즐, 미니게임
- UI: 퀘스트 로그, 인벤토리

### 5~6학년 (고급)
- 캐릭터: 전문가 복장
- 색상: 세련된 색 (보라, 회색)
- 퀘스트: 전략적 선택, 협동
- UI: 복잡한 메뉴, 통계

---

## 표준 컴포넌트 구조 (Phaser.js + Canvas)

```javascript
import Phaser from 'phaser';

const PX = 4;
const W = 384, H = 216;

// ── 헬퍼 함수 (항상 포함) ──
const px    = (ctx,x,y,c)     => { ctx.fillStyle=c; ctx.fillRect(x*PX,y*PX,PX,PX); };
const rect  = (ctx,x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(x*PX,y*PX,w*PX,h*PX); };
const dither= (ctx,x,y,cA,cB) => {
  [[cA,cB],[cB,cA]].forEach((row,dy)=>row.forEach((c,dx)=>{
    ctx.fillStyle=c; ctx.fillRect((x+dx)*PX,(y+dy)*PX,PX,PX);
  }));
};

// 노이즈: 따뜻한 앰버/보라만 사용
const noise = (ctx,x,y,w,h,i=0.04) => {
  for(let ny=0;ny<h;ny++) for(let nx=0;nx<w;nx++){
    if(Math.random()<i){
      const b=Math.random()<0.5?16:-12;
      ctx.fillStyle=b>0
        ?`rgba(255,240,200,${b/255})`   // 따뜻한 앰버
        :`rgba(10,6,20,${Math.abs(b)/255})`; // 보라 어둠
      ctx.fillRect((x+nx)*PX,(y+ny)*PX,PX,PX);
    }
  }
};

// 발광 (약병, 등불, 학습 보상)
const glow = (ctx,cx,cy,r,col,alpha) => {
  for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
    const d=Math.sqrt(dx*dx+dy*dy);
    if(d>r) continue;
    ctx.fillStyle=`${col}${alpha*(1-d/r)})`;
    ctx.fillRect((cx+dx)*PX,(cy+dy)*PX,PX,PX);
  }
};

// 보라 그림자 타원
const shadow = (ctx,cx,y,r=5,a=0.3) => {
  ctx.fillStyle='#1a1428'; ctx.globalAlpha=a;
  for(let i=-r;i<=r;i++){
    const t=Math.abs(i)<r*0.5?3:Math.abs(i)<r*0.8?2:1;
    ctx.fillRect((cx+i)*PX,y*PX,PX,t*PX);
  }
  ctx.globalAlpha=1;
};

// 스프라이트맵 드로잉 (성검전설3 방식)
const sprite = (ctx,map,colors,ox,oy) => {
  map.forEach((row,y)=>row.forEach((cell,x)=>{
    if(cell&&colors[cell]){
      ctx.fillStyle=colors[cell];
      ctx.fillRect((x+ox)*PX,(y+oy)*PX,PX,PX);
    }
  }));
};

export default class MathScene extends Phaser.Scene {
  constructor() {
    super('MathScene');
  }

  preload() {
    // 나노바나나2 배경 이미지 로드
    this.load.image('math-bg', '/assets/maps/math-tower.jpg');
    // 픽셀 오브젝트 로드
    this.load.json('math-objects', '/assets/objects/math-objects.json');
  }

  create() {
    // 배경 설정
    const bg = this.add.image(0, 0, 'math-bg').setOrigin(0);
    bg.setScale(1536/1920); // 나노바나나2 이미지 스케일 조정

    // 픽셀 캔버스 오버레이
    this.pixelCanvas = this.add.graphics();
    this.pixelCanvas.setDepth(10);

    // 토토로 분위기 파티클
    this.createParticles();

    // 수학 몬스터 생성
    this.createMathMonsters();
  }

  createParticles() {
    // 먼지 파티클 (빛 속에서만)
    for(let i=0; i<50; i++) {
      const x = Math.random() * 1536;
      const y = Math.random() * 864;
      // 빛 영역에만 먼지 생성 로직
    }
  }

  createMathMonsters() {
    // 숫자 몬스터, 도형 몬스터 생성
    // 128x128 픽셀 오브젝트 사용
  }
}
```

---

## 교과별 오브젝트 라이브러리

### 수학 오브젝트
```javascript
const MATH_OBJECTS = {
  numberMonster1: {
    width: 24, height: 32,
    colors: {
      '1': '#801818', // 빨강 숫자
      '2': '#2a9030', // 초록 숫자
      // ... 더 많은 색상
    },
    spriteMap: [
      // 24x32 숫자 몬스터 스프라이트맵
    ]
  },
  triangleMonster: {
    width: 28, height: 24,
    colors: {
      'T': '#c03030', // 삼각형 빨강
      'E': '#e85050', // 삼각형 가장자리
    },
    spriteMap: [
      // 삼각형 몬스터 스프라이트맵
    ]
  }
};
```

### 국어 오브젝트
```javascript
const KOREAN_OBJECTS = {
  wordBook: {
    width: 16, height: 20,
    colors: {
      'B': '#4a2e18', // 책갈피 갈색
      'P': '#c8a870', // 종이색
    },
    spriteMap: [
      // 단어 책 스프라이트맵
    ]
  }
};
```

---

## 퀘스트 시스템 디자인

### 개인 퀘스트
- **수학**: "더하기 몬스터 5마리 처치"
- **국어**: "단어 맞추기 퍼즐"
- **과학**: "식물 물주기 미션"

### 협동 퀘스트
- **수학**: "클래스 도형 퍼즐" (4명이 각자 도형 맞추기)
- **국어**: "이야기 함께 쓰기"
- **과학**: "실험실 정리하기"

### 클래스 퀘스트
- **수학**: "학교 숫자 타워 건설"
- **국어**: "학급 이야기책 만들기"
- **과학**: "학교 정원 가꾸기"

---

## UI/UX 원칙 (초등학생 최적화)

### 색상 사용
- **학습 요소**: 형광색 (약병처럼) - 빨강, 초록, 파랑, 노랑
- **배경**: 따뜻한 자연색 - 갈색, 초록, 베이지
- **경고**: 부드러운 주황 (절대 빨강 경고 금지)

### 인터랙션
- **터치**: 큰 히트박스 (64x64 최소)
- **피드백**: 즉각적 애니메이션 + 소리
- **진행률**: 별, 하트, 꽃으로 시각화

### 텍스트
- **폰트**: 둥근 글씨 (Arial Rounded MT)
- **크기**: 최소 24px
- **색상**: 검정 텍스트 + 흰색 윤곽선

---

## 개발 워크플로우

### 1. 맵 디자인
1. 나노바나나2로 배경 생성
2. Tiled Map Editor로 타일맵 구성
3. 픽셀 오브젝트 배치

### 2. 오브젝트 제작
1. 128x128 스프라이트맵 설계
2. 색상 팔레트 적용
3. 애니메이션 프레임 추가

### 3. 퀘스트 구현
1. 학습 목표 정의
2. 게임 메커닉 설계
3. 보상 시스템 구현

### 4. 멀티플레이어 통합
1. Socket.io 이벤트 설계
2. 실시간 동기화 구현
3. 협동 로직 추가

---

## 퀄리티 체크리스트

### 그래픽
- [ ] 지브리풍 따뜻한 색감
- [ ] 128x128 오브젝트 선명도
- [ ] 토토로 분위기 파티클
- [ ] 초등학생 시력에 맞는 크기

### 교육성
- [ ] 교과 내용 정확성
- [ ] 난이도 학년별 적절성
- [ ] 학습 목표 명확성
- [ ] 재미와 교육 균형

### 기술
- [ ] Phaser.js 최적화
- [ ] Socket.io 안정성
- [ ] 모바일 호환성
- [ ] 로딩 속도

---

## 참고 리소스

- **SKILLS.md**: 오브젝트 제작 가이드
- **CLAUDE.md**: 프로젝트 개요
- **ghibli-pixel-world.skill**: 원본 스킬 파일
- **나노바나나2**: 배경 이미지 생성
- **Tiled Map Editor**: 타일맵 구성

---

**이 스킬은 mumusubject 프로젝트의 모든 픽셀 그래픽, 맵 디자인, 퀘스트 개발에 적용됩니다.**