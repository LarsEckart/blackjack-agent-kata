#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { clearSelectedPage } from "./page-state.js";

const STATE_DIR = join(homedir(), ".cache/agent-web");
const STATE_FILE = join(STATE_DIR, "state.json");
const DATA_DIR = join(STATE_DIR, "chrome-data");

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

function removeState() {
  rmSync(STATE_FILE, { force: true });
}

function processCommand(pid) {
  try {
    return execSync(`ps -p ${pid} -o command=`, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

async function waitForExit(pid, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!isProcessAlive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return !isProcessAlive(pid);
}

const force = process.argv.includes("--force");

const state = readState();
if (!state?.pid) {
  clearSelectedPage();
  console.log("○ No AI Chrome state found");
  process.exit(0);
}

const pid = Number(state.pid);
if (!isProcessAlive(pid)) {
  removeState();
  clearSelectedPage();
  console.log("○ AI Chrome is not running (state cleaned)");
  process.exit(0);
}

const command = processCommand(pid);
const expectedMarker = `--user-data-dir=${DATA_DIR}`;

if (!force && !command.includes(expectedMarker)) {
  console.error("✗ Refusing to stop process: PID does not look like AI Chrome");
  console.error(`  pid: ${pid}`);
  console.error("  Use --force if you really want to terminate this PID.");
  process.exit(1);
}

try {
  process.kill(pid, "SIGTERM");
} catch (error) {
  console.error(`✗ Failed to send SIGTERM: ${error.message}`);
  process.exit(1);
}

const exited = await waitForExit(pid, 5000);
if (!exited) {
  try {
    process.kill(pid, "SIGKILL");
  } catch (error) {
    console.error(`✗ Failed to force stop PID ${pid}: ${error.message}`);
    process.exit(1);
  }
}

removeState();
clearSelectedPage();
console.log(`✓ Stopped AI Chrome (pid ${pid})`);
