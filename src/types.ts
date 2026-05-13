import Phaser from 'phaser';
import type { WeaponKey } from './config.ts';

export { Player, Enemy } from './entities/Character.ts';
export type { EnemyKind } from './entities/Character.ts';

export interface Bullet extends Phaser.GameObjects.Rectangle {
  body: Phaser.Physics.Arcade.Body;
  from: 'player' | 'enemy';
  r: number;
  life?: number;
  thrown?: WeaponKey;
}

export interface Pickup extends Phaser.GameObjects.Rectangle {
  body: Phaser.Physics.Arcade.Body;
  weapon: WeaponKey;
  ammo: number;
}

export interface HudState {
  level: number;
  enemies: number;
  kills: number;
  weapon: string;
  weaponCol: string;
  ammo: number | null;
}

export type OverlayKind = 'paused' | 'dead' | 'win';
export interface OverlayData {
  kind: OverlayKind;
  level?: number;
  kills?: number;
}
