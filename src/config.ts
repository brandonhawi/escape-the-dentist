export const GAME_W = 960;
export const GAME_H = 600;
export const TILE = 40;
export const COLS = Math.floor(GAME_W / TILE);  // 24
export const ROWS = Math.floor(GAME_H / TILE);  // 15

export const T_FLOOR = 0;
export const T_WALL = 1;
export const T_EXIT = 2;
export const T_CHAIR = 3;

export type WeaponKey = 'fists' | 'syringe' | 'drill' | 'scalpel' | 'mallet' | 'pistol' | 'uzi';

export interface WeaponDef {
  name: string;
  range: number;
  dmg: number;
  cd: number;
  type: 'melee' | 'ranged';
  col: number;
  ammo?: number;
  speed?: number;
  spread?: number;
}

export const WEAPONS: Record<WeaponKey, WeaponDef> = {
  fists:   { name: 'FISTS',         range: 26, dmg: 1, cd: 0.25, type: 'melee', col: 0xffffff },
  syringe: { name: 'SYRINGE',       range: 30, dmg: 1, cd: 0.20, type: 'melee', col: 0x9be7ff },
  drill:   { name: 'DRILL',         range: 34, dmg: 1, cd: 0.10, type: 'melee', col: 0xffe44a },
  scalpel: { name: 'SCALPEL',       range: 38, dmg: 1, cd: 0.18, type: 'melee', col: 0xffffff },
  mallet:  { name: 'MALLET',        range: 42, dmg: 1, cd: 0.40, type: 'melee', col: 0xc08060 },
  pistol:  { name: 'DART PISTOL',   range: 0,  dmg: 1, cd: 0.35, type: 'ranged', ammo: 8,  speed: 540, col: 0x9be7ff },
  uzi:     { name: 'NOVOCAIN UZI',  range: 0,  dmg: 1, cd: 0.08, type: 'ranged', ammo: 32, speed: 600, spread: 0.18, col: 0xff2e88 },
};
