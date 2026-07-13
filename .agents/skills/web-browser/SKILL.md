---
name: web-browser
description: Minimal Chrome/CDP workflow for playing and inspecting the blackjack frontend.
---

# Minimal web browser skill

Use this skill with the `tmux` skill to open the blackjack frontend, click its
buttons, and inspect the resulting browser and backend logs.

## Setup

From the repository root, install the small local CDP dependency once:

```bash
npm ci --prefix .agents/skills/web-browser/scripts
```

The commands below are relative to this skill directory:

```bash
cd .agents/skills/web-browser
```

## Play the game

Start or reuse the dedicated Chrome profile:

```bash
./scripts/start.js
```

Open the frontend and inspect its interactive elements:

```bash
./scripts/nav.js http://localhost:5173
./scripts/snapshot.js --json
```

Use the button UID from the snapshot to click. For example:

```bash
./scripts/click.js aw-10  # Start hand or New hand
./scripts/wait-for.js --text "Your move."
./scripts/snapshot.js --json
./scripts/click.js aw-11  # Hit
./scripts/click.js aw-12  # Stand
```

Take a fresh snapshot after each render because UIDs can change when the page
changes.

## Observe logs

`start.js` automatically starts browser console and network logging. Dump the
latest browser log after a click with:

```bash
./scripts/logs-tail.js
```

The React logs identify the button, request path, response status, and action
result. Capture the backend pane separately:

```bash
tmux capture-pane -p -t blackjack:backend -S -100
```

## Stop Chrome

```bash
./scripts/stop.js
```
