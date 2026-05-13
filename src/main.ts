import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config.ts';
import BootScene from './scenes/BootScene.ts';
import TitleScene from './scenes/TitleScene.ts';
import GameScene from './scenes/GameScene.ts';
import UIScene from './scenes/UIScene.ts';
import OverlayScene from './scenes/OverlayScene.ts';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#15001f',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, TitleScene, GameScene, UIScene, OverlayScene],
});
