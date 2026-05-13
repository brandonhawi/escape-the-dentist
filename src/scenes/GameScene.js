import Phaser from 'phaser';
import { TILE, COLS, ROWS, T_FLOOR, T_WALL, T_EXIT, T_CHAIR, WEAPONS, GAME_W, GAME_H } from '../config.js';
import { generateFloor } from '../systems/WorldGen.js';

const MAX_LEVEL = 5;

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.level = 1;
    this.totalKills = 0;
    this.kills = 0;
    this.paused = false;

    // groups
    this.wallGroup = this.physics.add.staticGroup();
    this.chairGroup = this.physics.add.staticGroup();
    this.exitGroup = this.physics.add.staticGroup();
    this.enemyGroup = this.physics.add.group();
    this.bulletGroup = this.physics.add.group();
    this.pickupGroup = this.physics.add.group({ allowGravity: false });
    this.decalLayer = this.add.layer();
    this.fxLayer = this.add.layer();

    // input
    this.keys = this.input.keyboard.addKeys({
      w: 'W', a: 'A', s: 'S', d: 'D',
      e: 'E', r: 'R', space: 'SPACE', p: 'P', enter: 'ENTER',
    });

    this.input.keyboard.on('keydown-P', () => {
      if (this.scene.isActive()) {
        this.paused = !this.paused;
        if (this.paused) {
          this.physics.pause();
          this.scene.launch('Overlay', { kind: 'paused' });
        } else {
          this.physics.resume();
          this.scene.stop('Overlay');
        }
      }
    });

    // sounds (tiny webaudio synth)
    this.ac = null;
    this.input.once('pointerdown', () => { if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)(); });

    this.startLevel(1);
  }

  // ---- audio ----
  blip(freq, dur=0.05, type='square', vol=0.04) {
    if (!this.ac) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, this.ac.currentTime + dur);
    o.connect(g).connect(this.ac.destination);
    o.start(); o.stop(this.ac.currentTime + dur);
  }
  sfxShoot()  { this.blip(880, 0.05, 'square', 0.04); }
  sfxHit()    { this.blip(140, 0.18, 'sawtooth', 0.08); }
  sfxSwing()  { this.blip(420, 0.04, 'triangle', 0.05); }
  sfxPickup() { this.blip(660, 0.08, 'sine', 0.05); }
  sfxDash()   { this.blip(220, 0.10, 'triangle', 0.05); }
  sfxDoor()   { this.blip(1200, 0.20, 'sine', 0.06); }
  sfxDeath()  { this.blip(120, 0.40, 'sawtooth', 0.10); setTimeout(() => this.blip(80, 0.4, 'sawtooth', 0.08), 100); }

  // ---- world setup ----
  startLevel(level) {
    this.level = level;
    this.kills = 0;
    this.paused = false;
    this.dead = false;

    this.wallGroup.clear(true, true);
    this.chairGroup.clear(true, true);
    this.exitGroup.clear(true, true);
    this.enemyGroup.clear(true, true);
    this.bulletGroup.clear(true, true);
    this.pickupGroup.clear(true, true);
    this.decalLayer.removeAll(true);
    this.fxLayer.removeAll(true);

    const { map, rng } = generateFloor(level);
    this.map = map;

    // tiles
    this.tileGfx = this.add.graphics();
    this.drawTiles();

    // walls/chairs/exit physics
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = map[y][x];
        const px = x * TILE + TILE/2, py = y * TILE + TILE/2;
        if (t === T_WALL) {
          const r = this.add.rectangle(px, py, TILE, TILE, 0x3a005a).setVisible(false);
          this.physics.add.existing(r, true);
          this.wallGroup.add(r);
        } else if (t === T_CHAIR) {
          const r = this.add.rectangle(px, py, TILE-6, TILE-10, 0x3a005a).setVisible(false);
          this.physics.add.existing(r, true);
          this.chairGroup.add(r);
        } else if (t === T_EXIT) {
          const r = this.add.rectangle(px, py, TILE, TILE, 0xffe44a).setVisible(false);
          this.physics.add.existing(r, true);
          this.exitGroup.add(r);
        }
      }
    }

    // player
    this.player = this.physics.add.sprite(TILE * 1.5, TILE * 1.5, 'player');
    this.player.setDisplaySize(36, 32);
    this.player.body.setCircle(this.player.width/2, 0, (this.player.height - this.player.width)/2);
    this.player.setCollideWorldBounds(true);
    this.player.weapon = 'fists';
    this.player.ammo = 0;
    this.player.cd = 0;
    this.player.dashCd = 0;
    this.player.dashT = 0;
    this.player.swingT = 0;
    this.player.alive = true;

    // weapon overlay rectangle (drawn each frame)
    this.weaponGfx = this.add.graphics();

    // enemies
    const enemyCount = 3 + level * 2;
    let placed = 0, tries = 0;
    while (placed < enemyCount && tries < 400) {
      tries++;
      const tx = 4 + Math.floor(rng() * (COLS - 6));
      const ty = 1 + Math.floor(rng() * (ROWS - 2));
      if (map[ty][tx] !== T_FLOOR) continue;
      const ex = tx * TILE + TILE/2, ey = ty * TILE + TILE/2;
      if (Phaser.Math.Distance.Between(ex, ey, this.player.x, this.player.y) < 220) continue;
      const roll = rng();
      let weapon, kind = 'normal';
      if (roll < 0.35) weapon = 'fists';
      else if (roll < 0.55) { weapon = 'drill'; kind = 'fast'; }
      else if (roll < 0.75) weapon = 'pistol';
      else if (roll < 0.88) weapon = 'mallet';
      else weapon = level >= 2 ? 'uzi' : 'pistol';
      this.spawnEnemy(ex, ey, kind, weapon);
      placed++;
    }

    // pickups
    const pickupPool = ['syringe', 'drill', 'scalpel', 'mallet', 'pistol'];
    if (level >= 2) pickupPool.push('uzi');
    const pickupCount = 2 + Math.floor(level / 2);
    for (let i = 0; i < pickupCount; i++) {
      let tx, ty, t = 0;
      do { tx = 2 + Math.floor(rng()*(COLS-4)); ty = 2 + Math.floor(rng()*(ROWS-4)); t++; }
      while (map[ty][tx] !== T_FLOOR && t < 50);
      const w = pickupPool[Math.floor(rng() * pickupPool.length)];
      this.spawnPickup(tx * TILE + TILE/2, ty * TILE + TILE/2, w);
    }

    // colliders
    this.physics.add.collider(this.player, this.wallGroup);
    this.physics.add.collider(this.player, this.chairGroup);
    this.physics.add.collider(this.enemyGroup, this.wallGroup);
    this.physics.add.collider(this.enemyGroup, this.chairGroup);
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);
    this.physics.add.overlap(this.player, this.exitGroup, () => this.advanceFloor());
    this.physics.add.overlap(this.player, this.pickupGroup, (p, it) => this.tryPickup(it));
    this.physics.add.overlap(this.bulletGroup, this.wallGroup, (b) => this.killBullet(b));
    this.physics.add.overlap(this.bulletGroup, this.enemyGroup, (b, e) => {
      if (b.from === 'player' && e.alive) { this.killEnemy(e); this.killBullet(b); }
    });
    this.physics.add.overlap(this.bulletGroup, this.player, (p, b) => {
      // note Phaser passes (objectA, objectB) but we register (bullets, player) so first arg may flip
    });
    // separate overlap so we know argument order
    this.physics.add.overlap(this.player, this.bulletGroup, (p, b) => {
      if (b.from === 'enemy' && this.player.alive) { this.killPlayer(); this.killBullet(b); }
    });

    // emit UI event
    this.game.events.emit('hud', this.hudState());
    this.toast(`FLOOR ${level} — ${enemyCount} HOSTILES`);
    // re-emit after a tick in case UI scene was started concurrently
    this.time.delayedCall(60, () => this.game.events.emit('hud', this.hudState()));
  }

  drawTiles() {
    const g = this.tileGfx;
    g.clear();
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = this.map[y][x];
        const px = x * TILE, py = y * TILE;
        if (t === T_FLOOR) {
          g.fillStyle(((x+y) & 1) ? 0x220040 : 0x1a0030);
          g.fillRect(px, py, TILE, TILE);
        } else if (t === T_WALL) {
          g.fillStyle(0x3a005a); g.fillRect(px, py, TILE, TILE);
          g.fillStyle(0x5a1090); g.fillRect(px, py, TILE, 3);
          g.fillStyle(0x1a002a); g.fillRect(px, py + TILE - 3, TILE, 3);
        } else if (t === T_EXIT) {
          g.fillStyle(0xffe44a); g.fillRect(px, py, TILE, TILE);
          g.fillStyle(0x15001f); g.fillRect(px+8, py+8, TILE-16, TILE-16);
        } else if (t === T_CHAIR) {
          g.fillStyle(0x3a005a); g.fillRect(px, py, TILE, TILE);
          g.fillStyle(0x9be7ff); g.fillRect(px+6, py+8, TILE-12, TILE-16);
          g.fillStyle(0x00f0ff); g.fillRect(px+10, py+4, TILE-20, 6);
        }
      }
    }
    // EXIT label
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.map[y][x] === T_EXIT) {
          const t = this.add.text(x*TILE + TILE/2, y*TILE + TILE/2, 'EXIT', {
            fontFamily: 'Courier New', fontSize: '13px', color: '#ff2e88', fontStyle: 'bold',
          }).setOrigin(0.5);
          this.fxLayer.add(t);
        }
      }
    }
  }

  spawnEnemy(x, y, kind, weapon) {
    const tex = kind === 'fast' ? 'fast' : 'dentist';
    const e = this.physics.add.sprite(x, y, tex);
    e.setDisplaySize(36, 32);
    e.body.setCircle(e.width/2, 0, (e.height - e.width)/2);
    e.weapon = weapon;
    e.ammo = WEAPONS[weapon].ammo || 0;
    e.cd = Math.random() * 0.5;
    e.kind = kind;
    e.alive = true;
    e.speed = kind === 'fast' ? 170 : 110;
    e.seePlayer = false;
    e.reactT = 0.2 + Math.random() * 0.3;
    e.wanderT = 0;
    e.wanderVx = 0; e.wanderVy = 0;
    this.enemyGroup.add(e);
    return e;
  }

  spawnPickup(x, y, weapon, ammo) {
    const w = WEAPONS[weapon];
    const r = this.add.rectangle(x, y, 20, 6, w.col);
    this.physics.add.existing(r);
    r.body.setAllowGravity(false);
    r.weapon = weapon;
    r.ammo = ammo !== undefined ? ammo : (w.ammo || 0);
    r._t0 = this.time.now;
    this.pickupGroup.add(r);
    return r;
  }

  tryPickup(it) {
    if (!this.keys.e.isDown) return;
    const p = this.player;
    if (p.weapon !== 'fists') {
      this.spawnPickup(p.x, p.y, p.weapon, p.ammo);
    }
    p.weapon = it.weapon;
    p.ammo = it.ammo;
    it.destroy();
    this.sfxPickup();
    const w = WEAPONS[p.weapon];
    this.toast(w.name + (w.type === 'ranged' ? ` [${p.ammo}]` : ''));
    this.game.events.emit('hud', this.hudState());
  }

  killBullet(b) { if (b.active) b.destroy(); }

  killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    this.kills++; this.totalKills++;
    this.spawnBlood(e.x, e.y, 22);
    if (e.weapon && e.weapon !== 'fists') {
      this.spawnPickup(e.x + (Math.random()-0.5)*8, e.y + (Math.random()-0.5)*8, e.weapon, e.ammo);
    }
    e.destroy();
    this.cameras.main.shake(120, 0.006);
    this.sfxHit();
    this.game.events.emit('hud', this.hudState());
  }

  killPlayer() {
    if (!this.player.alive) return;
    this.player.alive = false;
    this.spawnBlood(this.player.x, this.player.y, 40);
    this.cameras.main.shake(220, 0.012);
    this.sfxDeath();
    this.dead = true;
    this.physics.pause();
    this.scene.launch('Overlay', { kind: 'dead', level: this.level, kills: this.totalKills });
  }

  spawnBlood(x, y, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 180;
      const dot = this.add.circle(x, y, 2 + Math.random()*3, 0xff2e88);
      this.fxLayer.add(dot);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(a) * s * 0.3,
        y: y + Math.sin(a) * s * 0.3,
        alpha: 0,
        duration: 300 + Math.random() * 400,
        onComplete: () => dot.destroy(),
      });
    }
    const decal = this.add.circle(x + (Math.random()-0.5)*10, y + (Math.random()-0.5)*10, 8 + Math.random()*8, 0xb40040, 0.55);
    this.decalLayer.add(decal);
  }

  toast(msg) {
    this.game.events.emit('toast', msg);
  }

  hudState() {
    const enemiesLeft = this.enemyGroup.getChildren().filter(e => e.alive).length;
    const w = WEAPONS[this.player.weapon];
    return {
      level: this.level,
      enemies: enemiesLeft,
      kills: this.totalKills,
      weapon: w.name,
      weaponCol: '#' + w.col.toString(16).padStart(6, '0'),
      ammo: w.type === 'ranged' ? this.player.ammo : null,
    };
  }

  advanceFloor() {
    if (this._advancing) return;
    this._advancing = true;
    this.sfxDoor();
    if (this.level >= MAX_LEVEL) {
      this.physics.pause();
      this.scene.launch('Overlay', { kind: 'win', kills: this.totalKills });
    } else {
      this.time.delayedCall(120, () => {
        this._advancing = false;
        this.startLevel(this.level + 1);
      });
    }
  }

  // ---- main loop ----
  update(time, delta) {
    if (this.paused || this.dead || !this.player || !this.player.alive) {
      // still update weapon overlay so dying player doesn't ghost a weapon? skip.
      return;
    }
    const dt = delta / 1000;
    this.handleInput(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.drawWeapon();
  }

  handleInput(dt) {
    const p = this.player;
    let dx = 0, dy = 0;
    if (this.keys.a.isDown) dx -= 1;
    if (this.keys.d.isDown) dx += 1;
    if (this.keys.w.isDown) dy -= 1;
    if (this.keys.s.isDown) dy += 1;
    if (dx || dy) { const l = Math.hypot(dx, dy); dx /= l; dy /= l; }

    // dash
    p.dashCd -= dt;
    if (this.keys.space.isDown && p.dashCd <= 0 && (dx || dy)) {
      p.dashT = 0.16; p.dashCd = 0.7;
      p.dashDx = dx; p.dashDy = dy;
      this.sfxDash();
    }
    let speed = 220;
    if (p.dashT > 0) {
      p.dashT -= dt;
      dx = p.dashDx; dy = p.dashDy;
      speed = 600;
    }
    p.setVelocity(dx * speed, dy * speed);

    // aim
    const ptr = this.input.activePointer;
    p.rotation = Math.atan2(ptr.worldY - p.y, ptr.worldX - p.x);

    // throw
    if (Phaser.Input.Keyboard.JustDown(this.keys.r) && p.weapon !== 'fists') {
      const a = p.rotation;
      const sp = 520;
      const b = this.add.rectangle(p.x + Math.cos(a)*16, p.y + Math.sin(a)*16, 8, 4, WEAPONS[p.weapon].col);
      this.physics.add.existing(b);
      b.body.setVelocity(Math.cos(a)*sp, Math.sin(a)*sp);
      b.body.setAllowGravity(false);
      b.from = 'player';
      b.life = 0.7;
      b.thrown = p.weapon;
      b.r = 5;
      this.bulletGroup.add(b);
      p.weapon = 'fists'; p.ammo = 0;
      this.sfxSwing();
      this.game.events.emit('hud', this.hudState());
    }

    // attack
    if (this.input.activePointer.isDown) this.playerAttack();
    p.cd -= dt;
    if (p.swingT > 0) p.swingT -= dt;
  }

  playerAttack() {
    const p = this.player;
    if (p.cd > 0) return;
    const w = WEAPONS[p.weapon];
    if (w.type === 'ranged') {
      if (p.ammo <= 0) {
        p.weapon = 'fists'; p.ammo = 0;
        this.toast('OUT OF AMMO — FISTS');
        this.game.events.emit('hud', this.hudState());
        return;
      }
      p.ammo--;
      const spread = w.spread || 0.02;
      const a = p.rotation + (Math.random()-0.5) * spread;
      const b = this.add.rectangle(p.x + Math.cos(a)*16, p.y + Math.sin(a)*16, 6, 3, w.col);
      this.physics.add.existing(b);
      b.body.setVelocity(Math.cos(a)*w.speed, Math.sin(a)*w.speed);
      b.body.setAllowGravity(false);
      b.from = 'player';
      b.r = 3;
      this.bulletGroup.add(b);
      p.cd = w.cd;
      this.cameras.main.shake(40, 0.003);
      this.sfxShoot();
      // muzzle flash
      const fx = this.add.circle(p.x + Math.cos(a)*22, p.y + Math.sin(a)*22, 10, 0xffe44a);
      this.fxLayer.add(fx);
      this.tweens.add({ targets: fx, alpha: 0, scale: 0.4, duration: 90, onComplete: () => fx.destroy() });
      if (p.ammo <= 0) this.toast('CLICK — EMPTY');
      this.game.events.emit('hud', this.hudState());
    } else {
      const ax = p.x + Math.cos(p.rotation) * w.range * 0.6;
      const ay = p.y + Math.sin(p.rotation) * w.range * 0.6;
      let hit = false;
      this.enemyGroup.getChildren().forEach(e => {
        if (!e.alive || hit) return;
        if (Phaser.Math.Distance.Between(ax, ay, e.x, e.y) < w.range * 0.7 + 14) {
          this.killEnemy(e); hit = true;
        }
      });
      p.cd = w.cd;
      p.swingT = 0.12;
      this.sfxSwing();
      // swing arc
      const arc = this.add.graphics();
      arc.lineStyle(3, 0xffffff, 0.9);
      arc.beginPath();
      arc.arc(0, 0, w.range * 0.9, -1.0, 1.0);
      arc.strokePath();
      arc.x = p.x; arc.y = p.y; arc.rotation = p.rotation;
      this.fxLayer.add(arc);
      this.tweens.add({ targets: arc, alpha: 0, duration: 140, onComplete: () => arc.destroy() });
      if (hit) this.cameras.main.shake(80, 0.005);
    }
  }

  updateEnemies(dt) {
    const p = this.player;
    this.enemyGroup.getChildren().forEach(e => {
      if (!e.active || !e.alive) return;
      const d = Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y);
      const see = p.alive && d < 360 && this.losClear(e.x, e.y, p.x, p.y);
      e.seePlayer = see;
      const w = WEAPONS[e.weapon];
      let dx = 0, dy = 0;
      if (see) {
        e.reactT -= dt;
        e.rotation = Math.atan2(p.y - e.y, p.x - e.x);
        if (w.type === 'ranged') {
          const ideal = 200;
          if (d > ideal + 20) { dx = Math.cos(e.rotation); dy = Math.sin(e.rotation); }
          else if (d < ideal - 20) { dx = -Math.cos(e.rotation); dy = -Math.sin(e.rotation); }
        } else {
          dx = Math.cos(e.rotation); dy = Math.sin(e.rotation);
        }
        if (e.reactT <= 0 && e.cd <= 0) {
          if (w.type === 'ranged') {
            const a = e.rotation + (Math.random()-0.5) * (w.spread || 0.12);
            const b = this.add.rectangle(e.x + Math.cos(a)*16, e.y + Math.sin(a)*16, 6, 3, w.col);
            this.physics.add.existing(b);
            b.body.setVelocity(Math.cos(a)*w.speed, Math.sin(a)*w.speed);
            b.body.setAllowGravity(false);
            b.from = 'enemy';
            b.r = 3;
            this.bulletGroup.add(b);
            e.cd = w.cd + Math.random() * 0.1;
            this.sfxShoot();
          } else {
            if (d < w.range + 14 + 14 - 4 && p.alive) {
              this.killPlayer();
              e.cd = w.cd;
            }
          }
        }
      } else {
        e.wanderT -= dt;
        if (e.wanderT <= 0) {
          e.wanderT = 1 + Math.random() * 1.5;
          const a = Math.random() * Math.PI * 2;
          e.wanderVx = Math.cos(a) * 0.5; e.wanderVy = Math.sin(a) * 0.5;
          if (Math.random() < 0.4) { e.wanderVx = 0; e.wanderVy = 0; }
        }
        dx = e.wanderVx; dy = e.wanderVy;
        if (dx || dy) e.rotation = Math.atan2(dy, dx);
      }
      const l = Math.hypot(dx, dy) || 1;
      e.setVelocity((dx/l) * e.speed, (dy/l) * e.speed);
      e.cd -= dt;
    });
  }

  losClear(ax, ay, bx, by) {
    const steps = Math.ceil(Phaser.Math.Distance.Between(ax, ay, bx, by) / 8);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
      if (this.map[ty][tx] === T_WALL) return false;
    }
    return true;
  }

  updateBullets(dt) {
    this.bulletGroup.getChildren().forEach(b => {
      if (!b.active) return;
      if (b.life !== undefined) {
        b.life -= dt;
        if (b.life <= 0) {
          if (b.thrown) this.spawnPickup(b.x, b.y, b.thrown);
          b.destroy(); return;
        }
      }
      // out-of-bounds cleanup
      if (b.x < 0 || b.x > GAME_W || b.y < 0 || b.y > GAME_H) b.destroy();
    });
  }

  drawWeapon() {
    const g = this.weaponGfx;
    g.clear();
    const p = this.player;
    if (!p.alive) return;
    const w = WEAPONS[p.weapon];
    g.save();
    g.translateCanvas(p.x, p.y);
    g.rotateCanvas(p.rotation);
    if (w.type === 'ranged') {
      g.fillStyle(w.col);
      g.fillRect(8, -2, 14, 4);
    } else {
      g.fillStyle(w.col);
      const swingActive = p.swingT > 0;
      const len = w.range * (0.5 + (swingActive ? 0.7 : 0.3));
      g.fillRect(8, -2, len, 4);
    }
    g.restore();
  }
}
