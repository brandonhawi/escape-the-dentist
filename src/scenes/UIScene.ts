import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.ts';
import type { HudState } from '../types.ts';

export default class UIScene extends Phaser.Scene {
  private hudText!: Phaser.GameObjects.Text;
  private controlsText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;

  constructor() { super('UI'); }

  create(): void {
    this.hudText = this.add.text(12, 10, '', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#ffb3ec',
    }).setShadow(0, 0, '#ff00aa', 8, true, true);

    this.controlsText = this.add.text(GAME_W / 2, GAME_H - 14,
      'WASD move  ·  MOUSE aim  ·  LMB attack  ·  E pickup  ·  R throw  ·  SPACE dash  ·  P pause',
      { fontFamily: 'Courier New', fontSize: '11px', color: '#9be7ff' }
    ).setOrigin(0.5, 1).setAlpha(0.75);

    this.toastText = this.add.text(GAME_W / 2, GAME_H - 50, '', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#ffe44a',
    }).setOrigin(0.5).setAlpha(0).setShadow(0, 0, '#ff2e88', 8, true, true);

    this.game.events.on('hud', (s: HudState) => {
      const ammoStr = s.ammo !== null ? `  [${s.ammo}]` : '';
      this.hudText.setText(
        `FLOOR ${s.level}   ENEMIES ${s.enemies}   KILLS ${s.kills}\n` +
        `WEAPON: ${s.weapon}${ammoStr}`
      );
    });
    this.game.events.on('toast', (msg: string) => {
      this.toastText.setText(msg).setAlpha(1);
      this.tweens.killTweensOf(this.toastText);
      this.tweens.add({ targets: this.toastText, alpha: 0, delay: 900, duration: 400 });
    });
  }
}
