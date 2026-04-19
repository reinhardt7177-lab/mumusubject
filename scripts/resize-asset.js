/**
 * 게임 스펙에 맞게 이미지 리사이징 + 배경 제거
 * 사용법: node scripts/resize-asset.js --input "temp/name.png" --name "object-name" --type character
 *
 * --type 옵션:
 *   character  → 128x128 (플레이어, NPC)
 *   monster    → 128x128 (대형) or 64x64 (소형, --small 플래그)
 *   item       → 64x64
 *   custom     → --width, --height 직접 지정
 *
 * --no-bg-remove  배경 제거 건너뜀 (이미 투명한 경우)
 * --threshold N   배경 색상 허용 오차 (기본 30, 0~100)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const getArg  = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const hasFlag = (flag) => args.includes(flag);

const input     = getArg('--input');
const name      = getArg('--name') || path.basename(input, path.extname(input));
const type      = getArg('--type') || 'character';
const dest      = getArg('--dest');
const removeBg  = !hasFlag('--no-bg-remove');
const threshold = parseInt(getArg('--threshold') || '30');

if (!input)                  { console.error('--input 필요'); process.exit(1); }
if (!fs.existsSync(input))   { console.error(`파일 없음: ${input}`); process.exit(1); }

const SIZE_MAP = {
  character: { w: 128, h: 128 },
  monster:   hasFlag('--small') ? { w: 64, h: 64 } : { w: 128, h: 128 },
  item:      { w: 64,  h: 64  },
  custom:    { w: parseInt(getArg('--width') || '128'), h: parseInt(getArg('--height') || '128') }
};

const { w, h } = SIZE_MAP[type] || SIZE_MAP.character;
const TEMP_DIR  = path.join(process.cwd(), 'scripts', 'temp');
const outPath   = path.join(TEMP_DIR, `${name}_${w}x${h}.png`);

// 두 색상 간 거리 계산
function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

// 배경 제거: 4방향 Flood-fill (코너에서 시작해 연결된 배경만 제거)
async function removeBackground(inputPath) {
  const img    = sharp(inputPath);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;
  const buf = Buffer.from(data);

  // 코너 4픽셀의 평균 색상 = 배경색
  const corners = [[0,0],[W-1,0],[0,H-1],[W-1,H-1]];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const [cx, cy] of corners) {
    const idx = (cy * W + cx) * 4;
    bgR += buf[idx]; bgG += buf[idx+1]; bgB += buf[idx+2];
  }
  bgR = Math.round(bgR / 4);
  bgG = Math.round(bgG / 4);
  bgB = Math.round(bgB / 4);
  console.log(`🎨 감지된 배경색: rgb(${bgR}, ${bgG}, ${bgB})`);

  // Flood-fill: 코너에서 시작해 연결된 배경 픽셀만 투명 처리
  const visited = new Uint8Array(W * H);
  const queue   = [];

  const isBg = (x, y) => {
    const idx = (y * W + x) * 4;
    return colorDist(buf[idx], buf[idx+1], buf[idx+2], bgR, bgG, bgB) < threshold;
  };

  const enqueue = (x, y) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const pos = y * W + x;
    if (visited[pos] || !isBg(x, y)) return;
    visited[pos] = 1;
    queue.push(x, y);
  };

  // 4개 코너를 시드로 시작
  for (const [cx, cy] of corners) enqueue(cx, cy);

  let removed = 0;
  while (queue.length > 0) {
    const y = queue.pop();
    const x = queue.pop();
    const idx = (y * W + x) * 4;
    buf[idx + 3] = 0; // 투명
    removed++;
    enqueue(x+1, y); enqueue(x-1, y);
    enqueue(x, y+1); enqueue(x, y-1);
  }

  // 2차 패스: 체커보드 흰색 칸 제거
  // 코너 flood-fill 후 남은 밝은 픽셀 중 투명 픽셀에 인접한 것을 추가 제거
  const isTransparent = (x, y) => buf[(y * W + x) * 4 + 3] === 0;
  const isBright = (x, y) => {
    const idx = (y * W + x) * 4;
    return buf[idx] > 180 && buf[idx+1] > 180 && buf[idx+2] > 180;
  };

  let pass2 = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        if (buf[idx + 3] !== 0 && isBright(x, y)) {
          // 4방향 중 하나라도 투명이면 이 픽셀도 제거
          const adjTransp =
            (x > 0     && isTransparent(x-1, y)) ||
            (x < W-1   && isTransparent(x+1, y)) ||
            (y > 0     && isTransparent(x, y-1)) ||
            (y < H-1   && isTransparent(x, y+1));
          if (adjTransp) {
            buf[idx + 3] = 0;
            removed++;
            pass2++;
            changed = true;
          }
        }
      }
    }
  }

  console.log(`✂️  배경 제거 (flood-fill): ${removed}px 투명 처리 (2차 밝은픽셀: ${pass2}px)`);
  return sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png();
}

async function run() {
  console.log(`📐 리사이징: ${input} → ${w}x${h}px`);

  let pipeline;

  if (removeBg) {
    console.log(`🔍 배경 제거 중... (threshold: ${threshold})`);
    pipeline = await removeBackground(input);
  } else {
    pipeline = sharp(input).ensureAlpha();
  }

  await pipeline
    .resize(w, h, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(outPath);

  console.log(`✅ 완료: ${outPath}`);

  if (dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(outPath, dest);
    console.log(`📦 배치 완료: ${dest}`);
  }
}

run().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
