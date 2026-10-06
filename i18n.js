// Localization loader.
// Applies data-i18n / data-i18n-html / data-i18n-* attributes, then fires an
// `i18nReady` event so page scripts can re-render dynamic strings.
// Every page loads this; missing keys fall back to the markup's own English so
// nothing ever renders a raw key.
const DEFAULT_LANG = "en";
const SUPPORTED = ["en", "es", "fr", "de"];
const urlParams = new URLSearchParams(window.location.search);

const requested =
  urlParams.get("lan") ||
  urlParams.get("lang") ||
  (navigator.languages?.[0] || navigator.language || navigator.userLanguage || "")
    .split("-")[0]
    .toLowerCase();

const USER_LANG = SUPPORTED.includes(requested) ? requested : DEFAULT_LANG;

let translations = {};

// Locale files sit next to every page, so resolve them relative to this script
// rather than the site root (works from a subdirectory too).
const localeBase = new URL("locales/", document.currentScript?.src || location.href);

async function loadLocalization() {
  const tryLoad = async (lang) => {
    const res = await fetch(new URL(`${lang}.json`, localeBase), {
      cache: "no-cache",
    });
    if (!res.ok) throw new Error(`Locale ${lang} not found`);
    return res.json();
  };

  try {
    translations = await tryLoad(USER_LANG);
  } catch (e) {
    try {
      translations = await tryLoad(DEFAULT_LANG);
    } catch (err) {
      console.warn("Failed to load localization:", err);
      translations = {};
    }
  }
  // The boot loader (loader.js) waits on this flag: the page is only "really
  // loaded" once the locale has been fetched and applied.
  window.__i18nDone = true;
  applyLocalization();
}

// Keys that are really ids (`chat.newChat`) rather than English sentences.
const isSymbolicKey = (key) => /^[a-z][a-zA-Z0-9]*\.[a-zA-Z]/.test(String(key || ""));

/** Look up a key, optionally interpolating {placeholders}. */
function translate(key, vars) {
  let value = translations[key];
  if (value === undefined) {
    // Sentence keys are their own English text, so a locale that is behind (or
    // a page whose markup text was stripped) still reads as English instead of
    // rendering nothing. Real ids stay empty so callers can supply defaults.
    return isSymbolicKey(key) ? "" : String(key);
  }
  if (vars) {
    value = value.replace(/\{(\w+)\}/g, (match, name) =>
      vars[name] === undefined ? match : String(vars[name]),
    );
  }
  return value;
}

function applyLocalization(root = document) {
  // Text-only replacements keep nested markup (icons, <code>, links) intact.
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = translate(el.getAttribute("data-i18n"));
    if (value) el.textContent = value;
  });

  // For strings that legitimately contain markup.
  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const value = translate(el.getAttribute("data-i18n-html"));
    if (value) el.innerHTML = value;
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const value = translate(el.getAttribute("data-i18n-placeholder"));
    if (value) el.setAttribute("placeholder", value);
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const value = translate(el.getAttribute("data-i18n-aria-label"));
    if (value) el.setAttribute("aria-label", value);
  });

  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const value = translate(el.getAttribute("data-i18n-title"));
    if (!value) return;
    el.setAttribute("title", value);
    if (!el.getAttribute("data-i18n-aria-label")) {
      el.setAttribute("aria-label", value);
    }
  });

  document.documentElement.setAttribute("lang", USER_LANG);
  document.dispatchEvent(new Event("i18nReady"));
}

applyLocalization();

// Global lookup. Returns "" for a missing key so callers can fall back to their
// own English default rather than printing the key.
window.i18n = translate;
window.i18nLang = USER_LANG;
window.i18nSupported = SUPPORTED;
window.applyLocalization = applyLocalization;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadLocalization);
} else {
  loadLocalization();
}
