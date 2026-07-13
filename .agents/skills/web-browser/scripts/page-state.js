import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const STATE_DIR = join(homedir(), ".cache/agent-web");
const SELECTED_PAGE_FILE = join(STATE_DIR, "selected-page.json");

function ensureStateDir() {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

export function readSelectedPageState() {
  if (!existsSync(SELECTED_PAGE_FILE)) return null;
  try {
    const data = JSON.parse(readFileSync(SELECTED_PAGE_FILE, "utf8"));
    if (!data || typeof data !== "object") return null;
    if (typeof data.targetId !== "string" || data.targetId.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSelectedPage(targetId) {
  if (!targetId) return;
  ensureStateDir();
  writeFileSync(
    SELECTED_PAGE_FILE,
    `${JSON.stringify({ targetId, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

export function clearSelectedPage() {
  rmSync(SELECTED_PAGE_FILE, { force: true });
}

export async function resolveSelectedPage(cdp, options = {}) {
  const { fallback = "last" } = options;
  const pages = await cdp.getPages();
  if (pages.length === 0) {
    return { pages, page: null, selectedTargetId: null, fromSavedSelection: false };
  }

  const saved = readSelectedPageState();
  const selectedTargetId = saved?.targetId || null;
  let page = selectedTargetId
    ? pages.find((candidate) => candidate.targetId === selectedTargetId) || null
    : null;

  const fromSavedSelection = Boolean(page);
  if (!page) {
    page = fallback === "first" ? pages[0] : pages.at(-1);
  }

  if (page?.targetId) {
    writeSelectedPage(page.targetId);
  }

  return {
    pages,
    page,
    selectedTargetId: page?.targetId || null,
    fromSavedSelection,
  };
}
