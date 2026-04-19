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
    // 컬링 게임 이미지 에셋 (없으면 Graphics 폴백)
    this.load.image('youngmi-cheer', '/assets/youngmi-cheer.png');
    this.load.image('stone-glossy',  '/assets/stone-glossy.png');
    this.load.image('ice-surface',   '/assets/ice-surface.png');
    this.load.image('curling-title', '/assets/curling-title.png');
  }

  create() {
    console.log('🎮 mumusubject 시작 중...');

    // 모든 게임 텍스처를 Graphics로 생성
    this.createPlayerTexture();
    this.createMonsterTextures();
    this.createDustTexture();
    this.createCurlingTextures();

    this.scene.start(this._resolveInitialScene());
  }

  // ─── URL `?mode=curling` 파라미터로 초기 씬 분기 ─────────
  _resolveInitialScene() {
    const mode = new URLSearchParams(window.location.search).get('mode');
    return mode === 'curling' ? 'CurlingScene' : 'MathScene';
  }

  // ─── 플레이어 텍스처 (SKILLS.md 학년별 학생 캐릭터, 80×80) ──
  createPlayerTexture() {
    // lv1 → 1~2학년: 주황 머리 + 흰 셔츠
    this._makeKid('player-lv1', {
      hair: 0xff8c00, hairDark: 0xcc5500, hairLight: 0xffaa33,
      shirt: 0xf2f2f2, shirtDark: 0xaaaaaa, shirtLight: 0xffffff,
      pants: 0x2255aa, pantsDark: 0x112266,
      shoes: 0x3d2010, shoeDark: 0x1a0a00,
      eye: 0x3d8844,  eyeDark: 0x0d1a0d,
      decoCount: 0,
    });
    // lv2 → 3학년: 핑크 머리 + 파란 셔츠
    this._makeKid('player-lv2', {
      hair: 0xff88aa, hairDark: 0xcc4477, hairLight: 0xffbbcc,
      shirt: 0x3399ee, shirtDark: 0x1155aa, shirtLight: 0x88ccff,
      pants: 0x224488, pantsDark: 0x112244,
      shoes: 0x3d2010, shoeDark: 0x1a0a00,
      eye: 0x2266cc,  eyeDark: 0x000d1a,
      decoCount: 1,
    });
    // lv3 → 5학년: 어두운 파란 머리 + 빨간 셔츠
    this._makeKid('player-lv3', {
      hair: 0x224488, hairDark: 0x112244, hairLight: 0x4466aa,
      shirt: 0xdd2233, shirtDark: 0x881122, shirtLight: 0xff5566,
      pants: 0x222233, pantsDark: 0x111122,
      shoes: 0x1a0a00, shoeDark: 0x0d0500,
      eye: 0x2255aa,  eyeDark: 0x0d1a33,
      decoCount: 2,
    });
    // lv4 → 6학년 레전드: 검은 머리 + 특별 외형
    this._makeKid('player-lv4', {
      hair: 0x1a1a33, hairDark: 0x0d0d1a, hairLight: 0x3333aa,
      shirt: 0x0d0d22, shirtDark: 0x08080f, shirtLight: 0x3333bb,
      pants: 0x0d0d1a, pantsDark: 0x080808,
      shoes: 0x0a0a00, shoeDark: 0x050500,
      eye: 0x8844cc,  eyeDark: 0x220033,
      decoCount: 3, aura: 0x8844cc,
    });
  }

  // ─── 학교 학생 캐릭터 (SKILLS.md 학년별, 80×80) ──────────
  _makeKid(key, c) {
    const g = this.add.graphics();

    // ── lv4 마법 오라 ─────────────────────────────────────────
    if (c.aura) {
      g.fillStyle(c.aura, 0.12); g.fillCircle(40, 48, 38);
      g.fillStyle(c.aura, 0.06); g.fillCircle(40, 48, 48);
    }

    // 그림자
    g.fillStyle(0x000000, 0.20);
    g.fillEllipse(40, 77, 38, 8);

    // ── 신발 ──────────────────────────────────────────────────
    g.fillStyle(c.shoeDark);
    g.fillRoundedRect(23, 67, 14, 10, 3); g.fillRoundedRect(43, 67, 14, 10, 3);
    g.fillStyle(c.shoes);
    g.fillRoundedRect(24, 66, 12, 9, 3); g.fillRoundedRect(44, 66, 12, 9, 3);
    g.fillStyle(0xffffff, 0.25);
    g.fillEllipse(28, 68, 7, 3); g.fillEllipse(48, 68, 7, 3);

    // ── 흰 양말 ───────────────────────────────────────────────
    g.fillStyle(0xfafafa);
    g.fillRect(25, 63, 10, 5); g.fillRect(45, 63, 10, 5);
    g.fillStyle(0xdddddd);
    g.fillRect(25, 65, 10, 2); g.fillRect(45, 65, 10, 2);

    // ── 바지 ──────────────────────────────────────────────────
    g.fillStyle(c.pantsDark);
    g.fillRoundedRect(23, 52, 34, 17, 4);
    g.fillStyle(c.pants);
    g.fillRoundedRect(24, 51, 32, 16, 4);
    g.fillStyle(c.pantsDark, 0.4);
    g.fillRect(39, 51, 2, 16);
    g.fillStyle(0xffffff, 0.10);
    g.fillEllipse(32, 55, 12, 8);

    // ── 셔츠 몸통 ─────────────────────────────────────────────
    g.fillStyle(c.shirtDark);
    g.fillRoundedRect(22, 31, 36, 22, 5);
    g.fillStyle(c.shirt);
    g.fillRoundedRect(23, 30, 34, 21, 5);
    g.fillStyle(c.shirtLight, 0.20);
    g.fillEllipse(30, 36, 14, 10);

    // ── 팔/소매 ───────────────────────────────────────────────
    g.fillStyle(c.shirtDark);
    g.fillRoundedRect(11, 32, 13, 20, 5);
    g.fillStyle(c.shirt);
    g.fillRoundedRect(12, 31, 12, 19, 5);
    g.fillStyle(c.shirtDark);
    g.fillRoundedRect(56, 32, 13, 20, 5);
    g.fillStyle(c.shirt);
    g.fillRoundedRect(57, 31, 12, 19, 5);
    // 커프스
    g.fillStyle(0xfafafa);
    g.fillRoundedRect(12, 47, 12, 5, 2); g.fillRoundedRect(57, 47, 12, 5, 2);
    // 손
    g.fillStyle(0xffcc99);
    g.fillCircle(17, 54, 6);
    g.fillStyle(0xffddaa);
    g.fillCircle(16, 53, 5);
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(14, 51, 2);
    g.fillStyle(0xffcc99);
    g.fillCircle(62, 54, 6);
    g.fillStyle(0xffddaa);
    g.fillCircle(61, 53, 5);

    // ── 셔츠 단추 ─────────────────────────────────────────────
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(40, 35, 2); g.fillCircle(40, 41, 2); g.fillCircle(40, 47, 2);
    g.fillStyle(c.shirtDark, 0.5);
    g.fillCircle(40, 35, 1.2); g.fillCircle(40, 41, 1.2); g.fillCircle(40, 47, 1.2);

    // ── 칼라 ──────────────────────────────────────────────────
    g.fillStyle(0xfafafa);
    g.fillTriangle(34, 30, 40, 38, 26, 32);
    g.fillTriangle(46, 30, 40, 38, 54, 32);
    g.fillStyle(0xdddddd, 0.5);
    g.fillRect(37, 30, 6, 8);

    // ── 목 ────────────────────────────────────────────────────
    g.fillStyle(0xffcc99);
    g.fillRect(36, 26, 8, 8);
    g.fillStyle(0xffddaa);
    g.fillRect(37, 27, 6, 7);

    // ── 머리 (피부) ───────────────────────────────────────────
    g.fillStyle(0xdd9966);
    g.fillCircle(40, 17, 16);
    g.fillStyle(0xffddbb);
    g.fillCircle(40, 16, 15);
    g.fillStyle(0xffeedd, 0.40);
    g.fillEllipse(33, 9, 12, 8);

    // ── 귀 ───────────────────────────────────────────────────
    g.fillStyle(0xffcc99);
    g.fillCircle(26, 17, 5); g.fillCircle(54, 17, 5);
    g.fillStyle(0xffddaa);
    g.fillCircle(26, 17, 3.5); g.fillCircle(54, 17, 3.5);
    g.fillStyle(0xff9999, 0.35);
    g.fillCircle(26, 17, 2); g.fillCircle(54, 17, 2);

    // ── 머리카락 ──────────────────────────────────────────────
    g.fillStyle(c.hairDark);
    g.fillEllipse(40, 7, 34, 22);
    g.fillStyle(c.hair);
    g.fillEllipse(40, 6, 30, 18);
    g.fillStyle(c.hair);
    g.fillEllipse(27, 14, 12, 16); g.fillEllipse(53, 14, 12, 16);
    g.fillStyle(c.hairDark, 0.6);
    g.fillEllipse(33, 11, 10, 8); g.fillEllipse(47, 11, 10, 8);
    g.fillStyle(c.hairLight, 0.35);
    g.fillEllipse(38, 4, 14, 8);
    g.fillStyle(0xffffff, 0.18);
    g.fillEllipse(35, 4, 10, 5);

    // ── 눈 (지브리 왕눈!) ─────────────────────────────────────
    const lx = 32, rx = 48, ey = 18;
    g.fillStyle(0xffffff);
    g.fillEllipse(lx, ey, 13, 10); g.fillEllipse(rx, ey, 13, 10);
    g.fillStyle(c.eye);
    g.fillEllipse(lx + 1, ey + 1, 9, 8); g.fillEllipse(rx + 1, ey + 1, 9, 8);
    g.fillStyle(c.eyeDark);
    g.fillEllipse(lx + 1, ey + 1, 5, 6); g.fillEllipse(rx + 1, ey + 1, 5, 6);
    g.fillStyle(0xffffff);
    g.fillCircle(lx - 1, ey - 1, 2.8); g.fillCircle(rx - 1, ey - 1, 2.8);
    g.fillCircle(lx + 3, ey + 2, 1.4); g.fillCircle(rx + 3, ey + 2, 1.4);
    g.fillStyle(0x221100);
    g.fillRoundedRect(lx - 6, ey - 6, 13, 3, 1);
    g.fillRoundedRect(rx - 6, ey - 6, 13, 3, 1);
    g.fillStyle(c.hairDark);
    g.fillRoundedRect(lx - 5, ey - 10, 11, 2.5, 1);
    g.fillRoundedRect(rx - 5, ey - 10, 11, 2.5, 1);

    // ── 코 & 입 ───────────────────────────────────────────────
    g.fillStyle(0xcc8855, 0.45);
    g.fillEllipse(40, 24, 5, 3);
    g.fillStyle(0xcc7755, 0.8);
    g.fillEllipse(40, 29, 12, 6);
    g.fillStyle(0xffddbb);
    g.fillEllipse(40, 27, 14, 7);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(35, 29, 10, 2);

    // ── 볼터치 ────────────────────────────────────────────────
    g.fillStyle(0xff8888, 0.28);
    g.fillCircle(24, 23, 6); g.fillCircle(56, 23, 6);

    // ── decoCount 1: 별 배지 + 머리핀 ────────────────────────
    if (c.decoCount >= 1) {
      g.fillStyle(0xffcc00);
      g.fillCircle(29, 38, 5);
      g.fillStyle(0xffee55);
      const bx = 29, by = 38, br = 4;
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
        g.fillTriangle(
          bx + Math.cos(a) * br, by + Math.sin(a) * br,
          bx + Math.cos(a2) * (br * 0.4), by + Math.sin(a2) * (br * 0.4),
          bx + Math.cos(a2 + Math.PI / 5) * br, by + Math.sin(a2 + Math.PI / 5) * br
        );
      }
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(28, 37, 1.2);
      g.fillStyle(c.hair);
      g.fillRoundedRect(48, 3, 10, 4, 2);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(53, 5, 1.5);
    }
    // ── decoCount 2: 왕관 헤어핀 + 귀걸이 ───────────────────
    if (c.decoCount >= 2) {
      g.fillStyle(0xffcc00);
      g.fillRoundedRect(30, 1, 20, 5, 2);
      g.fillTriangle(30, 6, 33, 0, 36, 6);
      g.fillTriangle(37, 6, 40, -1, 43, 6);
      g.fillTriangle(44, 6, 47, 0, 50, 6);
      g.fillStyle(0xffee88);
      g.fillRoundedRect(31, 2, 18, 3, 1);
      g.fillStyle(c.eye, 0.9);
      g.fillCircle(33, 3, 2); g.fillCircle(40, 2, 2); g.fillCircle(47, 3, 2);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(32, 2, 0.8); g.fillCircle(39, 1, 0.8); g.fillCircle(46, 2, 0.8);
      g.fillStyle(c.eye, 0.85);
      g.fillCircle(26, 22, 3); g.fillCircle(54, 22, 3);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(25, 21, 1.2); g.fillCircle(53, 21, 1.2);
    }
    // ── decoCount 3: 마법 오라 + 특별 넥타이 ─────────────────
    if (c.decoCount >= 3) {
      const ac = c.aura || 0x8844cc;
      [[5, 32], [73, 30], [7, 52], [71, 50]].forEach(([x, y]) => {
        g.fillStyle(ac, 0.55); g.fillCircle(x, y, 4);
        g.fillStyle(0xffffff, 0.45); g.fillCircle(x - 1, y - 1, 2);
      });
      g.lineStyle(2, ac, 0.28);
      g.strokeCircle(40, 14, 22);
      g.lineStyle(1, 0xffffff, 0.18);
      g.strokeCircle(40, 14, 18);
      g.fillStyle(ac, 0.85);
      g.fillTriangle(37, 30, 43, 30, 40, 47);
      g.fillStyle(0xffffff, 0.25);
      g.fillTriangle(38, 30, 42, 30, 40, 38);
    }

    g.generateTexture('_tmp_' + key, 80, 80);
    g.destroy();
    this._finalize('_tmp_' + key, key, 80);
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

  // ─── 몬스터 4종 (성검전설3 스타일, 80×80) ─────────────────

  createMonsterTextures() {
    this._makeAddMonster();
    this._makeSubMonster();
    this._makeMulMonster();
    this._makeDivMonster();
    this._makeBossMonster();
    this._makeBossGoodMonster();
  }

  // 더하기 몬스터 — 살아있는 + 기호 (교과 개념화)
  _makeAddMonster() {
    const g = this.add.graphics();

    // 그림자
    g.fillStyle(0x000000, 0.20);
    g.fillEllipse(40, 77, 44, 9);

    // 글로우
    g.fillStyle(0xffaa00, 0.14);
    g.fillCircle(40, 42, 36);

    // ── + 기호가 몸통 (세로 막대) ─────────────────────────────
    g.fillStyle(0xcc5500);
    g.fillRoundedRect(33, 13, 14, 56, 6);
    // + 가로 막대
    g.fillRoundedRect(14, 35, 52, 14, 6);
    // 메인 색 세로
    g.fillStyle(0xff8800);
    g.fillRoundedRect(35, 15, 10, 52, 5);
    // 메인 색 가로
    g.fillStyle(0xff8800);
    g.fillRoundedRect(16, 37, 48, 10, 5);
    // 하이라이트
    g.fillStyle(0xffcc44, 0.55);
    g.fillRoundedRect(37, 15, 6, 22, 3);
    g.fillRoundedRect(16, 38, 22, 4, 2);
    g.fillStyle(0xffffff, 0.22);
    g.fillRoundedRect(37, 16, 4, 12, 2);
    g.fillRoundedRect(17, 38, 10, 2, 1);

    // ── 손 (가로 막대 끝) ─────────────────────────────────────
    g.fillStyle(0xcc5500);
    g.fillCircle(14, 42, 9); g.fillCircle(66, 42, 9);
    g.fillStyle(0xff8800);
    g.fillCircle(14, 41, 8); g.fillCircle(66, 41, 8);
    g.fillStyle(0xffcc44, 0.45);
    g.fillCircle(12, 39, 4); g.fillCircle(64, 39, 4);

    // ── 발 (세로 막대 아래 끝) ────────────────────────────────
    g.fillStyle(0xcc5500);
    g.fillCircle(35, 70, 8); g.fillCircle(45, 70, 8);
    g.fillStyle(0xff6600);
    g.fillCircle(35, 69, 7); g.fillCircle(45, 69, 7);

    // ── 얼굴 (교차 중심에) ────────────────────────────────────
    // 눈 흰자
    g.fillStyle(0xffffff);
    g.fillEllipse(33, 40, 12, 10); g.fillEllipse(47, 40, 12, 10);
    // 홍채 (황금빛)
    g.fillStyle(0xffdd00);
    g.fillEllipse(34, 41, 8, 8); g.fillEllipse(48, 41, 8, 8);
    // 동공
    g.fillStyle(0x220000);
    g.fillEllipse(34, 41, 5, 6); g.fillEllipse(48, 41, 5, 6);
    // 하이라이트
    g.fillStyle(0xffffff);
    g.fillCircle(32, 39, 2.2); g.fillCircle(46, 39, 2.2);
    g.fillCircle(35, 42, 1.1); g.fillCircle(49, 42, 1.1);
    // 속눈썹
    g.fillStyle(0x220000);
    g.fillRoundedRect(27, 34, 13, 2.5, 1);
    g.fillRoundedRect(41, 34, 13, 2.5, 1);

    // 볼터치
    g.fillStyle(0xff6600, 0.22);
    g.fillCircle(26, 45, 6); g.fillCircle(54, 45, 6);

    // 입 (싱긋 웃음)
    g.fillStyle(0x661100);
    g.fillEllipse(40, 51, 14, 8);
    g.fillStyle(0xff8800);
    g.fillEllipse(40, 49, 16, 8);
    g.fillStyle(0xffffff);
    g.fillRect(34, 49, 12, 3);

    g.generateTexture('_tmp_add', 80, 80);
    g.destroy();
    this._finalize('_tmp_add', 'monster-add', 80);
  }

  // 빼기 몬스터 — 살아있는 − 기호 (교과 개념화)
  _makeSubMonster() {
    const g = this.add.graphics();

    // 그림자
    g.fillStyle(0x000000, 0.20);
    g.fillEllipse(40, 77, 52, 9);

    // 글로우
    g.fillStyle(0x6600aa, 0.12);
    g.fillEllipse(40, 44, 66, 28);

    // ── − 기호가 몸통 (납작한 가로 바) ───────────────────────
    g.fillStyle(0x330055);
    g.fillRoundedRect(10, 31, 60, 24, 10);
    g.fillStyle(0x7722cc);
    g.fillRoundedRect(12, 33, 56, 20, 9);
    g.fillStyle(0xaa55ee);
    g.fillRoundedRect(14, 35, 52, 16, 8);
    // 하이라이트
    g.fillStyle(0xcc88ff, 0.45);
    g.fillRoundedRect(16, 36, 30, 7, 4);
    g.fillStyle(0xffffff, 0.18);
    g.fillRoundedRect(17, 37, 16, 3, 2);

    // ── 팔 (바 양 끝) ─────────────────────────────────────────
    g.fillStyle(0x330055);
    g.fillCircle(10, 43, 9); g.fillCircle(70, 43, 9);
    g.fillStyle(0x7722cc);
    g.fillCircle(10, 42, 8); g.fillCircle(70, 42, 8);
    g.fillStyle(0xcc88ff, 0.35);
    g.fillCircle(8, 40, 4); g.fillCircle(68, 40, 4);

    // ── 다리 (바 아래에 달린 작은 다리) ─────────────────────
    g.fillStyle(0x330055);
    g.fillRoundedRect(25, 53, 11, 18, 4);
    g.fillRoundedRect(44, 53, 11, 18, 4);
    g.fillStyle(0x5511aa);
    g.fillRoundedRect(26, 53, 9, 16, 3);
    g.fillRoundedRect(45, 53, 9, 16, 3);
    // 발
    g.fillStyle(0x220033);
    g.fillRoundedRect(23, 68, 15, 8, 4);
    g.fillRoundedRect(42, 68, 15, 8, 4);
    g.fillStyle(0x5511aa);
    g.fillRoundedRect(24, 68, 13, 7, 3);
    g.fillRoundedRect(43, 68, 13, 7, 3);

    // ── 얼굴 (바 위에) ────────────────────────────────────────
    // 눈 흰자
    g.fillStyle(0xffffff);
    g.fillEllipse(31, 42, 13, 11); g.fillEllipse(49, 42, 13, 11);
    // 홍채 (보라)
    g.fillStyle(0xcc66ff);
    g.fillEllipse(32, 43, 9, 9); g.fillEllipse(50, 43, 9, 9);
    // 동공
    g.fillStyle(0x110022);
    g.fillEllipse(32, 43, 5, 6); g.fillEllipse(50, 43, 5, 6);
    // 하이라이트
    g.fillStyle(0xffffff);
    g.fillCircle(30, 41, 2.2); g.fillCircle(48, 41, 2.2);
    g.fillCircle(33, 44, 1.1); g.fillCircle(51, 44, 1.1);
    // 찡그린 눈썹 (안쪽이 낮음)
    g.fillStyle(0x220033);
    g.fillRoundedRect(25, 33, 13, 2.5, 1);
    g.fillRoundedRect(43, 33, 13, 2.5, 1);
    g.fillTriangle(37, 36, 37, 33, 25, 33);
    g.fillTriangle(43, 33, 43, 36, 56, 33);

    // 볼터치
    g.fillStyle(0xcc44ff, 0.18);
    g.fillCircle(23, 46, 6); g.fillCircle(57, 46, 6);

    // 입 (일자 불만)
    g.fillStyle(0x330055);
    g.fillRoundedRect(31, 50, 18, 5, 2);
    g.fillStyle(0x9933ee);
    g.fillRoundedRect(32, 50, 16, 4, 2);

    g.generateTexture('_tmp_sub', 80, 80);
    g.destroy();
    this._finalize('_tmp_sub', 'monster-sub', 80);
  }

  // 곱하기 몬스터 — 살아있는 × 기호 (교과 개념화)
  _makeMulMonster() {
    const g = this.add.graphics();

    // 불꽃 글로우
    g.fillStyle(0xff2200, 0.14);
    g.fillCircle(40, 42, 38);

    // 그림자
    g.fillStyle(0x000000, 0.20);
    g.fillEllipse(40, 77, 44, 9);

    // ── × 기호 몸통 (두 대각 막대 = 쿼드 두 개) ─────────────
    // \ 막대: (13,16)→(23,8)→(67,60)→(57,68) 어두운 테두리
    g.fillStyle(0x880000);
    g.fillTriangle(13, 16, 23, 8, 67, 60);
    g.fillTriangle(13, 16, 67, 60, 57, 68);
    // / 막대: (57,8)→(67,16)→(23,68)→(13,60) 어두운 테두리
    g.fillTriangle(57, 8, 67, 16, 23, 68);
    g.fillTriangle(57, 8, 23, 68, 13, 60);

    // 메인 색 \ 막대
    g.fillStyle(0xff3300);
    g.fillTriangle(15, 17, 22, 10, 65, 59);
    g.fillTriangle(15, 17, 65, 59, 58, 66);
    // 메인 색 / 막대
    g.fillTriangle(58, 10, 65, 17, 22, 66);
    g.fillTriangle(58, 10, 22, 66, 15, 59);

    // 중심 원 (교차점)
    g.fillStyle(0xdd2200);
    g.fillCircle(40, 38, 14);
    g.fillStyle(0xff4422);
    g.fillCircle(40, 37, 12);
    // 하이라이트
    g.fillStyle(0xff8866, 0.45);
    g.fillEllipse(35, 32, 12, 8);
    g.fillStyle(0xffffff, 0.18);
    g.fillEllipse(34, 31, 6, 4);

    // 대각 막대 끝 (4개 = 손발)
    // TL: 팔
    g.fillStyle(0xcc2200); g.fillCircle(16, 14, 7);
    g.fillStyle(0xff4422); g.fillCircle(15, 13, 6);
    // TR: 팔
    g.fillStyle(0xcc2200); g.fillCircle(64, 14, 7);
    g.fillStyle(0xff4422); g.fillCircle(63, 13, 6);
    // BL: 발
    g.fillStyle(0xcc2200); g.fillCircle(16, 62, 7);
    g.fillStyle(0xff4422); g.fillCircle(15, 61, 6);
    // BR: 발
    g.fillStyle(0xcc2200); g.fillCircle(64, 62, 7);
    g.fillStyle(0xff4422); g.fillCircle(63, 61, 6);

    // ── 얼굴 (중심 원 위에) ───────────────────────────────────
    // 눈 흰자
    g.fillStyle(0xffffff);
    g.fillEllipse(33, 36, 11, 10); g.fillEllipse(47, 36, 11, 10);
    // 홍채 (황금 분노)
    g.fillStyle(0xffaa00);
    g.fillEllipse(34, 37, 7, 8); g.fillEllipse(48, 37, 7, 8);
    // 동공
    g.fillStyle(0x110000);
    g.fillEllipse(34, 37, 4, 6); g.fillEllipse(48, 37, 4, 6);
    // 하이라이트
    g.fillStyle(0xffffff);
    g.fillCircle(32, 35, 2); g.fillCircle(46, 35, 2);
    // 화난 눈썹
    g.fillStyle(0x330000);
    g.fillRoundedRect(28, 28, 12, 2.5, 1);
    g.fillRoundedRect(40, 28, 12, 2.5, 1);
    g.fillTriangle(40, 31, 40, 28, 28, 28);
    g.fillTriangle(40, 28, 40, 31, 52, 28);

    // 볼터치
    g.fillStyle(0xff6600, 0.20);
    g.fillCircle(27, 40, 6); g.fillCircle(53, 40, 6);

    // 입 (날카로운 이빨)
    g.fillStyle(0x330000);
    g.fillEllipse(40, 46, 16, 9);
    g.fillStyle(0xff2200);
    g.fillEllipse(40, 44, 18, 8);
    g.fillStyle(0xffffff);
    for (let i = 0; i < 3; i++) {
      g.fillTriangle(33 + i * 6, 44, 37 + i * 6, 44, 35 + i * 6, 50);
    }

    // 불꽃 파티클 (에너지)
    g.fillStyle(0xff6600, 0.65);
    g.fillCircle(7, 35, 5); g.fillCircle(73, 35, 5);
    g.fillStyle(0xffdd00, 0.50);
    g.fillCircle(5, 28, 3.5); g.fillCircle(75, 28, 3.5);
    g.fillStyle(0xffffff, 0.28);
    g.fillCircle(6, 27, 1.8); g.fillCircle(74, 27, 1.8);

    g.generateTexture('_tmp_mul', 80, 80);
    g.destroy();
    this._finalize('_tmp_mul', 'monster-mul', 80);
  }

  // 나누기 몬스터 — 살아있는 ÷ 기호 (교과 개념화)
  _makeDivMonster() {
    const g = this.add.graphics();

    // 글로우
    g.fillStyle(0x0088aa, 0.13);
    g.fillEllipse(40, 42, 64, 46);

    // 그림자
    g.fillStyle(0x000000, 0.20);
    g.fillEllipse(40, 77, 46, 9);

    // ── ÷ 기호 몸통: 가로 바 ─────────────────────────────────
    g.fillStyle(0x005566);
    g.fillRoundedRect(12, 35, 56, 16, 7);
    g.fillStyle(0x00aacc);
    g.fillRoundedRect(14, 37, 52, 12, 6);
    g.fillStyle(0x44ddee);
    g.fillRoundedRect(16, 39, 48, 8, 5);
    // 하이라이트
    g.fillStyle(0x88ffff, 0.40);
    g.fillRoundedRect(18, 40, 28, 4, 3);
    g.fillStyle(0xffffff, 0.18);
    g.fillRoundedRect(19, 40, 14, 2, 2);

    // ── ÷ 위 점 (점 = 머리) ───────────────────────────────────
    g.fillStyle(0x005566);
    g.fillCircle(40, 16, 14);
    g.fillStyle(0x00aacc);
    g.fillCircle(40, 15, 13);
    g.fillStyle(0x22ccdd);
    g.fillCircle(40, 14, 12);
    // 점 하이라이트
    g.fillStyle(0x88ffff, 0.4);
    g.fillEllipse(34, 9, 10, 7);
    g.fillStyle(0xffffff, 0.20);
    g.fillEllipse(33, 9, 5, 4);

    // ── ÷ 아래 점 (점 = 발 대신 둥근 받침) ──────────────────
    g.fillStyle(0x005566);
    g.fillCircle(40, 67, 11);
    g.fillStyle(0x00aacc);
    g.fillCircle(40, 66, 10);
    g.fillStyle(0x22ccdd);
    g.fillCircle(40, 65, 9);
    g.fillStyle(0x88ffff, 0.35);
    g.fillEllipse(36, 62, 8, 5);

    // ── 팔 (가로 바 양 끝) ────────────────────────────────────
    g.fillStyle(0x005566);
    g.fillCircle(12, 43, 9); g.fillCircle(68, 43, 9);
    g.fillStyle(0x00aacc);
    g.fillCircle(12, 42, 8); g.fillCircle(68, 42, 8);
    g.fillStyle(0x88ffff, 0.35);
    g.fillCircle(10, 40, 4); g.fillCircle(66, 40, 4);

    // ── 얼굴 (머리 점 위에) ───────────────────────────────────
    // 눈 흰자
    g.fillStyle(0xffffff);
    g.fillEllipse(34, 14, 11, 10); g.fillEllipse(46, 14, 11, 10);
    // 홍채 (밝은 청록)
    g.fillStyle(0x00ddcc);
    g.fillEllipse(35, 15, 7, 8); g.fillEllipse(47, 15, 7, 8);
    // 동공
    g.fillStyle(0x001122);
    g.fillEllipse(35, 15, 4, 5); g.fillEllipse(47, 15, 4, 5);
    // 하이라이트
    g.fillStyle(0xffffff);
    g.fillCircle(33, 13, 2); g.fillCircle(45, 13, 2);
    g.fillCircle(36, 16, 1.1); g.fillCircle(48, 16, 1.1);
    // 눈썹 (의문스러운 물결)
    g.fillStyle(0x003344);
    g.fillRoundedRect(29, 7, 12, 2.5, 1);
    g.fillRoundedRect(41, 7, 12, 2.5, 1);

    // 볼터치
    g.fillStyle(0x00cccc, 0.22);
    g.fillCircle(28, 18, 5); g.fillCircle(52, 18, 5);

    // 입 (신비로운 ○ 표정)
    g.fillStyle(0x003344);
    g.fillEllipse(40, 22, 12, 8);
    g.fillStyle(0x00aacc);
    g.fillEllipse(40, 22, 10, 6);
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(38, 21, 4, 3);

    // 마법 파티클
    g.fillStyle(0x00eeff, 0.65);
    g.fillCircle(6, 20, 4); g.fillCircle(74, 20, 4);
    g.fillCircle(5, 60, 3); g.fillCircle(75, 60, 3);
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(6, 20, 2); g.fillCircle(74, 20, 2);

    g.generateTexture('_tmp_div', 80, 80);
    g.destroy();
    this._finalize('_tmp_div', 'monster-div', 80);
  }

  // 보스 몬스터 — 수학 마왕 (성검전설3 Dark Lord 스타일, 96×96)
  _makeBossMonster() {
    const g = this.add.graphics();
    const C = 48; // 중앙

    // 다크 오라
    g.fillStyle(0x5500cc, 0.18);
    g.fillCircle(C, C + 4, 46);
    g.fillStyle(0xff0044, 0.08);
    g.fillCircle(C, C + 4, 36);

    // 그림자
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(C, 92, 68, 13);

    // ── 대형 날개 (뒤) ───────────────────────────────────────
    // 왼쪽 날개
    g.fillStyle(0x0d0022, 0.9);
    g.fillTriangle(2, 80, 28, 18, 36, 72);
    g.fillStyle(0x220044, 0.75);
    g.fillTriangle(4, 78, 28, 22, 35, 70);
    g.fillStyle(0x4400aa, 0.4);
    g.fillTriangle(6, 74, 28, 28, 34, 66);
    g.fillStyle(0x8833dd, 0.2);
    g.fillTriangle(8, 70, 28, 34, 33, 62);
    // 날개 맥
    g.fillStyle(0x9944ff, 0.5);
    g.fillRect(24, 24, 2, 46);
    g.fillRect(8, 50, 18, 2);
    g.fillRect(10, 64, 16, 2);
    // 오른쪽 날개
    g.fillStyle(0x0d0022, 0.9);
    g.fillTriangle(94, 80, 68, 18, 60, 72);
    g.fillStyle(0x220044, 0.75);
    g.fillTriangle(92, 78, 68, 22, 61, 70);
    g.fillStyle(0x4400aa, 0.4);
    g.fillTriangle(90, 74, 68, 28, 62, 66);
    g.fillStyle(0x8833dd, 0.2);
    g.fillTriangle(88, 70, 68, 34, 63, 62);
    g.fillStyle(0x9944ff, 0.5);
    g.fillRect(70, 24, 2, 46);
    g.fillRect(70, 50, 18, 2);
    g.fillRect(70, 64, 16, 2);

    // ── 망토 (뒤) ────────────────────────────────────────────
    g.fillStyle(0x0d0011);
    g.fillTriangle(16, 90, 32, 48, 48, 90);
    g.fillTriangle(80, 90, 64, 48, 48, 90);
    g.fillStyle(0x1a0033);
    g.fillTriangle(18, 90, 32, 52, 48, 90);
    g.fillTriangle(78, 90, 64, 52, 48, 90);
    // 망토 안감 (보라)
    g.fillStyle(0x330066, 0.6);
    g.fillTriangle(20, 90, 32, 58, 48, 90);
    g.fillTriangle(76, 90, 64, 58, 48, 90);

    // ── 몸 ──────────────────────────────────────────────────
    g.fillStyle(0x0d0022);
    g.fillCircle(C, 62, 30);
    g.fillStyle(0x1a0040);
    g.fillCircle(C, 61, 28);
    g.fillStyle(0x2d0055);
    g.fillCircle(C - 2, 59, 25);
    g.fillStyle(0x5500aa);
    g.fillEllipse(C - 8, 51, 22, 15);
    g.fillStyle(0x8822cc, 0.45);
    g.fillEllipse(C - 12, 47, 12, 8);

    // 로브 장식
    g.fillStyle(0x440088);
    g.fillRect(32, 72, 32, 4);
    g.fillStyle(0x7722bb);
    g.fillRect(33, 72, 30, 3);
    // 루엔 문양
    g.fillStyle(0xffdd44, 0.5);
    g.fillCircle(C, 68, 5);
    g.fillStyle(0xffd700, 0.7);
    g.fillCircle(C, 68, 3.5);

    // ── 팔 ──────────────────────────────────────────────────
    // 왼팔 (마법 지팡이 들고 있음)
    g.fillStyle(0x1a0033);
    g.fillRoundedRect(10, 56, 18, 28, 6);
    g.fillStyle(0x2d0055);
    g.fillRoundedRect(11, 55, 16, 26, 5);
    g.fillStyle(0x4400aa, 0.4);
    g.fillEllipse(16, 60, 10, 8);
    // 손
    g.fillStyle(0x110022);
    g.fillCircle(18, 82, 9);
    g.fillStyle(0x2d0055);
    g.fillCircle(18, 81, 7.5);
    // 손가락
    for (let i = 0; i < 4; i++) {
      g.fillStyle(0x0d0022);
      g.fillRoundedRect(10 + i * 4, 86, 3, 9, 2);
      g.fillStyle(0x4400aa);
      g.fillRoundedRect(11 + i * 4, 87, 2, 7, 1);
    }
    // 오른팔 (마법 번개 타오름)
    g.fillStyle(0x1a0033);
    g.fillRoundedRect(68, 56, 18, 24, 6);
    g.fillStyle(0x2d0055);
    g.fillRoundedRect(69, 55, 16, 22, 5);
    g.fillStyle(0x4400aa, 0.4);
    g.fillEllipse(77, 60, 10, 8);
    g.fillStyle(0x110022);
    g.fillCircle(76, 78, 9);
    g.fillStyle(0x2d0055);
    g.fillCircle(76, 77, 7.5);
    // 마법 번개
    g.fillStyle(0xff4400, 0.7);
    g.fillRect(73, 64, 3, 4); g.fillRect(76, 60, 3, 5);
    g.fillRect(70, 58, 4, 3); g.fillRect(78, 55, 3, 4);
    g.fillStyle(0xff8800);
    g.fillRect(74, 65, 2, 3); g.fillRect(77, 61, 2, 4);

    // ── 왕관 ─────────────────────────────────────────────────
    g.fillStyle(0x553300);
    g.fillRect(22, 26, 52, 12);
    g.fillStyle(0x886600);
    g.fillRect(23, 27, 50, 10);
    g.fillStyle(0xbbaa00);
    g.fillRect(24, 27, 48, 5);
    g.fillStyle(0xffdd44);
    g.fillRect(25, 27, 46, 3);

    // 왕관 스파이크 7개
    const spikes = [22, 30, 38, 48, 58, 66, 74];
    const heights = [14, 8, 10, 2, 10, 8, 14]; // 중앙이 가장 낮음(= 제일 높이 솟음)
    spikes.forEach((x, i) => {
      const tipY = heights[i];
      g.fillStyle(0x553300);
      g.fillTriangle(x - 1, 38, x + 5, tipY, x + 11, 38);
      g.fillStyle(0xaa8800);
      g.fillTriangle(x, 38, x + 5, tipY + 2, x + 10, 38);
      g.fillStyle(0xffcc00);
      g.fillTriangle(x + 1, 38, x + 5, tipY + 4, x + 9, 38);
    });

    // 왕관 보석
    g.fillStyle(0xff0033); g.fillCircle(28, 32, 4);
    g.fillStyle(0x00ffcc); g.fillCircle(C, 32, 5);
    g.fillStyle(0xff0033); g.fillCircle(68, 32, 4);
    g.fillStyle(0xffffff, 0.65);
    g.fillCircle(27, 30, 1.8); g.fillCircle(C - 1, 30, 2.2); g.fillCircle(67, 30, 1.8);

    // ── 머리 ─────────────────────────────────────────────────
    g.fillStyle(0x0d0022);
    g.fillCircle(C, 50, 24);
    g.fillStyle(0x1a0040);
    g.fillCircle(C, 49, 22);
    g.fillStyle(0x2d0055);
    g.fillCircle(C - 2, 47, 19);
    g.fillStyle(0x5500aa);
    g.fillEllipse(C - 8, 41, 18, 12);
    g.fillStyle(0x7722bb, 0.4);
    g.fillEllipse(C - 11, 38, 9, 6);

    // 눈 글로우
    g.fillStyle(0xff0000, 0.45);
    g.fillCircle(38, 48, 11); g.fillCircle(58, 48, 11);
    g.fillStyle(0xffffff);
    g.fillCircle(38, 48, 8); g.fillCircle(58, 48, 8);
    g.fillStyle(0xff2200);
    g.fillCircle(39, 49, 6); g.fillCircle(59, 49, 6);
    g.fillStyle(0x550000);
    g.fillCircle(40, 50, 3.5); g.fillCircle(60, 50, 3.5);
    g.fillStyle(0x000000);
    g.fillRect(39, 47, 2.5, 6); g.fillRect(59, 47, 2.5, 6);
    g.fillStyle(0xff8800, 0.8);
    g.fillCircle(36, 46, 2.5); g.fillCircle(56, 46, 2.5);
    // 눈썹 (V자)
    g.fillStyle(0xff0000, 0.6);
    g.fillRect(30, 38, 14, 3); g.fillRect(52, 38, 14, 3);
    g.fillRect(42, 38, 4, 6); g.fillRect(52, 38, 4, 6);

    // 코
    g.fillStyle(0x440022);
    g.fillTriangle(44, 54, 52, 54, 48, 58);

    // 이빨 입
    g.fillStyle(0x0d0022);
    g.fillRoundedRect(32, 58, 32, 14, 4);
    g.fillStyle(0xdd0033);
    g.fillRect(33, 59, 30, 12);
    g.fillStyle(0xffffff);
    for (let i = 0; i < 5; i++) {
      g.fillTriangle(33 + i * 6, 59, 37 + i * 6, 59, 35 + i * 6, 66);
    }
    // 아랫니
    g.fillStyle(0xeeeeff);
    for (let i = 0; i < 4; i++) {
      g.fillTriangle(35 + i * 7, 71, 39 + i * 7, 71, 37 + i * 7, 65);
    }

    g.generateTexture('_tmp_boss', 96, 96);
    g.destroy();
    this._finalize('_tmp_boss', 'monster-boss', 96);
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
