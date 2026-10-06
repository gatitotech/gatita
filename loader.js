/**
 * Boot loader — one for every page.
 *
 * The splash is not a timer. It stays up until the page has really finished its
 * work: deferred scripts, the locale, the logo, and whatever the page registers
 * with Loader.critical() (the workspace boot on the chat page, the dashboard's
 * first API round-trip on the API page). Only then does the page reveal itself.
 *
 * If that work fails, or never finishes, the splash gives way to an error sheet
 * assembled from the same parts as the cookie and terms popups — with a retry
 * and a way to keep going in a limited state.
 *
 * There is no wordmark under the mark: it carries a travelling gradient
 * (styles.css: .preloader-sheen / .preloader-edge) instead of a ring.
 */
(function () {
  "use strict";

  var MIN_VISIBLE_MS = 520; // never flash the splash for a moment
  var HARD_TIMEOUT_MS = 12000; // but never hang on it either
  var LOCALE_TIMEOUT_MS = 6000;
  var ERROR_ID = "loadErrorModal";

  var GENERIC =
    "Something failed while this page was starting up, so it may look incomplete.";

  var startedAt = Date.now();
  var tasks = []; // {name, message, promise}
  var pending = 0;
  var revealed = false;
  var shown = false;

  /* ---------- helpers ---------- */
  var sleep = function (ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  };

  var failure = function (message, detail) {
    var error = new Error(message || GENERIC);
    error.isLoadError = true;
    error.detail = detail || "";
    return error;
  };

  var asLoadError = function (error) {
    if (error && error.isLoadError) return error;
    var detail = error && error.message ? String(error.message) : "";
    return failure("", detail);
  };

  var entryFailure = function (entry, error) {
    var detail = error && error.message ? String(error.message) : "";
    return failure(entry && entry.message, detail);
  };

  var whenReady = function () {
    if (document.readyState !== "loading") return Promise.resolve();
    return new Promise(function (resolve) {
      document.addEventListener("DOMContentLoaded", resolve, { once: true });
    });
  };

  var timeout = function (ms, message) {
    return new Promise(function (_resolve, reject) {
      window.setTimeout(
        function () {
          reject(failure(message, "gave up after " + ms + "ms"));
        },
        Math.max(1, ms),
      );
    });
  };

  // The locale matters, but English markup is already in the page: wait for it
  // without ever treating a slow or missing translation file as a failure.
  var waitForLocale = function () {
    if (window.__i18nDone) return Promise.resolve();
    if (!document.querySelector('script[src*="i18n.js"]')) return Promise.resolve();
    return new Promise(function (resolve) {
      var timer = 0;
      var done = function () {
        if (!window.__i18nDone) return;
        window.clearTimeout(timer);
        document.removeEventListener("i18nReady", done);
        resolve();
      };
      timer = window.setTimeout(function () {
        document.removeEventListener("i18nReady", done);
        resolve();
      }, LOCALE_TIMEOUT_MS);
      document.addEventListener("i18nReady", done);
      if (window.__i18nDone) done();
    });
  };

  // The mark is what the splash draws, so it has to be there.
  var whenLogoReady = function () {
    var img = document.querySelector(".preloader-logo img");
    if (!img) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      if (img.complete) {
        if (img.naturalWidth > 0) resolve();
        else reject(failure("The page assets failed to load.", "assets/avatar.webp"));
        return;
      }
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener(
        "error",
        function () {
          reject(failure("The page assets failed to load.", "assets/avatar.webp"));
        },
        { once: true },
      );
    });
  };

  /* ---------- task tracking ---------- */
  var settleTask = function (entry, error) {
    pending -= 1;
    // Registered after the page revealed itself: still worth telling the user.
    if (error && revealed) showError(entryFailure(entry, error));
  };

  var asFailure = function (entry) {
    return entry.promise.then(
      function (value) {
        return value;
      },
      function (error) {
        throw entryFailure(entry, error);
      },
    );
  };

  // Every registered task, plus anything that joins while we wait: page scripts
  // run right after this file, so a task can appear a tick later.
  var waitForTasks = function () {
    var drain = async function () {
      for (;;) {
        if (tasks.length) await Promise.all(tasks.map(asFailure));
        if (pending === 0) return;
      }
    };
    return drain();
  };

  /**
   * Register important async work for this page. The splash stays up until it
   * settles, and a rejection turns into the error sheet, described by `message`
   * (an English sentence, which the locale layer translates if it can).
   */
  var critical = function (name, promise, message) {
    var entry = {
      name: String(name || "task"),
      message: message || "",
      promise: Promise.resolve(promise),
    };
    tasks.push(entry);
    pending += 1;
    entry.promise.then(
      function () {
        settleTask(entry, null);
      },
      function (error) {
        settleTask(entry, error);
      },
    );
    return entry.promise;
  };

  /* ---------- reveal / error ---------- */
  var reveal = function () {
    if (revealed) return;
    revealed = true;
    var splash = document.getElementById("preloader");
    if (splash) splash.classList.add("preloader-done");
    if (document.body) document.body.classList.add("app-ready");
  };

  var dismissError = function () {
    var sheet = document.getElementById(ERROR_ID);
    if (sheet) sheet.remove();
    shown = false;
  };

  var refreshIcons = function () {
    if (window.iconRefresh) window.iconRefresh();
    else if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  };

  var buildErrorSheet = function () {
    // Pages without the icon kit (login, 404) get a glyph that always renders.
    var closeGlyph =
      window.lucide && window.lucide.createIcons
        ? '<i data-lucide="x"></i>'
        : '<span aria-hidden="true">&times;</span>';
    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop consent-backdrop";
    backdrop.id = ERROR_ID;
    backdrop.setAttribute("role", "alertdialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-labelledby", "loadErrorTitle");
    backdrop.innerHTML =
      '<section class="sheet">' +
      '<div class="sheet-head">' +
      '<h2 id="loadErrorTitle" data-i18n="Couldn\'t load this page">Couldn\'t load this page</h2>' +
      '<button class="icon-btn" type="button" data-load-dismiss aria-label="Close" data-i18n-title="account.close">' +
      closeGlyph +
      "</button>" +
      "</div>" +
      '<div class="consent-body">' +
      '<p class="load-error-message" id="loadErrorMessage"></p>' +
      '<div class="consent-note">' +
      '<strong data-i18n="Nothing was sent, changed, or lost.">Nothing was sent, changed, or lost.</strong>' +
      '<span data-i18n="Retrying usually clears this. Your chats, API keys, and settings are untouched.">' +
      "Retrying usually clears this. Your chats, API keys, and settings are untouched." +
      "</span>" +
      "</div>" +
      '<p class="load-error-detail" id="loadErrorDetail" hidden></p>' +
      '<div class="notification-actions">' +
      '<button class="btn btn-primary" type="button" data-load-retry data-i18n="Try again">Try again</button>' +
      '<button class="btn" type="button" data-load-dismiss data-i18n="Continue anyway">Continue anyway</button>' +
      "</div>" +
      "</div>" +
      "</section>";

    backdrop.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (target.closest("[data-load-retry]")) {
        window.location.reload();
        return;
      }
      if (target.closest("[data-load-dismiss]")) dismissError();
    });

    document.body.appendChild(backdrop);
    refreshIcons();
    return backdrop;
  };

  /** Surface a boot failure: splash down, error sheet up. */
  var showError = function (error) {
    var wrapped = asLoadError(error);
    reveal();
    var backdrop = document.getElementById(ERROR_ID) || buildErrorSheet();
    var message = document.getElementById("loadErrorMessage");
    var detail = document.getElementById("loadErrorDetail");
    if (message) {
      message.setAttribute("data-i18n", wrapped.message);
      message.textContent = wrapped.message;
    }
    if (detail) {
      detail.textContent = wrapped.detail || "";
      detail.hidden = !wrapped.detail;
    }
    if (window.applyLocalization) window.applyLocalization(backdrop);
    shown = true;
  };

  /* ---------- boot ---------- */
  var boot = async function () {
    var deadline = startedAt + HARD_TIMEOUT_MS;
    var slow = "This page took too long to load.";
    try {
      await whenReady();
      await Promise.race([
        waitForLocale(),
        timeout(LOCALE_TIMEOUT_MS, slow),
      ]);
      await whenLogoReady();
      await Promise.race([waitForTasks(), timeout(deadline - Date.now(), slow)]);
      var elapsed = Date.now() - startedAt;
      if (elapsed < MIN_VISIBLE_MS) await sleep(MIN_VISIBLE_MS - elapsed);
      // Page scripts can register a task while we hold the minimum on screen —
      // those still have to finish before the page reveals itself.
      await Promise.race([waitForTasks(), timeout(deadline - Date.now(), slow)]);
      reveal();
    } catch (error) {
      showError(error);
    }
  };

  window.Loader = {
    critical: critical,
    fail: function (message, detail) {
      showError(failure(message, detail));
    },
    hide: reveal,
    dismiss: dismissError,
    get busy() {
      return pending > 0;
    },
    get failed() {
      return shown;
    },
  };

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && shown) dismissError();
  });

  boot();
})();
