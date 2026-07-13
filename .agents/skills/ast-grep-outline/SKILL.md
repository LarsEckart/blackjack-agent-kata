---
name: ast-grep-outline
description: Use `ast-grep outline` as a cheap structural scout before reading full source files.
---

# ast-grep outline quick commands

Run these before reading source. Prefer the simplest command that gives useful line numbers.

## Backend: Java

```shell
# Inspect one Java file, including fields/constructors/methods
ast-grep outline backend/app/src/main/java/kata/blackjack/Game.java --view expanded

# Inspect one Java file's imports/dependencies
ast-grep outline backend/app/src/main/java/kata/blackjack/Game.java --items imports --view signatures
```

## Frontend: JavaScript / JSX

```shell
# Scan React source files/components/constants
ast-grep outline frontend/src --items structure --view names

# Inspect one JSX file, including component/function structure
ast-grep outline frontend/src/App.jsx --view expanded

# Inspect imports/dependencies
ast-grep outline frontend/src --items imports --view signatures
```

## Reminders

- Use directory scans to find candidate files, then inspect a single file with `--view expanded`.
- `--items` accepts one mode only: use `structure`, `imports`, `exports`, or `all`; run separate commands when separate output is easier to read.
- If output is too broad, add `--type` or `--match`; otherwise keep commands simple.
