// mumusubject - 클라이언트 진입점
// Phaser.js 기반 게임 시작

import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MathScene from './scenes/MathScene';
import CurlingScene from './scenes/CurlingScene';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 600,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
    parent: 'game',
    expandParent: true,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MathScene,
    CurlingScene,
    // 추후 씬 추가
  ],
};

const game = new Phaser.Game(config);
