#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: record_screen.sh [options]

Record a short macOS display capture with ffmpeg and verify the resulting MP4.

Options:
  --duration SECONDS    Capture duration from 1 through 300 seconds (default: 5)
  --output PATH         Destination MP4 (default: ~/Movies/recording-demo-<timestamp>.mp4)
  --screen INDEX        AVFoundation screen index; required when several screens exist
  --audio INDEX         Explicit AVFoundation audio index; omitted for video-only capture
  --overwrite           Replace an existing destination after a successful capture
  -h, --help            Show this help
EOF
}

die() {
  printf 'recording-demo: %s\n' "$*" >&2
  exit 1
}

duration=5
output="$HOME/Movies/recording-demo-$(date +%Y%m%d-%H%M%S).mp4"
screen_index=''
audio_index=''
overwrite=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --duration)
      [ "$#" -ge 2 ] || die "--duration requires a value"
      duration="$2"
      shift 2
      ;;
    --output)
      [ "$#" -ge 2 ] || die "--output requires a path"
      output="$2"
      shift 2
      ;;
    --screen)
      [ "$#" -ge 2 ] || die "--screen requires an index"
      screen_index="$2"
      shift 2
      ;;
    --audio)
      [ "$#" -ge 2 ] || die "--audio requires an index"
      audio_index="$2"
      shift 2
      ;;
    --overwrite)
      overwrite=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1 (use --help for usage)"
      ;;
  esac
done

case "$duration" in
  ''|*[!0-9]*) die "duration must be an integer from 1 through 300 seconds" ;;
esac
[ "$duration" -ge 1 ] && [ "$duration" -le 300 ] || die "duration must be an integer from 1 through 300 seconds"

if [ -n "$screen_index" ]; then
  case "$screen_index" in
    *[!0-9]*) die "screen index must be a non-negative integer" ;;
  esac
fi

if [ -n "$audio_index" ]; then
  case "$audio_index" in
    *[!0-9]*) die "audio index must be a non-negative integer" ;;
  esac
fi

ffmpeg_bin="$(command -v ffmpeg || true)"
[ -n "$ffmpeg_bin" ] || die "ffmpeg is not on PATH"
ffprobe_bin="$(command -v ffprobe || true)"
[ -n "$ffprobe_bin" ] || die "ffprobe is not on PATH"

encoder_listing="$("$ffmpeg_bin" -hide_banner -encoders 2>&1 || true)"
printf '%s\n' "$encoder_listing" | grep -Eq '(^|[[:space:]])libx264([[:space:]]|$)' || \
  die "ffmpeg does not expose libx264; install an ffmpeg build with H.264 encoding support"

# AVFoundation writes the device inventory to stderr and returns a non-zero
# status because the empty input is not a capture request. That status is
# expected here; the inventory is what this step needs.
device_listing="$("$ffmpeg_bin" -hide_banner -f avfoundation -list_devices true -i "" 2>&1 || true)"
screen_candidates="$(printf '%s\n' "$device_listing" | sed -nE 's/.*\[([0-9]+)\] (Capture screen.*)$/\1|\2/p')"
candidate_count="$(printf '%s\n' "$screen_candidates" | sed '/^$/d' | wc -l | tr -d '[:space:]')"

if [ "$candidate_count" -eq 0 ]; then
  printf '%s\n' "$device_listing" >&2
  die "no Capture screen device found; grant Screen Recording access in System Settings → Privacy & Security → Screen Recording, then rerun"
fi

if [ -z "$screen_index" ]; then
  if [ "$candidate_count" -ne 1 ]; then
    printf 'Available screen devices:\n%s\n' "$screen_candidates" >&2
    die "multiple screens found; rerun with --screen INDEX"
  fi
  screen_index="$(printf '%s\n' "$screen_candidates" | sed -n '1p' | cut -d'|' -f1)"
