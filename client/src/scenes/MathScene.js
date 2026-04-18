// MathScene - 수학 마법사의 탑
// 학년 선택 → 웨이브 반복 → HP/EXP/레벨 시스템

import Phaser from 'phaser';
import { MathQuestionGenerator, GRADES, MONSTER_NAMES } from '../quests/MathQuestions';

const PLAYER_SPEED  = 3;
const SELECT_RADIUS = 85;
const EXP_PER_KILL  = 20;
const COIN_PER_HIT  = 0.1;

// ─── 방별 설정 ────────────────────────────────────────────────
const ROOM_CONFIG = {
  1: {
    bg: 'room1-bg',
    playerStart: { x: 400, y: 380 },
    exit: { x: 400, y: 78, radius: 55, label: '마법사의 집으로 ▲' },
    monsters: [
      { x: 185, y: 210, type: 'add' },
      { x: 615, y: 210, type: 'sub' },
      { x: 185, y: 430, type: 'mul' },
      { x: 615, y: 430, type: 'div' },
    ],
  },
  2: {
    bg: 'room2-bg',
    playerStart: { x: 400, y: 480 },
    exit: { x: 68, y: 310, radius: 55, label: '숲으로 나가기 ◀' },
    secretExit: { x: 400, y: 155, radius: 70, label: '✨ 비밀의 방 ✨' },
    monsters: [
      { x: 220, y: 300, type: 'add' },
      { x: 580, y: 300, type: 'sub' },
      { x: 220, y: 450, type: 'mul' },
      { x: 580, y: 450, type: 'div' },
    ],
  },
  treasure: {
    bg: 'treasure-bg',
    playerStart: { x: 400, y: 400 },
    exit: { x: 72, y: 300, radius: 60, label: '숲으로 ◀' },
    isTreasureRoom: true,
    pedestal: { x: 400, y: 270, radius: 55 },
  },
  3: {
    bg: 'room3-bg',
    playerStart: { x: 400, y: 520 },
    exit: { x: 400, y: 85, radius: 60, label: '숲 깊은 곳으로 ▲' },
    monsters: [
      { x: 200, y: 290, type: 'add' },
      { x: 600, y: 290, type: 'sub' },
      { x: 200, y: 440, type: 'mul' },
      { x: 600, y: 440, type: 'div' },
    ],
  },
  4: {
    bg: 'room4-bg',
    bgTint: 0x4411aa,
    playerStart: { x: 400, y: 500 },
    exit: null,
    bossRoom: true,
    monsters: [
      { x: 400, y: 240, type: 'boss' },
    ],
  },
};

// 레벨 → 플레이어 외형 매핑
function playerTexKey(level) {
  if (level <= 2) return 'hero';
  if (level <= 4) return 'hero-lv2';
  if (level <= 6) return 'hero-lv3';
  return 'hero-lv4';
}

export default class MathScene extends Phaser.Scene {
  constructor() {
    super('MathScene');
  }

  // ─── URL 파라미터로 학년 자동 감지 ─────────────────────────
  _gradeFromURL() {
    const p = new URLSearchParams(window.location.search).get('grade');
    if (p === '34') return GRADES.G34;
    if (p === '56') return GRADES.G56;
    if (p === '12') return GRADES.G12;
    return null; // 파라미터 없으면 학년 선택 화면
  }

  // ─── Phaser 데이터 수신 (create 이전에 호출됨) ────────────
  init(data) {
    this.room          = data.room  || 1;
    this.stats         = data.stats || { level: 1, exp: 0, expToNext: 50, coins: 0, hp: 5, maxHp: 5 };
    this.grade         = data.grade || this._gradeFromURL() || GRADES.G12;
    this._fromRoom     = !!data.room;
    this._fromTreasure = data.fromRoom || null;
    this._urlGrade     = !data.room ? this._gradeFromURL() : null; // 첫 진입 시만
  }

  // ─── 씬 생성 ─────────────────────────────────────────────
  create() {
    const cfg = ROOM_CONFIG[this.room] || ROOM_CONFIG[1];
    this.bgImg = this.add.image(0, 0, cfg.bg).setOrigin(0);
    if (cfg.bgTint) this.bgImg.setTint(cfg.bgTint);

    this.generator     = new MathQuestionGenerator(this.grade);
    this.wave          = 1;
    this.monsters      = [];
    this.selectedMonster = null;
    this.answer        = '';
    this.gameStarted   = false;
    this.caveOpen      = false;
    this.transitioning = false;

    this.inBattle          = false;
    this.combo             = 0;
    this.battleStartTime   = 0;
    this.battleOverlayGroup = null;

    this.cursors = this.input.keyboard.createCursorKeys();
    this._setupKeyboard();
    this._createDustEmitter();
    this._setupJoystick();

    if (this._fromRoom || this._urlGrade) {
      // 방 이동 또는 URL 파라미터: 학년 선택 없이 바로 시작
      this.cameras.main.fadeIn(600);
      this._startGame(this._urlGrade || this.grade);
    } else {
      this._showGradeSelector();
    }

    // ── 디버그: 다음 방 스킵 버튼 ──────────────────────────
    this._addFullscreenButton();
  }

  // ─── 학년 선택 UI ─────────────────────────────────────────
  _showGradeSelector() {
    this.gradeUI = this.add.container(0, 0).setDepth(50);

    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.78);
    this.gradeUI.add(overlay);

