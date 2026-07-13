const DOM_HELPERS_SOURCE = String.raw`
(() => {
  const root = window;
  if (root.__agentWeb) return root.__agentWeb;

  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const isVisible = (el) => {
    if (!(el instanceof Element)) return false;
    if (!el.isConnected) return false;
    if (el.closest("[hidden], [aria-hidden='true']")) return false;
    const style = root.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (style.opacity === "0") return false;
    if (style.pointerEvents === "none" && !(el instanceof HTMLInputElement)) return false;
    return el.getClientRects().length > 0;
  };

  const isInteractive = (el) => {
    if (!(el instanceof Element)) return false;
    if (el.matches("a[href], button, input, select, textarea, summary, option")) return true;
    if (el.matches("[contenteditable=''], [contenteditable='true'], [tabindex], [role]")) return true;
    if (el instanceof HTMLLabelElement && el.control) return true;
    return false;
  };

  const isSemantic = (el) => {
    if (!(el instanceof Element)) return false;
    if (el.matches("h1, h2, h3, h4, h5, h6, img, main, nav, header, footer, aside, section, article, form")) return true;
    const role = normalize(el.getAttribute("role")).toLowerCase();
    return Boolean(role && role !== "presentation" && role !== "none");
  };

  const getLabelText = (el) => {
    if (!(el instanceof Element)) return "";

    const ariaLabel = normalize(el.getAttribute("aria-label"));
    if (ariaLabel) return ariaLabel;

    const labelledBy = normalize(el.getAttribute("aria-labelledby"));
    if (labelledBy) {
      const text = labelledBy
        .split(/\s+/)
        .map((id) => normalize(document.getElementById(id)?.textContent || ""))
        .filter(Boolean)
        .join(" ");
      if (text) return text;
    }

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      const labels = Array.from(el.labels || [])
        .map((label) => normalize(label.textContent || ""))
        .filter(Boolean)
        .join(" ");
      if (labels) return labels;
    }

    if (el instanceof HTMLImageElement) {
      const alt = normalize(el.getAttribute("alt"));
      if (alt) return alt;
    }

    if (el instanceof HTMLInputElement && ["button", "submit", "reset"].includes(el.type)) {
      const value = normalize(el.value);
      if (value) return value;
    }

    const title = normalize(el.getAttribute("title"));
    if (title) return title;

    const placeholder = normalize(el.getAttribute("placeholder"));
    if (placeholder) return placeholder;

    return normalize(el.textContent || "");
  };

  const textPreview = (el) => normalize(el.textContent || "").slice(0, 140);

  const roleFor = (el) => {
    if (!(el instanceof Element)) return null;
    return normalize(el.getAttribute("role")) || null;
  };

  const typeFor = (el) => {
    if (el instanceof HTMLInputElement) return el.type || "text";
    return null;
  };

  const nodesById = new Map();
  let nextId = 1;

  const ensureUid = (el) => {
    if (!el.__agentWebId) {
      el.__agentWebId = "aw-" + nextId++;
    }
    nodesById.set(el.__agentWebId, el);
    return el.__agentWebId;
  };

  const describeElement = (el) => {
    const uid = ensureUid(el);
    const tag = el.tagName.toLowerCase();
    const role = roleFor(el);
    const type = typeFor(el);
    const name = getLabelText(el);
    const text = textPreview(el);
    const description = {
      uid,
      tag,
      role,
      type,
      name: name || null,
      text: text || null,
      placeholder: normalize(el.getAttribute("placeholder")) || null,
      href: el instanceof HTMLAnchorElement ? el.href || null : null,
      value:
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
          ? String(el.value ?? "")
          : null,
      disabled: "disabled" in el ? Boolean(el.disabled) : false,
      checked:
        el instanceof HTMLInputElement && ["checkbox", "radio"].includes((el.type || "").toLowerCase())
          ? Boolean(el.checked)
          : null,
      selected: el instanceof HTMLOptionElement ? Boolean(el.selected) : null,
    };
    return description;
  };

  const collectSnapshotElements = () => {
    const result = [];
    const seen = new Set();
    const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_ELEMENT);
    let current = walker.currentNode;

    while (current) {
      if (current instanceof Element && isVisible(current) && (isInteractive(current) || isSemantic(current))) {
        const uid = ensureUid(current);
        if (!seen.has(uid)) {
          seen.add(uid);
          result.push(describeElement(current));
        }
      }
      current = walker.nextNode();
    }

    return result;
  };

  const findByUid = (uid) => {
    if (!uid) return null;
    const fromMap = nodesById.get(uid);
    if (fromMap?.isConnected) return fromMap;

    const elements = document.querySelectorAll("*");
    for (const el of elements) {
      if (el.__agentWebId === uid) {
        nodesById.set(uid, el);
        return el;
      }
    }
    return null;
  };

  const emitInputEvents = (el) => {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const click = (uid) => {
    const el = findByUid(uid);
    if (!el) {
      throw new Error("No element found for uid " + uid + ". Take a fresh snapshot first.");
    }
    if (!isVisible(el)) {
      throw new Error("Element " + uid + " is not visible.");
    }
    el.scrollIntoView({ block: "center", inline: "center" });
    if (typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }
    if ("disabled" in el && el.disabled) {
      throw new Error("Element " + uid + " is disabled.");
    }
    el.click();
    return describeElement(el);
  };

  const fill = (uid, rawValue) => {
    const el = findByUid(uid);
    if (!el) {
      throw new Error("No element found for uid " + uid + ". Take a fresh snapshot first.");
    }
    if (!isVisible(el)) {
      throw new Error("Element " + uid + " is not visible.");
    }

    const value = String(rawValue ?? "");
    el.scrollIntoView({ block: "center", inline: "center" });
    if (typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }

    if (el instanceof HTMLSelectElement) {
      const normalizedValue = normalize(value).toLowerCase();
      const option = Array.from(el.options).find((candidate) => {
        const optionValue = normalize(candidate.value).toLowerCase();
        const optionLabel = normalize(candidate.textContent || candidate.label || "").toLowerCase();
        return optionValue === normalizedValue || optionLabel === normalizedValue;
      });
      if (!option) {
        throw new Error("No matching option for value " + value);
      }
      el.value = option.value;
      emitInputEvents(el);
      return describeElement(el);
    }

    if (el instanceof HTMLInputElement) {
      const type = (el.type || "text").toLowerCase();
      if (type === "file") {
        throw new Error("File inputs are not supported by fill().");
      }
      if (type === "checkbox") {
        el.checked = ["true", "1", "yes", "on", "checked"].includes(normalize(value).toLowerCase());
        emitInputEvents(el);
        return describeElement(el);
      }
      if (type === "radio") {
        const normalized = normalize(value).toLowerCase();
        if (normalized && normalized !== normalize(el.value).toLowerCase() && normalized !== "true") {
          throw new Error("Radio value " + value + " does not match input value " + el.value);
        }
        el.click();
        return describeElement(el);
      }
      el.value = value;
      emitInputEvents(el);
      return describeElement(el);
    }

    if (el instanceof HTMLTextAreaElement) {
      el.value = value;
      emitInputEvents(el);
      return describeElement(el);
    }

    if (el instanceof HTMLElement && el.isContentEditable) {
      el.textContent = value;
      emitInputEvents(el);
      return describeElement(el);
    }

    throw new Error("Element " + uid + " cannot be filled.");
  };

  const waitFor = async ({ uid = null, text = null, timeoutMs = 10000, intervalMs = 100 }) => {
    const texts = Array.isArray(text)
      ? text.map((value) => normalize(value).toLowerCase()).filter(Boolean)
      : [normalize(text).toLowerCase()].filter(Boolean);

    if (!uid && texts.length === 0) {
      throw new Error("waitFor requires either uid or text.");
    }

    const deadline = Date.now() + timeoutMs;
    while (Date.now() <= deadline) {
      if (uid) {
        const el = findByUid(uid);
        if (el && isVisible(el)) {
          return { ok: true, match: { type: "uid", value: uid }, element: describeElement(el) };
        }
      }

      if (texts.length > 0) {
        const bodyText = normalize(document.body?.innerText || document.documentElement?.innerText || "").toLowerCase();
        const matchedText = texts.find((value) => bodyText.includes(value));
        if (matchedText) {
          return { ok: true, match: { type: "text", value: matchedText } };
        }
      }

      await new Promise((resolve) => root.setTimeout(resolve, intervalMs));
    }

    return {
      ok: false,
      match: null,
      message: uid
        ? "Timed out waiting for element " + uid
        : "Timed out waiting for text: " + texts.join(", "),
    };
  };

  root.__agentWeb = {
    snapshot() {
      return {
        title: document.title,
        url: location.href,
        elements: collectSnapshotElements(),
      };
    },
    click,
    fill,
    waitFor,
    findByUid(uid) {
      const el = findByUid(uid);
      return el ? describeElement(el) : null;
    },
  };

  return root.__agentWeb;
})()
`;

export function buildDomExpression(invocationSource) {
  return `(() => { const agent = ${DOM_HELPERS_SOURCE}; return agent.${invocationSource}; })()`;
}
