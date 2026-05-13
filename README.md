# Escape the Dentist

A browser-based top-down twin-stick shooter in the spirit of Hotline Miami. You woke up mid-procedure. They're not letting you leave.

**Live:** https://brandonhawi.github.io/escape-the-dentist/

## Stack

- **Phaser 3** game engine
- **Vite** for the build (`npm run dev` / `npm run build`)
- **GitHub Actions** builds & deploys to GitHub Pages on every push to `main`
- **Kenney CC0** sprite art (`assets/KENNEY_LICENSE.txt`)

## Development

```bash
npm install
npm run dev      # Vite dev server on :5173
npm run build    # → dist/
npm run preview  # serve the built bundle
```

## Project layout

```
escape-the-dentist/
├─ index.html              # Vite entry, mounts Phaser into #game
├─ public/assets/          # static sprite PNGs (CC0 Kenney)
├─ src/
│  ├─ main.js              # Phaser.Game config + scene list
│  ├─ config.js            # constants, weapon table, tile codes
│  ├─ scenes/
│  │  ├─ BootScene.js      # preload sprites
│  │  ├─ TitleScene.js     # title screen + START
│  │  ├─ GameScene.js      # gameplay loop, AI, physics, attacks
│  │  ├─ UIScene.js        # HUD + controls strip + toast
│  │  └─ OverlayScene.js   # paused / dead / win overlays
│  └─ systems/
│     └─ WorldGen.js       # procedural floor generation
└─ .github/workflows/deploy.yml
```

Scenes run in parallel — `Game` for the world, `UI` for the HUD, `Overlay` launched on pause/death/win. Communication via `this.game.events` (`hud` and `toast` events).

## Controls

| Key      | Action          |
|----------|-----------------|
| `WASD`   | Move            |
| `Mouse`  | Aim             |
| `LMB`    | Attack / shoot  |
| `E`      | Pick up weapon  |
| `R`      | Throw weapon    |
| `Space`  | Dash            |
| `P`      | Pause           |
| `Enter`  | Restart on death/win |

One hit kills. Five floors. Reach the yellow `EXIT` tile.

## Weapons

- **Fists** — last resort
- **Syringe / Drill / Scalpel / Mallet** — melee, varying reach and speed
- **Dart Pistol** — ranged, 8 darts
- **Novocain Uzi** — ranged, 32 rounds, spread fire (floor 2+)

Ranged weapons auto-revert to fists when empty.

## Credits

Character sprites: [Kenney — Top-down Shooter](https://kenney.nl/assets/top-down-shooter) (CC0).
