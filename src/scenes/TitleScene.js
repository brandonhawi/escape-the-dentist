import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    const cx = GAME_W/2, cy = GAME_H/2;
    this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x1a0028);

    this.add.text(cx, cy - 140, 'ESCAPE THE DENTIST', {
      fontFamily: 'Courier New', fontSize: '52px', color: '#ff2e88',
      fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#ff2e88', 16, true, true);

    this.add.text(cx, cy - 70, "You woke up mid-procedure. They're not letting you leave.", {
      fontFamily: 'Courier New', fontSize: '16px', color: '#9be7ff',
    }).setOrigin(0.5);

    const lines = [
      'WASD move  ·  MOUSE aim  ·  LMB attack / shoot',
      'E pickup  ·  R throw weapon  ·  SPACE dash  ·  P pause',
      'One hit and you\'re dead. So are they. Reach the exit.',
    ];
    lines.forEach((l, i) =>
      this.add.text(cx, cy - 20 + i*22, l, {
        fontFamily: 'Courier New', fontSize: '14px', color: '#ffe44a',
      }).setOrigin(0.5)
    );

    const btn = this.add.text(cx, cy + 100, '  START  ', {
      fontFamily: 'Courier New', fontSize: '24px', color: '#ffffff',
      backgroundColor: '#ff2e88', padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setBackgroundColor('#00f0ff'));
    btn.on('pointerout',  () => btn.setBackgroundColor('#ff2e88'));
    btn.on('pointerdown', () => {
      this.scene.launch('UI');
      this.scene.start('Game');
    });

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.launch('UI');
      this.scene.start('Game');
    });
  }
}
