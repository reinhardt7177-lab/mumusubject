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

// 배경 제거: 코너 픽셀 색상을 배경으로 간주하고 투명 처리
async function removeBackground(inputPath) {
  const img    = sharp(inputPath);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;
  const buf = Buffer.from(data);

  // 코너 4픽셀의 평균 색상 = 배경색
  const corners = [
    [0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]
  ];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const [cx, cy] of corners) {
    const idx = (cy * W + cx) * 4;
    bgR += buf[idx]; bgG += buf[idx + 1]; bgB += buf[idx + 2];
  }
  bgR = Math.round(bgR / 4);
  bgG = Math.round(bgG / 4);
  bgB = Math.round(bgB / 4);

  console.log(`🎨 감지된 배경색: rgb(${bgR}, ${bgG}, ${bgB})`);

  // 배경색과 유사한 픽셀 투명 처리
  let removed = 0;
  for (let i = 0; i < buf.length; i += 4) {
    const dist = colorDist(buf[i], buf[i+1], buf[i+2], bgR, bgG, bgB);
    if (dist < threshold) {
      buf[i + 3] = 0; // alpha = 0 (투명)
      removed++;
    }
  }

  console.log(`✂️  배경 제거: ${removed}px 투명 처리`);

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
