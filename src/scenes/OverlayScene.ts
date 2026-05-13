import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.ts';
import type { OverlayData } from '../types.ts';

export default class OverlayScene extends Phaser.Scene {
  private overlayData: OverlayData = { kind: 'paused' };

  constructor() { super('Overlay'); }

  init(data: OverlayData): void {
    this.overlayData = data || { kind: 'paused' };
  }

  create(): void {
    const cx = GAME_W / 2, cy = GAME_H / 2;
    this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x140020, 0.6);

    const kind = this.overlayData.kind;
    let title = '', sub = '';
    if (kind === 'paused')    { title = 'PAUSED';        sub = 'PRESS [P] TO RESUME'; }
    else if (kind === 'dead') { title = 'YOU DIED';      sub = `Floor ${this.overlayData.level ?? '?'} • Kills ${this.overlayData.kills ?? 0}\nPRESS [ENTER] TO TRY AGAIN`; }
    else if (kind === 'win')  { title = 'YOU ESCAPED.';  sub = `Total Kills: ${this.overlayData.kills ?? 0}\nPRESS [ENTER] TO PLAY AGAIN`; }

    this.add.text(cx, cy - 10, title, {
      fontFamily: 'Courier New', fontSize: '52px',
      color: kind === 'win' ? '#ffe44a' : '#ff2e88',
      fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#ff2e88', 16, true, true);

    this.add.text(cx, cy + 40, sub, {
      fontFamily: 'Courier New', fontSize: '14px', color: '#9be7ff', align: 'center',
    }).setOrigin(0.5);

    if (kind === 'dead' || kind === 'win') {
      this.input.keyboard!.once('keydown-ENTER', () => {
        this.scene.stop('Overlay');
        this.scene.stop('UI');
        this.scene.stop('Game');
        this.scene.start('Title');
      });
    }
  }
}
