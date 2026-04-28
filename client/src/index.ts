// mumusubject - 클라이언트 진입점
// Phaser.js 기반 게임 시작

import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MathScene from './scenes/MathScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game',
    expandParent: true,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  scene: [BootScene, MathScene],
};

new Phaser.Game(config);
