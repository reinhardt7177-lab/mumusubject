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
  }

  create() {
    console.log('🎮 mumusubject 시작 중...');

    // 몬스터/더스트 텍스처를 Graphics로 생성 (플레이어는 외부 PNG 사용)
    this.createMonsterTextures();
    this.createDustTexture();

    this.scene.start('MathScene');
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

  // ─── 몬스터 4종 + 보스 ──────────────────────────────────────

  createMonsterTextures() {
    this._makeSlimeMonster();
    this._makeGoblinMonster();
    this._makeOrcMonster();
    this._makeWitchMonster();
    this._makeBossMonster();
    this._makeBossGoodMonster();
  }

  // 슬라임 — 초록 젤리 몸체, 귀엽고 통통
  _makeSlimeMonster() {
    const g = this.add.graphics();
    // 그림자
    g.fillStyle(0x000000, 0.22); g.fillEllipse(40, 76, 46, 10);
    // 외곽 글로우
    g.fillStyle(0x00aa44, 0.18); g.fillCircle(40, 50, 30);
    // 몸통 아웃라인
    g.fillStyle(0x006622); g.fillEllipse(40, 52, 54, 46);
    // 몸통 메인 (밝은 초록)
    g.fillStyle(0x22cc55); g.fillEllipse(40, 50, 50, 42);
    // 몸통 하이라이트
    g.fillStyle(0x66ee88, 0.55); g.fillEllipse(32, 38, 22, 14);
    g.fillStyle(0xaaffbb, 0.30); g.fillEllipse(30, 36, 12, 7);
    // 더듬이 (두 개)
    g.fillStyle(0x006622);
    g.fillRoundedRect(27, 14, 5, 18, 2); g.fillRoundedRect(48, 12, 5, 18, 2);
    g.fillStyle(0x22cc55);
    g.fillRoundedRect(28, 15, 3, 16, 2); g.fillRoundedRect(49, 13, 3, 16, 2);
    g.fillStyle(0x006622); g.fillCircle(29, 13, 5); g.fillCircle(51, 11, 5);
    g.fillStyle(0x44ee77); g.fillCircle(29, 12, 4); g.fillCircle(51, 10, 4);
    g.fillStyle(0xffffff, 0.5); g.fillCircle(28, 11, 2); g.fillCircle(50, 9, 2);
    // 눈 흰자
    g.fillStyle(0xffffff); g.fillEllipse(30, 46, 14, 13); g.fillEllipse(50, 46, 14, 13);
    // 홍채 (검정)
    g.fillStyle(0x003311); g.fillEllipse(31, 47, 10, 11); g.fillEllipse(51, 47, 10, 11);
    // 동공 하이라이트
    g.fillStyle(0xffffff); g.fillCircle(29, 44, 3); g.fillCircle(49, 44, 3);
    g.fillCircle(33, 48, 1.5); g.fillCircle(53, 48, 1.5);
    // 웃는 입
    g.fillStyle(0x004411); g.fillEllipse(40, 60, 20, 11);
    g.fillStyle(0x22cc55); g.fillEllipse(40, 58, 22, 10);
    g.fillStyle(0xffffff); g.fillRect(32, 58, 16, 4);
    // 볼터치
    g.fillStyle(0x99ffaa, 0.35); g.fillCircle(24, 52, 7); g.fillCircle(56, 52, 7);

    g.generateTexture('_tmp_slime', 80, 80);
    g.destroy();
    this._finalize('_tmp_slime', 'monster-slime', 80);
  }

  // 고블린 — 초록 피부 소형 인간형, 뾰족한 귀와 빨간 눈
  _makeGoblinMonster() {
    const g = this.add.graphics();
    // 그림자
    g.fillStyle(0x000000, 0.22); g.fillEllipse(40, 77, 40, 9);
    // 다리
    g.fillStyle(0x3a2200); g.fillRoundedRect(25, 60, 10, 18, 3); g.fillRoundedRect(45, 60, 10, 18, 3);
    g.fillStyle(0x5c3a00); g.fillRoundedRect(26, 60, 8, 16, 2); g.fillRoundedRect(46, 60, 8, 16, 2);
    // 발
    g.fillStyle(0x2a1800); g.fillRoundedRect(22, 75, 16, 7, 3); g.fillRoundedRect(42, 75, 16, 7, 3);
    g.fillStyle(0x5c3a00); g.fillRoundedRect(23, 75, 14, 6, 2); g.fillRoundedRect(43, 75, 14, 6, 2);
    // 몸통 아웃라인
    g.fillStyle(0x1a4400); g.fillRoundedRect(22, 38, 36, 25, 6);
    // 몸통 메인 (어두운 초록)
    g.fillStyle(0x336600); g.fillRoundedRect(23, 37, 34, 24, 5);
    // 가죽 조끼
    g.fillStyle(0x5c3a00); g.fillRoundedRect(27, 38, 26, 22, 4);
    g.fillStyle(0x7a5200); g.fillRoundedRect(28, 39, 24, 20, 3);
    g.fillStyle(0xffcc44, 0.6); g.fillRect(38, 39, 4, 20);
    // 팔
    g.fillStyle(0x1a4400); g.fillRoundedRect(12, 40, 12, 20, 4); g.fillRoundedRect(56, 40, 12, 20, 4);
    g.fillStyle(0x336600); g.fillRoundedRect(13, 39, 10, 18, 3); g.fillRoundedRect(57, 39, 10, 18, 3);
    // 손 (무기 들고)
    g.fillStyle(0x1a4400); g.fillCircle(17, 60, 6); g.fillCircle(63, 60, 6);
    g.fillStyle(0x336600); g.fillCircle(17, 59, 5); g.fillCircle(63, 59, 5);
    // 몽둥이
    g.fillStyle(0x5c3a00); g.fillRoundedRect(60, 44, 5, 22, 2);
    g.fillStyle(0x7a5200); g.fillRoundedRect(61, 45, 3, 20, 1);
    g.fillStyle(0x3a2200); g.fillCircle(63, 44, 7);
    g.fillStyle(0x5c3a00); g.fillCircle(63, 43, 6);
    // 뾰족한 귀
    g.fillStyle(0x1a4400); g.fillTriangle(18, 24, 22, 10, 27, 24); g.fillTriangle(62, 24, 58, 10, 53, 24);
    g.fillStyle(0x336600); g.fillTriangle(19, 24, 22, 12, 26, 24); g.fillTriangle(61, 24, 58, 12, 54, 24);
    g.fillStyle(0x55aa00, 0.4); g.fillTriangle(20, 23, 22, 14, 25, 23); g.fillTriangle(60, 23, 58, 14, 55, 23);
    // 머리
    g.fillStyle(0x1a4400); g.fillCircle(40, 28, 18);
    g.fillStyle(0x336600); g.fillCircle(40, 27, 17);
    g.fillStyle(0x55aa00, 0.3); g.fillEllipse(32, 20, 14, 9);
    // 머리카락 (텁수룩)
    g.fillStyle(0x221100); g.fillRoundedRect(23, 14, 34, 8, 3);
    g.fillStyle(0x442200); g.fillRoundedRect(24, 15, 32, 6, 2);
    // 눈 흰자
    g.fillStyle(0xffffff); g.fillEllipse(33, 28, 11, 10); g.fillEllipse(47, 28, 11, 10);
    // 홍채 (빨강)
    g.fillStyle(0xcc0000); g.fillEllipse(34, 29, 7, 8); g.fillEllipse(48, 29, 7, 8);
    g.fillStyle(0x220000); g.fillEllipse(34, 29, 4, 5); g.fillEllipse(48, 29, 4, 5);
    g.fillStyle(0xffffff); g.fillCircle(32, 27, 2); g.fillCircle(46, 27, 2);
    // 눈썹 (V자 찡그림)
    g.fillStyle(0x221100); g.fillRoundedRect(27, 20, 11, 3, 1); g.fillRoundedRect(42, 20, 11, 3, 1);
    g.fillTriangle(38, 23, 38, 20, 27, 20); g.fillTriangle(42, 20, 42, 23, 53, 20);
    // 코
    g.fillStyle(0x1a4400); g.fillTriangle(37, 33, 43, 33, 40, 37);
    g.fillStyle(0x003300); g.fillCircle(38, 35, 2); g.fillCircle(42, 35, 2);
    // 이빨 입
    g.fillStyle(0x330000); g.fillRoundedRect(32, 36, 16, 8, 3);
    g.fillStyle(0xdd0000); g.fillRect(33, 37, 14, 6);
    g.fillStyle(0xffffff); g.fillTriangle(33, 37, 37, 37, 35, 43); g.fillTriangle(43, 37, 47, 37, 45, 43);
    // 볼터치
    g.fillStyle(0x55cc00, 0.25); g.fillCircle(25, 31, 6); g.fillCircle(55, 31, 6);

    g.generateTexture('_tmp_goblin', 80, 80);
    g.destroy();
    this._finalize('_tmp_goblin', 'monster-goblin', 80);
  }

  // 오크전사 — 갈색 근육질 전사, 투구와 도끼
  _makeOrcMonster() {
    const g = this.add.graphics();
    // 그림자
    g.fillStyle(0x000000, 0.22); g.fillEllipse(40, 77, 50, 10);
    // 다리 (두껍고 짧음)
    g.fillStyle(0x2a1800); g.fillRoundedRect(22, 57, 14, 20, 4); g.fillRoundedRect(44, 57, 14, 20, 4);
    g.fillStyle(0x4a3000); g.fillRoundedRect(23, 57, 12, 18, 3); g.fillRoundedRect(45, 57, 12, 18, 3);
    g.fillStyle(0x221500); g.fillRoundedRect(20, 73, 18, 7, 3); g.fillRoundedRect(42, 73, 18, 7, 3);
    g.fillStyle(0x4a3000); g.fillRoundedRect(21, 73, 16, 6, 2); g.fillRoundedRect(43, 73, 16, 6, 2);
    // 몸통 (판금 갑옷 느낌)
    g.fillStyle(0x332200); g.fillRoundedRect(18, 35, 44, 26, 5);
    g.fillStyle(0x664400); g.fillRoundedRect(19, 34, 42, 25, 4);
    // 갑옷 장식
    g.fillStyle(0x885500); g.fillRoundedRect(25, 36, 30, 22, 3);
    g.fillStyle(0xaa7700); g.fillRoundedRect(26, 37, 28, 20, 2);
    g.fillStyle(0xffcc44, 0.5);
    g.fillRect(34, 36, 12, 22); g.fillRect(25, 47, 30, 3);
    // 팔 (근육질)
    g.fillStyle(0x332200); g.fillRoundedRect(8, 36, 13, 24, 5); g.fillRoundedRect(59, 36, 13, 24, 5);
    g.fillStyle(0x664400); g.fillRoundedRect(9, 35, 12, 22, 4); g.fillRoundedRect(60, 35, 12, 22, 4);
    g.fillStyle(0x885522); g.fillRoundedRect(10, 35, 10, 20, 3); g.fillRoundedRect(61, 35, 10, 20, 3);
    // 손
    g.fillStyle(0x332200); g.fillCircle(14, 60, 7); g.fillCircle(66, 60, 7);
    g.fillStyle(0x664400); g.fillCircle(14, 59, 6); g.fillCircle(66, 59, 6);
    // 도끼 (오른손)
    g.fillStyle(0x553300); g.fillRoundedRect(64, 40, 4, 28, 2);
    g.fillStyle(0x775500); g.fillRoundedRect(65, 41, 2, 26, 1);
    g.fillStyle(0x444444); g.fillTriangle(62, 36, 72, 33, 72, 50); g.fillTriangle(62, 50, 72, 46, 72, 54);
    g.fillStyle(0x888888); g.fillTriangle(63, 37, 71, 34, 71, 50); g.fillTriangle(63, 50, 71, 47, 71, 53);
    g.fillStyle(0xcccccc, 0.4); g.fillRect(63, 37, 4, 12);
    // 투구
    g.fillStyle(0x333333); g.fillRoundedRect(20, 13, 40, 22, 8);
    g.fillStyle(0x555555); g.fillRoundedRect(21, 14, 38, 20, 7);
    g.fillStyle(0x777777, 0.5); g.fillEllipse(30, 18, 18, 10);
    // 뿔
    g.fillStyle(0x221100); g.fillTriangle(22, 18, 18, 4, 26, 18); g.fillTriangle(58, 18, 62, 4, 54, 18);
    g.fillStyle(0x442200); g.fillTriangle(23, 18, 19, 6, 25, 18); g.fillTriangle(57, 18, 61, 6, 55, 18);
    // 얼굴
    g.fillStyle(0x332200); g.fillCircle(40, 32, 16);
    g.fillStyle(0x664400); g.fillCircle(40, 31, 15);
    g.fillStyle(0x885522, 0.4); g.fillEllipse(33, 25, 14, 9);
    // 눈 (빨간 분노)
    g.fillStyle(0xffffff); g.fillEllipse(32, 30, 12, 10); g.fillEllipse(48, 30, 12, 10);
    g.fillStyle(0xff2200); g.fillEllipse(33, 31, 8, 8); g.fillEllipse(49, 31, 8, 8);
    g.fillStyle(0x330000); g.fillEllipse(33, 31, 5, 6); g.fillEllipse(49, 31, 5, 6);
    g.fillStyle(0xffffff); g.fillCircle(31, 29, 2.2); g.fillCircle(47, 29, 2.2);
    // 눈썹 (두껍게 V자)
    g.fillStyle(0x221100);
    g.fillRoundedRect(26, 21, 13, 4, 1); g.fillRoundedRect(41, 21, 13, 4, 1);
    g.fillTriangle(39, 25, 39, 21, 26, 21); g.fillTriangle(41, 21, 41, 25, 54, 21);
    // 코 (납작하고 넓음)
    g.fillStyle(0x332200); g.fillRoundedRect(36, 34, 8, 5, 2);
    g.fillStyle(0x221100); g.fillCircle(37, 37, 2); g.fillCircle(43, 37, 2);
    // 엄니 + 입
    g.fillStyle(0x221100); g.fillRoundedRect(30, 39, 20, 8, 3);
    g.fillStyle(0xcc2200); g.fillRect(31, 40, 18, 6);
    g.fillStyle(0xffffff); g.fillTriangle(31, 40, 35, 40, 33, 47); g.fillTriangle(45, 40, 49, 40, 47, 47);

    g.generateTexture('_tmp_orc', 80, 80);
    g.destroy();
    this._finalize('_tmp_orc', 'monster-orc', 80);
  }

  // 마녀 — 뾰족 모자, 보라 로브, 마법 지팡이
  _makeWitchMonster() {
    const g = this.add.graphics();
    // 그림자
    g.fillStyle(0x000000, 0.22); g.fillEllipse(40, 77, 40, 9);
    // 마법 오라
    g.fillStyle(0x8800cc, 0.12); g.fillCircle(40, 45, 32);
    // 로브 (넓은 삼각형)
    g.fillStyle(0x1a0033); g.fillTriangle(20, 75, 60, 75, 50, 40); g.fillTriangle(20, 75, 30, 40, 50, 40);
    g.fillStyle(0x330055); g.fillTriangle(22, 75, 58, 75, 49, 41); g.fillTriangle(22, 75, 31, 41, 49, 41);
    g.fillStyle(0x550088, 0.4); g.fillTriangle(28, 70, 52, 70, 40, 45);
    // 로브 별 장식
    g.fillStyle(0xffdd00, 0.7);
    [[30, 55], [50, 60], [37, 65]].forEach(([x, y]) => {
      g.fillCircle(x, y, 2);
    });
    // 팔/소매
    g.fillStyle(0x1a0033); g.fillRoundedRect(10, 42, 14, 22, 5); g.fillRoundedRect(56, 42, 14, 22, 5);
    g.fillStyle(0x330055); g.fillRoundedRect(11, 41, 12, 20, 4); g.fillRoundedRect(57, 41, 12, 20, 4);
    g.fillStyle(0x550088, 0.3); g.fillEllipse(16, 46, 10, 8); g.fillEllipse(64, 46, 10, 8);
    // 손
    g.fillStyle(0xffddcc); g.fillCircle(16, 63, 6); g.fillCircle(64, 63, 6);
    g.fillStyle(0xffeedd); g.fillCircle(16, 62, 5); g.fillCircle(64, 62, 5);
    // 지팡이 (왼손)
    g.fillStyle(0x5c3a00); g.fillRoundedRect(6, 44, 4, 34, 2);
    g.fillStyle(0x7a5200); g.fillRoundedRect(7, 45, 2, 32, 1);
    g.fillStyle(0x8800cc); g.fillCircle(8, 44, 8);
    g.fillStyle(0xaa44ee); g.fillCircle(8, 43, 7);
    g.fillStyle(0xcc88ff, 0.5); g.fillCircle(6, 41, 4);
    g.fillStyle(0xffffff, 0.6); g.fillCircle(6, 40, 2);
    // 뾰족 모자
    g.fillStyle(0x110022); g.fillTriangle(40, 4, 22, 30, 58, 30);
    g.fillStyle(0x220044); g.fillTriangle(40, 5, 23, 30, 57, 30);
    g.fillStyle(0x330066, 0.5); g.fillTriangle(40, 8, 28, 29, 52, 29);
    // 모자 챙
    g.fillStyle(0x110022); g.fillRoundedRect(16, 28, 48, 7, 3);
    g.fillStyle(0x220044); g.fillRoundedRect(17, 29, 46, 5, 2);
    g.fillStyle(0xffdd00, 0.6); g.fillRoundedRect(18, 30, 44, 2, 1);
    // 모자 별
    g.fillStyle(0xffee44); g.fillCircle(40, 16, 4);
    g.fillStyle(0xffffff, 0.6); g.fillCircle(39, 15, 2);
    // 얼굴
    g.fillStyle(0xeeddcc); g.fillCircle(40, 40, 14);
    g.fillStyle(0xffeedd); g.fillCircle(40, 39, 13);
    g.fillStyle(0xffffff, 0.2); g.fillEllipse(34, 33, 12, 7);
    // 눈 (빛나는 보라)
    g.fillStyle(0xffffff); g.fillEllipse(32, 38, 12, 10); g.fillEllipse(48, 38, 12, 10);
    g.fillStyle(0xaa22ee); g.fillEllipse(33, 39, 8, 8); g.fillEllipse(49, 39, 8, 8);
    g.fillStyle(0x220033); g.fillEllipse(33, 39, 4, 6); g.fillEllipse(49, 39, 4, 6);
    g.fillStyle(0xffffff); g.fillCircle(31, 37, 2.2); g.fillCircle(47, 37, 2.2);
    g.fillCircle(34, 40, 1.1); g.fillCircle(50, 40, 1.1);
    // 눈썹 (우아하게 아치)
    g.fillStyle(0x330044); g.fillRoundedRect(27, 30, 12, 2.5, 1); g.fillRoundedRect(41, 30, 12, 2.5, 1);
    // 코 (작고 오뚝)
    g.fillStyle(0xddbbaa); g.fillTriangle(38, 43, 42, 43, 40, 46);
    // 미소 입
    g.fillStyle(0x550033); g.fillEllipse(40, 50, 16, 8);
    g.fillStyle(0xeeddcc); g.fillEllipse(40, 48, 18, 8);
    g.fillStyle(0xffffff); g.fillRect(34, 48, 12, 3);
    // 마법 파티클
    g.fillStyle(0xcc44ff, 0.7); g.fillCircle(68, 28, 4); g.fillCircle(72, 40, 3);
    g.fillStyle(0xffffff, 0.6); g.fillCircle(68, 27, 2); g.fillCircle(72, 39, 1.5);
    // 볼터치
    g.fillStyle(0xffaacc, 0.3); g.fillCircle(27, 42, 6); g.fillCircle(53, 42, 6);

    g.generateTexture('_tmp_witch', 80, 80);
    g.destroy();
    this._finalize('_tmp_witch', 'monster-witch', 80);
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
}
