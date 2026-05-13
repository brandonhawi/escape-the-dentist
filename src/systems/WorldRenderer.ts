import Phaser from 'phaser';
import { TILE, COLS, ROWS, T_FLOOR, T_WALL, T_EXIT, T_CHAIR } from '../config.ts';

export function drawTiles(
  scene: Phaser.Scene,
  map: number[][],
  gfx: Phaser.GameObjects.Graphics,
  fxLayer: Phaser.GameObjects.Layer,
): void {
  gfx.clear();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = map[y][x];
      const px = x * TILE, py = y * TILE;
      if (t === T_FLOOR) {
        gfx.fillStyle(((x + y) & 1) ? 0x220040 : 0x1a0030);
        gfx.fillRect(px, py, TILE, TILE);
      } else if (t === T_WALL) {
        gfx.fillStyle(0x3a005a); gfx.fillRect(px, py, TILE, TILE);
        gfx.fillStyle(0x5a1090); gfx.fillRect(px, py, TILE, 3);
        gfx.fillStyle(0x1a002a); gfx.fillRect(px, py + TILE - 3, TILE, 3);
      } else if (t === T_EXIT) {
        gfx.fillStyle(0xffe44a); gfx.fillRect(px, py, TILE, TILE);
        gfx.fillStyle(0x15001f); gfx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16);
      } else if (t === T_CHAIR) {
        gfx.fillStyle(0x3a005a); gfx.fillRect(px, py, TILE, TILE);
        gfx.fillStyle(0x9be7ff); gfx.fillRect(px + 6, py + 8, TILE - 12, TILE - 16);
        gfx.fillStyle(0x00f0ff); gfx.fillRect(px + 10, py + 4, TILE - 20, 6);
      }
    }
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === T_EXIT) {
        const label = scene.add.text(x * TILE + TILE / 2, y * TILE + TILE / 2, 'EXIT', {
          fontFamily: 'Courier New',
          fontSize: '13px',
          color: '#ff2e88',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        fxLayer.add(label);
      }
    }
  }
}
