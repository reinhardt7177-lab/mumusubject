// CurlingScene — "영미! 영미!" 컬링 게임
// 세로 링크 | 카메라 줌/팬 | 레디→클로즈업→와이드아웃 | 영미! 이미지
//
// [UI 배치 원리]
// setScrollFactor(0) 오브젝트의 화면 위치:
//   screen_x = (world_x - 400) * zoom + 400
//   screen_y = (world_y - 300) * zoom + 300
// 따라서 줌이 바뀔 때마다 _toUI(sx, sy, zoom)로 world 좌표를 계산해 setPosition + setScale(1/zoom).

import Phaser from 'phaser';

// ── 링크 기하 (세로 배치, 800×600 캔버스 내) ─────────────────
// [Step 7 비율 개선] 좁고 길게 — 폭:길이 1:1.9 → 1:3.0 (실제 컬링 1:9.6에 근접)
const RK = {
  cx:     400,   // 링크 중심 X
  left:   316,   right:  484,   // 폭 168 (256→168, 34% 좁게)
  top:     78,   bottom: 588,   // 높이 510 (HUD 아래로 시작)
  throwX: 400,   throwY: 558,   // 투척 지점 (하단 해크)
  houseCx:400,   houseCy: 138,  // 하우스 중심 (상단 티) — 8px 아래로 이동
  // 링 반지름 — 실제 12ft:8ft:4ft:button = 1:0.667:0.333:0.083 비율 (35% 축소)
  ringBlue: 40,  ringWhite: 27, ringRed: 14, button: 3,
  backY:   94,   // 백 라인 (하우스 뒷가장자리에서 4px 뒤 — 138-40-4)
  hogNear: 440,  // 근거리 호그 라인 (투척 쪽)
  hogFar:  215,  // 원거리 호그 라인 (하우스 쪽)
};

const S = {
  OVERVIEW: 'OVERVIEW',
  AIMING:   'AIMING',
  CHARGING: 'CHARGING',
  SLIDING:  'SLIDING',
  SETTLING: 'SETTLING',
  RESULT:   'RESULT',
};

const STONE_R        = 11;     // [Step 7] 18→11 (비율 개선)
const FRICTION       = 0.0165; // [Step 7] 0.018→0.0165 (투척 거리 9% 늘어남 보정)
const B_POWER        = 8.5;
const MIN_RATIO      = 0.77;
const SWEEP_WIN      = 500;
const TOTAL_ENDS     = 5;
const STONES_PER_END = 4;   // 팀당 4개 → 엔드당 8투

// 뷰포트 센터 (800×600)
const VCX = 400, VCY = 300;

const CAM = {
  wide:  { x: 400, y: 300, zoom: 1.0, dur: 420 },
  throw: { x: RK.throwX, y: RK.throwY - 30, zoom: 2.4, dur: 620 },
  house: { x: RK.houseCx, y: RK.houseCy + 20, zoom: 2.0, dur: 650 },
};

export default class CurlingScene extends Phaser.Scene {
  constructor() { super('CurlingScene'); }

  init(data) { this.returnTo = (data && data.returnTo) || null; }

  // ─── CREATE ───────────────────────────────────────────────
  create() {
    this._gameMode     = 'solo';  // 'solo' | 'duo'
    this._state        = S.OVERVIEW;
    this._endIdx       = 1;
    this._throwIdx     = 0;   // 0~7 per end: 짝수=team1, 홀수=team2(AI or 2P)
    this._playerScore  = 0;
    this._aiScore      = 0;
    this._sweepCount   = 0;
    this._sweepMul     = 1.0;
    this._lastTapAt    = 0;
    this._recentTaps   = [];
    this._aimAngle       = 0;
    this._aimAngleOffset = 0;   // 각도 버튼으로 수동 조정하는 오프셋 (도)
    this._posHeld        = null; // 위치 버튼 홀드: 'left'|'right'|null
    this._angHeld        = null; // 각도 버튼 홀드: 'left'|'right'|null
    this._powerT         = 0;
    this._powerDir       = 1;
    this._endStones      = [];   // 이번 엔드에 정착한 모든 돌 (물리 대상)
    this._playerStones   = [];   // 이번 엔드 플레이어 돌
    this._aiStones       = [];   // 이번 엔드 AI 돌
    this._activeStone    = null;
    this._youngmiSp      = null;
    this._broomSp        = null;
    this._broomTween     = null;
    this._audioCtx       = null;

    this._hasStoneImg  = this.textures.exists('stone-glossy');
    this._hasYoungmiImg= this.textures.exists('youngmi-cheer');
    this._hasIceImg    = this.textures.exists('ice-surface');

    this._buildWorld();
    this._buildHUD();
    this._buildButtons();
    this._setupKeys();

    this.cameras.main.setBounds(0, 0, 800, 600);
    this._camGo(CAM.wide);
    // 타이틀 이미지 있으면 타이틀 → 모드선택, 없으면 바로 모드선택
    if (this.textures.exists('curling-title')) this._enterTitleScreen();
    else this._enterModeSelect();
  }