else
  if ! printf '%s\n' "$screen_candidates" | awk -F'|' -v wanted="$screen_index" '$1 == wanted { found = 1 } END { exit found ? 0 : 1 }'; then
    printf 'Available screen devices:\n%s\n' "$screen_candidates" >&2
    die "screen index $screen_index is not a Capture screen device"
  fi
fi

audio_spec='none'
if [ -n "$audio_index" ]; then
  audio_listing="$(printf '%s\n' "$device_listing" | sed -n '/AVFoundation audio devices:/,$p' | sed '1d')"
  audio_candidates="$(printf '%s\n' "$audio_listing" | sed -nE 's/.*\[([0-9]+)\] (.*)$/\1|\2/p')"
  if ! printf '%s\n' "$audio_candidates" | awk -F'|' -v wanted="$audio_index" '$1 == wanted { found = 1 } END { exit found ? 0 : 1 }'; then
    printf 'Available audio devices:\n%s\n' "$audio_candidates" >&2
    die "audio index $audio_index is not an available audio device"
  fi
  audio_spec="$audio_index"
fi

output_dir="$(dirname "$output")"
mkdir -p "$output_dir"
if [ -e "$output" ] && [ "$overwrite" -ne 1 ]; then
  die "output already exists: $output (choose another path or pass --overwrite explicitly)"
fi

tmp_output="$(mktemp "${output}.part.XXXXXX")"
cleanup() {
  rm -f "$tmp_output"
}
trap cleanup EXIT INT TERM

audio_label='none'
ffmpeg_args=(
  -hide_banner
  -nostdin
  -loglevel warning
  -f avfoundation
  -framerate 30
  -pixel_format uyvy422
  -capture_cursor 1
  -i "${screen_index}:${audio_spec}"
  -t "$duration"
  -r 30
  -fps_mode cfr
  -map 0:v:0
  -vf 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
  -c:v libx264
  -preset ultrafast
  -crf 28
  -pix_fmt yuv420p
)

if [ "$audio_spec" = 'none' ]; then
  ffmpeg_args+=( -an )
else
  audio_label="device $audio_spec"
  ffmpeg_args+=( -map 0:a:0 -c:a aac -b:a 128k -ar 48000 -ac 2 )
fi

ffmpeg_args+=( -movflags +faststart -f mp4 -y "$tmp_output" )
printf 'Recording %ss from screen %s (audio: %s)\n' "$duration" "$screen_index" "$audio_label"
printf 'Temporary output: %s\n' "$tmp_output"

if ! "$ffmpeg_bin" "${ffmpeg_args[@]}"; then
  die "ffmpeg failed; if macOS denied capture, grant Screen Recording access and retry after the permission change"
fi

if [ "$overwrite" -eq 1 ]; then
  mv -f "$tmp_output" "$output"
else
  [ ! -e "$output" ] || die "output appeared while recording; refusing to overwrite it"
  mv "$tmp_output" "$output"
fi

[ -s "$output" ] || die "ffmpeg produced an empty output"
"$ffmpeg_bin" -hide_banner -loglevel error -i "$output" -f null - >/dev/null 2>&1 || \
  die "recording failed decode verification: $output"

actual_duration="$("$ffprobe_bin" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output")"
[ -n "$actual_duration" ] || die "ffprobe could not read the recording duration"
awk -v actual="$actual_duration" -v requested="$duration" \
  'BEGIN { exit !(actual > 0 && actual >= requested - 1 && actual <= requested + 1) }' || \
  die "recording duration ${actual_duration}s is not within one second of requested ${duration}s"

size_bytes="$(wc -c < "$output" | tr -d '[:space:]')"
printf '\nVerified recording\n'
printf 'path=%s\n' "$output"
printf 'duration_seconds=%s\n' "$actual_duration"
printf 'size_bytes=%s\n' "$size_bytes"
"$ffprobe_bin" -v error \
  -show_entries stream=codec_type,codec_name,width,height \
  -of default=noprint_wrappers=1 "$output"
