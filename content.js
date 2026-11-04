// RacistYT v2 - content script
// Works in Chrome, Edge, Brave, Opera (chrome.*) and Firefox (browser.*).
// This script never deletes YouTube's DOM. It sets data-attributes and CSS
// variables on <html>; black-theme.css does the actual styling and hiding.

const api = globalThis.browser ?? globalThis.chrome;
const root = document.documentElement;

const DEFAULTS = {
  enabled: true,
  font: "default",        // "default" | "system" | any installed/Google font name
  thumbDim: 85,           // thumbnail opacity, 30-100
  gridColumns: 0,         // 0 = YouTube default, otherwise 3-8
  accent: "",             // "" = no accent override, or a hex colour
  hideShorts: false,
  hideComments: false,
  hideRelated: false,
  hideEndCards: false,
  blockedSelectors: []
};

const FONT_STACKS = {
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
};

let settings = { ...DEFAULTS };
const FONT_LINK_ID = "rytt-font-link";
const BLOCK_STYLE_ID = "rytt-blocked-style";

// ---------- applying settings ----------

function setFlag(name, on) {
  if (on) root.setAttribute(name, "");
  else root.removeAttribute(name);
}

function applyFont(font) {
  document.getElementById(FONT_LINK_ID)?.remove();

  if (!font || font === "default") {
    root.style.removeProperty("--rytt-font");
    root.removeAttribute("data-rytt-font");
    return;
  }

  if (FONT_STACKS[font]) {
    root.style.setProperty("--rytt-font", FONT_STACKS[font]);
  } else {
    // Named font: load from Google Fonts if the page allows it, fall back to
    // an installed font of the same name, then to sans-serif.
    const safe = String(font).replace(/[^\w\s-]/g, "");
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${safe.replace(/ /g, "+")}:wght@400;500;700&display=swap`;
    (document.head || root).appendChild(link);
    root.style.setProperty("--rytt-font", `"${safe}", sans-serif`);
  }
  root.setAttribute("data-rytt-font", "");
}

function applyBlocked(selectors) {
  let style = document.getElementById(BLOCK_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = BLOCK_STYLE_ID;
    (document.head || root).appendChild(style);
  }
  // Validate each selector so one bad entry cannot break the rest.
  const valid = selectors.filter((s) => {
    try { document.querySelector(s); return true; } catch { return false; }
  });
  style.textContent = valid.map((s) => `${s}{display:none !important}`).join("\n");
}

function applyAll() {
  root.setAttribute("data-rytt", settings.enabled ? "on" : "off");

  root.style.setProperty("--rytt-thumb-opacity", String(settings.thumbDim / 100));

  if (settings.gridColumns >= 3) {
    root.style.setProperty("--rytt-cols", String(settings.gridColumns));
    root.setAttribute("data-rytt-cols", "");
  } else {
    root.style.removeProperty("--rytt-cols");
    root.removeAttribute("data-rytt-cols");
  }

  if (/^#[0-9a-f]{3,8}$/i.test(settings.accent)) {
    root.style.setProperty("--rytt-accent", settings.accent);
    root.setAttribute("data-rytt-accent", "");
  } else {
    root.style.removeProperty("--rytt-accent");
    root.removeAttribute("data-rytt-accent");
  }

  setFlag("data-rytt-hide-shorts", settings.hideShorts);
  setFlag("data-rytt-hide-comments", settings.hideComments);
  setFlag("data-rytt-hide-related", settings.hideRelated);
  setFlag("data-rytt-hide-endcards", settings.hideEndCards);

  applyFont(settings.enabled ? settings.font : "default");
  applyBlocked(settings.enabled ? settings.blockedSelectors : []);
}

// ---------- storage ----------

async function load() {
  const stored = await api.storage.sync.get(null);

  // Migrate settings from v1.x
  if (stored.selectedFont && stored.font === undefined) stored.font = stored.selectedFont;
  if (stored.shortsHidden !== undefined && stored.hideShorts === undefined) {
    stored.hideShorts = !!stored.shortsHidden;
  }

  settings = { ...DEFAULTS, ...stored };
  if (!Array.isArray(settings.blockedSelectors)) settings.blockedSelectors = [];
  applyAll();
}

api.storage.onChanged.addListener((_changes, area) => {
  if (area === "sync") load();
});

// Re-apply on YouTube's in-page navigation (it never does a full reload).
window.addEventListener("yt-navigate-finish", applyAll);

// <head> may not exist at document_start; re-apply injected nodes once it does.
document.addEventListener("DOMContentLoaded", applyAll, { once: true });

// ---------- element picker ----------

const PICK_TARGETS = [
  "ytd-rich-item-renderer", "ytd-rich-section-renderer", "ytd-rich-shelf-renderer",
  "ytd-video-renderer", "ytd-compact-video-renderer", "ytd-grid-video-renderer",
  "ytd-reel-shelf-renderer", "ytd-guide-entry-renderer", "ytd-mini-guide-entry-renderer",
  "ytd-comments", "ytd-merch-shelf-renderer", "ytd-playlist-panel-renderer",
  "yt-lockup-view-model", "ytd-masthead #buttons > *"
].join(",");

function buildSelector(el) {
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && node !== document.body && parts.length < 7) {
    const tag = node.tagName.toLowerCase();
    if (node.id && document.querySelectorAll(`#${CSS.escape(node.id)}`).length === 1) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const siblings = node.parentElement
      ? [...node.parentElement.children].filter((c) => c.tagName === node.tagName)
      : [];
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(node) + 1})` : tag);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

function startPicker() {
  if (document.getElementById("rytt-picker-bar")) return;

  const bar = document.createElement("div");
  bar.id = "rytt-picker-bar";
  bar.textContent = "RacistYT: click an element to hide it. Press Esc to cancel.";
  root.appendChild(bar);

  let hovered = null;
  const pick = (e) => e.target.closest?.(PICK_TARGETS) || e.target;

  const onOver = (e) => {
    hovered?.removeAttribute("data-rytt-picking");
    hovered = pick(e);
    hovered.setAttribute("data-rytt-picking", "");
  };

  const stop = () => {
    hovered?.removeAttribute("data-rytt-picking");
    bar.remove();
    document.removeEventListener("mouseover", onOver, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
  };

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selector = buildSelector(pick(e));
    stop();
    if (!selector) return;
    const { blockedSelectors = [] } = await api.storage.sync.get("blockedSelectors");
    if (!blockedSelectors.includes(selector)) {
      await api.storage.sync.set({ blockedSelectors: [...blockedSelectors, selector] });
    }
  };

  const onKey = (e) => { if (e.key === "Escape") stop(); };

  document.addEventListener("mouseover", onOver, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
}

api.runtime.onMessage.addListener((message) => {
  if (message?.action === "startPicker" || message?.action === "enablePicker") startPicker();
});

// ---------- boot ----------

root.setAttribute("data-rytt", "on"); // instant black before storage resolves
load();
