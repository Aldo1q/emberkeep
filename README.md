# Emberkeep — Defend the Last Lantern

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Aldo1q/emberkeep/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Aldo1q/emberkeep/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A 2D canvas tower-defence game for the make.fun "Make the best game" bounty.
Original theme, art (canvas-drawn) and sounds (WebAudio synth). No libraries,
no network, no assets — plain ES modules, 1280×720.

## The game

Dusk has fallen on the forest and shadow creatures — the **Glooms** — are
marching down the winding path toward the **Last Lantern**. Build towers on
the glowing stone pads, hold the line through **12 waves**, and keep the
lantern lit. If its HP hits 0, the forest goes dark.

**Towers** (built with embers, 3 levels each, upgrade cost scales):
- **Spark Spire** (50🔥) — fast, low damage, cheap
- **Frost Brazier** (70🔥) — slows enemies in its radius
- **Cannon Mortar** (110🔥) — slow, splash damage
- **Prism Lens** (160🔥) — long range, heavy hits

**Enemies:** Wisp (fast, weak), Shade (balanced), Brute (slow, tough),
Flicker (fast, erratic speed), Wraith (slow, huge HP, regenerates).

**Score:** 10 per kill + wave-clear bonuses + 25 per lantern HP left on a
win. Best score is saved in localStorage.

## How to play

- Click a glowing pad, then click a tower in the menu (or press **1–4**) to build.
- Click a tower to upgrade it or sell it (70% refund).
- Press **Space** (or the Start Wave button) to send the next wave.
- **P** / **Esc** pause · **R** restart · **F** 1×/2× speed · **M** mute.
- Win by clearing wave 12. Lose if the lantern's HP reaches 0.

## Run it

```sh
python3 -m http.server --directory game 8000
```

Serve the `game/` folder with any static server and open `index.html`
(or open the file directly — the game makes no network requests).

Deterministic scenes for screenshots: `?shot=title|play|victory|defeat&seed=N`.

## Build the entry

`MAKEFUN_OUTPUT_DIR=out node main.ts` copies `game/` + `screenshots/` to
`out/` and writes `out/dossier.json` (via `vendor/makefun-game.ts`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=835rtjk0&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
