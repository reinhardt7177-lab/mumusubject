/**
 * Gemini API 이미지 생성 스크립트
 * 사용법:
 *   단일 이미지:    node scripts/gemini-generate.js --prompt "..." --name "name"
 *   픽셀아트:       node scripts/gemini-generate.js --prompt "..." --name "name" --pixel
 *   스프라이트시트: node scripts/gemini-generate.js --prompt "..." --name "name" --spritesheet --dirs 4
 *   픽셀 스프라이트시트: node scripts/gemini-generate.js --prompt "..." --name "name" --pixel --spritesheet
 *
 * --pixel            픽셀아트 모드 (게임 스프라이트용 128x128)
 * --spritesheet      스프라이트 시트 모드 (캐릭터 애니메이션용)
 * --dirs N           방향 수: 4 (상하좌우) or 8 (8방향), 기본 4
 * --frames N         방향당 프레임 수, 기본 4
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const args    = process.argv.slice(2);
const getArg  = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const hasFlag = (flag) => args.includes(flag);

const userPrompt  = getArg('--prompt');
const name        = getArg('--name') || 'object';
const apiKey      = getArg('--key') || process.env.GEMINI_API_KEY;
const spritesheet = hasFlag('--spritesheet');
const pixel       = hasFlag('--pixel');
const dirs        = parseInt(getArg('--dirs')   || '4');
const frames      = parseInt(getArg('--frames') || '4');

if (!userPrompt) { console.error('--prompt 필요'); process.exit(1); }
if (!apiKey)     { console.error('--key 또는 GEMINI_API_KEY 환경변수 필요'); process.exit(1); }

const TEMP_DIR  = path.join(process.cwd(), 'scripts', 'temp');
const LOG_FILE  = path.join(TEMP_DIR, 'log.json');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// 방향 레이블
const DIR_LABELS = {
  4: ['Down', 'Left', 'Right', 'Up'],
  8: ['Down', 'Down-Left', 'Left', 'Up-Left', 'Up', 'Up-Right', 'Right', 'Down-Right']
};

const PIXEL_SUFFIX = `
Pixel art style, exactly 128x128 pixels, limited color palette (max 32 colors).
Crisp hard edges, no anti-aliasing, no blur, no gradients.
Clear readable silhouette, each pixel intentional.
Transparent background (PNG).
Retro JRPG game sprite, top-down view, suitable for Phaser.js game.`;

function buildPrompt() {
  const base = pixel ? `${userPrompt}${PIXEL_SUFFIX}` : userPrompt;

  if (!spritesheet) return base;

  const dirLabels = DIR_LABELS[dirs] || DIR_LABELS[4];
  const sheetW    = frames * 128;
  const sheetH    = dirs   * 128;

  return `${base}

Create a sprite sheet with ${dirs} rows and ${frames} columns.
- Each cell is exactly 128x128 pixels.
- Total sheet size: ${sheetW}x${sheetH} pixels.
- Row order (top to bottom): ${dirLabels.join(', ')}.
- Each row shows a walk cycle animation with ${frames} frames.
- transparent background, PNG format.
- Studio Ghibli style, soft watercolor, warm pastel colors, clean outline.
- All frames must be consistent in size, style, and character proportions.
- Grid layout, no gaps between cells, no labels or borders.`;
}

function saveLog(entry) {
  let log = [];
  if (fs.existsSync(LOG_FILE)) {
    try { log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); } catch { log = []; }
  }
  log.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf-8');
}

async function generate() {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

  const finalPrompt = buildPrompt();
  const mode = spritesheet ? `스프라이트시트 (${dirs}방향 × ${frames}프레임)` : '단일 이미지';

  console.log(`🎨 생성 중: "${name}" [${mode}]`);
  console.log(`📝 프롬프트:\n${finalPrompt}\n`);

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
  });

  const parts = result.response.candidates[0].content.parts;
  let outPath = null;

  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      const ext = part.inlineData.mimeType.split('/')[1].replace('jpeg', 'jpg');
      outPath = path.join(TEMP_DIR, `${name}.${ext}`);
      fs.writeFileSync(outPath, Buffer.from(part.inlineData.data, 'base64'));
      console.log(`✅ 저장 완료: ${outPath}`);
      break;
    }
  }

  if (!outPath) {
    console.error('❌ 이미지 생성 실패 — 텍스트 응답만 반환됨');
    process.exit(1);
  }

  // 이력 저장
  saveLog({
    timestamp:   new Date().toISOString(),
    name,
    mode:        spritesheet ? 'spritesheet' : 'single',
    dirs:        spritesheet ? dirs   : null,
    frames:      spritesheet ? frames : null,
    userPrompt,
    finalPrompt,
    output:      outPath
  });

  console.log(`📋 이력 저장: ${LOG_FILE}`);
}

generate().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
