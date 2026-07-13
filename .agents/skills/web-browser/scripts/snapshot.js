#!/usr/bin/env node

import { connect } from "./cdp.js";
import { buildDomExpression } from "./dom-helpers.js";
import { resolveSelectedPage } from "./page-state.js";

const DEBUG = process.env.DEBUG === "1";
const log = DEBUG ? (...args) => console.error("[debug]", ...args) : () => {};
const asJson = process.argv.includes("--json");

function formatElement(element) {
  const parts = [`[${element.uid}]`, element.tag];
  if (element.role) parts.push(`role=${JSON.stringify(element.role)}`);
  if (element.type) parts.push(`type=${JSON.stringify(element.type)}`);
  if (element.name) parts.push(`name=${JSON.stringify(element.name)}`);
  if (element.text && element.text !== element.name) parts.push(`text=${JSON.stringify(element.text)}`);
  if (element.placeholder) parts.push(`placeholder=${JSON.stringify(element.placeholder)}`);
  if (element.href) parts.push(`href=${JSON.stringify(element.href)}`);
  if (element.value) parts.push(`value=${JSON.stringify(element.value)}`);
  if (element.disabled) parts.push("disabled=true");
  if (element.checked !== null) parts.push(`checked=${element.checked}`);
  return parts.join(" ");
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
  const snapshot = await cdp.evaluate(sessionId, buildDomExpression("snapshot()"));

  if (asJson) {
    console.log(JSON.stringify(snapshot, null, 2));
  } else {
    console.log(`# ${snapshot.title || "Untitled page"}`);
    console.log(snapshot.url);
    console.log("");
    for (const element of snapshot.elements) {
      console.log(formatElement(element));
    }
  }

  cdp.close();
} catch (error) {
  console.error("✗", error.message);
  process.exit(1);
} finally {
  clearTimeout(globalTimeout);
  setTimeout(() => process.exit(0), 100);
}
