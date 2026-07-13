---
name: tmux
description: Minimal tmux workflow for running and observing the blackjack backend and frontend.
---

# tmux for the blackjack app

Use this skill when you need both applications running while you inspect a
button click. Run these commands from the repository root.

## Start both applications

```sh
SESSION=blackjack

tmux kill-session -t "$SESSION" 2>/dev/null || true
tmux new-session -d -s "$SESSION" -n backend
tmux send-keys -t "${SESSION}:backend" 'cd backend && ./gradlew :app:run' C-m
tmux new-window -t "$SESSION" -n frontend
tmux send-keys -t "${SESSION}:frontend" 'cd frontend && npm run dev -- --host 127.0.0.1' C-m
```

The backend listens on `http://localhost:8080` and Vite serves the frontend on
`http://localhost:5173`.

## See what is happening

Attach to the session when you want an interactive view:

```sh
tmux attach -t blackjack
```

Press `Ctrl-b`, then `d` to detach without stopping the applications. From a
separate shell, capture recent output without attaching:

```sh
tmux capture-pane -p -t blackjack:backend -S -100
tmux capture-pane -p -t blackjack:frontend -S -100
```

The backend pane contains Java request, session, weather, and game-action logs.
The frontend pane contains Vite/HMR output. React button and request logs are
browser-console logs, so inspect them with the browser's console or the
`web-browser` skill's background log commands after clicking.

A minimal click-observation loop is:

1. Open `http://localhost:5173` with the `web-browser` skill.
2. Click `Start hand`, `Hit`, or `Stand`.
3. Capture `blackjack:backend` and inspect the browser console logs to correlate
   the button with the HTTP request and backend action.

## Stop both applications

Once you've finished observing, stop both applications with:

```sh
tmux kill-session -t blackjack
```
