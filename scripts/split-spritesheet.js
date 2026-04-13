/**
 * 스프라이트 시트를 개별 프레임으로 분리
 * 사용법: node --input-type=module scripts/split-spritesheet.js --input "temp/name.png" --name "name" --dirs 4 --frames 4
 *
 * --dirs N     방향(행) 수, 기본 4
 * --frames N   프레임(열) 수, 기본 4
 * --size N     셀 크기(px), 기본 128
 * --dest DIR   출력 폴더 (기본: scripts/temp/[name]-frames/)
 *
 * 출력 파일명 규칙: [name]_d[방향번호]_f[프레임번호].png
 * 예: player_d0_f0.png (Down 방향, 1번째 프레임)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const args    = process.argv.slice(2);
const getArg  = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

const input   = getArg('--input');
const name    = getArg('--name') || path.basename(input, path.extname(input));
const dirs    = parseInt(getArg('--dirs')   || '4');
const frames  = parseInt(getArg('--frames') || '4');
const size    = parseInt(getArg('--size')   || '128');
const destDir = getArg('--dest') || path.join(process.cwd(), 'scripts', 'temp', `${name}-frames`);

const DIR_LABELS = {
  4: ['down', 'left', 'right', 'up'],
  8: ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right']
};

if (!input)                { console.error('--input 필요'); process.exit(1); }
if (!fs.existsSync(input)) { console.error(`파일 없음: ${input}`); process.exit(1); }

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

async function split() {
  const meta = await sharp(input).metadata();
  const dirLabels = DIR_LABELS[dirs] || DIR_LABELS[4];

  console.log(`✂️  시트 분리: ${input}`);
  console.log(`   크기: ${meta.width}x${meta.height} | 셀: ${size}x${size} | ${dirs}방향 × ${frames}프레임`);

  const promises = [];

  for (let d = 0; d < dirs; d++) {
    for (let f = 0; f < frames; f++) {
      const left = f * size;
      const top  = d * size;
      const dir  = dirLabels[d] || `d${d}`;
      const outPath = path.join(destDir, `${name}_${dir}_f${f}.png`);

      promises.push(
        sharp(input)
          .extract({ left, top, width: size, height: size })
          .png()
          .toFile(outPath)
          .then(() => console.log(`   ✅ ${path.basename(outPath)}`))
      );
    }
  }

  await Promise.all(promises);

  console.log(`\n✅ 분리 완료: ${destDir}`);
  console.log(`   총 ${dirs * frames}개 프레임`);

  // Phaser 스프라이트 시트 설정 출력
  console.log(`\n📋 Phaser preload 코드:`);
  console.log(`   this.load.spritesheet('${name}', '/assets/characters/${name}.png', {`);
  console.log(`     frameWidth: ${size}, frameHeight: ${size}`);
  console.log(`   });`);
  console.log(`\n📋 Phaser 애니메이션 설정 예시 (Down 방향):`);
  console.log(`   this.anims.create({`);
  console.log(`     key: '${name}-walk-down',`);
  console.log(`     frames: this.anims.generateFrameNumbers('${name}', { start: 0, end: ${frames - 1} }),`);
  console.log(`     frameRate: 8, repeat: -1`);
  console.log(`   });`);
}

split().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
