// 수학 마법사의 탑 — 탑뷰 배경 생성기
// 게임 뷰포트(800×600)에 맞는 던전 인테리어를 canvas로 직접 그립니다.

export function createMathTowerBackground(canvas) {
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  const W = 800, H = 600;

  drawFloor(ctx, W, H);
  drawWalls(ctx, W, H);
  drawFurniture(ctx, W, H);
  drawMagicCircles(ctx);
  drawTorchLights(ctx, W, H);

  return canvas.toDataURL();
}

// ─── 1. 돌바닥 타일 ────────────────────────────────────────────
function drawFloor(ctx, W, H) {
  const TILE = 40;
  // 기본 색조를 미리 채워 랜덤 잡음 없이 일정한 색깔 유지
  ctx.fillStyle = '#5a5060';
  ctx.fillRect(0, 0, W, H);

  for (let row = 0; row < H / TILE; row++) {
    for (let col = 0; col < W / TILE; col++) {
      // 체크무늬 변형
      const light = (row + col) % 2 === 0;
      ctx.fillStyle = light ? '#5e5468' : '#524960';
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);

      // 타일 균열 라인
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(col * TILE + 0.5, row * TILE + 0.5, TILE - 1, TILE - 1);
    }
  }

  // 바닥 중앙 카펫 (플레이어 이동 구역 시각화)
  ctx.fillStyle = 'rgba(80, 40, 100, 0.25)';
  ctx.fillRect(80, 130, 640, 380);
  ctx.strokeStyle = 'rgba(180, 120, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(80, 130, 640, 380);
}

// ─── 2. 상단 벽 & 벽돌 ────────────────────────────────────────
function drawWalls(ctx, W, H) {
  const WALL_H = 100;
  const BRICK_W = 80, BRICK_H = 20;

  // 벽 베이스
  ctx.fillStyle = '#2d1f14';
  ctx.fillRect(0, 0, W, WALL_H);

  // 벽돌 패턴
  for (let row = 0; row < WALL_H / BRICK_H; row++) {
    const offset = (row % 2 === 0) ? 0 : BRICK_W / 2;
    for (let col = -1; col <= W / BRICK_W + 1; col++) {
      ctx.fillStyle = row % 2 === 0 ? '#3a2518' : '#3f2a1c';
      ctx.fillRect(col * BRICK_W + offset + 1, row * BRICK_H + 1, BRICK_W - 2, BRICK_H - 2);
    }
  }

  // 벽 하단 그림자 경계
  const borderGrad = ctx.createLinearGradient(0, WALL_H, 0, WALL_H + 20);
  borderGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
  borderGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = borderGrad;
  ctx.fillRect(0, WALL_H, W, 20);

  // 좌우 그림자 (공간감)
  const leftGrad = ctx.createLinearGradient(0, 0, 55, 0);
  leftGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
  leftGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, WALL_H, 55, H - WALL_H);

  const rightGrad = ctx.createLinearGradient(W - 55, 0, W, 0);
  rightGrad.addColorStop(0, 'rgba(0,0,0,0)');
  rightGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = rightGrad;
  ctx.fillRect(W - 55, WALL_H, 55, H - WALL_H);

  // 하단 그림자
  const bottomGrad = ctx.createLinearGradient(0, H - 30, 0, H);
  bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, H - 30, W, 30);
}

// ─── 3. 가구 & 오브젝트 ──────────────────────────────────────
function drawFurniture(ctx, W, H) {
  // 책장 (상단 좌/우)
  drawBookshelf(ctx, 15, 102, 110, 70);
  drawBookshelf(ctx, W - 125, 102, 110, 70);

  // 책장 사이 아치형 문 표현 (빛)
  ctx.fillStyle = 'rgba(255, 200, 100, 0.08)';
  ctx.beginPath();
  ctx.arc(W / 2, 100, 60, Math.PI, 0);
  ctx.fill();

  // 마법 항아리 (하단 좌/우)
  drawMagicPot(ctx, 45,  H - 55, '#7c3aed');
  drawMagicPot(ctx, W - 45, H - 55, '#1d4ed8');

  // 기둥 (좌/우 중간)
  drawPillar(ctx, 60,  200);
  drawPillar(ctx, W - 60, 200);
  drawPillar(ctx, 60,  450);
  drawPillar(ctx, W - 60, 450);
}

