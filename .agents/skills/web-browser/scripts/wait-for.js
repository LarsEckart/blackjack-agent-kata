#!/usr/bin/env node

import { connect } from "./cdp.js";
import { buildDomExpression } from "./dom-helpers.js";
import { resolveSelectedPage } from "./page-state.js";

const DEBUG = process.env.DEBUG === "1";
const log = DEBUG ? (...args) => console.error("[debug]", ...args) : () => {};

function printUsage() {
  console.log("Usage: wait-for.js --text <text> [--timeout 10000] [--json]");
  console.log("       wait-for.js --uid <uid> [--timeout 10000] [--json]");
}

function getFlagValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const text = getFlagValue("--text");
const uid = getFlagValue("--uid");
const timeoutMs = Number(getFlagValue("--timeout") || 10000);
const asJson = process.argv.includes("--json");

if ((!text && !uid) || Number.isNaN(timeoutMs) || timeoutMs < 1) {
  printUsage();
  process.exit(1);
}

const globalTimeout = setTimeout(() => {
  console.error("✗ Global timeout exceeded (30s)");
  process.exit(1);
}, Math.max(30000, timeoutMs + 5000));

try {
  log("connecting...");
  const cdp = await connect(5000);

  const { page } = await resolveSelectedPage(cdp);
  if (!page) {
    console.error("✗ No active tab found");
    process.exit(1);
  }

  const sessionId = await cdp.attachToPage(page.targetId);
  const result = await cdp.evaluate(
    sessionId,
    buildDomExpression(
      `waitFor(${JSON.stringify({ uid: uid || null, text: text || null, timeoutMs, intervalMs: 100 })})`,
    ),
    timeoutMs + 2000,
  );

  if (!result.ok) {
    console.error(`✗ ${result.message}`);
    process.exit(1);
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.match?.type === "uid") {
    console.log(`✓ Found element ${result.match.value}`);
  } else {
    console.log(`✓ Found text: ${result.match?.value}`);
  }

  cdp.close();
} catch (error) {
  console.error("✗", error.message);
  process.exit(1);
} finally {
  clearTimeout(globalTimeout);
  setTimeout(() => process.exit(0), 100);
}
