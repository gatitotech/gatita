// i18n logic
const DEFAULT_LANG = "en";
const urlParams = new URLSearchParams(window.location.search);
const USER_LANG = urlParams.get("lan") || (navigator.language || navigator.userLanguage || DEFAULT_LANG).split("-")[0];
let translations = {};

async function loadLocalization() {
  try {
    const res = await fetch(`/locales/${USER_LANG}.json`);
    if (!res.ok) throw new Error("Locale not found");
    translations = await res.json();
  } catch (e) {
    try {
      const fallback = await fetch(`/locales/${DEFAULT_LANG}.json`);
      translations = await fallback.json();
    } catch (err) {
      console.warn("Failed to load localization:", err);
    }
  }
  applyLocalization();
}

function applyLocalization() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[key]) {
      el.textContent = translations[key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[key]) {
      el.setAttribute("placeholder", translations[key]);
    }
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (translations[key]) {
      el.setAttribute("title", translations[key]);
      el.setAttribute("aria-label", translations[key]);
    }
  });

  // Make available globally
  window.i18n = function (key) {
    return translations[key] || key;
  };
  
  // Dispatch an event
  document.dispatchEvent(new Event("i18nReady"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadLocalization);
} else {
  loadLocalization();
}