function drawBookshelf(ctx, x, y, w, h) {
  ctx.fillStyle = '#4a2e0e';
  ctx.fillRect(x, y, w, h);

  const bookColors = ['#c84b4b','#4bbc4b','#4b7bc8','#c8c84b','#c84bc8','#4bc8c8','#e88c2c'];
  const bw = 11;
  const slots = Math.floor((w - 6) / bw);
  for (let i = 0; i < slots; i++) {
    const bh = 20 + (i * 7) % 22;
    ctx.fillStyle = bookColors[i % bookColors.length];
    ctx.fillRect(x + 3 + i * bw, y + h - bh - 4, bw - 2, bh);
  }

  ctx.strokeStyle = '#2d1a06';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // 선반 라인
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h - 8);
  ctx.lineTo(x + w, y + h - 8);
  ctx.stroke();
}

function drawMagicPot(ctx, cx, cy, color) {
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 항아리 몸체
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // 하이라이트
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx - 5, cy - 6, 5, 8, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // 입구
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 18, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 연기
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(160,100,255,${0.15 - i * 0.04})`;
    ctx.beginPath();
    ctx.ellipse(cx + (i - 1) * 5, cy - 26 - i * 7, 5 - i, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPillar(ctx, cx, y) {
  const pw = 18, ph = 90;
  // 기둥 몸체
  const grad = ctx.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0);
  grad.addColorStop(0, '#3a2010');
  grad.addColorStop(0.4, '#6b4020');
  grad.addColorStop(1, '#2a1808');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - pw / 2, y, pw, ph);

  // 상단/하단 캐피털
  ctx.fillStyle = '#8b5a30';
  ctx.fillRect(cx - pw / 2 - 4, y, pw + 8, 10);
  ctx.fillRect(cx - pw / 2 - 4, y + ph - 10, pw + 8, 10);
}

// ─── 4. 마법 소환진 (몬스터 4곳) ──────────────────────────────
// 위치는 MathScene의 MONSTER_POSITIONS와 일치해야 합니다.
const CIRCLE_DEFS = [
  { x: 180, y: 220, color: '#44ff88', symbol: '+' },
  { x: 620, y: 220, color: '#ff4488', symbol: '−' },
  { x: 180, y: 440, color: '#ffaa44', symbol: '×' },
  { x: 620, y: 440, color: '#44aaff', symbol: '÷' },
];

function drawMagicCircles(ctx) {
  CIRCLE_DEFS.forEach(({ x, y, color, symbol }) => {
    drawMagicCircle(ctx, x, y, 48, color, symbol);
  });
}

function drawMagicCircle(ctx, cx, cy, r, color, symbol) {
  ctx.save();

  // 바깥 글로우
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.4);
  glow.addColorStop(0, 'rgba(255,255,255,0.06)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // 바닥 원형 무늬
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // 바깥 원
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // 안쪽 원
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  // 별형 (6각 라인)
  drawStar6(ctx, cx, cy, r * 0.85, r * 0.45, color);

  // 룬 점들 (바깥 원 위 8곳)
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) * (Math.PI / 180);
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 중앙 연산 기호
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = color;
  ctx.font = 'bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, cx, cy);

  ctx.restore();
}

function drawStar6(ctx, cx, cy, outerR, innerR, color) {
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ─── 5. 횃불 조명 ────────────────────────────────────────────
const TORCH_POSITIONS = [
  { x: 12,       y: 108 },
  { x: 788,      y: 108 },
  { x: 400,      y: 104 },
];

function drawTorchLights(ctx, W, H) {
  TORCH_POSITIONS.forEach(({ x, y }) => {
    // 빛 퍼짐 (소프트 그라디언트)
    const lightR = 220;
    const grad = ctx.createRadialGradient(x, y + 15, 8, x, y + 15, lightR);
    grad.addColorStop(0, 'rgba(255, 160, 60, 0.20)');
    grad.addColorStop(0.4, 'rgba(255, 120, 30, 0.08)');
    grad.addColorStop(1, 'rgba(255, 80, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    drawTorch(ctx, x, y);
  });
}

function drawTorch(ctx, x, y) {
  // 막대
  ctx.fillStyle = '#7a3b10';
  ctx.fillRect(x - 3, y + 2, 6, 18);

  // 불꽃 — 바깥
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // 불꽃 — 안쪽
  ctx.fillStyle = '#ffdd00';
  ctx.beginPath();
  ctx.ellipse(x, y, 3, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 불꽃 — 코어
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 1.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}
