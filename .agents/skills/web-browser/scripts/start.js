#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 9222;
const STATE_DIR = join(homedir(), ".cache/agent-web");
const DATA_DIR = join(STATE_DIR, "chrome-data");
const STATE_FILE = join(STATE_DIR, "state.json");
const DEFAULT_CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function usage() {
  console.log("Usage: start.js [--show] [--headless] [--fresh]");
  console.log("\nOptions:");
  console.log("  --show       Launch with visible browser window (default)");
  console.log("  --headless   Launch in headless mode");
  console.log("  --fresh      Reset AI browser profile before launch");
  console.log("\nEnvironment:");
  console.log(
    `  CHROME_BIN  Chrome executable path (default: ${DEFAULT_CHROME_PATH})`,
  );
}

function parseArgs(argv) {
  const options = {
    headless: false,
    fresh: false,
    port: DEFAULT_PORT,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--show") {
      options.headless = false;
    } else if (arg === "--headless") {
      options.headless = true;
    } else if (arg === "--fresh") {
      options.fresh = true;
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function isProcessAlive(pid) {
  if (!pid || !Number.isInteger(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try {
    const data = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

function writeState(state) {
  ensureDir(STATE_DIR);
  writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function clearState() {
  if (existsSync(STATE_FILE)) {
    rmSync(STATE_FILE, { force: true });
  }
}

async function fetchVersion(port, timeoutMs = 1000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`, {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function waitForVersion(port, attempts = 40, delayMs = 250) {
  for (let i = 0; i < attempts; i++) {
    const info = await fetchVersion(port, 1000);
    if (info?.webSocketDebuggerUrl) return info;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
}

function startWatcher() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const watcherPath = join(scriptDir, "watch.js");
  spawn(process.execPath, [watcherPath], { detached: true, stdio: "ignore" }).unref();
}

function launchChrome({ port, headless }) {
  const chromePath = process.env.CHROME_BIN || DEFAULT_CHROME_PATH;
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${DATA_DIR}`,
    "--profile-directory=Default",
    "--disable-search-engine-choice-screen",
    "--no-first-run",
    "--disable-features=ProfilePicker",
  ];

  if (headless) {
    args.push("--headless=new");
  }

  const child = spawn(chromePath, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  return child.pid;
}

try {
  const options = parseArgs(process.argv);

  ensureDir(STATE_DIR);

  if (options.fresh && existsSync(DATA_DIR)) {
    rmSync(DATA_DIR, { recursive: true, force: true });
  }
  ensureDir(DATA_DIR);

  const existing = readState();
  if (existing?.pid && isProcessAlive(existing.pid)) {
    const info = await fetchVersion(existing.port || options.port, 1200);
    if (info?.webSocketDebuggerUrl) {
      writeState({
        ...existing,
        port: existing.port || options.port,
        webSocketDebuggerUrl: info.webSocketDebuggerUrl,
        lastSeenAt: new Date().toISOString(),
      });
      startWatcher();
      console.log("✓ AI Chrome already running");
      console.log(`  data dir: ${DATA_DIR}`);
      console.log(`  debug:    http://127.0.0.1:${existing.port || options.port}`);
      process.exit(0);
    }
  }

  // If another process is already listening on this port, fail safely.
  const occupied = await fetchVersion(options.port, 1200);
  if (occupied?.webSocketDebuggerUrl) {
    if (existing?.pid && !isProcessAlive(existing.pid)) {
      clearState();
    }
    console.error(
      `✗ Port ${options.port} is already in use by a DevTools-enabled browser.`,
    );
    console.error("  Refusing to attach automatically for safety.");
    console.error("  Stop the other DevTools browser and retry.");
    process.exit(1);
  }

  const pid = launchChrome(options);
  const info = await waitForVersion(options.port);

  if (!info?.webSocketDebuggerUrl) {
    console.error("✗ Failed to connect to AI Chrome on DevTools port");
    process.exit(1);
  }

  writeState({
    pid,
    port: options.port,
    webSocketDebuggerUrl: info.webSocketDebuggerUrl,
    dataDir: DATA_DIR,
    startedAt: new Date().toISOString(),
    headless: options.headless,
  });

  startWatcher();

  console.log("✓ AI Chrome started");
  console.log(`  data dir: ${DATA_DIR}`);
  console.log(`  debug:    http://127.0.0.1:${options.port}`);
} catch (error) {
  if (error?.message?.startsWith("Unknown argument")) {
    console.error(`✗ ${error.message}`);
    usage();
    process.exit(1);
  }
  console.error(`✗ ${error.message}`);
  process.exit(1);
}
