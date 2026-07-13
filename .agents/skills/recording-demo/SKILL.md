---
name: recording-demo
description: Record an explicit screen demo with ffmpeg on macOS.
disable-model-invocation: true
---

# Recording Demo

## When to use

Use `/recording-demo` when the user explicitly asks for a short recording of a Mac display. This skill is user-invoked because screen capture is privacy-sensitive.

## Workflow

1. **Set the contract.** Confirm the duration, display, output path, and whether audio is wanted. Default to a 5-second, video-only capture saved under `~/Movies/`. Warn that the selected display is captured in full, so sensitive windows should be closed first.
   **Completion criterion:** duration, display, audio choice, and output path are explicit.

2. **Discover before capturing.** Resolve `scripts/record_screen.sh` relative to this skill directory and run it. The script enumerates AVFoundation devices, selects a screen only when the choice is unambiguous, and refuses to overwrite an existing output unless `--overwrite` is explicitly supplied. Do not hardcode a screen index.
   **Completion criterion:** ffmpeg and ffprobe are available, the requested screen is identified, and no permission or device-selection error remains.

3. **Capture the default branch.** Run the helper rather than reconstructing its ffmpeg flags:

   ```bash
   bash scripts/record_screen.sh --duration 5 --output "$HOME/Movies/recording-demo-$(date +%Y%m%d-%H%M%S).mp4"
   ```

   **Completion criterion:** ffmpeg exits successfully and produces the requested artifact.

4. **Verify and report.** The helper decodes the finished file and checks that its duration is within one second of the requested duration. Read its ffprobe summary and report the absolute path, duration, dimensions, codecs, audio presence, and file size.
   **Completion criterion:** the file exists, is non-empty, decodes without errors, and every requested stream is present.

## Constraints

- MUST have an explicit screen-recording request in the current conversation.
- MUST default to video-only; never capture a microphone or other audio device implicitly.
- MUST ask the user to choose when multiple displays or audio devices are available; do not guess.
- MUST NOT overwrite an existing recording without explicit consent and `--overwrite`.
- MUST stop and ask for a manual macOS permission change when Screen Recording access is denied; do not retry in a loop or claim success.
- MUST NOT treat the AVFoundation device-list command's expected empty-input error as a successful recording.
- MUST NOT claim completion before the helper's verification passes.

