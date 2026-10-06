// Icon kit: the single place that turns <i data-lucide="..."> placeholders into
// real SVG icons. Loaded by every page, right after the (locally vendored)
// lucide bundle.
//
// Three things used to make icons flaky:
//   1. lucide came from an unpkg CDN — blocked, slow or offline meant every
//      icon stayed a 0x0 <i> with nothing to show.
//   2. rendering depended on each call site remembering to call createIcons,
//      so markup injected in one code path (streaming, toasts, panels) could
//      be missed.
//   3. createIcons re-renders *every* icon in the document on each call, which
//      restarts CSS animations on icons that were already on screen.
//
// This module fixes all three: it renders only the placeholders that are still
// pending, retries until the library is there, and watches the DOM so newly
// injected icons draw themselves.
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var issues = { missing: [], libraryMissing: false, rendered: 0 };
  var retryTimer = null;
  var retryBudget = 80; // ~20s of patience for a slow first paint
  var framePending = false;
  var observer = null;

  window.iconIssues = issues;

  var toPascal = function (name) {
    return String(name)
      .split(/[-_]/)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("");
  };

  var lookup = function (name) {
    var icons = window.lucide && window.lucide.icons;
    if (!icons) return null;
    if (icons[name]) return icons[name];
    var pascal = toPascal(name);
    return icons[pascal] || null;
  };

  /** Attributes every lucide glyph ships with. */
  var baseAttributes = function (name) {
    return {
      xmlns: SVG_NS,
      width: 24,
      height: 24,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "lucide lucide-" + name,
      "data-lucide": name,
    };
  };

  /** Replace one placeholder. Returns true when it became an <svg>. */
  var renderPlaceholder = function (el) {
    var name = el.getAttribute("data-lucide");
    if (!name) return false;

    var node = lookup(name);
    if (!node) {
      if (issues.missing.indexOf(name) === -1) {
        issues.missing.push(name);
        console.warn("[icons] no glyph named:", name);
      }
      // Leave a marker so tooling (tools/smoke.js) can spot it instantly.
      el.setAttribute("data-icon-missing", name);
      return false;
    }

    var attrs = baseAttributes(name);
    // Carry over the placeholder's own attributes: class hooks, aria labels,
    // titles — everything the page put on the <i>.
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if (attr.name === "data-icon-missing") continue;
      attrs[attr.name] = attr.value;
    }

    var svg;
    if (window.lucide.createElement) {
      svg = window.lucide.createElement(node, attrs);
    } else {
      // Very old builds: hand the whole document to lucide as a last resort.
      window.lucide.createIcons({ icons: window.lucide.icons });
      return !el.parentNode;
    }

    if (!svg) return false;
    if (!el.getAttribute("aria-hidden") && !el.getAttribute("aria-label")) {
      svg.setAttribute("aria-hidden", "true");
    }
    if (el.parentNode) el.parentNode.replaceChild(svg, el);
    issues.rendered += 1;
    return true;
  };

  /** Render every placeholder that is still waiting. Safe to call often. */
  var render = function () {
    framePending = false;
    var lib = window.lucide;
    if (!lib || !lib.icons || !lib.createElement) {
      issues.libraryMissing = true;
      scheduleRetry();
      return false;
    }
    issues.libraryMissing = false;

    var pending = document.querySelectorAll("i[data-lucide]");
    for (var i = 0; i < pending.length; i++) {
      renderPlaceholder(pending[i]);
    }
    return true;
  };

  var scheduleRetry = function () {
    if (retryTimer) return;
    if (retryBudget-- <= 0) return;
    retryTimer = setTimeout(function () {
      retryTimer = null;
      render();
    }, 250);
  };

  /** Batch refreshes to one per frame — icon draws are cheap, floods are not. */
  var schedule = function () {
    if (framePending) return;
    framePending = true;
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(render);
    } else {
      setTimeout(render, 16);
    }
  };

  // Anything the page injects later (streaming markdown, panels, toasts) gets
  // picked up without every call site remembering to refresh.
  var observe = function () {
    if (observer || typeof MutationObserver === "function") {
      observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var mutation = mutations[i];
          if (mutation.type === "attributes") {
            schedule();
            return;
          }
          var added = mutation.addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added[j];
            if (node.nodeType !== 1) continue;
            if (
              node.matches?.("i[data-lucide]") ||
              node.querySelector?.("i[data-lucide]")
            ) {
              schedule();
              return;
            }
          }
        }
      });
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["data-lucide"],
      });
    }
    render();
  };

  // Public surface. Existing code calls `iconRefresh()` — same contract.
  window.iconRefresh = render;
  window.iconRefresh.schedule = schedule;
  window.iconRefresh.issues = issues;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observe, { once: true });
  } else {
    observe();
  }
  // A late-arriving bundle still gets picked up.
  window.addEventListener("load", render, { once: true });
})();
