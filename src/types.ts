import Phaser from 'phaser';
import type { WeaponKey } from './config.ts';

export interface Player extends Phaser.Physics.Arcade.Sprite {
  weapon: WeaponKey;
  ammo: number;
  cd: number;
  dashCd: number;
  dashT: number;
  dashDx: number;
  dashDy: number;
  swingT: number;
  alive: boolean;
}

export interface Enemy extends Phaser.Physics.Arcade.Sprite {
  weapon: WeaponKey;
  ammo: number;
  cd: number;
  kind: 'normal' | 'fast';
  alive: boolean;
  speed: number;
  seePlayer: boolean;
  reactT: number;
  wanderT: number;
  wanderVx: number;
  wanderVy: number;
}

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