    // 타이틀
    const title = this.add.text(400, 140, '⚔ 수학 마법사의 탑', {
      fontSize: '34px', color: '#FFD700',
      stroke: '#000', strokeThickness: 5,
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.gradeUI.add(title);

    const sub = this.add.text(400, 188, '학년을 선택하세요', {
      fontSize: '20px', color: '#cccccc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.gradeUI.add(sub);

    const options = [
      { grade: GRADES.G12, label: '1~2학년', desc: '20 이하 기초 사칙연산', bg: 0x1a6b2a, y: 270 },
      { grade: GRADES.G34, label: '3~4학년', desc: '구구단 & 100 이하 연산', bg: 0x1a3d7a, y: 360 },
      { grade: GRADES.G56, label: '5~6학년', desc: '큰 수 & 혼합계산',        bg: 0x6b1a1a, y: 450 },
    ];

    options.forEach(({ grade, label, desc, bg, y }) => {
      const btn = this.add.rectangle(400, y, 340, 62, bg, 0.92)
        .setInteractive({ useHandCursor: true });
      const lbl = this.add.text(400, y - 10, label, {
        fontSize: '24px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      const dsc = this.add.text(400, y + 16, desc, {
        fontSize: '13px', color: '#bbbbbb', fontFamily: 'monospace',
      }).setOrigin(0.5);

      btn.on('pointerover', () => btn.setAlpha(1));
      btn.on('pointerout',  () => btn.setAlpha(0.92));
      btn.on('pointerdown', () => this._startGame(grade));

      this.gradeUI.add([btn, lbl, dsc]);
    });
  }

  _startGame(grade) {
    this.grade = grade;
    this.generator.setGrade(grade);
    this.gameStarted = true;
    if (this.gradeUI) this.gradeUI.destroy();

    this._spawnPlayer();

    const cfg = ROOM_CONFIG[this.room];
    if (cfg?.isTreasureRoom) {
      this._setupTreasureRoom(cfg);
    } else {
      this._spawnMonsters();
    }

    this._createHUD();
    this._createProblemPanel();
    this._refreshHUD();
  }

  // ─── 플레이어 ─────────────────────────────────────────────
  _spawnPlayer() {
    const { x, y } = (ROOM_CONFIG[this.room] || ROOM_CONFIG[1]).playerStart;
    const key = playerTexKey(this.stats.level);
    this.player = this.add.sprite(x, y, key)
      .setDepth(5).setScale(0.8);
  }

  // ─── 몬스터 소환 ──────────────────────────────────────────
  _spawnMonsters() {
    // 이전 웨이브 잔여물 제거
    this.monsters.forEach(m => {
      if (m.alive) {
        m.sprite.destroy();
        this._destroyHpBar(m.hpBar);
        m.nameTag.destroy();
      }
    });
    this.monsters = [];
    this.selectedMonster = null;

    const cfg = ROOM_CONFIG[this.room] || ROOM_CONFIG[1];

    // ─── 보스 방 ─────────────────────────────────────────────
    if (cfg.bossRoom) {
      this._spawnBoss(cfg);
      return;
    }

    // ─── 일반 방 ─────────────────────────────────────────────
    const monsterHp = 3;  // 대결 모드: 항상 3문제
    cfg.monsters.forEach(({ x, y, type }) => {
      const sprite = this.add.sprite(x, y, `monster-${type}`)
        .setDepth(4).setScale(0.50);

      const problem = this.generator.generate(type);

      const monster = {
        sprite, type, problem,
        hp: monsterHp, maxHp: monsterHp,
        x, y, alive: true,
        patrolX: x, patrolY: y,
        bobOffset: Math.random() * Math.PI * 2,
        hpBar:   this._makeHpBar(x, y - 60, monsterHp),
        nameTag: this._makeNameTag(x, y + 56, type),
      };

      // 배회 타이머
      this.time.addEvent({
        delay: 1000 + Math.random() * 1400,
        loop: true,
        callback: () => {
          if (!monster.alive) return;
          monster.patrolX = Phaser.Math.Clamp(x + (Math.random() - 0.5) * 80, 100, 700);
          monster.patrolY = Phaser.Math.Clamp(y + (Math.random() - 0.5) * 50, 120, 500);
        },
      });

      this.monsters.push(monster);
    });
  }

  _spawnBoss(cfg) {
    const { x, y } = cfg.monsters[0];
    const sprite = this.add.sprite(x, y, 'monster-boss').setDepth(4).setScale(0.75);

    const bossTypes = ['add', 'sub', 'mul', 'div'];
    const firstType = bossTypes[Math.floor(Math.random() * 4)];
    const problem = this.generator.generate(firstType);

    const monster = {
      sprite, type: 'boss', problem,
      hp: 5, maxHp: 5,
      x, y, alive: true,
      isBoss: true,
      bossTypes,
      hpBar:   this._makeBossHpBar(5),
      nameTag: this._makeNameTag(x, y + 72, 'boss'),
    };

    monster.patrolX = x;
    monster.patrolY = y;
    monster.bobOffset = Math.random() * Math.PI * 2;

    this.monsters.push(monster);

    // 보스 등장 연출
    this.time.delayedCall(200, () => {
      this.cameras.main.shake(500, 0.018);
      this._floatText(400, 270, '👑 수학 마왕 등장!', '#ff44ff', 36);
    });
  }

  // HP 바 컨테이너
  _makeHpBar(x, y, maxHp) {
    const W = 54;
    const bg  = this.add.rectangle(x, y, W,     8, 0x222222).setDepth(6);
    const bar = this.add.rectangle(x - W / 2, y, W, 8, 0x44ff44)
      .setOrigin(0, 0.5).setDepth(6);

    return { bg, bar, maxWidth: W, maxHp };
  }

  // 보스 전용 HP 바 (상단 중앙, 크게)
  _makeBossHpBar(maxHp) {
    const W = 220, cx = 400, cy = 55;
    const bg  = this.add.rectangle(cx, cy, W + 8, 20, 0x220022).setDepth(15);
    const bar = this.add.rectangle(cx - W / 2, cy, W, 16, 0xee1166)
      .setOrigin(0, 0.5).setDepth(16);
    const label = this.add.text(cx, cy - 18, '👑 수학 마왕', {
      fontSize: '14px', color: '#ff88ff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(16);
    const hpText = this.add.text(cx, cy, `${maxHp} / ${maxHp}`, {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(17);

    return { bg, bar, maxWidth: W, maxHp, label, hpText, isBoss: true };
  }

  _updateHpBar(hpBar, hp) {
    const ratio = Math.max(0, hp / hpBar.maxHp);
    hpBar.bar.width = hpBar.maxWidth * ratio;
    if (hpBar.isBoss) {
      hpBar.bar.setFillStyle(ratio > 0.5 ? 0xee1166 : ratio > 0.2 ? 0xff6600 : 0xff0000);
      if (hpBar.hpText) hpBar.hpText.setText(`${hp} / ${hpBar.maxHp}`);
    } else {
      hpBar.bar.setFillStyle(ratio > 0.5 ? 0x44ff44 : ratio > 0.25 ? 0xffaa44 : 0xff4444);
    }
  }

  _destroyHpBar(hpBar) {
    hpBar.bg.destroy();
    hpBar.bar.destroy();
    if (hpBar.label)  hpBar.label.destroy();
    if (hpBar.hpText) hpBar.hpText.destroy();
  }

  // 몬스터 이름표
  _makeNameTag(x, y, type) {
    return this.add.text(x, y, MONSTER_NAMES[type], {
      fontSize: '11px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(6);
  }

  // ─── HUD (상단 바) ────────────────────────────────────────
  _createHUD() {
    this.hudGroup = this.add.container(0, 0).setDepth(20);

    // 배경 바
    this.hudGroup.add(this.add.rectangle(400, 16, 800, 32, 0x000000, 0.65));

    // 🪙 디스코인
    this.hudGroup.add(
      this.add.text(14, 16, '🪙', { fontSize: '16px' }).setOrigin(0, 0.5)
    );
    this.coinText = this.add.text(36, 16, '0.0 DC', {
      fontSize: '15px', color: '#FFD700',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.hudGroup.add(this.coinText);

    // 웨이브
    this.waveText = this.add.text(400, 16, `Wave ${this.wave}`, {
      fontSize: '16px', color: '#aaddff',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.hudGroup.add(this.waveText);

    // 학년
    this.hudGroup.add(
      this.add.text(570, 16, this.grade, {
        fontSize: '13px', color: '#cccccc', fontFamily: 'monospace',
      }).setOrigin(0.5)
    );

    // 레벨
    this.levelText = this.add.text(680, 10, `Lv.${this.stats.level}`, {
      fontSize: '14px', color: '#ffffff',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.hudGroup.add(this.levelText);

    // EXP 바
    const EXP_W = 100;
    this.hudGroup.add(this.add.rectangle(750, 22, EXP_W, 7, 0x333333).setOrigin(0.5));
    this.expBar = this.add.rectangle(700, 22, 0, 7, 0x44aaff).setOrigin(0, 0.5);
    this.expBarMaxW = EXP_W;
    this.hudGroup.add(this.expBar);

    // ❤ 플레이어 HP 하트 (HUD 우측)
    this.hudHpHearts = [];
    for (let i = 0; i < this.stats.maxHp; i++) {
      const heart = this.add.text(158 + i * 22, 16, '❤', {
        fontSize: '14px',
        color: i < this.stats.hp ? '#ff4444' : '#444444',
      }).setOrigin(0.5).setDepth(21);
      this.hudHpHearts.push(heart);
    }
  }

  _refreshHUD() {
    // 코인
    const dc = (Math.round(this.stats.coins * 10) / 10).toFixed(1);
    this.coinText.setText(`${dc} DC`);

    // EXP 바
    const ratio = Math.min(1, this.stats.exp / this.stats.expToNext);
    this.expBar.width = this.expBarMaxW * ratio;

    // 레벨
    this.levelText.setText(`Lv.${this.stats.level}`);

    // 웨이브
    this.waveText.setText(`Wave ${this.wave}`);

    // HP 하트
    if (this.hudHpHearts) {
      this.hudHpHearts.forEach((heart, i) => {
        heart.setColor(i < this.stats.hp ? '#ff4444' : '#444444');
      });
    }
  }

  // ─── 문제 패널 (하단) ─────────────────────────────────────
  _createProblemPanel() {
    this.problemPanel = this.add.container(0, 510).setDepth(20);

    const bg = this.add.rectangle(400, 45, 800, 90, 0x0d0d1e, 0.92);
    this.problemPanel.add(bg);

    this.problemText = this.add.text(400, 24, '몬스터에게 가까이 가면 문제가 나타납니다!', {
      fontSize: '18px', color: '#bbbbbb', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.inputDisplay = this.add.text(400, 60, '', {
      fontSize: '21px', color: '#FFD700',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.problemPanel.add([this.problemText, this.inputDisplay]);
  }

  // ─── 키보드 입력 ──────────────────────────────────────────
  _setupKeyboard() {
    this.input.keyboard.on('keydown', (e) => {
      if (!this.gameStarted || !this.selectedMonster) return;

      if (e.key >= '0' && e.key <= '9') {
        if (this.answer.length < 5) {
          this.answer += e.key;
          this._refreshInput();
        }
      } else if (e.key === 'Backspace') {
        this.answer = this.answer.slice(0, -1);
        this._refreshInput();
      } else if (e.key === 'Enter' && this.answer.length > 0) {
        this._checkAnswer();
      } else if (e.key === 'Escape') {
        this._exitBattle();
      }
    });
  }

  _refreshInput() {
    if (!this.selectedMonster) return;
    const cursor = (Date.now() % 500 < 250) ? '|' : ' ';
    const inputStr = `답: ${this.answer}${cursor}`;
    this.inputDisplay.setText(inputStr);
    if (this.battleInputText) this.battleInputText.setText(inputStr);
  }

  // ─── 업데이트 루프 ────────────────────────────────────────
  update() {
    if (!this.gameStarted || !this.player) return;

    // 대결 중에는 이동 불가
    if (!this.inBattle) {
      const p = this.player;
      const joy = this.joystick;

      // 키보드
      if (this.cursors.left.isDown)  p.x -= PLAYER_SPEED;
      if (this.cursors.right.isDown) p.x += PLAYER_SPEED;
      if (this.cursors.up.isDown)    p.y -= PLAYER_SPEED;
      if (this.cursors.down.isDown)  p.y += PLAYER_SPEED;

      // 조이스틱 (터치)
      if (joy.active) {
        p.x += joy.dx * PLAYER_SPEED;
        p.y += joy.dy * PLAYER_SPEED;
      }

      p.x = Phaser.Math.Clamp(p.x, 50, 750);
      p.y = Phaser.Math.Clamp(p.y, 105, 555);
    }

    // 몬스터 배회 & 바 동기화
    this._updateMonsters();

    // 출구 근접 감지 (대결 중 아닐 때만)
    if (!this.inBattle && !this.transitioning) {
      const cfg = ROOM_CONFIG[this.room] || ROOM_CONFIG[1];

      // 일반 출구
      if (this.caveOpen && cfg.exit) {
        const ex = cfg.exit;
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, ex.x, ex.y);
        if (d < ex.radius) {
          cfg.isTreasureRoom ? this._exitTreasureRoom() : this._enterNextRoom();
        }
      }

      // 비밀 출구 (몬스터 전멸 후에만 접근 가능)
      if (cfg.secretExit && this.caveOpen) {
        const se = cfg.secretExit;
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, se.x, se.y);
        if (d < se.radius) this._enterTreasureRoom();
      }

      // 보물방 제단 근접 감지
      if (cfg.isTreasureRoom && cfg.pedestal && !this.pedestalUsed && !this.pedestalChallenge) {
        const ped = cfg.pedestal;
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, ped.x, ped.y);
        if (d < ped.radius) this._startPedestalChallenge();
      }
    }

    // 대결 중 아닐 때만 몬스터 근접 감지
    if (!this.inBattle) {
      let nearest = null, nearestDist = SELECT_RADIUS;
      this.monsters.filter(m => m.alive).forEach(m => {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.sprite.x, m.sprite.y);
        if (d < nearestDist) { nearest = m; nearestDist = d; }
      });
      if (nearest) this._enterBattle(nearest);
    }

    // 커서 깜빡임
    if (this.selectedMonster) this._refreshInput();
  }

  // ─── 몬스터 이동 & UI 동기화 ─────────────────────────────
  _updateMonsters() {
    const t = this.time.now;
    this.monsters.filter(m => m.alive).forEach(m => {
      const selected = (m === this.selectedMonster);
      const bob = Math.sin(t * 0.0026 + m.bobOffset) * 7;

      // 선택 중엔 제자리 bob, 아니면 배회
      if (!selected) {
        m.sprite.x = Phaser.Math.Linear(m.sprite.x, m.patrolX, 0.016);
      }
      m.sprite.y = (selected ? m.y : m.patrolY) + bob;

      // 보스 HP 바는 화면 고정이므로 스킵
      if (m.isBoss) return;

      const sx = m.sprite.x, sy = m.sprite.y;
      m.hpBar.bg.setPosition(sx, sy - 52);
      m.hpBar.bar.setPosition(sx - m.hpBar.maxWidth / 2, sy - 52);
      m.nameTag.setPosition(sx, sy + 50);
    });
  }

  // ─── 대결 진입 / 탈출 ────────────────────────────────────
  _enterBattle(monster) {
    if (this.inBattle) return;
    this.inBattle        = true;
    this.combo           = 0;
    this.battleStartTime = this.time.now;

    if (this.selectedMonster && this.selectedMonster !== monster) {
      this.selectedMonster.sprite.clearTint();
    }
    this.selectedMonster = monster;
    monster.sprite.setTint(0xffff88);
    this.answer = '';

    // 화면 전환 연출
    this.cameras.main.flash(250, 255, 220, 80, true);
    this.cameras.main.shake(200, 0.010);

    // 대결 오버레이 생성
    this._createBattleOverlay(monster);
    this._floatText(400, 170, `⚔  ${MONSTER_NAMES[monster.type]}`, '#ff6688', 32);
    this._showNumpad();
  }

  _exitBattle() {
    if (!this.inBattle) return;
    this.inBattle = false;

    if (this.selectedMonster && this.selectedMonster.alive) {
      this.selectedMonster.sprite.clearTint();
    }
    this.selectedMonster  = null;
    this.answer           = '';
    this.combo            = 0;

    // 오버레이 제거
    if (this.battleOverlayGroup) {
      this.tweens.add({
        targets: this.battleOverlayGroup,
        alpha: 0, duration: 200,
        onComplete: () => {
          if (this.battleOverlayGroup) {
            this.battleOverlayGroup.destroy(true);
            this.battleOverlayGroup = null;
          }
          this.battleProblemText = null;
          this.battleInputText   = null;
          this.battleHpHearts    = null;
          this.battleComboText   = null;
        },
      });
    }

    this.problemText.setText('몬스터에게 가까이 가면 문제가 나타납니다!');
    this.inputDisplay.setText('');
    this._hideNumpad();
  }

  // ─── 대결 오버레이 UI ─────────────────────────────────────
  _createBattleOverlay(monster) {
    if (this.battleOverlayGroup) {
      this.battleOverlayGroup.destroy(true);
      this.battleOverlayGroup = null;
    }

    const grp = this.add.container(0, 0).setDepth(40);
    this.battleOverlayGroup = grp;

    // 어두운 배경
    const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.78);
    grp.add(bg);

    // 몬스터 스포트라이트
    const spot = this.add.circle(monster.x, monster.y, 95, 0x9933ff, 0.12);
    grp.add(spot);

    // 대결 패널 테두리 강조선
    const panelTop = this.add.rectangle(400, 248, 680, 2, 0x9933ff, 0.8);
    const panelBot = this.add.rectangle(400, 530, 680, 2, 0x9933ff, 0.8);
    grp.add([panelTop, panelBot]);

    // 패널 배경
    const panel = this.add.rectangle(400, 390, 680, 280, 0x0a0018, 0.96);
    grp.add(panel);

    // 몬스터 이름 + Wave 정보
    const qLeft  = monster.maxHp - monster.hp;
    const nameHdr = this.add.text(400, 266, `⚔  ${MONSTER_NAMES[monster.type]}  (${qLeft + 1} / ${monster.maxHp})`, {
      fontSize: '20px', color: '#ff88cc',
      stroke: '#000', strokeThickness: 4,
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    grp.add(nameHdr);
    this._battleNameHdr = nameHdr;

    // 문제 텍스트 (크게)
    this.battleProblemText = this.add.text(400, 335, monster.problem.question, {
      fontSize: '40px', color: '#ffffff',
      stroke: '#000', strokeThickness: 6,
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    grp.add(this.battleProblemText);

    // 입력 표시
    this.battleInputText = this.add.text(400, 400, '답: _', {
      fontSize: '26px', color: '#FFD700',
      stroke: '#000', strokeThickness: 4,
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    grp.add(this.battleInputText);

    // Enter 힌트
    const hint = this.add.text(400, 433, 'Enter = 제출   ESC = 도망가기', {
      fontSize: '13px', color: '#666688', fontFamily: 'monospace',
    }).setOrigin(0.5);
    grp.add(hint);

    // 구분선
    grp.add(this.add.rectangle(400, 452, 580, 1, 0x333355, 0.8));

    // HP 하트 (플레이어)
    grp.add(this.add.text(130, 475, '내 HP', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5));

    this.battleHpHearts = [];
    for (let i = 0; i < this.stats.maxHp; i++) {
      const heart = this.add.text(168 + i * 26, 475, '❤', {
        fontSize: '20px',
        color: i < this.stats.hp ? '#ff3355' : '#333333',
      }).setOrigin(0.5);
      grp.add(heart);
      this.battleHpHearts.push(heart);
    }

    // 콤보 텍스트
    this.battleComboText = this.add.text(630, 475, '', {
      fontSize: '18px', color: '#ffdd00',
      stroke: '#000', strokeThickness: 3,
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    grp.add(this.battleComboText);

    // 페이드인
    grp.setAlpha(0);
    this.tweens.add({ targets: grp, alpha: 1, duration: 220, ease: 'Linear' });

    // 기존 하단 패널에도 반영
    this.problemText.setText(monster.problem.question);
  }

  // ─── 정답 처리 ────────────────────────────────────────────
  _checkAnswer() {
    if (!this.selectedMonster) return;

    const userAns    = parseInt(this.answer, 10);
    const correctAns = this.selectedMonster.problem.answer;

    if (userAns === correctAns) {
      this._onCorrect();
    } else {
      this._onWrong();
    }

    this.answer = '';
    this._refreshInput();
  }

  _onCorrect() {
    const m = this.selectedMonster;
    m.hp--;
    this._updateHpBar(m.hpBar, m.hp);

    // 콤보 증가
    this.combo++;

    // 빠른 정답 보너스 (5초 이내)
    const elapsed     = (this.time.now - this.battleStartTime) / 1000;
    const speedBonus  = elapsed < 5 ? 0.2 : 0;
    const comboBonus  = this.combo >= 3 ? Math.round(Math.floor(this.combo / 3) * 0.1 * 10) / 10 : 0;
    const totalCoin   = Math.round((COIN_PER_HIT + speedBonus + comboBonus) * 10) / 10;

    this.stats.coins = Math.round((this.stats.coins + totalCoin) * 10) / 10;
    this._refreshHUD();

    this.cameras.main.flash(180, 0, 200, 0, true);

    // 획득 코인 플로팅
    let coinMsg = `+${COIN_PER_HIT} DC`;
    if (speedBonus > 0) coinMsg += ` ⚡`;
    if (comboBonus > 0) coinMsg += ` 🔥`;
    this._floatText(m.x, m.y - 50, coinMsg, '#FFD700', 22);
    this._floatText(m.x, m.y - 80, '정답! ✓', '#44ff88', 30);

    // 콤보 UI 갱신
    if (this.battleComboText) {
      if (this.combo >= 2) {
        this.battleComboText.setText(`🔥 COMBO ×${this.combo}`);
        this.battleComboText.setColor(this.combo >= 5 ? '#ff4400' : '#ffdd00');
        // 콤보 팡파르 연출
        this.tweens.add({
          targets: this.battleComboText,
          scaleX: 1.4, scaleY: 1.4, duration: 100,
          yoyo: true, ease: 'Back.easeOut',
        });
      } else {
        this.battleComboText.setText('');
      }
    }

    if (m.isBoss) {
      this._floatText(m.x, m.y - 108, `${m.maxHp - m.hp} / ${m.maxHp} 타격!`, '#ff88ff', 18);
    }

    if (m.hp <= 0) {
      this._killMonster(m);
    } else {
      // 다음 문제 생성
      if (m.isBoss) {
        const nextType = m.bossTypes[Math.floor(Math.random() * m.bossTypes.length)];
        m.problem = this.generator.generate(nextType);
      } else {
        m.problem = this.generator.generate(m.type);
      }
      this.problemText.setText(m.problem.question);
      // 대결 패널 문제 + 진행도 갱신
      if (this.battleProblemText) this.battleProblemText.setText(m.problem.question);
      if (this._battleNameHdr) {
        const qLeft = m.maxHp - m.hp;
        this._battleNameHdr.setText(`⚔  ${MONSTER_NAMES[m.type]}  (${qLeft + 1} / ${m.maxHp})`);
      }
      this.battleStartTime = this.time.now; // 다음 문제 타이머 리셋
      this._hitShake(m.sprite);
    }
  }

  _onWrong() {
    this.cameras.main.shake(280, 0.014);
    this.cameras.main.flash(200, 200, 0, 0, true);

    // 콤보 초기화
    this.combo = 0;
    if (this.battleComboText) this.battleComboText.setText('');

    // HP 감소
    this.stats.hp = Math.max(0, this.stats.hp - 1);
    this._refreshHUD();
    this._refreshBattleHpHearts();

    // 플레이어 깜빡임
    if (this.player) {
      this.tweens.add({
        targets: this.player,
        alpha: 0.15, duration: 80,
        yoyo: true, repeat: 4,
      });
    }

    if (this.stats.hp <= 0) {
      this._floatText(400, 250, '💀 쓰러졌다!', '#ff0000', 42);
      this.time.delayedCall(1200, () => this._gameOver());
    } else {
      this._floatText(400, 270, `틀렸어! ❤ ${this.stats.hp}남음`, '#ff5533', 24);
    }
  }

  _refreshBattleHpHearts() {
    if (!this.battleHpHearts) return;
    this.battleHpHearts.forEach((heart, i) => {
      heart.setColor(i < this.stats.hp ? '#ff3355' : '#333333');
    });
  }

  _killMonster(monster) {
    monster.alive = false;
    this._exitBattle();

    // EXP 획득
    const gain = EXP_PER_KILL * this.wave;
    this._gainExp(gain);
    this._showExpBurst(monster.x, monster.y, gain);

    // HP바 / 이름표 페이드아웃
    const hpTargets = [monster.hpBar.bg, monster.hpBar.bar, monster.nameTag];
    if (monster.hpBar.label)  hpTargets.push(monster.hpBar.label);
    if (monster.hpBar.hpText) hpTargets.push(monster.hpBar.hpText);
    this.tweens.add({
      targets: hpTargets,
      alpha: 0, duration: 300,
      onComplete: () => {
        this._destroyHpBar(monster.hpBar);
        monster.nameTag.destroy();
      },
    });

    if (monster.isBoss) {
      // 보스: 스프라이트 파괴 없이 변신 연출
      this.time.delayedCall(400, () => this._bossTransform(monster));
    } else {
      // 일반: 축소 후 파괴
      this.tweens.add({
        targets: [monster.sprite],
        scaleX: 0, scaleY: 0, alpha: 0,
        duration: 380, ease: 'Back.easeIn',
        onComplete: () => monster.sprite.destroy(),
      });
      if (this.monsters.filter(m => m.alive).length === 0) {
        this.time.delayedCall(700, () => this._waveClear());
      }
    }
  }

  // ─── 보스 변신 연출 ──────────────────────────────────────
  _bossTransform(monster) {
    this.cameras.main.flash(350, 255, 255, 255, true);

    // 1단계: 축소 (사라짐)
    this.tweens.add({
      targets: monster.sprite,
      scaleX: 0, scaleY: 0,
      duration: 280, ease: 'Back.easeIn',
      onComplete: () => {
        // 텍스처 교체
        monster.sprite.setTexture('monster-boss-good').setAlpha(1);

        // 2단계: 착한 모습으로 등장
        this.tweens.add({
          targets: monster.sprite,
          scaleX: 0.9, scaleY: 0.9,
          duration: 550, ease: 'Back.easeOut',
          onComplete: () => {
            this.cameras.main.flash(200, 255, 240, 100, true);
            this._floatText(monster.x, monster.y - 100, '착해졌다! 🌟', '#FFD700', 34);
            // 3단계: 잠시 후 게임 클리어
            this.time.delayedCall(2400, () => this._gameClear());
          },
        });
      },
    });
  }

  // ─── EXP / 레벨 ──────────────────────────────────────────
  _gainExp(amount) {
    this.stats.exp += amount;
    if (this.stats.exp >= this.stats.expToNext) {
      this._levelUp();
    }
    this._refreshHUD();
  }

  _levelUp() {
    const prevTex = playerTexKey(this.stats.level);
    this.stats.level++;
    this.stats.exp -= this.stats.expToNext;
    this.stats.expToNext = Math.floor(this.stats.expToNext * 1.6);

    // 외형 변경 (텍스처 키가 바뀔 때만)
    const newTex = playerTexKey(this.stats.level);
    if (newTex !== prevTex && this.player) {
      this.player.setTexture(newTex);
      this.player.setScale(0.8);
      // 변신 이펙트
      this.tweens.add({
        targets: this.player,
        scaleX: 0.75, scaleY: 0.75,
        duration: 200, yoyo: true,
        ease: 'Back.easeOut',
      });
    }

    const tierNames = { 'player-lv1': '견습 마법사', 'player-lv2': '숙련 마법사', 'player-lv3': '고급 마법사', 'player-lv4': '전설 마법사' };
    const tierMsg = newTex !== prevTex ? ` [${tierNames[newTex]}]` : '';
    this._floatText(400, 250, `★ Lv.${this.stats.level} UP!${tierMsg} ★`, '#FFD700', 34);
    this.cameras.main.flash(280, 255, 210, 0, true);
  }

  // ─── 웨이브 클리어 ────────────────────────────────────────
  _waveClear() {
    this.wave++;
    this._floatText(400, 270, `★ Wave ${this.wave - 1} 클리어! ★`, '#FFD700', 38);
    this._refreshHUD();

    // 다음 방이 있으면 출구 활성화, 없으면 다음 웨이브
    const hasNextRoom = ROOM_CONFIG[this.room + 1] !== undefined;
    if (hasNextRoom) {
      this.time.delayedCall(1000, () => this._openExit());
    } else {
      this.time.delayedCall(1400, () => this._spawnMonsters());
    }
  }

  _openExit() {
    const cfg = (ROOM_CONFIG[this.room] || ROOM_CONFIG[1]).exit;
    this.caveOpen = true;

    // 출구 글로우 원
    this.exitGlow = this.add.circle(cfg.x, cfg.y, cfg.radius, 0xffffff, 0.15).setDepth(8);
    this.tweens.add({
      targets: this.exitGlow,
      alpha: 0.4, scaleX: 1.15, scaleY: 1.15,
      duration: 800, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 출구 안내 텍스트
    this.exitLabel = this.add.text(cfg.x, cfg.y - cfg.radius - 18, cfg.label, {
      fontSize: '14px', color: '#FFD700',
      stroke: '#000', strokeThickness: 3,
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(9);

    this._floatText(400, 300, '출구가 열렸다!', '#ffffff', 30);

    // 비밀 문 활성화 (방 2)
    this._showSecretDoor();
  }

  _enterNextRoom() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.gameStarted = false;

    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MathScene', {
        room:  this.room + 1,
        stats: this.stats,
        grade: this.grade,
      });
    });
  }

  // ─── 비밀 문 시각화 (방 2 북쪽) ─────────────────────────────
  _showSecretDoor() {
    const cfg = ROOM_CONFIG[this.room];
    if (!cfg?.secretExit) return;
    const { x, y, radius, label } = cfg.secretExit;
    // 몬스터 전멸 전엔 희미하게만 표시 (진입 불가 힌트)

    // 외곽 큰 글로우
    const outerGlow = this.add.circle(x, y, radius + 20, 0xffcc00, 0.12).setDepth(3);
    this.tweens.add({
      targets: outerGlow,
      alpha: 0.28, scaleX: 1.1, scaleY: 1.1,
      duration: 1000, yoyo: true, repeat: -1,
    });

    // 내부 글로우
    const glow = this.add.circle(x, y, radius, 0xffaa00, 0.30).setDepth(4);
    this.tweens.add({
      targets: glow,
      alpha: 0.55, scaleX: 1.08, scaleY: 1.08,
      duration: 800, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 라벨 (깜빡임)
    const lbl = this.add.text(x, y, label, {
      fontSize: '15px', color: '#FFD700',
      stroke: '#000', strokeThickness: 4,
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: lbl,
      alpha: 0.3,
      duration: 700, yoyo: true, repeat: -1,
    });
  }

  // ─── 보물방 진입 ─────────────────────────────────────────────
  _enterTreasureRoom() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.gameStarted = false;
    this.cameras.main.fadeOut(700, 255, 215, 0); // 골드 페이드
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MathScene', {
        room:     'treasure',
        stats:    this.stats,
        grade:    this.grade,
        fromRoom: this.room,
      });
    });
  }

  // ─── 보물방 퇴장 (→ 룸 3 숲) ────────────────────────────────
  _exitTreasureRoom() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.gameStarted = false;
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MathScene', {
        room:  3,
        stats: this.stats,
        grade: this.grade,
      });
    });
  }

  // ─── 보물방 설정 ─────────────────────────────────────────────
  _setupTreasureRoom(cfg) {
    this.monsters = [];
    this.treasureCoins = [];
    this.pedestalUsed = false;
    this.pedestalChallenge = null;

    // 출구는 보물 획득 후에 열림
    this.caveOpen = false;

    // 중앙 제단 오브젝트
    const ped = cfg.pedestal;
    this.pedestalGlow = this.add.circle(ped.x, ped.y, ped.radius, 0xaaddff, 0.18).setDepth(4);
    this.tweens.add({
      targets: this.pedestalGlow,
      alpha: 0.38, scaleX: 1.12, scaleY: 1.12,
      duration: 1000, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.pedestalLabel = this.add.text(ped.x, ped.y - ped.radius - 16, '[ 가까이 가기 ]', {
      fontSize: '13px', color: '#aaddff',
      stroke: '#000', strokeThickness: 3,
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: this.pedestalLabel,
      alpha: 0.2, duration: 600, yoyo: true, repeat: -1,
    });
  }

  // ─── 제단 챌린지 (5문제) ─────────────────────────────────────
  _startPedestalChallenge() {
    if (this.pedestalUsed || this.pedestalChallenge) return;
    this.pedestalChallenge = { questions: [], current: 0, correct: 0 };

    // 5문제 생성
    const types = ['add', 'sub', 'mul', 'div', 'add'];
    this.pedestalChallenge.questions = types.map(t => this.generator.generate(t));

    this._showPedestalQuestion();
  }

  _showPedestalQuestion() {
    const ch = this.pedestalChallenge;
    if (ch.overlay) ch.overlay.destroy();

    const q = ch.questions[ch.current];
    const overlay = this.add.container(0, 0).setDepth(60);
    ch.overlay = overlay;

    // 배경
    overlay.add(this.add.rectangle(400, 300, 480, 320, 0x0d0d22, 0.92));
    overlay.add(this.add.rectangle(400, 300, 476, 316, 0x334466, 0).setStrokeStyle(2, 0xaaddff));

    // 진행도
    overlay.add(this.add.text(400, 170, `문제 ${ch.current + 1} / 5`, {
      fontSize: '16px', color: '#aaddff', fontFamily: 'monospace',
    }).setOrigin(0.5));

    // 문제
    overlay.add(this.add.text(400, 245, q.question, {
      fontSize: '36px', color: '#FFD700',
      stroke: '#000', strokeThickness: 4,
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    // 입력창
    ch.inputText = '';
    ch.inputDisplay = this.add.text(400, 310, '답: _', {
      fontSize: '26px', color: '#ffffff',
      stroke: '#000', strokeThickness: 3,
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    overlay.add(ch.inputDisplay);

    overlay.add(this.add.text(400, 360, 'Enter로 제출', {
      fontSize: '13px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5));

    // 키 입력 핸들러
    if (ch.keyHandler) this.input.keyboard.off('keydown', ch.keyHandler);
    ch.keyHandler = (e) => this._handlePedestalInput(e);
    this.input.keyboard.on('keydown', ch.keyHandler);
    this._showNumpad();
  }

  _handlePedestalInput(e) {
    const ch = this.pedestalChallenge;
    if (!ch) return;

    if (e.key >= '0' && e.key <= '9') {
      ch.inputText += e.key;
      ch.inputDisplay.setText(`답: ${ch.inputText}_`);
    } else if (e.key === 'Backspace') {
      ch.inputText = ch.inputText.slice(0, -1);
      ch.inputDisplay.setText(`답: ${ch.inputText || ''}_`);
    } else if (e.key === 'Enter') {
      this._submitPedestalAnswer();
    }
  }

  _submitPedestalAnswer() {
    const ch = this.pedestalChallenge;
    const q = ch.questions[ch.current];
    const userAns = parseInt(ch.inputText, 10);

    if (userAns === q.answer) {
      ch.correct++;
      this._floatText(400, 210, '✓ 정답!', '#44ff88', 28);
    } else {
      this._floatText(400, 210, `✗ 오답 (${q.answer})`, '#ff4444', 28);
    }

    ch.current++;
    if (ch.current >= 5) {
      this.input.keyboard.off('keydown', ch.keyHandler);
      ch.overlay.destroy();
      this._hideNumpad();
      this.time.delayedCall(600, () => this._finishPedestalChallenge());
    } else {
      this.time.delayedCall(400, () => this._showPedestalQuestion());
    }
  }

  _finishPedestalChallenge() {
    this.pedestalUsed = true;
    this.pedestalChallenge = null;

    // 제단 글로우 끄기
    if (this.pedestalGlow)  { this.pedestalGlow.destroy();  this.pedestalGlow = null; }
    if (this.pedestalLabel) { this.pedestalLabel.destroy(); this.pedestalLabel = null; }

    // 코인 지급
    this.stats.coins += 1;
    this._refreshHUD();
    this._floatText(400, 270, '🏆 +1 DC 획득!', '#FFD700', 36);
    this.cameras.main.flash(400, 255, 215, 0, true);

    // 왼쪽 문 열기
    this.caveOpen = true;
    const ex = (ROOM_CONFIG['treasure']).exit;
    const exitGlow = this.add.circle(ex.x, ex.y, ex.radius, 0xffffff, 0.18).setDepth(8);
    this.tweens.add({
      targets: exitGlow,
      alpha: 0.45, scaleX: 1.15, scaleY: 1.15,
      duration: 800, yoyo: true, repeat: -1,
    });
    this.add.text(ex.x + ex.radius + 14, ex.y, ex.label, {
      fontSize: '14px', color: '#FFD700',
      stroke: '#000', strokeThickness: 3,
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(9);
    this._floatText(ex.x + 80, ex.y, '문이 열렸다!', '#ffffff', 24);
  }

  // ─── 디버그 스킵 버튼 ────────────────────────────────────
  // ─── 모바일 숫자 키패드 ──────────────────────────────────────
  _createNumpadOnce() {
    if (this.numpadContainer) return;

    const BW = 64, BH = 52, GAP = 6;
    const COLS = 3;
    const startX = 800 - (BW * COLS + GAP * (COLS - 1)) - 12;
    const startY = 310;

    const keys = [
      '7','8','9',
      '4','5','6',
      '1','2','3',
      '⌫','0','✓',
    ];

    this.numpadContainer = this.add.container(0, 0).setDepth(95).setAlpha(0);

    // 배경 패널
    const panelW = BW * COLS + GAP * (COLS - 1) + 24;
    const panelH = BH * 4  + GAP * 3  + 24;
    this.numpadContainer.add(
      this.add.rectangle(startX - 12 + panelW / 2, startY - 12 + panelH / 2, panelW, panelH, 0x0d0d1e, 0.88)
    );

    keys.forEach((k, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const bx  = startX + col * (BW + GAP) + BW / 2;
      const by  = startY + row * (BH + GAP) + BH / 2;

      const isEnter = k === '✓';
      const isDel   = k === '⌫';
      const color   = isEnter ? 0x1a5c1a : isDel ? 0x5c1a1a : 0x223355;
      const border  = isEnter ? 0x44ff44 : isDel ? 0xff4444 : 0x4466aa;

      const btn = this.add.rectangle(bx, by, BW, BH, color, 0.95)
        .setStrokeStyle(2, border, 0.8)
        .setInteractive({ useHandCursor: true });
      const lbl = this.add.text(bx, by, k, {
        fontSize: isEnter || isDel ? '20px' : '24px',
        color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
        btn.setAlpha(0.5);
        this._numpadInput(k);
      });
      btn.on('pointerup',   () => btn.setAlpha(1));
      btn.on('pointerout',  () => btn.setAlpha(1));

      this.numpadContainer.add([btn, lbl]);
    });
  }

  _numpadInput(k) {
    // 일반 전투 입력
    if (this.inBattle && this.selectedMonster) {
      if (k === '⌫') {
        this.answer = this.answer.slice(0, -1);
      } else if (k === '✓') {
        if (this.answer.length > 0) this._checkAnswer();
      } else if (this.answer.length < 5) {
        this.answer += k;
      }
      this._refreshInput();
      return;
    }
    // 제단 챌린지 입력
    const ch = this.pedestalChallenge;
    if (ch) {
      if (k === '⌫') {
        ch.inputText = ch.inputText.slice(0, -1);
        ch.inputDisplay.setText(`답: ${ch.inputText || ''}_`);
      } else if (k === '✓') {
        if (ch.inputText.length > 0) this._submitPedestalAnswer();
      } else if (ch.inputText.length < 5) {
        ch.inputText += k;
        ch.inputDisplay.setText(`답: ${ch.inputText}_`);
      }
    }
  }

  _showNumpad() {
    this._createNumpadOnce();
    this.numpadContainer.setVisible(true);
    this.tweens.add({ targets: this.numpadContainer, alpha: 1, duration: 150 });
  }

  _hideNumpad() {
    if (!this.numpadContainer) return;
    this.tweens.add({
      targets: this.numpadContainer, alpha: 0, duration: 150,
      onComplete: () => this.numpadContainer?.setVisible(false),
    });
  }

  // ─── 모바일 가상 조이스틱 ────────────────────────────────────
  _setupJoystick() {
    const BASE_R  = 52;   // 베이스 반지름
    const KNOB_R  = 26;   // 핸들 반지름
    const MAX_D   = 40;   // 최대 드래그 거리
    const BX = 110, BY = 500; // 베이스 위치 (왼쪽 하단)

    this.joystick = { active: false, dx: 0, dy: 0 };

    // 베이스 (항상 표시)
    this.add.circle(BX, BY, BASE_R, 0x000000, 0.30)
      .setDepth(90).setScrollFactor(0);
    this.add.circle(BX, BY, BASE_R, 0xffffff, 0.10)
      .setDepth(90).setScrollFactor(0)
      .setStrokeStyle(2, 0xffffff, 0.35);

    // 핸들
    const knob = this.add.circle(BX, BY, KNOB_R, 0xffffff, 0.55)
      .setDepth(91).setScrollFactor(0);

    // 터치 인풋: zone.setInteractive() 는 scene.start() 재시작 후 동작하지 않으므로
    // 직접 scene input 이벤트에서 거리 계산으로 판별
    this.input.on('pointerdown', (ptr) => {
      const dx = ptr.x - BX, dy = ptr.y - BY;
      if (Math.sqrt(dx * dx + dy * dy) < BASE_R * 2) {
        this.joystick.active = true;
        this._updateJoystick(ptr, BX, BY, MAX_D, knob);
      }
    });
    this.input.on('pointermove', (ptr) => {
      if (!this.joystick.active) return;
      this._updateJoystick(ptr, BX, BY, MAX_D, knob);
    });
    this.input.on('pointerup', () => {
      this.joystick.active = false;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
      knob.setPosition(BX, BY);
    });
  }

  _updateJoystick(ptr, bx, by, maxD, knob) {
    const dx  = ptr.x - bx;
    const dy  = ptr.y - by;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const clamped = Math.min(len, maxD);
    const nx = dx / len, ny = dy / len;
    knob.setPosition(bx + nx * clamped, by + ny * clamped);
    this.joystick.dx = nx * (clamped / maxD);
    this.joystick.dy = ny * (clamped / maxD);
  }


  // ─── 전체화면 버튼 ───────────────────────────────────────
  _addFullscreenButton() {
    const SIZE = 36;
    const MARGIN = 8;
    const x = MARGIN + SIZE / 2;
    const y = MARGIN + SIZE / 2;

    const bg = this.add.rectangle(x, y, SIZE, SIZE, 0x000000, 0.45)
      .setDepth(99).setScrollFactor(0).setInteractive({ useHandCursor: true });

    const icon = this.add.text(x, y, '⛶', {
      fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    const toggle = () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        icon.setText('⛶');
      } else {
        this.scale.startFullscreen();
        icon.setText('✕');
      }
    };

    bg.on('pointerdown', toggle);
    bg.on('pointerover', () => bg.setAlpha(0.75));
    bg.on('pointerout',  () => bg.setAlpha(0.45));
  }

  // ─── 게임 오버 (HP 0) ────────────────────────────────────
  _gameOver() {
    this.gameStarted = false;
    if (this.battleOverlayGroup) {
      this.battleOverlayGroup.destroy(true);
      this.battleOverlayGroup = null;
    }

    this.cameras.main.shake(500, 0.025);
    this.cameras.main.fadeOut(700, 30, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.cameras.main.fadeIn(900);

      this.add.rectangle(400, 300, 800, 600, 0x110000, 0.85).setDepth(100);

      this.add.text(400, 155, '💀  GAME OVER', {
        fontSize: '52px', color: '#ff2222',
        stroke: '#000', strokeThickness: 7,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(101);

      this.add.text(400, 245, '몬스터에게 쓰러졌다...', {
        fontSize: '24px', color: '#ff8888',
        stroke: '#000', strokeThickness: 4,
        fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(101);

      this.add.text(400, 308, `최고 레벨 : Lv.${this.stats.level}`, {
        fontSize: '20px', color: '#ffffff',
        stroke: '#000', strokeThickness: 3,
        fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(101);

      const dc = (Math.round(this.stats.coins * 10) / 10).toFixed(1);
      this.add.text(400, 355, `획득 디스코인 : ${dc} DC`, {
        fontSize: '20px', color: '#FFD700',
        stroke: '#000', strokeThickness: 3,
        fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(101);

      const retryBtn = this.add.text(400, 440, '[ 다시 도전하기 ]', {
        fontSize: '22px', color: '#aaddff',
        stroke: '#000', strokeThickness: 3,
        fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });

      this.tweens.add({
        targets: retryBtn, alpha: 0.3,
        duration: 700, yoyo: true, repeat: -1,
      });

      retryBtn.on('pointerdown', () => {
        this.cameras.main.fadeOut(600);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MathScene', {});
        });
      });
    });
  }

  // ─── 게임 클리어 (보스 처치) ──────────────────────────────
  _gameClear() {
    this.gameStarted = false;
    this.cameras.main.shake(600, 0.022);

    this.time.delayedCall(900, () => {
      // 페이드아웃 → 틴트 제거 → 페이드인 (어둠이 걷히는 연출)
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.bgImg) this.bgImg.clearTint();
        this.cameras.main.fadeIn(1200);

        // 배경 위에 반투명 오버레이
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.45).setDepth(100);

        this.time.delayedCall(400, () => {
          this.add.text(400, 130, '★ GAME CLEAR! ★', {
            fontSize: '52px', color: '#FFD700',
            stroke: '#000', strokeThickness: 6,
            fontFamily: 'monospace', fontStyle: 'bold',
          }).setOrigin(0.5).setDepth(101);

          this.add.text(400, 215, '수학 마왕을 물리쳤다!', {
            fontSize: '28px', color: '#ff88ff',
            stroke: '#000', strokeThickness: 4,
            fontFamily: 'monospace',
          }).setOrigin(0.5).setDepth(101);

          this.add.text(400, 295, `최종 레벨 : Lv.${this.stats.level}`, {
            fontSize: '24px', color: '#ffffff',
            stroke: '#000', strokeThickness: 3,
            fontFamily: 'monospace',
          }).setOrigin(0.5).setDepth(101);

          const dc = (Math.round(this.stats.coins * 10) / 10).toFixed(1);
          this.add.text(400, 345, `누적 디스코인 : ${dc} DC`, {
            fontSize: '24px', color: '#FFD700',
            stroke: '#000', strokeThickness: 3,
            fontFamily: 'monospace',
          }).setOrigin(0.5).setDepth(101);

          const restartBtn = this.add.text(400, 440, '[ 클릭하면 처음부터 다시 시작 ]', {
            fontSize: '17px', color: '#aaddff',
            stroke: '#000', strokeThickness: 3,
            fontFamily: 'monospace',
          }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });

          // 깜빡임
          this.tweens.add({
            targets: restartBtn, alpha: 0.3,
            duration: 700, yoyo: true, repeat: -1,
          });

          restartBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(600);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('MathScene', {});
            });
          });
        });
      });
    });
  }

  // ─── 먼지 파티클 ─────────────────────────────────────────
  _createDustEmitter() {
    this.add.particles(400, 300, 'dust', {
      x: { min: -380, max: 380 },
      y: { min: -270, max: 270 },
      lifespan: 3500,
      speedX: { min: -8, max: 8 },
      speedY: { min: -8, max: 8 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.35, end: 0 },
      frequency: 300,
    });
  }

  // ─── 유틸 ─────────────────────────────────────────────────
  _floatText(x, y, text, color = '#ffffff', fontSize = 26) {
    const t = this.add.text(x, y, text, {
      fontSize: `${fontSize}px`, color,
      stroke: '#000000', strokeThickness: 4,
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: t, y: y - 65, alpha: 0,
      duration: 1600, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  _showExpBurst(x, y, amount) {
    for (let i = 0; i < 6; i++) {
      const ox = (Math.random() - 0.5) * 70;
      const oy = (Math.random() - 0.5) * 40;
      const t = this.add.text(x + ox, y + oy, `+${amount} EXP`, {
        fontSize: '13px', color: '#FFD700',
        stroke: '#000', strokeThickness: 2,
        fontFamily: 'monospace',
      }).setDepth(28);

      this.tweens.add({
        targets: t, y: t.y - 35, alpha: 0,
        duration: 900, delay: i * 90,
        onComplete: () => t.destroy(),
      });
    }
  }

  _hitShake(target) {
    const ox = target.x;
    this.tweens.add({
      targets: target,
      x: ox + 6, duration: 45,
      yoyo: true, repeat: 3,
      onComplete: () => { target.x = ox; },
    });
  }
}
