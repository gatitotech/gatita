
(function () {
  "use strict";

  const STORAGE_PREFIX = "gatita_ask_";
  const LEGACY_STORAGE_PREFIX = ["cl4", "nkr_ask_"].join("");
  const API_BASE_OVERRIDE = (() => {
    try {
      const fromQuery = new URLSearchParams(window.location.search).get("api");
      if (fromQuery) {
        localStorage.setItem(`${STORAGE_PREFIX}api_base`, fromQuery);
        return fromQuery;
      }
      return (
        localStorage.getItem(`${STORAGE_PREFIX}api_base`) ||
        localStorage.getItem(`${LEGACY_STORAGE_PREFIX}api_base`) ||
        ""
      );
    } catch (_) {
      return "";
    }
  })();
  const API_BASE =
    window.GATITA_ASK_API_BASE ||
    window["CL4NKR_ASK_API_BASE"] ||
    API_BASE_OVERRIDE ||
    "https://api.gatita.tech";

  // Public OpenAI-compatible surface used for /v1/models.
  const PUBLIC_API_BASE =
    window.GATITA_PUBLIC_API_BASE || "https://api.gatita.tech/v1";

  const storageGet = (key) =>
    localStorage.getItem(`${STORAGE_PREFIX}${key}`) ??
    localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${key}`) ??
    "";
  const storageSet = (key, value) => {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
    localStorage.setItem(`${LEGACY_STORAGE_PREFIX}${key}`, value);
  };
  const storageRemove = (key) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    localStorage.removeItem(`${LEGACY_STORAGE_PREFIX}${key}`);
  };

  let authToken = storageGet("token");
  let currentUser = null;
  let currentTier = null;
  let keys = [];
  let charts = {};
  let revokeKeyId = null;
  let chartRange = 30;

  const TAB_CONFIG = {
    overview: { title: "Overview" },
    keys: { title: "API keys" },
    models: { title: "Models" },
    analytics: { title: "Analytics" },
    usage: { title: "Usage & limits" },
    plan: { title: "Plans" },
    status: { title: "Status" },
  };

  /* Tier limits are read from the API whenever possible; these are the
     fallbacks used before /tier responds. */
  const TIER_FALLBACKS = {
    free: {
      id: "free",
      name: "Free",
      dailyRequestLimit: 200,
      requestsPerMinute: 6,
      maxTokensPerRequest: 4096,
      research: false,
      deepResearch: false,
      agent: false,
      strikeBypass: false,
      sort_order: 0,
    },
    plus: {
      id: "plus",
      name: "Plus",
      dailyRequestLimit: 2000,
      requestsPerMinute: 30,
      maxTokensPerRequest: 8192,
      research: true,
      deepResearch: true,
      agent: true,
      strikeBypass: true,
      sort_order: 1,
    },
    pro: {
      id: "pro",
      name: "Pro",
      dailyRequestLimit: 10000,
      requestsPerMinute: 100,
      maxTokensPerRequest: 32768,
      research: true,
      deepResearch: true,
      agent: true,
      strikeBypass: true,
      sort_order: 2,
    },
  };

  const PLAN_MATRIX = [
    { label: "Requests / day", get: (t) => formatNumber(t.dailyRequestLimit) },
    { label: "Requests / min", get: (t) => formatNumber(t.requestsPerMinute) },
    {
      label: "Max tokens / request",
      get: (t) => formatNumber(t.maxTokensPerRequest),
    },
    {
      label: "Research",
      get: (t) => (t.research ? "check" : "x"),
    },
    {
      label: "Deep research",
      get: (t) => (t.deepResearch ? "check" : "x"),
    },
    { label: "Gatita Agent", get: (t) => (t.agent ? "check" : "x") },
    {
      label: "Strike bypass",
      get: (t) => (t.strikeBypass ? "check" : "x"),
    },
  ];

  const el = (id) => document.getElementById(id);
  const elements = {
    sidebarToggle: el("sidebarToggle"),
    pageScrim: el("pageScrim"),
    navItems: document.querySelectorAll(".page-nav-item[data-tab]"),
    pageTitle: el("pageTitle"),
    newKeyBtn: el("newKeyBtn"),
    createFirstKeyBtn: el("createFirstKeyBtn"),
    apiKeysList: el("apiKeysList"),
    noKeysState: el("noKeysState"),
    testKeyInput: el("testKeyInput"),
    testKeyButton: el("testKeyButton"),
    testKeyStatus: el("testKeyStatus"),
    testKeyStatusText: el("testKeyStatusText"),
    testedModelsList: el("testedModelsList"),
    usageMeters: el("usageMeters"),
    limitsList: el("limitsList"),
    planCards: el("planCards"),
    planComparisonBody: el("planComparisonBody"),
    contactUpgradeBtn: el("contactUpgradeBtn"),
    authGate: el("apiAuthGate"),
    authForm: el("apiAuthForm"),
    authEmail: el("apiAuthEmail"),
    authPassword: el("apiAuthPassword"),
    authError: el("apiAuthError"),
    authSubmit: el("apiAuthSubmit"),
    accountButton: el("accountButton"),
    accountPanel: el("accountPanel"),
    accountName: el("accountName"),
    accountTier: el("accountTier"),
    accountAvatar: el("accountAvatar"),
    accountPanelAvatar: el("accountPanelAvatar"),
    accountModalName: el("accountModalName"),
    accountModalEmail: el("accountModalEmail"),
    dockTier: el("dockTier"),
    dockKeyCount: el("dockKeyCount"),
    accountSignOutButton: el("accountSignOutButton"),
    dockNewKeyButton: el("dockNewKeyButton"),
    dockTestKeyButton: el("dockTestKeyButton"),
    dailyBreakdownBody: el("dailyBreakdownBody"),
    recentActivity: el("recentActivity"),
    createKeyModal: el("createKeyModal"),
    createKeyForm: el("createKeyForm"),
    createKeyModalClose: el("createKeyModalClose"),
    createKeyCancel: el("createKeyCancel"),
    showKeyModal: el("showKeyModal"),
    newApiKey: el("newApiKey"),
    copyKeyBtn: el("copyKeyBtn"),
    showKeyDone: el("showKeyDone"),
    revokeKeyModal: el("revokeKeyModal"),
    revokeKeyName: el("revokeKeyName"),
    revokeKeyCancel: el("revokeKeyCancel"),
    revokeKeyConfirm: el("revokeKeyConfirm"),
    toast: el("toast"),
  };

  /* ---------- helpers ---------- */
  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
  };

  const icons = () => window.iconRefresh?.() ?? window.lucide?.createIcons?.();

  const formatNumber = (num) => {
    const value = Number(num || 0);
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "K";
    return String(value);
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelative = (value) => {
    if (!value) return "—";
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return String(value);
    const diff = then - Date.now();
    const abs = Math.abs(diff);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (abs < minute) return "just now";
    if (abs < hour) return `${Math.round(abs / minute)}m`;
    if (abs < day) return `${Math.round(abs / hour)}h`;
    if (abs < 30 * day) return `${Math.round(abs / day)}d`;
    return formatDate(value);
  };

  const tierConfig = () => ({
    ...(TIER_FALLBACKS[currentTier] || TIER_FALLBACKS.free),
    ...(stateTier || {}),
  });

  let stateTier = null;

  const showToast = (message, tone = "info") => {
    const toast = elements.toast;
    if (!toast) return;
    toast.textContent = message;
    toast.style.borderColor =
      tone === "error"
        ? "rgba(255,107,107,.4)"
        : tone === "success"
          ? "rgba(62,207,142,.4)"
          : "";
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
  };

  /* ---------- api ---------- */
  async function apiFetch(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(json.error || json.message || "Request failed.");
      error.status = response.status;
      error.data = json;
      throw error;
    }
    return json;
  }

  /* The first load is what the splash screen waits on. If the API cannot be
     reached there is nothing to show, so boot fails loudly (loader.js turns it
     into the error sheet) instead of rendering an empty dashboard. Once boot is
     done, refreshes go back to degrading quietly. */
  let booting = true;

  const bootFailure = (error, fallback, essential) => {
    if (!booting) return fallback;
    const status = error && typeof error.status === "number" ? error.status : null;
    // Signed out is a state this page already renders (empty dashboard, gate).
    if (status === 401 || status === 403) return fallback;
    // No status at all means the API could not be reached; `essential` means
    // the dashboard has nothing to show without it.
    if (status === null || essential) throw error;
    return fallback;
  };

  /* ---------- auth ---------- */
  const showAuthGate = (message) => {
    const gate = elements.authGate;
    if (!gate) return;
    gate.classList.remove("hidden");
    document
      .querySelectorAll(".api-panel, .page-topbar-actions")
      .forEach((node) => node.classList.add("hidden"));
    if (message && elements.authError) elements.authError.textContent = message;
    // The settings panel only makes sense with an account, so it steps aside.
    elements.accountPanel?.remove();
    if (elements.accountName) elements.accountName.textContent = "Sign in";
    if (elements.accountTier) elements.accountTier.textContent = "";
    elements.accountButton?.setAttribute("aria-label", "Sign in to Gatita");
  };

  const submitApiAuth = async (event) => {
    event.preventDefault();
    if (elements.authError) elements.authError.textContent = "";
    if (elements.authSubmit) elements.authSubmit.disabled = true;
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: (elements.authEmail?.value || "").trim(),
          password: elements.authPassword?.value || "",
          displayName: "",
        }),
      });
      if (data.token) {
        authToken = data.token;
        storageSet("token", data.token);
        window.location.reload();
        return;
      }
      throw new Error("Sign-in did not return a session.");
    } catch (error) {
      if (elements.authError) {
        elements.authError.textContent = error.message || "Could not sign in.";
      }
      if (elements.authSubmit) elements.authSubmit.disabled = false;
    }
  };

  async function checkAuth() {
    try {
      const data = await apiFetch("/me");
      currentUser = data.user || null;
      currentTier = data.tier || currentTier;
      paintAccount();
      return true;
    } catch (error) {
      if (error.status === 401) {
        authToken = "";
        storageRemove("token");
        showAuthGate();
        return false;
      }
      // Not signed out — unreachable, or the API is broken. The boot loader
      // turns this into the error sheet rather than pretending the session is
      // gone and quietly dropping the user on a sign-in form.
      throw error;
    }
  }

  /* ---------- tabs ---------- */
  function currentTabFromHash() {
    const hash = (window.location.hash || "").replace("#", "");
    return TAB_CONFIG[hash] ? hash : "overview";
  }

  function switchTab(tab) {
    if (!TAB_CONFIG[tab]) tab = "overview";
    document.querySelectorAll(".api-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `tab-${tab}`);
    });
    elements.navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.tab === tab);
    });
    if (elements.pageTitle) elements.pageTitle.textContent = TAB_CONFIG[tab].title;
    if (window.history.replaceState) {
      window.history.replaceState(null, "", `#${tab}`);
    }
    if (window.innerWidth <= 980) closeSidebar();
    loadTabData(tab);
    icons();
  }

  async function loadTabData(tab) {
    try {
      if (tab === "keys") await loadApiKeys();
      if (tab === "analytics") renderAnalytics();
    } catch (error) {
      showToast(error.message || "That section could not load.", "error");
    }
  }

  /* ---------- sidebar (mobile) ---------- */
  const isCompact = () => window.innerWidth <= 980;
  function openSidebar() {
    document.body.classList.remove("sidebar-collapsed");
    elements.pageScrim?.classList.remove("hidden");
    elements.pageScrim?.classList.add("show");
  }
  function closeSidebar() {
    if (!isCompact()) return;
    document.body.classList.add("sidebar-collapsed");
    elements.pageScrim?.classList.remove("show");
    elements.pageScrim?.classList.add("hidden");
  }
  function syncSidebar() {
    if (isCompact()) closeSidebar();
    else {
      document.body.classList.remove("sidebar-collapsed");
      elements.pageScrim?.classList.add("hidden");
      elements.pageScrim?.classList.remove("show");
    }
  }

  /* ---------- overview ---------- */
  async function loadOverview() {
    const data = await apiFetch("/overview").catch((error) =>
      bootFailure(error, null, false),
    );
    if (!data) return;
    const usage = data.usage || {};
    el("statTotalKeys").textContent = formatNumber(keys.length);
    el("statTodayRequests").textContent = formatNumber(usage.today?.requests || 0);
    el("statTotalTokens").textContent = formatNumber(usage.month?.tokens || 0);
    el("statMinuteRequests").textContent = formatNumber(
      data.realtime?.currentMinute || usage.minute?.requests || 0,
    );
    renderRequestsChart(data.dailyStats || []);
    renderModelsChart(data.modelUsage || []);
    renderRecentActivity(data.dailyStats || []);
  }

  function renderRequestsChart(dailyStats) {
    const canvas = el("requestsChart");
    if (!canvas || !window.Chart) return;
    const rows = dailyStats.slice(-chartRange);
    const labels = rows.map((d) => d.date);
    const requests = rows.map((d) => d.requests ?? d.total_requests ?? 0);
    const tokens = rows.map((d) => d.tokens ?? d.total_tokens ?? 0);

    charts.requests?.destroy();
    charts.requests = new Chart(canvas, {
      data: {
        labels,
        datasets: [
          {
            type: "line",
            label: "Requests",
            data: requests,
            borderColor: "#ff6600",
            backgroundColor: "rgba(255,102,0,.12)",
            fill: true,
            tension: 0.32,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
          {
            type: "line",
            label: "Tokens",
            data: tokens,
            borderColor: "rgba(255,255,255,.34)",
            backgroundColor: "transparent",
            tension: 0.32,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 1.5,
            borderDash: [4, 4],
            yAxisID: "y1",
          },
        ],
      },
      options: chartOptions({
        y1: { position: "right", grid: { drawOnChartArea: false } },
      }),
    });
  }

  function renderModelsChart(modelUsage) {
    const canvas = el("modelsChart");
    if (!canvas || !window.Chart) return;
    const rows = modelUsage.slice(0, 6);
    charts.models?.destroy();
    if (rows.length === 0) {
      charts.models = new Chart(canvas, {
        type: "doughnut",
        data: { labels: [], datasets: [{ data: [] }] },
        options: chartOptions({ cutout: "68%", plugins: { legend: { display: false } } }),
      });
      return;
    }
    charts.models = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: rows.map((m) => m.model),
        datasets: [
          {
            data: rows.map((m) => m.requests ?? 0),
            backgroundColor: [
              "#ff6600",
              "#ff8c42",
              "#d95400",
              "#ffb27a",
              "#b34700",
              "#ffd0ad",
            ],
            borderWidth: 0,
          },
        ],
      },
      options: chartOptions({ cutout: "68%" }),
    });
  }

  function renderRecentActivity(dailyStats) {
    const body = elements.recentActivity;
    if (!body) return;
    const rows = dailyStats.slice(0, 7);
    if (rows.length === 0 || rows.every((d) => (d.requests ?? d.total_requests) === 0)) {
      body.innerHTML = `<tr><td colspan="4">No recent API activity</td></tr>`;
      return;
    }
    body.innerHTML = rows
      .map((day) => {
        const requests = day.requests ?? day.total_requests ?? 0;
        const tokens = day.tokens ?? day.total_tokens ?? 0;
        const successful = day.successful ?? day.successful_requests ?? 0;
        const total = day.total_requests ?? requests;
        const rate = total > 0 ? ((successful / total) * 100).toFixed(1) : "100";
        return `<tr>
          <td>${escapeHtml(formatDate(day.date))}</td>
          <td class="num">${formatNumber(requests)}</td>
          <td class="num">${formatNumber(tokens)}</td>
          <td class="num">${rate}%</td>
        </tr>`;
      })
      .join("");
  }

  /* ---------- analytics ---------- */
  function renderAnalytics() {
    apiFetch("/overview")
      .then((data) => {
        renderEndpointChart(data.endpointUsage || []);
        renderModelDetailChart(data.modelUsage || []);
        renderTokensChart(data.dailyStats || []);
        renderDailyBreakdown(data.dailyStats || []);
      })
      .catch(() => {});
  }

  function renderEndpointChart(endpointUsage) {
    const canvas = el("endpointsChart");
    if (!canvas || !window.Chart) return;
    charts.endpoints?.destroy();
    charts.endpoints = new Chart(canvas, {
      type: "bar",
      data: {
        labels: endpointUsage.map((e) => e.endpoint),
        datasets: [
          {
            label: "Requests",
            data: endpointUsage.map((e) => e.requests ?? 0),
            backgroundColor: "rgba(255,102,0,.75)",
            borderRadius: 6,
            borderWidth: 0,
          },
        ],
      },
      options: chartOptions({ indexAxis: "y" }),
    });
  }

  function renderModelDetailChart(modelUsage) {
    const canvas = el("modelsDetailChart");
    if (!canvas || !window.Chart) return;
    charts.modelsDetail?.destroy();
    charts.modelsDetail = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: modelUsage.map((m) => m.model),
        datasets: [
          {
            data: modelUsage.map((m) => m.requests ?? 0),
            backgroundColor: [
              "#ff6600",
              "#ff8c42",
              "#d95400",
              "#ffb27a",
              "#b34700",
              "#ffd0ad",
            ],
            borderWidth: 0,
          },
        ],
      },
      options: chartOptions({ cutout: "62%" }),
    });
  }

  function renderTokensChart(dailyStats) {
    const canvas = el("tokensChart");
    if (!canvas || !window.Chart) return;
    const rows = dailyStats.slice(-30);
    charts.tokens?.destroy();
    charts.tokens = new Chart(canvas, {
      type: "line",
      data: {
        labels: rows.map((d) => d.date),
        datasets: [
          {
            label: "Tokens",
            data: rows.map((d) => d.tokens ?? d.total_tokens ?? 0),
            borderColor: "#ff6600",
            backgroundColor: "rgba(255,102,0,.12)",
            fill: true,
            tension: 0.32,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
        ],
      },
      options: chartOptions(),
    });
  }

  function renderDailyBreakdown(dailyStats) {
    const body = elements.dailyBreakdownBody;
    if (!body) return;
    const rows = dailyStats.slice(0, 30);
    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="4">No data available</td></tr>`;
      return;
    }
    body.innerHTML = rows
      .map((day) => {
        const requests = day.total_requests ?? day.requests ?? 0;
        const tokens = day.total_tokens ?? day.tokens ?? 0;
        const successful = day.successful_requests ?? day.successful ?? 0;
        const rate = requests > 0 ? ((successful / requests) * 100).toFixed(1) : "100";
        return `<tr>
          <td>${escapeHtml(formatDate(day.date))}</td>
          <td class="num">${formatNumber(requests)}</td>
          <td class="num">${formatNumber(tokens)}</td>
          <td class="num">${rate}%</td>
        </tr>`;
      })
      .join("");
  }

  function chartOptions(extra = {}) {
    const scales = {
      x: {
        grid: { display: false },
        ticks: { color: "#6f6f6f", font: { size: 10 }, maxRotation: 0 },
      },
      y: {
        grid: { color: "rgba(255,255,255,.05)" },
        ticks: { color: "#6f6f6f", font: { size: 10 } },
        beginAtZero: true,
      },
    };
    if (extra.indexAxis === "y") {
      scales.x = { grid: { display: false }, ticks: { color: "#8a8a8a", font: { size: 11 } } };
      scales.y = {
        grid: { color: "rgba(255,255,255,.05)" },
        ticks: { color: "#6f6f6f", font: { size: 10 } },
        beginAtZero: true,
      };
    }
    const y1 = extra.y1;
    delete extra.y1;
    const indexAxis = extra.indexAxis;
    delete extra.indexAxis;
    const cutout = extra.cutout;
    delete extra.cutout;
    const legend = extra.plugins?.legend;
    delete extra.plugins;

    if (y1) scales.y1 = { ...y1, ticks: { color: "#6f6f6f", font: { size: 10 } }, beginAtZero: true };

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      cutout,
      plugins: {
        legend: {
          display: legend?.display !== false && Boolean(Object.keys(scales).length > 2),
          position: "bottom",
          labels: {
            color: "#8a8a8a",
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 6,
            padding: 14,
            font: { size: 11 },
          },
        },
        tooltip: {
          backgroundColor: "rgba(14,14,14,.97)",
          borderColor: "rgba(255,255,255,.12)",
          borderWidth: 1,
          titleColor: "#ececec",
          bodyColor: "#8a8a8a",
          padding: 11,
          displayColors: false,
          cornerRadius: 10,
        },
      },
      scales,
      ...extra,
    };
  }

  /* ---------- keys ---------- */
  async function loadApiKeys() {
    const data = await apiFetch("/keys").catch((error) =>
      bootFailure(error, { keys: [] }, true),
    );
    keys = data.keys || [];
    renderKeys();
    const stat = el("statTotalKeys");
    if (stat) stat.textContent = formatNumber(keys.length);
    paintAccount();
    return keys;
  }

  function renderKeys() {
    const list = elements.apiKeysList;
    const empty = elements.noKeysState;
    if (!list || !empty) return;

    if (keys.length === 0) {
      list.innerHTML = "";
      list.hidden = true;
      empty.hidden = false;
      return;
    }

    list.hidden = false;
    empty.hidden = true;
    list.innerHTML = keys
      .map((key) => {
        const revoked = Boolean(key.revoked_at);
        const expired = key.expires_at && new Date(key.expires_at).getTime() < Date.now();
        const statusPill = revoked
          ? '<span class="pill pill-danger">Revoked</span>'
          : expired
            ? '<span class="pill pill-danger">Expired</span>'
            : '<span class="pill pill-success">Active</span>';
        return `<article class="key-card">
          <div class="key-card-head">
            <div>
              <h3>${escapeHtml(key.name || "Untitled key")}</h3>
              <span class="key-prefix">${escapeHtml(key.key_prefix || "")}</span>
            </div>
            ${statusPill}
          </div>
          <div class="key-meta">
            <span><i data-lucide="calendar"></i>${escapeHtml(formatDate(key.created_at))}</span>
            <span><i data-lucide="clock"></i>${escapeHtml(formatRelative(key.last_used_at))}</span>
            ${
              key.expires_at
                ? `<span class="${expired ? "expired" : ""}"><i data-lucide="calendar-clock"></i>${escapeHtml(formatDate(key.expires_at))}</span>`
                : ""
            }
          </div>
          <div class="row">
            <button class="btn btn-sm" data-use-key-id="${escapeHtml(String(key.id))}" type="button">
              <i data-lucide="search"></i><span>Test</span>
            </button>
            <button class="btn btn-sm btn-danger" data-revoke-key-id="${escapeHtml(String(key.id))}" data-revoke-key-name="${escapeHtml(key.name || "")}" type="button" ${revoked ? "disabled" : ""}>
              <i data-lucide="trash-2"></i><span>Revoke</span>
            </button>
          </div>
        </article>`;
      })
      .join("");

    list.querySelectorAll("[data-revoke-key-id]").forEach((button) => {
      button.addEventListener("click", () =>
        openRevokeKey(
          Number(button.dataset.revokeKeyId),
          button.dataset.revokeKeyName || "",
        ),
      );
    });

    list.querySelectorAll("[data-use-key-id]").forEach((button) => {
      button.addEventListener("click", () => {
        // Keys are only ever stored hashed, so send the user to the docs
        // playground or ask them to paste the key they saved.
        switchTab("models");
        document.getElementById("testKeyInput")?.focus();
      });
    });

    icons();
  }

  /* ---------- key test via /v1/models ---------- */
  function setTesterStatus(text, tone = "") {
    const status = elements.testKeyStatus;
    const textEl = elements.testKeyStatusText;
    if (textEl) textEl.textContent = text;
    if (status) {
      status.classList.toggle("is-error", tone === "error");
      status.classList.toggle("is-ok", tone === "ok");
      const dot = status.querySelector(".pg-status-dot");
      if (dot) dot.className = `pg-status-dot ${tone === "error" ? "error" : tone === "ok" ? "success" : ""}`;
    }
  }

  async function testKey() {
    const key = (elements.testKeyInput?.value || "").trim();
    const output = elements.testedModelsList;
    if (!output) return;

    if (!key) {
      setTesterStatus("Enter an API key first.", "error");
      return;
    }

    elements.testKeyButton.disabled = true;
    setTesterStatus("Checking key against /v1/models…");
    output.innerHTML = "";

    try {
      const response = await fetch(`${PUBLIC_API_BASE}/models`, {
        headers: { Authorization: `Bearer ${key}` },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          (response.status === 401
            ? "That key was rejected. Check it was copied in full."
            : `Request failed with status ${response.status}.`);
        throw new Error(message);
      }

      const data = await response.json();
      const models = Array.isArray(data?.data) ? data.data : [];
      const ownedBy = new Set(
        models.map((model) => model?.owned_by).filter(Boolean),
      );

      setTesterStatus(
        models.length
          ? `${models.length} model${models.length === 1 ? "" : "s"} available to this key`
          : "This key returned no models.",
        models.length ? "ok" : "error",
      );

      output.innerHTML = models.length
        ? models
            .map(
              (model) => `<div class="model-result">
                <code>${escapeHtml(model.id || "")}</code>
                <span>${escapeHtml(model.owned_by || ownedBy.values().next().value || "")}</span>
              </div>`,
            )
            .join("")
        : "";
      icons();
    } catch (error) {
      setTesterStatus(error.message || "That key could not be checked.", "error");
    } finally {
      elements.testKeyButton.disabled = false;
    }
  }

  /* ---------- usage & limits ---------- */
  async function loadTier() {
    const data = await apiFetch("/tier").catch((error) =>
      bootFailure(error, null, false),
    );
    if (!data) return;
    currentTier = data.tier || currentTier;
    stateTier = data.tierConfig || null;
    renderTierStatus(data);
    renderUsage(data);
    renderPlans();
  }

  function renderTierStatus(data) {
    const strikeCount = Number(data.strikeCount || 0);
    const hasStrikes = Boolean(data.hasActiveStrikes);
    const bypass = Boolean(data.strikesBypass);
    const dot = el("statusDot");
    const statusText = el("statusText");
    const access = el("apiAccessStatus");

    const blocked = hasStrikes && !bypass;
    if (dot) dot.classList.toggle("blocked", blocked);
    if (statusText) statusText.textContent = blocked ? "Blocked" : "Active";
    if (access) {
      access.textContent = blocked ? "Blocked" : "Enabled";
      access.className = blocked ? "danger" : "success";
    }
    const count = el("strikeCount");
    if (count) count.textContent = String(strikeCount);
    const tierDisplay = el("currentTierDisplay");
    if (tierDisplay) tierDisplay.textContent = tierConfig().name;
    const bypassEl = el("strikeBypassStatus");
    if (bypassEl) {
      bypassEl.textContent = bypass ? "Enabled" : "Not available";
      bypassEl.className = bypass ? "success" : "warning";
    }
  }

  function renderUsage(data) {
    const tier = tierConfig();
    const realtime = data.realtime || {};
    const dailyUsed = Number(data.dailyUsed ?? realtime.dailyUsed ?? 0);
    const minuteUsed = Number(data.currentMinute ?? realtime.currentMinute ?? 0);

    const meters = [
      {
        title: "Daily requests",
        used: dailyUsed,
        max: Number(data.dailyLimit ?? tier.dailyRequestLimit),
        foot: "resets at midnight UTC",
      },
      {
        title: "Requests this minute",
        used: minuteUsed,
        max: Number(data.minuteLimit ?? tier.requestsPerMinute),
        foot: "resets every 60 seconds",
      },
      {
        title: "Max tokens / request",
        used: Number(data.tokenLimit ?? tier.maxTokensPerRequest),
        max: Number(data.tokenLimit ?? tier.maxTokensPerRequest),
        foot: "per request ceiling",
      },
    ];

    if (elements.usageMeters) {
      elements.usageMeters.innerHTML = meters
        .map((meter) => {
          const ratio = meter.max > 0 ? Math.min(meter.used / meter.max, 1) : 0;
          const tone = ratio >= 0.9 ? "danger" : ratio >= 0.7 ? "warn" : "";
          return `<div class="meter">
            <div class="meter-head">
              <h3>${escapeHtml(meter.title)}</h3>
              <span>${escapeHtml(formatNumber(meter.max))}</span>
            </div>
            <div class="meter-value">${escapeHtml(formatNumber(meter.used))}</div>
            <div class="meter-track">
              <div class="meter-fill ${tone}" style="width:${(ratio * 100).toFixed(1)}%"></div>
            </div>
            <div class="meter-foot">
              <span>${escapeHtml(meter.foot)}</span>
              <span>${escapeHtml(formatNumber(Math.max(0, meter.max - meter.used)))} left</span>
            </div>
          </div>`;
        })
        .join("");
    }

    if (elements.limitsList) {
      const rows = [
        ["Requests per day", formatNumber(tier.dailyRequestLimit)],
        ["Requests per minute", formatNumber(tier.requestsPerMinute)],
        ["Max tokens per request", formatNumber(tier.maxTokensPerRequest)],
        ["Research mode", tier.research ? "Included" : "Not included"],
        ["Deep research", tier.deepResearch ? "Included" : "Not included"],
        ["Gatita Agent", tier.agent ? "Included" : "Not included"],
      ];
      elements.limitsList.innerHTML = rows
        .map(
          ([label, value]) =>
            `<tr><td>${escapeHtml(label)}</td><td class="num">${escapeHtml(value)}</td></tr>`,
        )
        .join("");
    }
  }

  function renderPlans() {
    const currentId = currentTier || "free";
    const tiers = ["free", "plus", "pro"].map(
      (id) => ({ ...TIER_FALLBACKS[id], ...(id === currentId ? stateTier || {} : {}) }),
    );

    if (elements.planCards) {
      elements.planCards.innerHTML = tiers
        .map((tier) => {
          const isCurrent = tier.id === currentId;
          const isUpgrade = tier.sort_order > (TIER_FALLBACKS[currentId]?.sort_order ?? 0);
          const badge = isCurrent
            ? '<span class="pill pill-accent">Current</span>'
            : isUpgrade
              ? '<span class="pill">Upgrade</span>'
              : "";
          return `<article class="tier-card ${isCurrent ? "current" : ""} ${isUpgrade ? "upgrade" : ""}">
            <div class="tier-head"><h3>${escapeHtml(tier.name)}</h3>${badge}</div>
            <ul class="tier-features">
              <li><i data-lucide="check"></i>${escapeHtml(formatNumber(tier.dailyRequestLimit))} requests / day</li>
              <li><i data-lucide="check"></i>${escapeHtml(formatNumber(tier.requestsPerMinute))} requests / min</li>
              <li><i data-lucide="check"></i>${escapeHtml(formatNumber(tier.maxTokensPerRequest))} max tokens</li>
              ${tier.research ? '<li><i data-lucide="check"></i>Research mode</li>' : ""}
              ${tier.deepResearch ? '<li><i data-lucide="check"></i>Deep research</li>' : ""}
              ${tier.agent ? '<li><i data-lucide="check"></i>Gatita Agent</li>' : ""}
              ${tier.strikeBypass ? '<li><i data-lucide="check"></i>Strike bypass</li>' : ""}
            </ul>
            ${
              isCurrent
                ? '<button class="btn" disabled>Current plan</button>'
                : isUpgrade
                  ? `<button class="btn btn-primary" data-upgrade-tier="${escapeHtml(tier.id)}">Upgrade to ${escapeHtml(tier.name)}</button>`
                  : '<button class="btn" disabled>Not available</button>'
            }
          </article>`;
        })
        .join("");

      elements.planCards.querySelectorAll("[data-upgrade-tier]").forEach((button) => {
        button.addEventListener("click", () =>
          showToast(`Upgrades to ${button.dataset.upgradeTier} open on support.`),
        );
      });
    }

    if (elements.planComparisonBody) {
      elements.planComparisonBody.innerHTML = PLAN_MATRIX.map((row) => {
        const cell = (tier) => {
          const value = row.get(tier);
          return value === "check"
            ? '<i data-lucide="check" class="icon-yes"></i>'
            : value === "x"
              ? '<i data-lucide="x" class="icon-no"></i>'
              : escapeHtml(String(value));
        };
        return `<tr>
          <td>${escapeHtml(row.label)}</td>
          <td>${cell(tiers[0])}</td>
          <td>${cell(tiers[1])}</td>
          <td>${cell(tiers[2])}</td>
        </tr>`;
      }).join("");
    }

    icons();
  }

  /* ---------- account dock ---------- */
  const prefersReducedMotion = () =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const showPanel = (panel) => {
    if (!panel) return;
    window.clearTimeout(panel._hideTimer);
    panel.classList.remove("hidden", "is-closing");
  };
  const hidePanel = (panel) => {
    if (!panel || panel.classList.contains("hidden")) return;
    window.clearTimeout(panel._hideTimer);
    if (prefersReducedMotion()) {
      panel.classList.add("hidden");
      return;
    }
    panel.classList.add("is-closing");
    panel._hideTimer = window.setTimeout(() => {
      panel.classList.add("hidden");
      panel.classList.remove("is-closing");
    }, 190);
  };
  const isAccountPanelOpen = () =>
    Boolean(
      elements.accountPanel &&
      !elements.accountPanel.classList.contains("hidden") &&
      !elements.accountPanel.classList.contains("is-closing"),
    );
  const closeAccountPanel = () => {
    hidePanel(elements.accountPanel);
    elements.accountButton?.setAttribute("aria-expanded", "false");
  };
  const toggleAccountPanel = () => {
    if (isAccountPanelOpen()) {
      closeAccountPanel();
      return;
    }
    showPanel(elements.accountPanel);
    elements.accountButton?.setAttribute("aria-expanded", "true");
    icons();
  };

  const switchAccountTab = (tab) => {
    document.querySelectorAll("[data-account-tab]").forEach((button) => {
      button.classList.toggle("active", button.dataset.accountTab === tab);
    });
    document.querySelectorAll("[data-account-section]").forEach((section) => {
      const active = section.dataset.accountSection === tab;
      section.classList.toggle("active", active);
      if (active) section.scrollTop = 0;
    });
    const scroller = document.querySelector(".account-sections");
    if (scroller) scroller.scrollTop = 0;
    icons();
  };

  const paintAccount = () => {
    if (!currentUser) return;
    const name =
      currentUser.display_name || currentUser.displayName || currentUser.email || "Account";
    const initial = String(name).trim().charAt(0).toUpperCase() || "G";
    const tierName = tierConfig().name;

    [elements.accountName, elements.accountModalName].forEach((node) => {
      if (node) node.textContent = name;
    });
    if (elements.accountModalEmail) {
      elements.accountModalEmail.textContent = currentUser.email || "";
    }
    if (elements.accountTier) elements.accountTier.textContent = tierName;
    if (elements.dockTier) elements.dockTier.textContent = tierName;
    if (elements.dockKeyCount) {
      elements.dockKeyCount.textContent = formatNumber(keys.length);
    }

    [elements.accountAvatar, elements.accountPanelAvatar].forEach((node) => {
      if (node) node.textContent = initial;
    });

    elements.accountButton?.setAttribute(
      "aria-label",
      `Account: ${name}, ${tierName}`,
    );
  };

  async function signOut() {
    await apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    }).catch(() => {});
    authToken = "";
    storageRemove("token");
    window.location.href = "/index.html";
  }

  /* ---------- modals ---------- */
  const openModal = (node) => {
    if (!node) return;
    node.classList.remove("hidden", "is-closing");
    document.body.classList.add("is-locked");
  };
  const closeModal = (node) => {
    if (!node) return;
    node.classList.add("hidden");
    node.classList.remove("is-closing");
    if (
      [elements.createKeyModal, elements.showKeyModal, elements.revokeKeyModal].every(
        (m) => !m || m.classList.contains("hidden"),
      )
    ) {
      document.body.classList.remove("is-locked");
    }
  };

  function openCreateKeyModal() {
    openModal(elements.createKeyModal);
    setTimeout(() => el("keyName")?.focus(), 60);
  }
  function closeCreateKeyModal() {
    closeModal(elements.createKeyModal);
    elements.createKeyForm?.reset();
  }
  function openRevokeKey(keyId, keyName) {
    revokeKeyId = keyId;
    if (elements.revokeKeyName) {
      elements.revokeKeyName.textContent = keyName || "This key";
    }
    openModal(elements.revokeKeyModal);
  }
  function closeRevokeKeyModal() {
    closeModal(elements.revokeKeyModal);
    revokeKeyId = null;
  }

  async function handleCreateKey(event) {
    event.preventDefault();
    const name = (el("keyName")?.value || "").trim();
    const expiresInDays = Number(el("keyExpiry")?.value || 0);
    if (!name) {
      showToast("Key name is required.", "error");
      return;
    }
    try {
      const data = await apiFetch("/keys", {
        method: "POST",
        body: JSON.stringify({ name, expiresInDays }),
      });
      closeCreateKeyModal();
      const created = data.key?.key || "";
      if (elements.newApiKey) elements.newApiKey.textContent = created;
      openModal(elements.showKeyModal);
      await loadApiKeys();
    } catch (error) {
      showToast(error.message || "Could not create the key.", "error");
    }
  }

  async function confirmRevokeKey() {
    if (!revokeKeyId) return;
    try {
      await apiFetch(`/keys/${revokeKeyId}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      });
      closeRevokeKeyModal();
      await loadApiKeys();
      showToast("Key revoked.", "success");
    } catch (error) {
      showToast(error.message || "Could not revoke the key.", "error");
    }
  }

  async function copyApiKey() {
    const text = elements.newApiKey?.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      showToast("Key copied to clipboard.", "success");
      if (elements.copyKeyBtn) {
        elements.copyKeyBtn.innerHTML = '<i data-lucide="check"></i><span>Copied</span>';
        icons();
        setTimeout(() => {
          elements.copyKeyBtn.innerHTML = '<i data-lucide="copy"></i><span>Copy</span>';
          icons();
        }, 1800);
      }
    } catch (_) {
      showToast("Copy was blocked by the browser.", "error");
    }
  }

  /* ---------- realtime ---------- */
  async function pollRealtime() {
    const data = await apiFetch("/realtime").catch(() => null);
    if (!data) return;
    const minute = el("statMinuteRequests");
    if (minute) minute.textContent = formatNumber(data.currentMinute || 0);
  }

  /* ---------- events ---------- */
  function bindEvents() {
    elements.sidebarToggle?.addEventListener("click", () => {
      if (document.body.classList.contains("sidebar-collapsed")) openSidebar();
      else closeSidebar();
    });
    elements.pageScrim?.addEventListener("click", closeSidebar);

    elements.navItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();
        switchTab(item.dataset.tab);
      });
    });

    [elements.newKeyBtn, elements.createFirstKeyBtn].forEach((button) => {
      button?.addEventListener("click", openCreateKeyModal);
    });
    elements.createKeyModalClose?.addEventListener("click", closeCreateKeyModal);
    elements.createKeyCancel?.addEventListener("click", closeCreateKeyModal);
    elements.createKeyForm?.addEventListener("submit", handleCreateKey);

    elements.showKeyDone?.addEventListener("click", () => closeModal(elements.showKeyModal));
    elements.copyKeyBtn?.addEventListener("click", copyApiKey);

    elements.revokeKeyCancel?.addEventListener("click", closeRevokeKeyModal);
    elements.revokeKeyConfirm?.addEventListener("click", confirmRevokeKey);

    elements.accountButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleAccountPanel();
    });
    document.querySelector(".account-nav")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-account-tab]");
      if (button) switchAccountTab(button.dataset.accountTab);
    });
    elements.accountSignOutButton?.addEventListener("click", signOut);
    elements.dockNewKeyButton?.addEventListener("click", () => {
      closeAccountPanel();
      openCreateKeyModal();
    });
    elements.dockTestKeyButton?.addEventListener("click", () => {
      closeAccountPanel();
      switchTab("models");
      document.getElementById("testKeyInput")?.focus();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!isAccountPanelOpen()) return;
      const path = event.composedPath ? event.composedPath() : [];
      if (
        path.includes(elements.accountPanel) ||
        path.includes(elements.accountButton)
      ) {
        return;
      }
      closeAccountPanel();
    });

    elements.contactUpgradeBtn?.addEventListener("click", () =>
      window.open("https://discord.gg/gatita", "_blank", "noopener"),
    );

    elements.testKeyButton?.addEventListener("click", testKey);
    elements.testKeyInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        testKey();
      }
    });

    document.querySelectorAll(".chart-periods button").forEach((button) => {
      button.addEventListener("click", () => {
        document
          .querySelectorAll(".chart-periods button")
          .forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        chartRange = Number(button.dataset.period || 30);
        loadOverview();
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCreateKeyModal();
        closeModal(elements.showKeyModal);
        closeRevokeKeyModal();
      }
    });

    window.addEventListener("hashchange", () => switchTab(currentTabFromHash()));
    window.addEventListener("resize", syncSidebar);
  }

  /* ---------- boot ---------- */
  async function init() {
    bindEvents();
    syncSidebar();

    const boot = (async () => {
      const signedIn = await checkAuth();
      if (!signedIn) {
        // Sign in from here rather than bouncing to another page.
        elements.authForm?.addEventListener("submit", submitApiAuth);
        elements.accountButton?.addEventListener("click", () => {
          elements.authEmail?.focus();
        });
        icons();
        return;
      }

      await Promise.all([loadApiKeys(), loadTier()]);
      await loadOverview();
      switchTab(currentTabFromHash());
      icons();
      setInterval(pollRealtime, 8000);
    })();

    const settled = boot
      .catch((error) => {
        // Keep the shell usable behind the error sheet.
        switchTab(currentTabFromHash());
        icons();
        if (!window.Loader) {
          showToast(error.message || "The Gatita API could not be reached.", "error");
        }
      })
      .finally(() => {
        booting = false;
      });

    if (window.Loader) {
      // The splash screen holds until the dashboard's first round-trip lands.
      window.Loader.critical("dashboard", boot, "The Gatita API could not be reached.");
    }
    await settled;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
