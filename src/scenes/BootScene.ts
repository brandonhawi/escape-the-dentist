import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload(): void {
    this.load.image('player',  'assets/player.png');
    this.load.image('dentist', 'assets/dentist.png');
    this.load.image('fast',    'assets/dentist_fast.png');
  }
  create(): void {
    this.scene.start('Title');
  }
}
