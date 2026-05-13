# Escape the Dentist

A browser-based top-down twin-stick shooter in the spirit of Hotline Miami. You woke up mid-procedure. They're not letting you leave.

**Play:** just open `index.html` in any modern browser. No build step, no dependencies.

## Controls

| Key | Action |
|---|---|
| `WASD` | Move |
| `Mouse` | Aim |
| `LMB` | Attack / shoot |
| `E` | Pick up weapon |
| `R` | Throw current weapon |
| `Space` | Dash |
| `Enter` | Restart (on death / win) |

## Rules

- One hit and you're dead. So are they.
- Five floors of dental hell. Reach the yellow `EXIT` tile on each floor.
- Enemies drop their weapons when killed. Throw a scalpel through a doorway, then run in and grab their drill.
- Ranged weapons (dart pistol, novocain uzi) have limited ammo and auto-revert to fists when empty.

## Weapons

- **Fists** — last resort
- **Syringe / Drill / Scalpel / Mallet** — melee, varying reach and speed
- **Dart Pistol** — ranged, 8 darts
- **Novocain Uzi** — ranged, 32 rounds, spread fire (floor 2+)

## Tech

Single-file vanilla JS + HTML5 Canvas. ~700 lines. No frameworks. Tiny WebAudio synth for sound.
