import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';

export default class OverlayScene extends Phaser.Scene {
  constructor() { super('Overlay'); }
  init(data) { this.data = data || {}; }
  create() {
    const cx = GAME_W/2, cy = GAME_H/2;
    const bg = this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x140020, 0.6);
    const kind = this.data.kind || 'paused';
    let title = '', sub = '';
    if (kind === 'paused')      { title = 'PAUSED';     sub = 'PRESS [P] TO RESUME'; }
    else if (kind === 'dead')   { title = 'YOU DIED';   sub = `Floor ${this.data.level || '?'} • Kills ${this.data.kills || 0}\nPRESS [ENTER] TO TRY AGAIN`; }
    else if (kind === 'win')    { title = 'YOU ESCAPED.'; sub = `Total Kills: ${this.data.kills || 0}\nPRESS [ENTER] TO PLAY AGAIN`; }

    this.add.text(cx, cy - 10, title, {
      fontFamily: 'Courier New', fontSize: '52px',
      color: kind === 'win' ? '#ffe44a' : '#ff2e88',
      fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#ff2e88', 16, true, true);

    this.add.text(cx, cy + 40, sub, {
      fontFamily: 'Courier New', fontSize: '14px', color: '#9be7ff', align: 'center',
    }).setOrigin(0.5);

    if (kind === 'dead' || kind === 'win') {
      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.stop('Overlay');
        this.scene.stop('UI');
        this.scene.stop('Game');
        this.scene.start('Title');
      });
    }
  }
}