  // ─── 타이틀 화면 ─────────────────────────────────────────
  _enterTitleScreen() {
    this._state = S.OVERVIEW;
    this._setHUDVisible(false);
    this._readyBtn.setVisible(false);

    const objs = [];
    const cleanup = () => objs.forEach(o => { try { o.destroy(); } catch(e) {} });

    // 어두운 배경 (이미지가 캔버스 비율과 다를 때 가림막)
    objs.push(
      this.add.rectangle(400, 300, 800, 600, 0x000000, 1.0)
        .setDepth(94).setScrollFactor(0)
    );

    // 타이틀 이미지 — 800x600에 맞춰 cover 스케일 (잘림 허용)
    const titleImg = this.add.image(400, 300, 'curling-title')
      .setDepth(95).setScrollFactor(0);
    const tw = titleImg.width, th = titleImg.height;
    const scale = Math.max(800 / tw, 600 / th);
    titleImg.setScale(scale);
    objs.push(titleImg);

    // 비네팅 (가장자리 어둡게)
    const vignette = this.add.graphics().setDepth(96).setScrollFactor(0);
    vignette.fillStyle(0x000000, 0.45);
    vignette.fillRect(0, 0, 800, 60);
    vignette.fillRect(0, 540, 800, 60);
    objs.push(vignette);

    // PRESS START 박스
    const pressBg = this.add.rectangle(400, 510, 280, 56, 0x000000, 0.65)
      .setStrokeStyle(2.5, 0xffdd44, 0.85).setDepth(97).setScrollFactor(0);
    const pressTxt = this.add.text(400, 510, '▶  PRESS  START  ◀', {
      fontSize: '22px', color: '#ffdd44', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(98).setScrollFactor(0);
    const pressHint = this.add.text(400, 552, '아무  키  또는  클릭', {
      fontSize: '11px', color: '#aaccff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(98).setScrollFactor(0);
    objs.push(pressBg, pressTxt, pressHint);

    // 깜빡임 애니메이션
    const blink = this.tweens.add({
      targets: [pressBg, pressTxt],
      alpha: 0.35,
      duration: 600, ease: 'Sine.easeInOut',
      yoyo: true, repeat: -1,
    });

    // 입력 처리 (1회만)
    let triggered = false;
    const goNext = () => {
      if (triggered) return;
      triggered = true;
      blink.stop();
      // 페이드 아웃
      this.tweens.add({
        targets: objs,
        alpha: 0,
        duration: 320, ease: 'Sine.easeIn',
        onComplete: () => { cleanup(); this._enterModeSelect(); },
      });
      // 키/포인터 핸들러 해제
      this.input.keyboard.off('keydown', goNext);
      this.input.off('pointerdown', goNext);
    };
    this.input.keyboard.once('keydown', goNext);
    this.input.once('pointerdown', goNext);
  }

  // ─── UPDATE ───────────────────────────────────────────────
  update(time, delta) {
    const dt = delta / 16.667;
    if (this._state === S.AIMING)   this._updateAim(dt);
    if (this._state === S.CHARGING) this._updateCharge(dt);
    if (this._state === S.SLIDING)  this._updateSliding(dt, time);
    this._updateHUD();
    this._drawMiniMap();
  }

  // ── UI 좌표 변환 (scrollFactor=0 기준) ──────────────────
  // 원하는 화면 위치 (sx, sy)를 zoom에서 보이게 할 world 좌표 반환
  _toUI(sx, sy, zoom) {
    return {
      x: VCX + (sx - VCX) / zoom,
      y: VCY + (sy - VCY) / zoom,
    };
  }

  // ─── 월드 렌더링 ──────────────────────────────────────────
  _buildWorld() {
    // 전체 배경 (짙은 아이스 아레나 색)
    this.add.rectangle(400, 300, 800, 600, 0x04090f).setDepth(-20);

    // ── 사이드 보드 (링크 바깥 영역) ─────────────────────────
    const side = this.add.graphics().setDepth(-12);
    side.fillStyle(0x112244, 0.70);
    side.fillRoundedRect(RK.left - 20, RK.top - 10, (RK.right - RK.left) + 40, (RK.bottom - RK.top) + 20, 20);

    // ── 빙판 본체 ────────────────────────────────────────────
    const ice = this.add.graphics().setDepth(-10);
    // 베이스 밝은 파랑-흰 빙판
    ice.fillStyle(0xcde8f5, 1.0);
    ice.fillRoundedRect(RK.left, RK.top, RK.right - RK.left, RK.bottom - RK.top, 8);

    // ── 존 구분 컬러링 ────────────────────────────────────────
    const zones = this.add.graphics().setDepth(-9);
    // 하우스 주변 (백라인~티라인 영역) — 연한 파란 tint
    zones.fillStyle(0xb8d8f0, 0.55);
    zones.fillRect(RK.left, RK.top, RK.right - RK.left, RK.houseCy - RK.top);
    // 가드 존 (티라인~원거리호그라인) — 연한 청록 tint
    zones.fillStyle(0xc4e8e8, 0.30);
    zones.fillRect(RK.left, RK.houseCy, RK.right - RK.left, RK.hogFar - RK.houseCy);
    // 플레잉 존 (호그라인~해크) — 기본 흰
    zones.fillStyle(0xd8ecf8, 0.18);
    zones.fillRect(RK.left, RK.hogFar, RK.right - RK.left, RK.hogNear - RK.hogFar);

    // ── 페블 시뮬레이션 (세로 트랙 라인) ────────────────────
    const pebble = this.add.graphics().setDepth(-8);
    pebble.lineStyle(0.7, 0xffffff, 0.18);
    for (let x = RK.left + 14; x < RK.right; x += 14) {
      pebble.beginPath();
      pebble.moveTo(x, RK.top + 2); pebble.lineTo(x, RK.bottom - 2);
      pebble.strokePath();
    }
    // 가로 페블 (미세)
    pebble.lineStyle(0.5, 0xffffff, 0.10);
    for (let y = RK.top + 12; y < RK.bottom; y += 22) {
      pebble.beginPath();
      pebble.moveTo(RK.left + 2, y); pebble.lineTo(RK.right - 2, y);
      pebble.strokePath();
    }

    // ── 광택 하이라이트 ──────────────────────────────────────
    const gloss = this.add.graphics().setDepth(-7);
    gloss.fillStyle(0xffffff, 0.38);
    gloss.fillRoundedRect(RK.left + 4, RK.top + 4, 60, RK.bottom - RK.top - 8, 6);
    gloss.fillStyle(0xffffff, 0.10);
    gloss.fillRoundedRect(RK.left + 4, RK.top + 4, RK.right - RK.left - 8, 28, 6);

    const lines = this.add.graphics().setDepth(-6);
    // 외곽선
    lines.lineStyle(3, 0x1a5a9a, 0.95);
    lines.strokeRoundedRect(RK.left, RK.top, RK.right - RK.left, RK.bottom - RK.top, 8);
    // 센터 라인
    lines.lineStyle(1.5, 0x3377aa, 0.45);
    lines.beginPath();
    lines.moveTo(RK.cx, RK.top + 4); lines.lineTo(RK.cx, RK.bottom - 4);
    lines.strokePath();
    // 백 라인 (파란 실선, 굵게)
    lines.lineStyle(2.5, 0x2266bb, 0.85);
    lines.beginPath();
    lines.moveTo(RK.left + 2, RK.backY); lines.lineTo(RK.right - 2, RK.backY);
    lines.strokePath();
    // 티 라인 (파란)
    lines.lineStyle(2, 0x2255aa, 0.75);
    lines.beginPath();
    lines.moveTo(RK.left + 2, RK.houseCy); lines.lineTo(RK.right - 2, RK.houseCy);
    lines.strokePath();
    // 해크 라인 (빨간)
    lines.lineStyle(3, 0xdd2233, 0.9);
    lines.beginPath();
    lines.moveTo(RK.left + 2, RK.throwY); lines.lineTo(RK.right - 2, RK.throwY);
    lines.strokePath();
    // ── 호그 라인 (오렌지) ─────────────────────────────────────
    lines.lineStyle(2.5, 0xff7700, 0.95);
    lines.beginPath();
    lines.moveTo(RK.left + 2, RK.hogNear); lines.lineTo(RK.right - 2, RK.hogNear);
    lines.strokePath();
    lines.beginPath();
    lines.moveTo(RK.left + 2, RK.hogFar);  lines.lineTo(RK.right - 2, RK.hogFar);
    lines.strokePath();

    // 라인 라벨
    const lbS = { fontFamily: 'monospace' };
    const mkLbl = (x, y, t, col, size = '8px', orig = [0, 0.5]) =>
      this.add.text(x, y, t, { ...lbS, fontSize: size, color: col })
        .setOrigin(...orig).setDepth(-5);

    // 링크 벽 바깥 (사이드 보드와의 갭 영역)에 배치 — 우측 정렬로 벽에 붙임
    const LBX = RK.left - 4;   // 라벨 우측 끝 X (링크 벽 바깥 4px)
    mkLbl(LBX, RK.backY,   'BACK',   '#5599dd', '8px', [1, 0.5]);
    mkLbl(LBX, RK.houseCy, 'TEA',    '#4488cc', '8px', [1, 0.5]);
    mkLbl(LBX, RK.hogNear, 'HOG',    '#ff7700', '8px', [1, 0.5]);
    mkLbl(LBX, RK.hogFar,  'HOG',    '#ff7700', '8px', [1, 0.5]);
    mkLbl(LBX, RK.throwY,  'HACK',   '#dd2233', '8px', [1, 0.5]);
    // 가드존 라벨 (블루링 끝에서 25px 아래 — 하우스와 충분히 간격)
    mkLbl(RK.cx, RK.houseCy + RK.ringBlue + 25, 'GUARD ZONE', '#66aaaa', '7px', [0.5, 0.5]);

    this._drawHouse();

    this._aimGfx = this.add.graphics().setDepth(15);

    const marker = this.add.graphics().setDepth(5);
    marker.lineStyle(2, 0xdd2233, 0.7);
    marker.strokeCircle(RK.throwX, RK.throwY, 14);
    marker.lineStyle(1, 0xdd2233, 0.5);
    marker.beginPath();
    marker.moveTo(RK.throwX - 20, RK.throwY); marker.lineTo(RK.throwX + 20, RK.throwY);
    marker.moveTo(RK.throwX, RK.throwY - 20); marker.lineTo(RK.throwX, RK.throwY + 20);
    marker.strokePath();

    this._drawSidePanels();
  }

  _drawHouse() {
    const g = this.add.graphics().setDepth(-6);
    const cx = RK.houseCx, cy = RK.houseCy;
    g.fillStyle(0x4488ff, 0.10); g.fillCircle(cx, cy, RK.ringBlue + 10);
    g.fillStyle(0x1e5fd1);       g.fillCircle(cx, cy, RK.ringBlue);
    g.fillStyle(0xfafafa);       g.fillCircle(cx, cy, RK.ringWhite);
    g.fillStyle(0xcc2020);       g.fillCircle(cx, cy, RK.ringRed);
    g.fillStyle(0xf5c830);       g.fillCircle(cx, cy, RK.button);
    g.fillStyle(0xffffff, 0.20); g.fillEllipse(cx - 12, cy - 16, 22, 14);
    g.lineStyle(1.5, 0x0a1a40, 0.6);
    [RK.ringBlue, RK.ringWhite, RK.ringRed].forEach(r => g.strokeCircle(cx, cy, r));
    g.lineStyle(1, 0x0a1a40, 0.5);
    g.beginPath();
    g.moveTo(cx - 8, cy); g.lineTo(cx + 8, cy);
    g.moveTo(cx, cy - 8); g.lineTo(cx, cy + 8);
    g.strokePath();
  }

  _drawSidePanels() {
    const g = this.add.graphics().setDepth(-16);
    // 왼쪽 패널 배경
    g.fillStyle(0x07111f, 1.0);
    g.fillRect(0, 0, RK.left - 18, 600);
    // 오른쪽 패널 배경
    g.fillRect(RK.right + 18, 0, 800 - RK.right - 18, 600);

    // 아레나 사이드 보드 (광고판 느낌)
    const board = this.add.graphics().setDepth(-14);
    const BW = RK.left - 20;  // 왼쪽 보드 폭 ≈ 252
    const RBX = RK.right + 20; // 오른쪽 보드 시작 X

    // 왼쪽 보드
    board.fillStyle(0x0d1e36, 0.95);
    board.fillRoundedRect(4, 60, BW - 8, 480, 8);
    board.lineStyle(1.5, 0x2255aa, 0.5);
    board.strokeRoundedRect(4, 60, BW - 8, 480, 8);

    // 오른쪽 보드
    board.fillStyle(0x0d1e36, 0.95);
    board.fillRoundedRect(RBX + 4, 60, 800 - RBX - 8, 480, 8);
    board.lineStyle(1.5, 0x2255aa, 0.5);
    board.strokeRoundedRect(RBX + 4, 60, 800 - RBX - 8, 480, 8);

    // 장식 — 링크 좌우 경계선 빛 반사
    const rim = this.add.graphics().setDepth(-13);
    rim.fillStyle(0x3388dd, 0.22);
    rim.fillRect(RK.left - 19, RK.top - 6, 4, RK.bottom - RK.top + 12);
    rim.fillRect(RK.right + 15, RK.top - 6, 4, RK.bottom - RK.top + 12);

    // 왼쪽 팀 색 표시 줄 (🔴 팀)
    const teamBar = this.add.graphics().setDepth(-13);
    teamBar.fillStyle(0xaa1122, 0.35);
    teamBar.fillRoundedRect(6, 62, BW - 12, 8, 3);
    teamBar.fillStyle(0x1122aa, 0.35);
    teamBar.fillRoundedRect(RBX + 6, 62, 800 - RBX - 12, 8, 3);

    // 왼쪽 패널 장식 텍스트
    const panelStyle = { fontSize: '9px', color: '#334466', fontFamily: 'monospace' };
    ['CURLING', 'WORLD', 'CHAMPIONSHIP', '컬링', '영미!'].forEach((t, i) => {
      this.add.text(BW / 2, 110 + i * 65, t, panelStyle)
        .setOrigin(0.5).setDepth(-13).setAlpha(0.55);
    });
    ['CURLING', 'ARENA', 'ICE SHEET', '컬링', '화이팅'].forEach((t, i) => {
      this.add.text(RBX + (800 - RBX) / 2, 110 + i * 65, t, panelStyle)
        .setOrigin(0.5).setDepth(-13).setAlpha(0.55);
    });
  }

  // ─── HUD ─────────────────────────────────────────────────
  // [Step 7] 800px 폭의 막대 → 360px 폭의 둥근 전광판이 링크 위 매달린 룩
  _buildHUD() {
    this._hudDeco = [];   // 전광판 장식 (토글 시 함께 숨김)

    // 전광판 본체 — 링크 폭(168)보다 넉넉히 큰 360px, 둥근 모서리
    this._hudBar = this.add.rectangle(400, 30, 360, 52, 0x030a14, 0.96)
      .setStrokeStyle(2.5, 0x88aacc, 0.7).setDepth(80).setScrollFactor(0);
    // 전광판 안쪽 패널 (광택)
    this._hudDeco.push(
      this.add.rectangle(400, 30, 350, 42, 0x0a1a30, 0.5)
        .setStrokeStyle(1, 0x4477bb, 0.5).setDepth(80).setScrollFactor(0),

      // 좌측 팀 컬러 액센트 (🔴)
      this.add.rectangle(232, 30, 6, 38, 0xdd2233, 0.92)
        .setDepth(81).setScrollFactor(0),
      this.add.rectangle(232, 30, 4, 36, 0xff6677, 0.55)
        .setDepth(82).setScrollFactor(0),
      // 우측 팀 컬러 액센트 (🔵)
      this.add.rectangle(568, 30, 6, 38, 0x2244cc, 0.92)
        .setDepth(81).setScrollFactor(0),
      this.add.rectangle(568, 30, 4, 36, 0x5588ff, 0.55)
        .setDepth(82).setScrollFactor(0),

      // 전광판 → 링크 연결 지지대 (양쪽)
      this.add.rectangle(330, 60, 8, 18, 0x224488, 0.7)
        .setDepth(79).setScrollFactor(0),
      this.add.rectangle(470, 60, 8, 18, 0x224488, 0.7)
        .setDepth(79).setScrollFactor(0),
      // 링크 외곽선과 살짝 겹치는 베이스 그림자
      this.add.rectangle(400, 70, 200, 4, 0x111a2a, 0.65)
        .setDepth(79).setScrollFactor(0),
    );

    // END / 투 차례 텍스트 (전광판 좌측)
    this._endText = this.add.text(244, 22, '', {
      fontSize: '11px', color: '#88aacc', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(83).setScrollFactor(0);

    // 점수 (전광판 중앙)
    this._scoreText = this.add.text(400, 22, '', {
      fontSize: '19px', color: '#ffdd66', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(83).setScrollFactor(0);

    // 영미! 카운트 (전광판 우측)
    this._sweepText = this.add.text(556, 22, '', {
      fontSize: '11px', color: '#66eeff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0.5).setDepth(83).setScrollFactor(0);

    // ── 스톤 잔량 도트 (전광판 하단 줄) ──────────────────────
    this._stoneDotGfx = this.add.graphics().setDepth(83).setScrollFactor(0);

    // 파워 게이지 (CHARGING 시 재배치됨)
    this._powerBg = this.add.rectangle(400, 575, 240, 16, 0x000000, 0.7)
      .setStrokeStyle(1.5, 0x4488ff, 0.8).setDepth(81).setScrollFactor(0).setVisible(false);
    this._powerFill = this.add.rectangle(280, 575, 0, 12, 0x44ff88)
      .setOrigin(0, 0.5).setDepth(82).setScrollFactor(0).setVisible(false);
    this._powerLabel = this.add.text(400, 558, 'POWER', {
      fontSize: '11px', color: '#88aaff', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(82).setScrollFactor(0).setVisible(false);

    // 힌트 (SLIDING)
    this._hintText = this.add.text(400, 590, '', {
      fontSize: '13px', color: '#cccccc', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(81).setScrollFactor(0);

    // 각도/위치 표시 (AIMING 시 재배치됨)
    this._angleText = this.add.text(400, 55, '', {
      fontSize: '13px', color: '#88ddff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(81).setScrollFactor(0).setVisible(false);

    // ── 미니맵 (우측 사이드 패널) ─────────────────────────────
    // 링크 전체를 SC=0.44 배율로 축소 표시 (AIMING/CHARGING 시 표시)
    this._miniMapGfx = this.add.graphics().setDepth(82).setScrollFactor(0);
    // "MINI" 라벨 — 미니맵 상단 중앙 (화면 x≈677, y=50)
    this._miniMapLbl = this.add.text(677, 50, '미니맵', {
      fontSize: '9px', color: '#88aacc', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(83).setScrollFactor(0).setVisible(false);
  }

  _setHUDVisible(v) {
    this._hudBar.setVisible(v);
    this._endText.setVisible(v);
    this._scoreText.setVisible(v);
    this._sweepText.setVisible(v);
    this._stoneDotGfx.setVisible(v);
    if (this._hudDeco) this._hudDeco.forEach(o => o.setVisible(v));
  }

  _updateHUD() {
    const throwNum  = Math.floor(this._throwIdx / 2) + 1;
    const isTeam1   = this._throwIdx % 2 === 0;
    const teamLabel = this._gameMode === 'duo'
      ? (isTeam1 ? '🔴1P' : '🔵2P')
      : (isTeam1 ? '🔴'   : '🔵AI');
    this._endText.setText(`END ${this._endIdx}/${TOTAL_ENDS}  ${teamLabel} ${throwNum}/${STONES_PER_END}`);
    this._scoreText.setText(`🔴 ${this._playerScore} : ${this._aiScore} 🔵`);
    this._sweepText.setText(`영미! ×${this._sweepCount}`);

    // ── 스톤 잔량 도트 (전광판 하단 줄, x=270/530) ──────────
    const g = this._stoneDotGfx;
    g.clear();
    const p1Used = Math.ceil(this._throwIdx / 2);  // 짝수 throw 후 올라감
    const p2Used = Math.floor(this._throwIdx / 2);
    const dotR = 3.5, dotGap = 9;   // 전광판 좁아짐 → 도트도 작게
    const drawDots = (cx, used, col) => {
      for (let i = 0; i < STONES_PER_END; i++) {
        const x = cx + (i - (STONES_PER_END - 1) / 2) * dotGap;
        if (i < used) {
          g.fillStyle(col, 0.95);
          g.fillCircle(x, 44, dotR);
        } else {
          g.lineStyle(1.2, col, 0.55);
          g.strokeCircle(x, 44, dotR);
        }
      }
    };
    drawDots(285, p1Used, 0xdd2233);   // 🔴 플레이어 (좌측 액센트 옆)
    drawDots(515, p2Used, 0x2244cc);   // 🔵 AI / 2P (우측 액센트 옆)

    if (this._state === S.AIMING || this._state === S.CHARGING) {
      const offset = this._activeStone ? Math.round(this._activeStone.x - RK.cx) : 0;
      const dir = offset < -2 ? `← ${Math.abs(offset)}` : offset > 2 ? `${offset} →` : '↑ 중앙';
      this._angleText.setText(`위치: ${dir}`);
    }
    if (this._state === S.SLIDING) {
      this._hintText.setText('📳 탭! 탭! 탭! — 영미영미!!');
    } else {
      this._hintText.setText('');
    }
  }

  // ─── 버튼 ─────────────────────────────────────────────────
  _buildButtons() {
    // 레디 버튼 (OVERVIEW, zoom=1 고정) — 화려 버전
    this._readyBtn = this._makeReadyBtn(400, 320, '🥌  레  디  !', 0x115588);
    this._readyBtn.bg.on('pointerdown', () => this._onReady());
    this._readyBtn.setVisible(false);

    // ── 파워 버튼 (중앙) ─────────────────────────────────────
    this._fireBtn = this._makeBtn(400, 557, 140, 52, '💥 파워!', 0x4a0a0a, 20);
    this._fireBtn.bg.on('pointerdown', () => this._onFireDown());
    this._fireBtn.bg.on('pointerup',   () => this._onFireUp());
    this._fireBtn.setVisible(false);

    // ── 위치 컨트롤 (파워 왼쪽) — 돌을 투척선 위에서 좌우 이동 ──
    this._posLBtn = this._makeBtn(202, 557, 50, 50, '◀', 0x0d3355, 22);
    this._posLBtn.bg.on('pointerdown', () => { this._posHeld = 'left';  });
    this._posLBtn.bg.on('pointerup',   () => { this._posHeld = null;    });
    this._posLBtn.bg.on('pointerout',  () => { this._posHeld = null;    });
    this._posLBtn.setVisible(false);

    this._posRBtn = this._makeBtn(256, 557, 50, 50, '▶', 0x0d3355, 22);
    this._posRBtn.bg.on('pointerdown', () => { this._posHeld = 'right'; });
    this._posRBtn.bg.on('pointerup',   () => { this._posHeld = null;    });
    this._posRBtn.bg.on('pointerout',  () => { this._posHeld = null;    });
    this._posRBtn.setVisible(false);

    // ── 각도 컨트롤 (파워 오른쪽) — 조준 각도 좌우 조정 ────────
    this._angLBtn = this._makeBtn(544, 557, 50, 50, '◄', 0x332200, 22);
    this._angLBtn.bg.on('pointerdown', () => { this._angHeld = 'left';  });
    this._angLBtn.bg.on('pointerup',   () => { this._angHeld = null;    });
    this._angLBtn.bg.on('pointerout',  () => { this._angHeld = null;    });
    this._angLBtn.setVisible(false);

    this._angRBtn = this._makeBtn(598, 557, 50, 50, '►', 0x332200, 22);
    this._angRBtn.bg.on('pointerdown', () => { this._angHeld = 'right'; });
    this._angRBtn.bg.on('pointerup',   () => { this._angHeld = null;    });
    this._angRBtn.bg.on('pointerout',  () => { this._angHeld = null;    });
    this._angRBtn.setVisible(false);

    // ── 라벨 텍스트 (AIMING 시 placeAt으로 재배치) ──────────────
    const lblStyle = { fontSize:'11px', color:'#aaccff', fontFamily:'monospace',
      stroke:'#000', strokeThickness:2 };
    this._posLabel = this.add.text(229, 527, '◀▶ 위치', lblStyle)
      .setOrigin(0.5).setDepth(87).setScrollFactor(0).setVisible(false);
    this._angLabel = this.add.text(571, 527, '각도 ◄►', lblStyle)
      .setOrigin(0.5).setDepth(87).setScrollFactor(0).setVisible(false);

    // 나가기 (항상 visible)
    const exitBg = this.add.rectangle(762, 594, 68, 22, 0x000000, 0.5)
      .setDepth(90).setScrollFactor(0).setInteractive({ useHandCursor: true });
    this.add.text(762, 594, '⬅ 나가기', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(91).setScrollFactor(0);
    exitBg.on('pointerdown', () => this._goBack());
  }

  // 라벨 placeAt 헬퍼 (scrollFactor=0 텍스트)
  _placeLbl(txt, sx, sy, zoom) {
    const p = { x: VCX + (sx - VCX) / zoom, y: VCY + (sy - VCY) / zoom };
    txt.setPosition(p.x, p.y).setScale(1 / zoom).setVisible(true);
  }

  // 버튼 팩토리 ─ scrollFactor=0, placeAt()으로 줌 시 재배치
  // ── 화려한 레디 버튼 (다층 + 펄스 + 코너 액센트) ──────────
  _makeReadyBtn(x, y, label, bgColor) {
    const w = 280, h = 78;
    const D = 85;

    // 외곽 글로우 (펄스)
    const glow = this.add.rectangle(x, y, w + 24, h + 24, 0x4488ff, 0.18)
      .setStrokeStyle(2, 0x66bbff, 0.5).setDepth(D - 2).setScrollFactor(0);
    // 드롭 섀도
    const shadow = this.add.rectangle(x + 4, y + 6, w, h, 0x000000, 0.45)
      .setDepth(D - 1).setScrollFactor(0);
    // 메인 배경 (그라디언트 느낌으로 두 겹)
    const bg = this.add.rectangle(x, y, w, h, bgColor, 1.0)
      .setStrokeStyle(3, 0xaaccff, 0.9).setDepth(D)
      .setScrollFactor(0).setInteractive({ useHandCursor: true });
    const bgInner = this.add.rectangle(x, y, w - 10, h - 10, 0x1a4488, 0.85)
      .setStrokeStyle(1, 0x66aaff, 0.7).setDepth(D + 1).setScrollFactor(0);
    // 상단 광택
    const hl = this.add.rectangle(x, y - h * 0.24, w - 18, h * 0.28, 0xffffff, 0.22)
      .setDepth(D + 2).setScrollFactor(0);
    // 하단 어두움
    const sh = this.add.rectangle(x, y + h * 0.28, w - 18, h * 0.18, 0x000000, 0.25)
      .setDepth(D + 2).setScrollFactor(0);
    // 좌우 팀 컬러 액센트 바
    const accL = this.add.rectangle(x - w / 2 + 14, y, 6, h - 22, 0xdd2233, 0.95)
      .setDepth(D + 3).setScrollFactor(0);
    const accR = this.add.rectangle(x + w / 2 - 14, y, 6, h - 22, 0x2244cc, 0.95)
      .setDepth(D + 3).setScrollFactor(0);
    // 코너 모서리 액센트 (4개 점)
    const corners = [
      [x - w / 2 + 6,  y - h / 2 + 6],
      [x + w / 2 - 6,  y - h / 2 + 6],
      [x - w / 2 + 6,  y + h / 2 - 6],
      [x + w / 2 - 6,  y + h / 2 - 6],
    ].map(([cx, cy]) =>
      this.add.rectangle(cx, cy, 6, 6, 0xffdd44, 0.95).setDepth(D + 4).setScrollFactor(0)
    );
    // 메인 텍스트
    const txt = this.add.text(x, y - 2, label, {
      fontSize: '30px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#001133', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(D + 5).setScrollFactor(0);
    // 서브 텍스트
    const sub = this.add.text(x, y + 22, 'PRESS  TO  THROW', {
      fontSize: '9px', color: '#aaccff', fontFamily: 'monospace',
      stroke: '#001133', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(D + 5).setScrollFactor(0);

    // 펄스 애니메이션 (글로우 + 살짝 스케일)
    const pulse = this.tweens.add({
      targets: glow,
      scaleX: 1.06, scaleY: 1.12, alpha: 0.35,
      duration: 720, ease: 'Sine.easeInOut',
      yoyo: true, repeat: -1,
    });
    const bobble = this.tweens.add({
      targets: [bg, bgInner, hl, sh, accL, accR, txt, sub, ...corners],
      y: '+=2',
      duration: 980, ease: 'Sine.easeInOut',
      yoyo: true, repeat: -1,
    });

    bg.on('pointerover', () => { bg.setFillStyle(0x2266bb, 1.0); bgInner.setFillStyle(0x3377cc, 0.9); });
    bg.on('pointerout',  () => { bg.setFillStyle(bgColor, 1.0); bgInner.setFillStyle(0x1a4488, 0.85); });

    const allObjs = [glow, shadow, bg, bgInner, hl, sh, accL, accR, ...corners, txt, sub];

    const grp = {
      bg, txt, hl,
      _h: h,
      _allObjs: allObjs,
      _pulse: pulse, _bobble: bobble,
      setVisible: (v) => {
        allObjs.forEach(o => o.setVisible(v));
        if (v) { pulse.resume(); bobble.resume(); }
        else   { pulse.pause();  bobble.pause();  }
      },
      placeAt: (sx, sy, zoom = 1) => {
        const p = { x: VCX + (sx - VCX) / zoom, y: VCY + (sy - VCY) / zoom };
        const sc = 1 / zoom;
        glow.setPosition(p.x, p.y).setScale(sc);
        shadow.setPosition(p.x + 4 * sc, p.y + 6 * sc).setScale(sc);
        bg.setPosition(p.x, p.y).setScale(sc);
        bgInner.setPosition(p.x, p.y).setScale(sc);
        hl.setPosition(p.x, p.y - h * 0.24 * sc).setScale(sc);
        sh.setPosition(p.x, p.y + h * 0.28 * sc).setScale(sc);
        accL.setPosition(p.x - (w / 2 - 14) * sc, p.y).setScale(sc);
        accR.setPosition(p.x + (w / 2 - 14) * sc, p.y).setScale(sc);
        corners[0].setPosition(p.x - (w / 2 - 6) * sc, p.y - (h / 2 - 6) * sc).setScale(sc);
        corners[1].setPosition(p.x + (w / 2 - 6) * sc, p.y - (h / 2 - 6) * sc).setScale(sc);
        corners[2].setPosition(p.x - (w / 2 - 6) * sc, p.y + (h / 2 - 6) * sc).setScale(sc);
        corners[3].setPosition(p.x + (w / 2 - 6) * sc, p.y + (h / 2 - 6) * sc).setScale(sc);
        txt.setPosition(p.x, p.y - 2 * sc).setScale(sc);
        sub.setPosition(p.x, p.y + 22 * sc).setScale(sc);
      },
    };
    return grp;
  }

  _makeBtn(x, y, w, h, label, bgColor, fs = 18) {
    const bg = this.add.rectangle(x, y, w, h, bgColor, 0.95)
      .setStrokeStyle(2, 0x88aaff, 0.8).setDepth(85)
      .setScrollFactor(0).setInteractive({ useHandCursor: true });
    const hl = this.add.rectangle(x, y - h * 0.22, w - 8, h * 0.28, 0xffffff, 0.14)
      .setDepth(86).setScrollFactor(0);
    const txt = this.add.text(x, y, label, {
      fontSize: `${fs}px`, color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(87).setScrollFactor(0);

    bg.on('pointerover', () => bg.setAlpha(0.75));
    bg.on('pointerout',  () => bg.setAlpha(0.95));

    const grp = {
      bg, txt, hl,
      _h: h,
      setVisible: (v) => { bg.setVisible(v); txt.setVisible(v); hl.setVisible(v); },
      placeAt: (sx, sy, zoom = 1) => {
        const p = { x: VCX + (sx - VCX) / zoom, y: VCY + (sy - VCY) / zoom };
        const sc = 1 / zoom;
        bg.setPosition(p.x, p.y).setScale(sc);
        hl.setPosition(p.x, p.y - h * 0.22 * sc).setScale(sc);
        txt.setPosition(p.x, p.y).setScale(sc);
      },
    };
    return grp;
  }

  // ─── 키보드 ───────────────────────────────────────────────
  _setupKeys() {
    this.cursors  = this.input.keyboard.createCursorKeys();
    this._spKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._rKey    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this._spKey.on('down', () => this._onFireDown());
    this._spKey.on('up',   () => this._onFireUp());

    this.input.on('pointerdown', (ptr) => {
      if (this._state === S.SLIDING && ptr.y > 50) this._onSweepTap();
    });

    this._rKey.on('down', () => { if (this._state === S.RESULT) this._restart(); });
  }

  // ─── 상태 머신 ───────────────────────────────────────────
  // ─── 모드 선택 화면 ──────────────────────────────────────
  _enterModeSelect() {
    this._state = S.OVERVIEW;
    this._setHUDVisible(false);
    this._readyBtn.setVisible(false);

    const objs = [];
    const cleanup = () => objs.forEach(o => { try { o.destroy(); } catch(e) {} });

    // 어두운 배경 오버레이
    objs.push(
      this.add.rectangle(400, 300, 800, 600, 0x000000, 0.60)
        .setDepth(88).setScrollFactor(0),

      // 제목
      this.add.text(400, 148, '🥌  컬링  게임', {
        fontSize: '42px', color: '#ffdd66', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 7,
      }).setOrigin(0.5).setDepth(89).setScrollFactor(0),

      this.add.text(400, 208, '"영미! 영미!" 에디션', {
        fontSize: '17px', color: '#88ccff', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(89).setScrollFactor(0),

      // 구분선
      this.add.rectangle(400, 258, 380, 1.5, 0xffffff, 0.18)
        .setDepth(89).setScrollFactor(0),

      // 설명
      this.add.text(400, 472, '1인용: 플레이어(🔴) vs AI 컴퓨터(🔵)', {
        fontSize: '13px', color: '#999999', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(89).setScrollFactor(0),
      this.add.text(400, 494, '2인용: 🔴1P / 🔵2P 번갈아 투척 (로컬)', {
        fontSize: '13px', color: '#999999', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(89).setScrollFactor(0)
    );

    // 모드 버튼 생성 헬퍼
    const mkBtn = (y, emoji, title, desc, bgCol, fn) => {
      const bg = this.add.rectangle(400, y, 340, 74, bgCol, 0.96)
        .setStrokeStyle(2.5, 0x88aaee, 0.85).setDepth(89).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      const hl = this.add.rectangle(400, y - 18, 330, 18, 0xffffff, 0.09)
        .setDepth(90).setScrollFactor(0);
      const txt1 = this.add.text(400, y - 10, `${emoji}  ${title}`, {
        fontSize: '24px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(90).setScrollFactor(0);
      const txt2 = this.add.text(400, y + 18, desc, {
        fontSize: '13px', color: '#aaccff', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(90).setScrollFactor(0);
      bg.on('pointerover',  () => bg.setAlpha(0.75));
      bg.on('pointerout',   () => bg.setAlpha(0.96));
      bg.on('pointerdown',  fn);
      objs.push(bg, hl, txt1, txt2);
    };

    mkBtn(305, '🤖', '1인용  (vs AI)',
      '컴퓨터 AI와 대결 · 5엔드 승부',
      0x0e2244, () => {
        this._gameMode = 'solo';
        cleanup();
        this._enterOverview();
      });

    mkBtn(398, '👥', '2인용  (로컬)',
      '두 플레이어가 번갈아 투척 · 같은 화면',
      0x0e3322, () => {
        this._gameMode = 'duo';
        cleanup();
        this._enterOverview();
      });
  }

  _isPlayerTurn() {
    return this._throwIdx % 2 === 0;
  }

  _enterOverview() {
    this._state = S.OVERVIEW;
    this._camGo(CAM.wide);

    this._fireBtn.setVisible(false);
    this._posLBtn.setVisible(false); this._posRBtn.setVisible(false);
    this._angLBtn.setVisible(false); this._angRBtn.setVisible(false);
    this._posLabel.setVisible(false); this._angLabel.setVisible(false);
    this._showPowerBar(false);
    this._angleText.setVisible(false);
    this._aimGfx.clear();
    this._setHUDVisible(true);

    if (this._gameMode === 'duo') {
      // 2인용: 항상 인간 플레이어 — 두 팀 모두 레디 버튼
      const isTeam1 = this._throwIdx % 2 === 0;
      this._readyBtn.txt.setText(isTeam1 ? '🔴  1P  레디  !' : '🔵  2P  레디  !');
      this._readyBtn.bg.fillColor = isTeam1 ? 0x551111 : 0x112255;
      this._readyBtn.placeAt(400, 320, 1);
      this._readyBtn.setVisible(true);
    } else if (this._isPlayerTurn()) {
      // 1인용: 플레이어 차례 → 레디 버튼
      this._readyBtn.txt.setText('🥌  레  디  !');
      this._readyBtn.bg.fillColor = 0x115588;
      this._readyBtn.placeAt(400, 320, 1);
      this._readyBtn.setVisible(true);
    } else {
      // 1인용: AI 차례 → 자동 투척
      this._readyBtn.setVisible(false);
      this.time.delayedCall(1200, () => {
        if (this._state === S.OVERVIEW) this._startAIThrow();
      });
    }
  }

  _onReady() {
    if (this._state !== S.OVERVIEW) return;
    this._readyBtn.setVisible(false);
    this._setHUDVisible(false);
    // 짝수 throwIdx = team1(🔴), 홀수 throwIdx = team2(🔵)
    const team = (this._throwIdx % 2 === 0) ? 'player' : 'ai';
    this._spawnStone(team);
    this._camGo(CAM.throw);
    this.time.delayedCall(CAM.throw.dur, () => this._enterAim());
  }

  // ─── AI 자동 투척 ─────────────────────────────────────────
  // [AI 전략] 실제 투척 위치(stoneX)에서 목표 지점까지 각도를 계산한 뒤
  // 작은 오차(errDeg)를 추가. 이전의 '각도만 랜덤' 방식 폐기.
  _startAIThrow() {
    this._setHUDVisible(false);
    this._spawnStone('ai');

    // ── 전략 결정 ──────────────────────────────────────────
    const r = Math.random();
    const pInHouse = this._playerStones.filter(s => {
      if (!s.inPlay) return false;
      const dx = s.x - RK.houseCx, dy = s.y - RK.houseCy;
      return Math.sqrt(dx*dx + dy*dy) <= RK.ringBlue;
    });

    let posOffset, targetX, targetY, aiPower, errDeg;

    if (pInHouse.length > 0 && r < 0.38) {
      // 테이크아웃: 하우스 안 플레이어 돌 제거
      const tgt = pInHouse[Math.floor(Math.random() * pInHouse.length)];
      targetX = tgt.x + (Math.random() - 0.5) * 16;
      targetY = tgt.y;
      posOffset = (Math.random() - 0.5) * 36;
      aiPower   = 0.62 + Math.random() * 0.32;
      errDeg    = (Math.random() - 0.5) * 7;
    } else if (r < 0.72) {
      // 드로: 버튼(티) 근처로 안착
      targetX = RK.houseCx + (Math.random() - 0.5) * 34;
      targetY = RK.houseCy + (Math.random() - 0.5) * 28;
      posOffset = (Math.random() - 0.5) * 28;
      aiPower   = 0.46 + Math.random() * 0.18;
      errDeg    = (Math.random() - 0.5) * 10;
    } else {
      // 가드: 하우스 앞쪽에 돌 배치 (드로 약하게)
      targetX = RK.houseCx + (Math.random() - 0.5) * 55;
      targetY = RK.houseCy + 48 + Math.random() * 46;
      posOffset = (Math.random() - 0.5) * 38;
      aiPower   = 0.35 + Math.random() * 0.14;
      errDeg    = (Math.random() - 0.5) * 12;
    }

    // ── 실제 투척 위치 결정 ────────────────────────────────
    const stoneX = Phaser.Math.Clamp(
      RK.throwX + posOffset, RK.left + 24, RK.right - 24
    );
    this._activeStone.x = stoneX;
    if (this._activeStone.sprite) this._activeStone.sprite.x = stoneX;

    // ── 투척 위치 → 목표 각도 계산 ────────────────────────
    // aimAngleOffset = 0° 일 때 수직 위(↑) 방향이므로
    //   angle = atan2(dx, -dy) 으로 목표 향하는 각도를 구함
    const dx = targetX - stoneX;
    const dy = targetY - RK.throwY;   // 음수 (하우스가 위)
    const idealDeg = Phaser.Math.RadToDeg(Math.atan2(dx, -dy));
    this._aimAngleOffset = idealDeg + errDeg;

    this._camGo(CAM.throw);
    this.time.delayedCall(CAM.throw.dur + 500, () => {
      this._doAIRelease(aiPower);
    });
  }

  _doAIRelease(powerT) {
    if (!this._activeStone) return;
    const rad = this._calcAimRad();
    const v   = B_POWER * (MIN_RATIO + powerT * (1 - MIN_RATIO));
    this._activeStone.vx = Math.sin(rad) * v;
    this._activeStone.vy = -Math.cos(rad) * v;

    this._camGo(CAM.wide);
    this._sweepMul = 1.0; this._recentTaps = [];
    this._state = S.SLIDING;
    this._setHUDVisible(true);
    // AI 투척 시에는 영미 팝업/트래커 없음
  }

  // ─── 플레이어 조준 ──────────────────────────────────────
  _spawnStone(team = 'player') {
    // 항상 BootScene이 생성한 stone-red/stone-blue 텍스처 사용
    // (손잡이 색으로 팀 구분: 🔴 빨간 손잡이 = team1/player, 🔵 파란 손잡이 = team2/AI)
    const key = (team === 'player') ? 'stone-red' : 'stone-blue';
    const sp = this.add.image(RK.throwX, RK.throwY, key)
      .setDepth(20).setDisplaySize(24, 24);   // [Step 7] 44→24
    this._activeStone = {
      sprite: sp, team,
      x: RK.throwX, y: RK.throwY,
      vx: 0, vy: 0, radius: STONE_R,
      inPlay: true, scored: 0,
    };
    this._aimAngle       = 0;
    this._aimAngleOffset = 0;
    this._posHeld        = null;
    this._angHeld        = null;
  }

  _enterAim() {
    this._state = S.AIMING;
    const z = CAM.throw.zoom;   // 2.4
    this._aimAngleOffset = 0;

    // ── 파워 버튼 (중앙 하단) ────────────────────────────────
    this._fireBtn.placeAt(400, 557, z);
    this._fireBtn.txt.setText('💥 파워!');
    this._fireBtn.bg.fillColor = 0x4a0a0a;
    this._fireBtn.setVisible(true);

    // ── 위치 버튼 (파워 왼쪽) ──────────────────────────────
    this._posLBtn.placeAt(202, 557, z);
    this._posRBtn.placeAt(256, 557, z);
    this._posLBtn.setVisible(true);
    this._posRBtn.setVisible(true);
    this._placeLbl(this._posLabel, 229, 527, z);

    // ── 각도 버튼 (파워 오른쪽) ──────────────────────────────
    this._angLBtn.placeAt(544, 557, z);
    this._angRBtn.placeAt(598, 557, z);
    this._angLBtn.setVisible(true);
    this._angRBtn.setVisible(true);
    this._placeLbl(this._angLabel, 571, 527, z);

    // ── 위치 표시 텍스트 (상단) ──────────────────────────────
    const ap = this._toUI(400, 58, z);
    this._angleText.setPosition(ap.x, ap.y).setScale(1 / z).setVisible(true);
  }

  // 조준 각도: 항상 직선 위(수직) + 수동 각도 오프셋
  // 자동 조준(하우스 중심 향함) 제거 — 실제 컬링처럼 직선 투척
  _calcAimRad() {
    return Phaser.Math.DegToRad(this._aimAngleOffset);
  }

  _updateAim(dt) {
    // ── 위치 조절: 돌을 투척선 위에서 좌우 이동 ──────────────
    const posRate = 3.5 * dt;
    if (this.cursors.left.isDown  || this._posHeld === 'left')
      this._activeStone.x = Math.max(RK.left  + 24, this._activeStone.x - posRate);
    if (this.cursors.right.isDown || this._posHeld === 'right')
      this._activeStone.x = Math.min(RK.right - 24, this._activeStone.x + posRate);
    if (this._activeStone.sprite) this._activeStone.sprite.x = this._activeStone.x;

    // ── 각도 조절: 하우스 자동각에 수동 오프셋 추가 ─────────────
    const angRate = 1.2 * dt;
    if (this._angHeld === 'left')
      this._aimAngleOffset = Math.max(-28, this._aimAngleOffset - angRate);
    if (this._angHeld === 'right')
      this._aimAngleOffset = Math.min( 28, this._aimAngleOffset + angRate);

    this._aimAngle = Phaser.Math.RadToDeg(this._calcAimRad());
    this._drawAimLine();
  }

  _drawAimLine() {
    const g = this._aimGfx;
    g.clear();
    if (!this._activeStone) return;

    const rad = this._calcAimRad();
    const sx  = this._activeStone.x, sy = this._activeStone.y;
    const dx  = Math.sin(rad), dy = -Math.cos(rad);

    g.lineStyle(2.5, 0xffaa22, 0.9);
    const segLen = 14, gap = 8, nSeg = 18;
    for (let i = 0; i < nSeg; i++) {
      const t0 = STONE_R + 4 + i * (segLen + gap);
      const t1 = t0 + segLen;
      g.beginPath();
      g.moveTo(sx + dx * t0, sy + dy * t0);
      g.lineTo(sx + dx * t1, sy + dy * t1);
      g.strokePath();
    }
    const tipX = sx + dx * (STONE_R + 4 + nSeg * (segLen + gap));
    const tipY = sy + dy * (STONE_R + 4 + nSeg * (segLen + gap));
    const pd = 0.4;
    g.fillStyle(0xffaa22, 1.0);
    g.fillTriangle(
      tipX, tipY,
      tipX - Math.cos(rad - pd) * 14, tipY - Math.sin(rad - pd) * 14,
      tipX - Math.cos(rad + pd) * 14, tipY - Math.sin(rad + pd) * 14
    );
    g.lineStyle(2, 0xffffff, 0.4);
    g.strokeCircle(sx, sy, STONE_R + 5);

    // 투척선(throwY) 위에 돌 이동 범위 표시
    const margin = 24;
    g.lineStyle(1.5, 0xdd2233, 0.35);
    g.beginPath();
    g.moveTo(RK.left + margin, RK.throwY);
    g.lineTo(RK.right - margin, RK.throwY);
    g.strokePath();
  }

  _onFireDown() {
    if (this._state === S.OVERVIEW) {
      this._onReady();
    } else if (this._state === S.AIMING) {
      this._state = S.CHARGING;
      this._powerT = 0; this._powerDir = 1;
      this._showPowerBar(true);
      this._fireBtn.txt.setText('🔥 놓아!');
      this._fireBtn.bg.fillColor = 0x881100;
      // CHARGING 중에는 위치/각도 버튼 숨김
      this._posLBtn.setVisible(false); this._posRBtn.setVisible(false);
      this._angLBtn.setVisible(false); this._angRBtn.setVisible(false);
      this._posLabel.setVisible(false); this._angLabel.setVisible(false);
    } else if (this._state === S.SLIDING) {
      this._onSweepTap();
    }
  }

  _onFireUp() {
    if (this._state === S.CHARGING) this._releaseStone();
  }

  _updateCharge(dt) {
    const spd = 0.020 * dt;
    this._powerT += this._powerDir * spd;
    if (this._powerT >= 1) { this._powerT = 1; this._powerDir = -1; }
    if (this._powerT <= 0) { this._powerT = 0; this._powerDir  = 1; }

    const w = this._powerT * 240;
    this._powerFill.width = w;
    const col = this._powerT < 0.5 ? 0x44aaff : (this._powerT < 0.82 ? 0x44ff88 : 0xff5544);
    this._powerFill.fillColor = col;
    this._drawAimLine();
  }

  _releaseStone() {
    if (!this._activeStone) return;
    const rad = this._calcAimRad();
    const v   = B_POWER * (MIN_RATIO + this._powerT * (1 - MIN_RATIO));
    this._activeStone.vx = Math.sin(rad) * v;
    this._activeStone.vy = -Math.cos(rad) * v;

    this._showPowerBar(false);
    this._fireBtn.setVisible(false);
    this._posLBtn.setVisible(false); this._posRBtn.setVisible(false);
    this._angLBtn.setVisible(false); this._angRBtn.setVisible(false);
    this._posLabel.setVisible(false); this._angLabel.setVisible(false);
    this._angleText.setVisible(false);
    this._aimGfx.clear();

    this._camGo(CAM.wide);
    this._showYoungmiPopup();
    this._spawnYoungmiTracker();

    this._sweepMul = 1.0; this._recentTaps = [];
    this._state = S.SLIDING;
    this._setHUDVisible(true);
  }

  // ─── 슬라이딩 물리 ────────────────────────────────────────
  _updateSliding(dt, time) {
    const stones = this._allStones();

    for (const s of stones) {
      if (!s.inPlay) continue;
      const fm  = (s === this._activeStone) ? this._sweepMul : 1.0;
      const fac = Math.pow(1 - FRICTION * fm, dt);
      s.vx *= fac; s.vy *= fac;
      s.x  += s.vx * dt; s.y += s.vy * dt;
      if (Math.abs(s.vx) < 0.05 && Math.abs(s.vy) < 0.05) { s.vx = 0; s.vy = 0; }
    }

    for (const s of stones) {
      if (!s.inPlay) continue;
      const r = s.radius;
      if (s.x - r < RK.left)  { s.x = RK.left  + r; s.vx = Math.abs(s.vx) * 0.5; }
      if (s.x + r > RK.right) { s.x = RK.right  - r; s.vx = -Math.abs(s.vx) * 0.5; }
      if (s.y - r < RK.backY) {
        s.inPlay = false;
        this._floatText(s.x, RK.backY + 20, '아웃!', '#ff4444', 16);
        if (s.sprite) this.tweens.add({ targets: s.sprite, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 280, onComplete: () => { if (s.sprite) s.sprite.setVisible(false); } });
      }
      if (s.y + r > RK.bottom) {
        s.inPlay = false;
        if (s.sprite) this.tweens.add({ targets: s.sprite, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 280, onComplete: () => { if (s.sprite) s.sprite.setVisible(false); } });
      }
    }

    for (let i = 0; i < stones.length; i++)
      for (let j = i + 1; j < stones.length; j++)
        this._resolveCollision(stones[i], stones[j]);

    for (const s of stones) {
      if (s.sprite && s.sprite.active) { s.sprite.x = s.x; s.sprite.y = s.y; }
    }

    this._updateYoungmiTracker(dt);

    if (time - this._lastTapAt > SWEEP_WIN) {
      this._sweepMul = Math.min(1.0, this._sweepMul + 0.015);
    }

    if (stones.every(s => !s.inPlay || (s.vx === 0 && s.vy === 0)))
      this._settle();
  }

  _allStones() {
    const arr = [...this._endStones];
    if (this._activeStone) arr.push(this._activeStone);
    return arr;
  }

  _resolveCollision(a, b) {
    if (!a.inPlay || !b.inPlay) return;
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const min  = a.radius + b.radius;
    if (!dist || dist >= min) return;

    const nx = dx / dist, ny = dy / dist;
    const ov = (min - dist) / 2;
    a.x -= nx * ov; a.y -= ny * ov;
    b.x += nx * ov; b.y += ny * ov;

    const va = a.vx * nx + a.vy * ny;
    const vb = b.vx * nx + b.vy * ny;
    const d  = vb - va;
    a.vx += d * nx * 0.92; a.vy += d * ny * 0.92;
    b.vx -= d * nx * 0.92; b.vy -= d * ny * 0.92;

    this._playBeep(500 + Math.random() * 200, 60);
  }

  // ─── 영미 추적 ──────────────────────────────────────────────
  _spawnYoungmiTracker() {
    if (this._youngmiSp) this._youngmiSp.destroy();
    if (this._broomSp)   this._broomSp.destroy();
    const key = this._hasYoungmiImg ? 'youngmi-cheer' : 'youngmi';
    this._youngmiSp = this.add.image(RK.throwX - 48, RK.throwY, key)
      .setDepth(22).setDisplaySize(52, 52);
    this._broomSp = this.add.image(RK.throwX - 22, RK.throwY + 8, 'broom')
      .setDepth(23).setDisplaySize(18, 50).setOrigin(0.5, 0.9);
    if (this._broomTween) this._broomTween.stop();
    this._broomTween = this.tweens.add({
      targets: this._broomSp,
      rotation: { from: -0.4, to: 0.2 },
      duration: 350, yoyo: true, repeat: -1,
    });
  }

  _updateYoungmiTracker(dt) {
    if (!this._youngmiSp || !this._activeStone) return;
    const s = this._activeStone;
    const tx = s.x - 48, ty = s.y + 4;
    this._youngmiSp.x = Phaser.Math.Linear(this._youngmiSp.x, tx, 0.18 * dt);
    this._youngmiSp.y = Phaser.Math.Linear(this._youngmiSp.y, ty, 0.18 * dt);
    this._broomSp.x   = this._youngmiSp.x + 26;
    this._broomSp.y   = this._youngmiSp.y + 8;
  }

  _onSweepTap() {
    const now = this.time.now;
    this._recentTaps.push(now);
    this._recentTaps = this._recentTaps.filter(t => now - t <= SWEEP_WIN);
    this._sweepCount++;
    this._lastTapAt = now;

    const n = this._recentTaps.length;
    this._sweepMul = Math.max(0.45, 1.0 - (n - 1) * 0.08);
    if (this._broomTween) this._broomTween.timeScale = Math.min(3.5, 1 + n * 0.28);

    this._sayYoungmi();
    this._playBeep(640 + Math.random() * 160, 65);
    this._spawnDust();
  }

  _sayYoungmi() {
    if (!this._youngmiSp) return;
    const phrases = ['영미!', '영미~!', '영미!!', '영미영미!', '화이팅!'];
    const t = this.add.text(
      this._youngmiSp.x + (Math.random() - 0.5) * 20,
      this._youngmiSp.y - 34,
      phrases[Math.floor(Math.random() * phrases.length)],
      { fontSize: '18px', color: '#ffee66', stroke: '#000', strokeThickness: 4, fontFamily: 'monospace', fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(35);
    this.tweens.add({ targets: t, y: t.y - 28, alpha: 0, duration: 650, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  _spawnDust() {
    if (!this._activeStone) return;
    const s = this._activeStone;
    for (let i = 0; i < 4; i++) {
      const d = this.add.image(s.x + (Math.random() - 0.5) * 12, s.y + (Math.random() - 0.5) * 10, 'sweep-dust')
        .setDepth(18).setAlpha(0.7).setDisplaySize(8 + Math.random() * 6, 8 + Math.random() * 6);
      this.tweens.add({ targets: d, x: d.x - 18 - Math.random() * 12, alpha: 0, duration: 400, onComplete: () => d.destroy() });
    }
  }

  // ─── 영미! 팝업 (플레이어 투척 시만) ─────────────────────────
  _showYoungmiPopup() {
    const ctr = this.add.container(400, 300).setDepth(95).setScrollFactor(0);

    if (this._hasYoungmiImg) {
      const img = this.add.image(0, -30, 'youngmi-cheer').setDisplaySize(180, 180);
      ctr.add(img);
    }
    const txt = this.add.text(0, this._hasYoungmiImg ? 70 : 0, '영미!  영미!', {
      fontSize: '44px', color: '#ffee44', fontStyle: 'bold', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 7,
    }).setOrigin(0.5);
    const sub = this.add.text(0, this._hasYoungmiImg ? 118 : 54, '스위핑 하세요!! 📳', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    ctr.add([txt, sub]);

    ctr.setScale(0);
    this.tweens.add({ targets: ctr, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: ctr, scale: 0, alpha: 0, duration: 250, ease: 'Quad.easeIn', onComplete: () => ctr.destroy() });
    });
  }

  // ─── 정착 ─────────────────────────────────────────────────
  _settle() {
    this._state = S.SETTLING;
    this._setHUDVisible(false);

    // 영미 트래커 퇴장
    if (this._youngmiSp) {
      this.tweens.add({
        targets: [this._youngmiSp, this._broomSp].filter(Boolean), alpha: 0, duration: 350,
        onComplete: () => {
          if (this._youngmiSp) { this._youngmiSp.destroy(); this._youngmiSp = null; }
          if (this._broomSp)   { this._broomSp.destroy();   this._broomSp = null; }
          if (this._broomTween) { this._broomTween.stop(); this._broomTween = null; }
        },
      });
    }

    if (this._activeStone) {
      // 원거리 호그 라인 위반 체크: 돌이 hogFar(172)을 못 넘었으면 제거
      if (this._activeStone.inPlay && this._activeStone.y > RK.hogFar) {
        this._activeStone.inPlay = false;
        this._floatText(this._activeStone.x, this._activeStone.y - 32, '호그 라인!', '#ff8800', 15);
        const _hogSp = this._activeStone.sprite;
        if (_hogSp) {
          this.tweens.add({
            targets: _hogSp,
            alpha: 0, scaleX: 1.5, scaleY: 1.5,
            duration: 350,
            onComplete: () => { if (_hogSp && _hogSp.active) _hogSp.setVisible(false); }
          });
        }
      }

      // 팀별 배열에 추가
      if (this._activeStone.team === 'player') {
        this._playerStones.push(this._activeStone);
      } else {
        this._aiStones.push(this._activeStone);
      }
      this._endStones.push(this._activeStone);
      this._activeStone = null;
    }

    this._camGo(CAM.house);
    this.time.delayedCall(CAM.house.dur + 100, () => this._advanceTurn());
  }

  // ─── 턴 진행 & 엔드 점수 계산 ────────────────────────────
  _advanceTurn() {
    this._throwIdx++;

    this.time.delayedCall(900, () => {
      if (this._throwIdx >= STONES_PER_END * 2) {
        // 엔드 완료 → 점수 계산
        this._scoreEnd();
      } else {
        this._enterOverview();
      }
    });
  }

  _scoreEnd() {
    const dist = s => {
      const dx = s.x - RK.houseCx, dy = s.y - RK.houseCy;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // 하우스 안에 있는 돌만 (inPlay && 거리 <= ringBlue), 거리순 정렬
    const inHouse = arr =>
      arr.filter(s => s.inPlay && dist(s) <= RK.ringBlue)
         .sort((a, b) => dist(a) - dist(b));

    const pStones = inHouse(this._playerStones);
    const aStones = inHouse(this._aiStones);

    let endTeam = null, endPts = 0;

    if (pStones.length === 0 && aStones.length === 0) {
      // 블랭크 엔드
    } else if (pStones.length === 0) {
      endTeam = 'ai';
      endPts  = aStones.length;
    } else if (aStones.length === 0) {
      endTeam = 'player';
      endPts  = pStones.length;
    } else {
      // 실제 컬링 점수: 가장 가까운 돌 비교
      const pNear = dist(pStones[0]);
      const aNear = dist(aStones[0]);
      if (pNear < aNear) {
        endTeam = 'player';
        // 상대 최근접 돌보다 가까운 자기 돌 수
        endPts  = pStones.filter(s => dist(s) < aNear).length;
      } else {
        endTeam = 'ai';
        endPts  = aStones.filter(s => dist(s) < pNear).length;
      }
    }

    // 점수 누적
    if (endTeam === 'player') this._playerScore += endPts;
    else if (endTeam === 'ai') this._aiScore += endPts;

    // 득점 돌에 플로팅 텍스트
    if (endTeam === 'player') {
      pStones.slice(0, endPts).forEach(s =>
        this._floatText(s.x, s.y - 28, '+1', '#ff5555', 20));
    } else if (endTeam === 'ai') {
      aStones.slice(0, endPts).forEach(s =>
        this._floatText(s.x, s.y - 28, '+1', '#4499ff', 20));
    }

    this.time.delayedCall(700, () => this._showEndBanner(endTeam, endPts));
  }

  _showEndBanner(endTeam, endPts) {
    const ctr = this.add.container(400, 300).setDepth(90).setScrollFactor(0);
    const bg  = this.add.rectangle(0, 0, 500, 210, 0x06101e, 0.94)
      .setStrokeStyle(3, 0xffdd66, 0.9);

    let titleTxt, titleCol;
    if (!endTeam) {
      titleTxt = `END ${this._endIdx}  블랭크 엔드`;
      titleCol = '#aaaaaa';
    } else if (endTeam === 'player') {
      titleTxt = `END ${this._endIdx}  🔴 +${endPts}점!`;
      titleCol = '#ff9988';
    } else {
      titleTxt = `END ${this._endIdx}  🔵 +${endPts}점!`;
      titleCol = '#88aaff';
    }

    const t1 = this.add.text(0, -62, titleTxt, {
      fontSize: '22px', color: titleCol, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    const t2 = this.add.text(0, -10, `🔴  ${this._playerScore}  :  ${this._aiScore}  🔵`, {
      fontSize: '30px', color: '#ffdd66', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    const t3 = this.add.text(0, 48,
      this._endIdx < TOTAL_ENDS ? `다음 END ${this._endIdx + 1}/${TOTAL_ENDS}` : '마지막 엔드!', {
      fontSize: '15px', color: '#88ccff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    ctr.add([bg, t1, t2, t3]);
    ctr.setScale(0);
    this.tweens.add({ targets: ctr, scale: 1, duration: 260, ease: 'Back.easeOut' });

    this.time.delayedCall(2400, () => {
      this.tweens.add({ targets: ctr, alpha: 0, duration: 280, onComplete: () => {
        ctr.destroy(); this._nextEnd();
      }});
    });
  }

  _nextEnd() {
    // 이번 엔드 돌 스프라이트 정리
    for (const s of this._endStones) { if (s.sprite) s.sprite.destroy(); }
    this._endStones    = [];
    this._playerStones = [];
    this._aiStones     = [];
    this._throwIdx     = 0;
    this._endIdx++;
    if (this._endIdx > TOTAL_ENDS) this._showResult();
    else this._enterOverview();
  }

  // ─── 결과 화면 ────────────────────────────────────────────
  _showResult() {
    this._state = S.RESULT;
    this._camGo(CAM.wide);
    this._aimGfx.clear();
    this._setHUDVisible(false);

    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.82)
      .setDepth(100).setScrollFactor(0);

    const playerWins = this._playerScore > this._aiScore;
    const tie        = this._playerScore === this._aiScore;
    let resultTxt, resultCol;
    if (tie) {
      resultTxt = '🤝  무  승  부';  resultCol = '#ffffff';
    } else if (playerWins) {
      resultTxt = this._gameMode === 'duo' ? '🏆  🔴 1P  승리!' : '🏆  승  리  !';
      resultCol = '#ffdd66';
    } else {
      resultTxt = this._gameMode === 'duo' ? '🏆  🔵 2P  승리!' : '😢  패  배  …';
      resultCol = this._gameMode === 'duo' ? '#88aaff' : '#ff8866';
    }

    [
      { y: 120, txt: '🥌  게 임  종 료  🥌',                       fs: '28px', col: '#ffdd66' },
      { y: 178, txt: resultTxt,                                      fs: '36px', col: resultCol },
      { y: 248, txt: `🔴  ${this._playerScore}  :  ${this._aiScore}  🔵`, fs: '34px', col: '#ffffff' },
      { y: 304, txt: `"영미!" 외침: ${this._sweepCount}회`,         fs: '15px', col: '#88ddff' },
    ].forEach(({ y, txt, fs, col }) => {
      this.add.text(400, y, txt, {
        fontSize: fs, color: col, fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
    });

    if (this._hasYoungmiImg) {
      this.add.image(400, 420, 'youngmi-cheer')
        .setDisplaySize(110, 110).setDepth(101).setScrollFactor(0).setAlpha(0.9);
    }

    const mkBtn = (y, label, col, fn) => {
      const b = this.add.rectangle(400, y, 270, 52, col, 0.95)
        .setStrokeStyle(2, 0xaaaaff, 0.7).setDepth(102).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      this.add.text(400, y, label, {
        fontSize: '18px', color: '#fff', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
      b.on('pointerdown', fn);
      b.on('pointerover', () => b.setAlpha(0.75));
      b.on('pointerout',  () => b.setAlpha(0.95));
    };
    mkBtn(500, '🔄  다시하기 (R)', 0x1a3a6a, () => this._restart());
    mkBtn(562, '⬅  나가기',        0x3a1a1a, () => this._goBack());
  }

  // ─── 카메라 ───────────────────────────────────────────────
  _camGo({ x, y, zoom, dur }) {
    const cam = this.cameras.main;
    cam.pan(x, y, dur, 'Sine.easeInOut', true);
    cam.zoomTo(zoom, dur, 'Sine.easeInOut', true);
  }

  // ─── 유틸 ─────────────────────────────────────────────────
  _showPowerBar(v) {
    if (v) {
      const z = CAM.throw.zoom;
      const sc = 1 / z;
      const bgP  = this._toUI(400, 575, z);
      const filP = this._toUI(280, 575, z);
      const labP = this._toUI(400, 558, z);

      this._powerBg.setPosition(bgP.x, bgP.y).setScale(sc);
      this._powerFill.setPosition(filP.x, filP.y).setScale(sc);
      this._powerLabel.setPosition(labP.x, labP.y).setScale(sc);
      this._powerFill.width = 0;
    }
    this._powerBg.setVisible(v);
    this._powerFill.setVisible(v);
    this._powerLabel.setVisible(v);
    if (!v) this._powerFill.width = 0;
  }

  // ─── 미니맵 ───────────────────────────────────────────────
  // AIMING/CHARGING 시 우측 사이드 패널에 링크 전경 + 돌 위치 표시
  //
  // [scrollFactor=0 + zoom 보정 원리]
  // scrollFactor=0 오브젝트의 화면↔world 변환:
  //   screen = VCX + (world - VCX) * zoom
  //   world  = VCX + (screen - VCX) / zoom   ← _toUI() 와 동일
  // 따라서 Graphics.fillRect 등의 world 좌표를 _toUI()로 변환해야 올바른 화면 위치에 그려짐.
  _drawMiniMap() {
    const g = this._miniMapGfx;
    g.clear();

    const show = (this._state === S.AIMING || this._state === S.CHARGING);
    this._miniMapLbl.setVisible(show);
    if (!show) return;

    const z = this.cameras.main.zoom;   // AIMING/CHARGING = 2.4
    // screen → world 변환 헬퍼 (scrollFactor=0 기준)
    const tWX = (sx) => VCX + (sx - VCX) / z;
    const tWY = (sy) => VCY + (sy - VCY) / z;

    // 미니맵이 차지할 화면 영역 (screen 좌표)
    const SX = 618, SY = 55;   // screen top-left
    const SW = 155, SH = 200;  // screen size (px)

    // 해당 영역의 world 좌표 (Graphics 드로잉에 사용)
    const wx0 = tWX(SX),       wy0 = tWY(SY);
    const wx1 = tWX(SX + SW),  wy1 = tWY(SY + SH);
    const ww = wx1 - wx0,      wh = wy1 - wy0;

    // 링크 world → 미니맵 world 배율
    const rW = RK.right - RK.left;   // 256
    const rH = RK.bottom - RK.top;   // 490
    const sc = Math.min(ww / rW, wh / rH);
    // X 방향 여백으로 중앙 정렬
    const offX = (ww - rW * sc) / 2;
    const offY = 0;

    // 링크 world 좌표 → 미니맵 world 좌표
    const rwx = (lx) => wx0 + offX + (lx - RK.left) * sc;
    const rwy = (ly) => wy0 + offY + (ly - RK.top)  * sc;
    const lw  = 1.5 / z;   // line width (screen px 기준으로 일정하게)

    // 배경 + 테두리
    g.fillStyle(0x060e1f, 0.94);
    g.fillRoundedRect(wx0 - 2/z, wy0 - 2/z, ww + 4/z, wh + 4/z, 4/z);
    g.lineStyle(lw, 0x3366aa, 0.8);
    g.strokeRoundedRect(wx0 - 2/z, wy0 - 2/z, ww + 4/z, wh + 4/z, 4/z);

    // 빙판
    g.fillStyle(0xd6eaf8, 0.90);
    g.fillRect(wx0, wy0, ww, wh);

    // 하우스 링
    const hcx = rwx(RK.houseCx), hcy = rwy(RK.houseCy);
    g.fillStyle(0x1e5fd1); g.fillCircle(hcx, hcy, RK.ringBlue   * sc);
    g.fillStyle(0xfafafa); g.fillCircle(hcx, hcy, RK.ringWhite  * sc);
    g.fillStyle(0xcc2020); g.fillCircle(hcx, hcy, RK.ringRed    * sc);
    g.fillStyle(0xf5c830); g.fillCircle(hcx, hcy, Math.max(1/z, RK.button * sc));

    // 센터 라인
    g.lineStyle(0.5/z, 0x336688, 0.3);
    g.beginPath(); g.moveTo(rwx(RK.cx), wy0); g.lineTo(rwx(RK.cx), wy0 + wh); g.strokePath();

    // 백 라인
    g.lineStyle(lw * 0.7, 0x2255aa, 0.55);
    g.beginPath(); g.moveTo(wx0, rwy(RK.backY)); g.lineTo(wx0 + ww, rwy(RK.backY)); g.strokePath();

    // 호그 라인 (원/근거리)
    g.lineStyle(lw * 0.8, 0xff8800, 0.85);
    g.beginPath(); g.moveTo(wx0, rwy(RK.hogFar));  g.lineTo(wx0 + ww, rwy(RK.hogFar));  g.strokePath();
    g.beginPath(); g.moveTo(wx0, rwy(RK.hogNear)); g.lineTo(wx0 + ww, rwy(RK.hogNear)); g.strokePath();

    // 해크(투척) 라인
    g.lineStyle(lw, 0xdd2233, 0.75);
    g.beginPath(); g.moveTo(wx0, rwy(RK.throwY)); g.lineTo(wx0 + ww, rwy(RK.throwY)); g.strokePath();

    // 정착된 돌
    const stR = Math.max(2/z, STONE_R * sc);
    for (const s of this._endStones) {
      if (!s.inPlay) continue;
      g.fillStyle(s.team === 'player' ? 0xdd2233 : 0x2244cc);
      g.fillCircle(rwx(s.x), rwy(s.y), stR);
      g.lineStyle(0.7/z, 0xffffff, 0.6);
      g.strokeCircle(rwx(s.x), rwy(s.y), stR);
    }

    // 활성 돌 + 조준선
    if (this._activeStone) {
      const col = this._activeStone.team === 'player' ? 0xff4455 : 0x4466ff;
      g.fillStyle(col);
      g.fillCircle(rwx(this._activeStone.x), rwy(this._activeStone.y), stR);
      g.lineStyle(lw, 0xffffff, 1.0);
      g.strokeCircle(rwx(this._activeStone.x), rwy(this._activeStone.y), stR);

      // 조준선 (직선 위 + 각도 오프셋)
      const rad = this._calcAimRad();
      const adx = Math.sin(rad), ady = -Math.cos(rad);
      const ax = rwx(this._activeStone.x), ay = rwy(this._activeStone.y);
      g.lineStyle(lw * 0.7, 0xffaa22, 0.75);
      g.beginPath();
      g.moveTo(ax, ay);
      g.lineTo(ax + adx * wh * 0.8, ay + ady * wh * 0.8);
      g.strokePath();
    }

    // 미니맵 라벨 위치 갱신
    const lp = this._toUI(SX + SW / 2, SY - 1, z);
    this._miniMapLbl.setPosition(lp.x, lp.y).setScale(1 / z);
  }

  _floatText(x, y, text, color = '#fff', fs = 22) {
    const t = this.add.text(x, y, text, {
      fontSize: `${fs}px`, color, stroke: '#000', strokeThickness: 4, fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 1200, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  _playBeep(freq, ms) {
    try {
      if (!this._audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this._audioCtx = new AC();
      }
      const ctx = this._audioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = freq;
      gain.gain.value = 0.05;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      osc.stop(ctx.currentTime + ms / 1000 + 0.01);
    } catch (e) { /* ignore */ }
  }

  _restart() { this.scene.restart(); }

  _goBack() {
    if (this.returnTo) { this.scene.start(this.returnTo); return; }
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('mode');
      window.history.replaceState({}, '', u.toString());
    } catch (e) { /**/ }
    this.scene.start('MathScene');
  }
}
