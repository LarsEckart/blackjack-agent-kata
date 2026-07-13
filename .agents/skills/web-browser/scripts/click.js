#!/usr/bin/env node

import { connect } from "./cdp.js";
import { buildDomExpression } from "./dom-helpers.js";
import { resolveSelectedPage } from "./page-state.js";

const DEBUG = process.env.DEBUG === "1";
const log = DEBUG ? (...args) => console.error("[debug]", ...args) : () => {};
const uid = process.argv[2];
const asJson = process.argv.includes("--json");

if (!uid || uid === "--json") {
  console.log("Usage: click.js <uid> [--json]");
  process.exit(1);
}

const globalTimeout = setTimeout(() => {
  console.error("✗ Global timeout exceeded (20s)");
  process.exit(1);
}, 20000);

try {
  log("connecting...");
  const cdp = await connect(5000);

  const { page } = await resolveSelectedPage(cdp);
  if (!page) {
    console.error("✗ No active tab found");
    process.exit(1);
  }

  const sessionId = await cdp.attachToPage(page.targetId);
  const result = await cdp.evaluate(sessionId, buildDomExpression(`click(${JSON.stringify(uid)})`));

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`✓ Clicked ${result.uid} (${result.tag}${result.name ? `: ${result.name}` : ""})`);
  }

  cdp.close();
} catch (error) {
  console.error("✗", error.message);
  process.exit(1);
} finally {
  clearTimeout(globalTimeout);
  setTimeout(() => process.exit(0), 100);
}
