// BootScene - 게임 초기화 및 텍스처 생성
// 실제 에셋이 없는 동안 모든 텍스처를 Phaser Graphics로 직접 생성합니다.

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('room1-bg', '/assets/math-bg.jpg');
    this.load.image('room2-bg', '/assets/room2-bg.jpg');
    this.load.image('room3-bg', '/assets/room3-bg.jpg');
    this.load.image('room4-bg', '/assets/room4-bg.jpg');
    this.load.image('treasure-bg', '/assets/treasure-bg.png');
    this.load.image('hero',     '/assets/characters/hero.png');
    this.load.image('hero-lv2', '/assets/characters/hero-lv2.png');
    this.load.image('hero-lv3', '/assets/characters/hero-lv3.png');
    this.load.image('hero-lv4', '/assets/characters/hero-lv4.png');

    // 몬스터 정적 이미지 (128×128, 첫 번째 프레임)
    this.load.image('monster-slime',    '/assets/characters/monster-slime.png');
    this.load.image('monster-goblin',   '/assets/characters/monster-goblin.png');
    this.load.image('monster-orc',      '/assets/characters/monster-orc.png');
    this.load.image('monster-witch',    '/assets/characters/monster-witch.png');
    this.load.image('monster-skeleton', '/assets/characters/monster-skeleton.png');
    this.load.image('monster-dragon',   '/assets/characters/monster-dragon.png');
    this.load.image('monster-boss',     '/assets/characters/monster-boss.png');
  }

  create() {
    console.log('🎮 mumusubject 시작 중...');

    // boss-good 변신 텍스처만 프로시저럴 생성 (외부 에셋 없음)
    this._makeBossGoodMonster();
    this.createDustTexture();
    this.createCurlingTextures();

    this.scene.start(this._resolveInitialScene());
  }

  // ─── URL `?mode=curling` 파라미터로 초기 씬 분기 ─────────
  _resolveInitialScene() {
    const mode = new URLSearchParams(window.location.search).get('mode');
    return mode === 'curling' ? 'CurlingScene' : 'MathScene';
  }

  // 80/96 → 128×128 업스케일 (실제 에셋 교체 시 스케일 동일하게 유지)
  _finalize(tmpKey, finalKey, srcSize) {
    const scale = 128 / srcSize;
    const img = this.add.image(0, 0, tmpKey).setOrigin(0, 0).setScale(scale);
    const rt  = this.add.renderTexture(0, 0, 128, 128);
    rt.draw(img, 0, 0);
    rt.saveTexture(finalKey);
    img.destroy();
    rt.destroy();
    this.textures.remove(tmpKey);
  }


  // 착한 보스 — 황금 매스 킹 (변신 후, 96×96)
  _makeBossGoodMonster() {
    const g = this.add.graphics();

    // 황금 오라
    g.fillStyle(0xffdd44, 0.25);
    g.fillCircle(32, 38, 34);

    // 그림자
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(32, 63, 56, 13);

    // 망토 날개 (밝은)
    g.fillStyle(0xff8800, 0.5);
    g.fillTriangle(6, 46, 20, 30, 22, 52);
    g.fillTriangle(58, 46, 44, 30, 42, 52);
    g.fillStyle(0xffcc44, 0.35);
    g.fillTriangle(8, 46, 20, 32, 21, 50);
    g.fillTriangle(56, 46, 44, 32, 43, 50);

    // 몸 아웃라인
    g.fillStyle(0x885500);
    g.fillCircle(32, 44, 28);
    // 몸 음영
    g.fillStyle(0xcc8800);
    g.fillCircle(34, 45, 26);
    // 몸 메인
    g.fillStyle(0xffaa00);
    g.fillCircle(30, 42, 24);
    // 몸 하이라이트
    g.fillStyle(0xffdd66);
    g.fillEllipse(23, 34, 20, 13);
    g.fillStyle(0xffee99, 0.55);
    g.fillEllipse(20, 31, 10, 7);

    // 후광 링
    g.fillStyle(0xffffcc, 0.78);
    g.fillEllipse(32, 5, 34, 11);
    g.fillStyle(0xffaa00);
    g.fillEllipse(32, 5, 24, 6);

    // 왕관 베이스 (밝은 주황-금)
    g.fillStyle(0xcc6600);
    g.fillRect(15, 17, 34, 9);
    g.fillStyle(0xff8800);
    g.fillRect(16, 18, 32, 7);
    g.fillStyle(0xffcc44);
    g.fillRect(17, 18, 30, 4);

    // 왕관 스파이크 5개
    g.fillStyle(0xcc6600);
    g.fillTriangle(16, 26, 18, 10, 22, 26);
    g.fillTriangle(22, 26, 25, 13, 28, 26);
    g.fillTriangle(28, 26, 32, 4,  36, 26);
    g.fillTriangle(36, 26, 39, 13, 42, 26);
    g.fillTriangle(42, 26, 46, 10, 48, 26);
    g.fillStyle(0xffaa33);
    g.fillTriangle(17, 26, 19, 12, 21, 26);
    g.fillTriangle(29, 26, 32, 6,  35, 26);
    g.fillTriangle(43, 26, 47, 12, 47, 26);

    // 왕관 보석 (밝고 화사하게)
    g.fillStyle(0xff44aa);
    g.fillCircle(19, 21, 3);
    g.fillStyle(0x44ffcc);
    g.fillCircle(32, 21, 3.5);
    g.fillStyle(0xff44aa);
    g.fillCircle(45, 21, 3);
    g.fillStyle(0xffffff, 0.65);
    g.fillCircle(18, 20, 1.3);
    g.fillCircle(31, 20, 1.5);
    g.fillCircle(44, 20, 1.3);

    // 볼터치 (핑크 홍조)
    g.fillStyle(0xff9999, 0.5);
    g.fillCircle(15, 47, 8);
    g.fillCircle(49, 47, 8);

    // 눈 (행복한 ^ 초승달)
    g.fillStyle(0x664400);
    g.fillEllipse(23, 42, 13, 8);
    g.fillEllipse(41, 42, 13, 8);
    g.fillStyle(0xffaa00); // 위 가리기
    g.fillEllipse(23, 39, 15, 8);
    g.fillEllipse(41, 39, 15, 8);

    // 웃는 입 (U자)
    g.fillStyle(0x664400);
    g.fillEllipse(32, 54, 22, 13);
    g.fillStyle(0xffaa00);
    g.fillEllipse(32, 49, 24, 13);
    // 이빨
    g.fillStyle(0xffffff);
    g.fillRect(24, 52, 16, 5);
    g.fillStyle(0xffaa00);
    g.fillRect(25, 52, 2, 2);
    g.fillRect(29, 52, 2, 2);
    g.fillRect(33, 52, 2, 2);
    g.fillRect(37, 52, 2, 2);

    // 반짝이 별
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(6, 13, 3.5);
    g.fillCircle(58, 13, 3.5);
    g.fillCircle(4, 55, 2.5);
    g.fillCircle(60, 55, 2.5);
    g.fillStyle(0xffee88, 0.7);
    g.fillCircle(6, 13, 2);
    g.fillCircle(58, 13, 2);

    g.generateTexture('_tmp_boss_good', 96, 96);
    g.destroy();
    this._finalize('_tmp_boss_good', 'monster-boss-good', 96);
  }

  // ─── 먼지 파티클 텍스처 ──────────────────────────────────
  createDustTexture() {
    const g = this.add.graphics();
    g.fillStyle(0xaaaacc, 0.6);
    g.fillCircle(4, 4, 4);
    g.generateTexture('dust', 8, 8);
    g.destroy();
  }

  // ─── 컬링 전용 텍스처 ─────────────────────────────────────
  createCurlingTextures() {
    this._makeStone('stone-red',  0xcc2233, 0x881122, 0xff6677);
    this._makeStone('stone-blue', 0x2244cc, 0x112288, 0x5588ff);
    this._makeBroom();
    this._makeYoungmi();
    this._makeSweepDust();
  }

  // 컬링 스톤 (위에서 내려다본 뷰, 48×48)
  // handle = 손잡이 기본색, dark = 손잡이 어두운색, light = 손잡이 밝은색
  // 돌 본체는 화강암 회색으로 고정 — 손잡이 색으로 팀 구분
  _makeStone(key, handle, dark, light) {
    const g = this.add.graphics();
    const cx = 24, cy = 24;

    // ── 바닥 그림자 ───────────────────────────────────────────
    g.fillStyle(0x000000, 0.40);
    g.fillEllipse(cx + 2, cy + 5, 44, 12);

    // ── 화강암 본체 외곽 어두운 테두리 ───────────────────────
    g.fillStyle(0x111118, 1.0);
    g.fillCircle(cx, cy, 23);

    // ── 화강암 베이스 (스코틀랜드 Ailsa Craig 화강암 느낌) ────
    g.fillStyle(0x2a2a38, 1.0);
    g.fillCircle(cx, cy, 21);
    // 중간 톤
    g.fillStyle(0x353545, 1.0);
    g.fillCircle(cx, cy, 18);

    // ── 화강암 결정 무늬 (더 선명하게) ───────────────────────
    const spots = [
      [15, 16, 3.5, 0x44445a, 0.90], [30, 20, 3.0, 0x44445a, 0.85],
      [20, 31, 2.8, 0x484860, 0.80], [33, 13, 2.4, 0x42425a, 0.75],
      [12, 30, 2.2, 0x42425a, 0.75], [27, 30, 2.5, 0x464660, 0.80],
      [16, 12, 2.0, 0x42425a, 0.70], [33, 31, 1.8, 0x42425a, 0.65],
      [22, 26, 1.6, 0x50506a, 0.60], [18, 22, 1.4, 0x50506a, 0.55],
    ];
    spots.forEach(([x, y, r, col, a]) => { g.fillStyle(col, a); g.fillCircle(x, y, r); });
    // 밝은 미네랄 반짝임
    [[20, 17, 1.4, 0xc0c0dc, 0.38], [31, 24, 1.1, 0xc0c0dc, 0.32],
     [15, 27, 1.0, 0xc0c0dc, 0.28], [27, 15, 0.9, 0xd0d0e8, 0.25]].forEach(([x, y, r, c, a]) => {
      g.fillStyle(c, a); g.fillCircle(x, y, r);
    });

    // ── 본체 내부 홈 링 (실제 컬링 스톤 특징) ────────────────
    g.lineStyle(2.0, 0x1a1a24, 0.90);
    g.strokeCircle(cx, cy, 14);
    g.lineStyle(1.2, 0x1a1a24, 0.60);
    g.strokeCircle(cx, cy, 8);
    // 홈 안쪽 밝은 링 (깊이감)
    g.lineStyle(0.8, 0x555566, 0.40);
    g.strokeCircle(cx, cy, 13);

    // ── 손잡이 색 밴드 (가로, 팀 컬러) ──────────────────────
    // 다크 기저
    g.fillStyle(dark, 1.0);
    g.fillRoundedRect(4, 14, 40, 11, 4);
    // 메인 색
    g.fillStyle(handle, 1.0);
    g.fillRoundedRect(5, 13, 38, 10, 3.5);
    // 상단 하이라이트 줄
    g.fillStyle(light, 0.65);
    g.fillRoundedRect(7, 13, 18, 3.5, 2);
    // 하단 그림자 줄
    g.fillStyle(dark, 0.55);
    g.fillRoundedRect(7, 20, 34, 2, 1);
    // 밴드 외곽선
    g.lineStyle(1.2, dark, 0.80);
    g.strokeRoundedRect(5, 13, 38, 10, 3.5);

    // ── 핸들 (상단 돌출) ─────────────────────────────────────
    g.fillStyle(dark, 1.0);
    g.fillRoundedRect(16, 2, 16, 14, 5);
    g.fillStyle(handle, 1.0);
    g.fillRoundedRect(17, 1, 14, 13, 4.5);
    // 핸들 상단 하이라이트
    g.fillStyle(light, 0.85);
    g.fillRoundedRect(18, 2, 6, 3.5, 2);
    g.fillStyle(light, 0.45);
    g.fillRoundedRect(18, 6, 9, 3, 1.5);
    // 핸들 외곽선
    g.lineStyle(1.0, dark, 0.75);
    g.strokeRoundedRect(17, 1, 14, 13, 4.5);
    // 나사 (금속 느낌)
    g.fillStyle(0x0a0a12, 0.85);
    g.fillCircle(cx, 7.5, 3.2);
    g.fillStyle(dark, 0.90);
    g.fillCircle(cx, 7.5, 2.2);
    g.fillStyle(light, 0.70);
    g.fillCircle(cx - 0.5, 7.0, 1.1);
    // 나사 십자홈
    g.lineStyle(0.8, 0x0a0a12, 0.8);
    g.beginPath();
    g.moveTo(cx - 1.8, 7.5); g.lineTo(cx + 1.8, 7.5);
    g.moveTo(cx, 5.7);       g.lineTo(cx, 9.3);
    g.strokePath();

    // ── 본체 광택 (왼쪽 위 반사광) ──────────────────────────
    g.fillStyle(0xffffff, 0.16);
    g.fillEllipse(cx - 7, cy - 7, 16, 9);
    g.fillStyle(0xffffff, 0.07);
    g.fillEllipse(cx, cy, 34, 22);

    // ── 최종 외곽선 ──────────────────────────────────────────
    g.lineStyle(2.0, 0x08080e, 1.0);
    g.strokeCircle(cx, cy, 22);

    g.generateTexture(key, 48, 48);
    g.destroy();
  }

  // 빗자루/브룸 (24×64) — 실제 컬링 브룸 느낌
  _makeBroom() {
    const g = this.add.graphics();
    // 자루 (나무, 약간 둥근 느낌)
    g.fillStyle(0x4a2e14, 1.0);
    g.fillRoundedRect(9, 0, 6, 44, 2);
    g.fillStyle(0x7a4a28, 1.0);
    g.fillRoundedRect(10, 0, 3, 44, 2);
    g.fillStyle(0xa06030, 0.4);
    g.fillRect(10, 2, 1, 40);

    // 자루-헤드 연결부 (검은 밴드)
    g.fillStyle(0x1a1a1a, 0.9);
    g.fillRoundedRect(7, 40, 10, 4, 1);
    g.fillStyle(0x444444, 0.5);
    g.fillRect(8, 41, 8, 1);

    // 브룸 헤드 본체
    g.fillStyle(0x224488, 1.0);   // 파란 합성 브룸 패드
    g.fillRoundedRect(1, 43, 22, 12, 3);
    g.fillStyle(0x3366bb, 1.0);
    g.fillRoundedRect(2, 43, 20, 9, 2.5);
    // 헤드 하이라이트
    g.fillStyle(0x88aadd, 0.5);
    g.fillRoundedRect(3, 44, 10, 3, 1.5);

    // 브룸 빗살 (하단, 실제 빗자루 형태)
    g.fillStyle(0x1a3366, 0.8);
    for (let i = 2; i <= 20; i += 2) {
      g.fillRect(i, 54, 1.5, 10 - (i % 4));
    }
    // 빗살 끝 라인
    g.lineStyle(1, 0x0a1a44, 0.6);
    g.beginPath();
    g.moveTo(1, 55); g.lineTo(23, 55);
    g.strokePath();

    g.generateTexture('broom', 24, 66);
    g.destroy();
  }

  // 영미 캐릭터 (128×128) — _makeKid로 베이스 만들고 빨간 머리띠 덧입힘
  _makeYoungmi() {
    // _makeKid는 내부적으로 _finalize를 호출해 128×128 텍스처를 최종 키로 남김
    this._makeKid('youngmi-base', {
      hair: 0x3a2820, hairDark: 0x1a0f08, hairLight: 0x5a3c28,
      shirt: 0xee3344, shirtDark: 0x991122, shirtLight: 0xff6677,
      pants: 0x222233, pantsDark: 0x111122,
      shoes: 0x1a0a00, shoeDark: 0x0d0500,
      eye: 0x3d2010,  eyeDark: 0x0d0600,
      decoCount: 0,
    });

    const baseImg = this.add.image(0, 0, 'youngmi-base').setOrigin(0, 0);
    const rt = this.add.renderTexture(0, 0, 128, 128);
    rt.draw(baseImg, 0, 0);

    // 빨간 머리띠 + 응원 리본 (128 좌표계)
    const band = this.add.graphics();
    band.fillStyle(0xee2233);
    band.fillRoundedRect(38, 8, 52, 10, 4);
    band.fillStyle(0xff6677);
    band.fillRoundedRect(40, 9, 48, 3, 2);
    band.fillStyle(0xee2233);
    band.fillTriangle(38, 12, 32, 8, 32, 20);
    band.fillTriangle(90, 12, 96, 8, 96, 20);
    rt.draw(band, 0, 0);

    rt.saveTexture('youngmi');
    baseImg.destroy();
    band.destroy();
    rt.destroy();
    this.textures.remove('youngmi-base');
  }

  // 스위핑 먼지 (10×10)
  _makeSweepDust() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(5, 5, 4);
    g.fillStyle(0xddddff, 0.5);
    g.fillCircle(5, 5, 5);
    g.generateTexture('sweep-dust', 10, 10);
    g.destroy();
  }
}
