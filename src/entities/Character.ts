import Phaser from 'phaser';
import { WEAPONS, type WeaponKey } from '../config.ts';

const BODY_SIZE = 24;
const DISPLAY_W = 36;
const DISPLAY_H = 32;

export abstract class Character extends Phaser.Physics.Arcade.Sprite {
  weapon: WeaponKey = 'fists';
  ammo = 0;
  cd = 0;
  alive = true;

  // Force the cast: scene.physics.add.existing(this) guarantees a Body,
  // and our constructor refuses to run without one. Downstream code can
  // skip the `as Phaser.Physics.Arcade.Body` rigmarole.
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(DISPLAY_W, DISPLAY_H);
    this.body.setSize(BODY_SIZE, BODY_SIZE);
    this.body.setOffset(
      (this.width  - BODY_SIZE) / 2,
      (this.height - BODY_SIZE) / 2,
    );
  }
}

export class Player extends Character {
  dashCd = 0;
  dashT = 0;
  dashDx = 0;
  dashDy = 0;
  swingT = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    this.setCollideWorldBounds(true);
  }
}

export type EnemyKind = 'normal' | 'fast';

export class Enemy extends Character {
  kind: EnemyKind = 'normal';
  speed = 110;
  seePlayer = false;
  reactT = 0.2 + Math.random() * 0.3;
  wanderT = 0;
  wanderVx = 0;
  wanderVy = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind, weapon: WeaponKey) {
    super(scene, x, y, kind === 'fast' ? 'fast' : 'dentist');
    this.kind = kind;
    this.weapon = weapon;
    this.ammo = WEAPONS[weapon].ammo ?? 0;
    this.speed = kind === 'fast' ? 170 : 110;
    this.cd = Math.random() * 0.5;
  }
}
