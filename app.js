const LEGACY_API_BASE_KEY = ["CL4", "NKR_ASK_API_BASE"].join("");
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
  window[LEGACY_API_BASE_KEY] ||
  API_BASE_OVERRIDE ||
  "https://api.clankr.tech/ask-api";
const LEGAL_VERSION = "2026-05-23";
const STREAM_RENDER_INTERVAL_MS = 40;
const NOTIFICATION_PROMPT_INTERVAL_MS = 30 * 60 * 1000;
const BROWSER_CHECK_YIELD_EVERY = 150;
const COMPACT_SHELL_QUERY = "(max-width: 980px)";
const COMPACT_SHELL_WIDTH = 980;
const VOICE_TURN_MIN_PAUSE_MS = 1200;
const VOICE_TURN_LONG_PAUSE_MS = 2800;
const VOICE_TURN_MAX_PAUSE_MS = 4200;
const VOICE_CAPTURE_SILENCE_MS = 1150;
const VOICE_CAPTURE_MIN_MS = 650;
const VOICE_CAPTURE_MAX_MS = 13000;
const VOICE_CAPTURE_RMS_THRESHOLD = 0.014;
// Defensively strip any legacy notebook tags from model output.
const NOTEBOOK_STRIP_RE =
  /<gatita-notebook\b[^>]*>[\s\S]*?(?:<\/gatita-notebook>|$)|<\/gatita-notebook>/gi;
const PROMPT_TEMPLATES = {
  coding:
    "Debug this code and explain the fix clearly. I will paste the code below:\n\n```\n// paste code here\n```",
  school:
    "Make me a study guide for this topic with key terms, examples, and a quick self-quiz: ",
  writing:
    "Rewrite this to be clearer, more natural, and more polished while keeping my meaning:\n\n",
  research:
    "Make a concise research brief with current context, important facts, and open questions. Topic: ",
  "research-compare":
    "Compare two sides of this topic fairly, list what evidence would settle the disagreement, and suggest reliable sources to check: ",
};

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
const getQueryParam = (key) => {
  try {
    return new URLSearchParams(window.location.search).get(key) || "";
  } catch (_) {
    return "";
  }
};
const getPostLoginRedirect = () => {
  const redirect = getQueryParam("redirect").trim();
  if (!redirect) return "";
  if (/^https?:\/\//i.test(redirect)) return "";
  return redirect.startsWith("/") ? redirect : `/${redirect}`;
};
const isLoginEntryPage = () => {
  return /\/login\.html$/i.test(window.location.pathname) || getQueryParam("login") === "1";
};
const getTosUrl = () => state.config?.tosUrl || "https://gatita.tech/legal";
const chatUrl = (chatId) => `#/chat/${chatId}`;
const sharedUrl = (token) => `#/share/${token}`;
const newChatUrl = () => "#/new";
const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const els = {
  chatList: document.getElementById("chatList"),
  chatSearchInput: document.getElementById("chatSearchInput"),
  messages: document.getElementById("messages"),
  emptyState: document.getElementById("emptyState"),
  welcomeText: document.getElementById("welcomeText"),
  messageScroll: document.getElementById("messageScroll"),
  scrollSentinel: document.getElementById("scrollSentinel"),
  composer: document.getElementById("composer"),
  messageInput: document.getElementById("messageInput"),
  fileInput: document.getElementById("fileInput"),
  attachButton: document.getElementById("attachButton"),
  attachmentRow: document.getElementById("attachmentRow"),
  sendButton: document.getElementById("sendButton"),
  blockedOverlay: document.getElementById("blockedOverlay"),
  newChatButton: document.getElementById("newChatButton"),
  settingsButton: document.getElementById("settingsButton"),
  settingsWrap: document.querySelector(".settings-wrap"),
  settingsMenu: document.getElementById("settingsMenu"),
  settingsModelName: document.getElementById("settingsModelName"),
  settingsSummary: document.getElementById("settingsSummary"),
  sidebarToggleButton: document.getElementById("sidebarToggleButton"),
  sidebarScrim: document.getElementById("sidebarScrim"),
  voiceCallButton: document.getElementById("voiceCallButton"),
  voiceModal: document.getElementById("voiceModal"),
  voiceCloseButton: document.getElementById("voiceCloseButton"),
  voiceMuteButton: document.getElementById("voiceMuteButton"),
  voiceEndButton: document.getElementById("voiceEndButton"),
  voiceStatus: document.getElementById("voiceStatus"),
  voiceSubstatus: document.getElementById("voiceSubstatus"),
  voiceTranscript: document.getElementById("voiceTranscript"),
  modelSelect: document.getElementById("modelSelect"),
  modelSelectButton: document.getElementById("modelSelectButton"),
  modelSelectValue: document.getElementById("modelSelectValue"),
  modelSelectMenu: document.getElementById("modelSelectMenu"),
  personalitySelect: document.getElementById("personalitySelect"),
  personalitySelectButton: document.getElementById("personalitySelectButton"),
  personalitySelectValue: document.getElementById("personalitySelectValue"),
  personalitySelectMenu: document.getElementById("personalitySelectMenu"),
  thinkingToggle: document.getElementById("thinkingToggle"),
  researchToggle: document.getElementById("researchToggle"),
  autoWebToggle: document.createElement("input"),
  deepResearchToggle: document.getElementById("deepResearchToggle"),
  agenticToggle: document.getElementById("agenticToggle"),
  updatesButton: document.getElementById("updatesButton"),
  updatesModal: document.getElementById("updatesModal"),
  closeUpdatesButton: document.getElementById("closeUpdatesButton"),
  updatesList: document.getElementById("updatesList"),
  updatesForm: document.getElementById("updatesForm"),
  updateTitleInput: document.getElementById("updateTitleInput"),
  updateContentInput: document.getElementById("updateContentInput"),
  updatesError: document.getElementById("updatesError"),
  usageText: document.getElementById("usageText"),
  accountName: document.getElementById("accountName"),
  accountButton: document.getElementById("accountButton"),
  accountModal: document.getElementById("accountModal"),
  closeAccountButton: document.getElementById("closeAccountButton"),
  accountModalName: document.getElementById("accountModalName"),
  accountModalEmail: document.getElementById("accountModalEmail"),
  accountMinuteLimit: document.getElementById("accountMinuteLimit"),
  accountDeepLimit: document.getElementById("accountDeepLimit"),
  notificationsToggle: document.getElementById("notificationsToggle"),
  accountSignOutButton: document.getElementById("accountSignOutButton"),
  passwordForm: document.getElementById("passwordForm"),
  currentPassword: document.getElementById("currentPassword"),
  newPassword: document.getElementById("newPassword"),
  passwordError: document.getElementById("passwordError"),
  deleteAccountForm: document.getElementById("deleteAccountForm"),
  deleteAccountPassword: document.getElementById("deleteAccountPassword"),
  deleteAccountError: document.getElementById("deleteAccountError"),
  accountDeletionStatus: document.getElementById("accountDeletionStatus"),
  notificationPromptModal: document.getElementById("notificationPromptModal"),
  notificationPromptCloseButton: document.getElementById(
    "notificationPromptCloseButton",
  ),
  notificationEnableButton: document.getElementById("notificationEnableButton"),
  notificationLaterButton: document.getElementById("notificationLaterButton"),
  legalGateModal: document.getElementById("legalGateModal"),
  legalAcceptCheckbox: document.getElementById("legalAcceptCheckbox"),
  legalAcceptButton: document.getElementById("legalAcceptButton"),
  strikeModal: document.getElementById("strikeModal"),
  strikeModalMessage: document.getElementById("strikeModalMessage"),
  strikeModalStatus: document.getElementById("strikeModalStatus"),
  strikeAcknowledgeButton: document.getElementById("strikeAcknowledgeButton"),
  banModal: document.getElementById("banModal"),
  banModalMessage: document.getElementById("banModalMessage"),
  banSignOutButton: document.getElementById("banSignOutButton"),
  cookieBanner: document.getElementById("cookieBanner"),
  cookieAcceptButton: document.getElementById("cookieAcceptButton"),
  authModal: document.getElementById("authModal"),
  closeAuthButton: document.getElementById("closeAuthButton"),
  authForm: document.getElementById("authForm"),
  authEmail: document.getElementById("authEmail"),
  authDisplayName: document.getElementById("authDisplayName"),
  authPassword: document.getElementById("authPassword"),
  authError: document.getElementById("authError"),
  toast: document.getElementById("toast"),
  browserCheckStatus: document.getElementById("browserCheckStatus"),
  authBrowserCheckStatus: document.getElementById("authBrowserCheckStatus"),
  templateTray: document.getElementById("templateTray"),
  actionModal: document.getElementById("actionModal"),
  actionModalForm: document.getElementById("actionModalForm"),
  actionModalTitle: document.getElementById("actionModalTitle"),
  actionModalMessage: document.getElementById("actionModalMessage"),
  actionModalInputWrap: document.getElementById("actionModalInputWrap"),
  actionModalInputLabel: document.getElementById("actionModalInputLabel"),
  actionModalInput: document.getElementById("actionModalInput"),
  actionModalTextareaWrap: document.getElementById("actionModalTextareaWrap"),
  actionModalTextareaLabel: document.getElementById("actionModalTextareaLabel"),
  actionModalTextarea: document.getElementById("actionModalTextarea"),
  actionModalError: document.getElementById("actionModalError"),
  actionModalSubmitButton: document.getElementById("actionModalSubmitButton"),
  actionModalCancelButton: document.getElementById("actionModalCancelButton"),
  actionModalCloseButton: document.getElementById("actionModalCloseButton"),
};

const state = {
  config: null,
  usage: null,
  chats: [],
  messages: [],
  activeChatId: null,
  activeSharedToken: "",
  temporaryMode: false,
  temporaryMessages: [],
  agenticChat: false,
  updates: [],
  chatSearch: "",
  editingMessageId: null,
  authToken: storageGet("token"),
  guestId: storageGet("guest_id"),
  user: null,
  accountStatus: null,
  pendingFiles: [],
  browserProof: null,
  browserCheckVerifiedUntil: 0,
  authBrowserProof: null,
  authMode: "login",
  composerDraftKey: "",
  actionModalResolve: null,
  actionModalOptions: null,
  openCustomSelect: "",
  activeStreams: new Map(),
  busy: false,
  voice: {
    active: false,
    muted: false,
    listening: false,
    thinking: false,
    speaking: false,
    pendingText: "",
    pendingInterim: "",
    history: [],
    recognition: null,
    inputMode: "auto",
    recognitionStartedAt: 0,
    recognitionFastEndCount: 0,
    recognitionHadResult: false,
    turnTimer: null,
    restartTimer: null,
    audio: null,
    audioUrl: "",
    requestedStop: false,
    fallbackNotified: false,
    captureStream: null,
    captureContext: null,
    captureSource: null,
    captureProcessor: null,
    captureChunks: [],
    captureRecording: false,
    captureStartedAt: 0,
    captureLastSpeechAt: 0,
    captureSampleRate: 0,
    captureBusy: false,
  },
};

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const showWithMotion = (element) => {
  if (!element) return;
  window.clearTimeout(element._motionHideTimer);
  element.classList.remove("hidden", "is-closing");
};

const hideWithMotion = (element, { duration = 190 } = {}) => {
  if (!element || element.classList.contains("hidden")) return;
  window.clearTimeout(element._motionHideTimer);
  if (prefersReducedMotion()) {
    element.classList.add("hidden");
    element.classList.remove("is-closing");
    return;
  }
  element.classList.add("is-closing");
  element._motionHideTimer = window.setTimeout(() => {
    element.classList.add("hidden");
    element.classList.remove("is-closing");
  }, duration);
};

const pulseElement = (element, className = "soft-feedback") => {
  if (!element || prefersReducedMotion()) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), 560);
};

const eventIncludesElement = (event, element) => {
  if (!element) return false;
  const path =
    typeof event.composedPath === "function" ? event.composedPath() : [];
  return path.includes(element) || element.contains(event.target);
};

const closeActionModal = (value = null) => {
  if (!state.actionModalResolve) {
    hideWithMotion(els.actionModal);
    return;
  }
  const resolve = state.actionModalResolve;
  state.actionModalResolve = null;
  state.actionModalOptions = null;
  hideWithMotion(els.actionModal);
  resolve(value);
};

const openActionModal = ({
  title = "Action",
  message = "",
  kind = "confirm",
  label = "Value",
  value = "",
  placeholder = "",
  confirmText = "Save",
  danger = false,
  required = false,
  maxLength = 0,
} = {}) =>
  new Promise((resolve) => {
    state.actionModalResolve = resolve;
    state.actionModalOptions = { kind, required };
    els.actionModalTitle.textContent = title;
    els.actionModalMessage.textContent = message;
    els.actionModalMessage.classList.toggle("hidden", !message);
    els.actionModalError.textContent = "";
    els.actionModalSubmitButton.textContent = confirmText;
    els.actionModalSubmitButton.classList.toggle(
      "danger-action",
      Boolean(danger),
    );

    const usesInput = kind === "input";
    const usesTextarea = kind === "textarea";
    els.actionModalInputWrap.classList.toggle("hidden", !usesInput);
    els.actionModalTextareaWrap.classList.toggle("hidden", !usesTextarea);
    els.actionModalInputLabel.textContent = label;
    els.actionModalTextareaLabel.textContent = label;
    els.actionModalInput.value = usesInput ? String(value || "") : "";
    els.actionModalTextarea.value = usesTextarea ? String(value || "") : "";
    els.actionModalInput.placeholder = placeholder;
    els.actionModalTextarea.placeholder = placeholder;
    els.actionModalInput.required = Boolean(required && usesInput);
    els.actionModalTextarea.required = Boolean(required && usesTextarea);
    els.actionModalInput.maxLength =
      usesInput && maxLength ? maxLength : 524288;
    els.actionModalTextarea.maxLength =
      usesTextarea && maxLength ? maxLength : 524288;

    showWithMotion(els.actionModal);
    iconRefresh();
    requestAnimationFrame(() => {
      if (usesTextarea) {
        els.actionModalTextarea.focus();
        els.actionModalTextarea.select();
      } else if (usesInput) {
        els.actionModalInput.focus();
        els.actionModalInput.select();
      } else {
        els.actionModalSubmitButton.focus();
      }
    });
  });

const submitActionModal = () => {
  const options = state.actionModalOptions || {};
  const field =
    options.kind === "textarea"
      ? els.actionModalTextarea
      : els.actionModalInput;
  if (options.kind === "input" || options.kind === "textarea") {
    const value = field.value.trim();
    if (options.required && !value) {
      els.actionModalError.textContent = "This field is required.";
      field.focus();
      return;
    }
    closeActionModal(value);
    return;
  }
  closeActionModal(true);
};

const chatStreamKey = (chatId) => `chat:${Number(chatId)}`;
const temporaryStreamKey = () => "temporary";

const streamTargetKey = (target) =>
  target?.isTemporary ? temporaryStreamKey() : chatStreamKey(target?.chatId);

const currentStreamKey = () => {
  if (state.temporaryMode) return temporaryStreamKey();
  if (state.activeChatId && !state.activeSharedToken)
    return chatStreamKey(state.activeChatId);
  return "";
};

const composerDraftKeyForCurrentView = () => {
  if (state.temporaryMode) return "composer_draft_temporary";
  if (state.activeChatId && !state.activeSharedToken)
    return `composer_draft_chat_${Number(state.activeChatId)}`;
  if (state.activeSharedToken)
    return `composer_draft_share_${state.activeSharedToken}`;
  return "composer_draft_new";
};

const saveComposerDraft = () => {
  if (!els.messageInput) return;
  if (!state.composerDraftKey) return;
  const key = state.composerDraftKey;
  const value = els.messageInput.value;
  if (value.trim()) {
    storageSet(key, value);
  } else {
    storageRemove(key);
  }
};

const loadComposerDraft = () => {
  if (!els.messageInput) return;
  state.composerDraftKey = composerDraftKeyForCurrentView();
  els.messageInput.value = storageGet(state.composerDraftKey);
  autoGrowInput();
};

const switchComposerDraft = () => {
  saveComposerDraft();
  loadComposerDraft();
};

const isCurrentViewStreaming = () =>
  state.activeStreams.has(currentStreamKey());

const isStreamTargetActive = (target) => {
  if (!target) return false;
  if (target.isTemporary) return state.temporaryMode;
  return (
    !state.temporaryMode &&
    !state.activeSharedToken &&
    Number(state.activeChatId) === Number(target.chatId)
  );
};

const setMessagesForStreamTarget = (target, messages) => {
  const key = streamTargetKey(target);
  const stream = state.activeStreams.get(key);
  if (stream) stream.messages = messages;
  if (target?.isTemporary) state.temporaryMessages = messages;
  if (isStreamTargetActive(target)) state.messages = messages;
};

const renderStreamTarget = (target) => {
  if (!isStreamTargetActive(target)) return;
  renderMessages();
};

const requestStopForStream = (stream) => {
  if (!stream || stream.target?.isTemporary) return;
  const assistant = [...(stream.messages || [])]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" &&
        message.id &&
        (message.streaming || message.loading),
    );
  if (!assistant?.id || !stream.target?.chatId) return;
  apiFetch(`/chats/${stream.target.chatId}/messages/${assistant.id}/stop`, {
    method: "POST",
    body: JSON.stringify({}),
  }).catch(() => {});
};

const stopStreamTarget = (target) => {
  const stream = state.activeStreams.get(streamTargetKey(target));
  if (!stream) return false;
  stream.stopped = true;
  requestStopForStream(stream);
  stream.controller?.abort();
  const assistant = [...(stream.messages || [])]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" && (message.streaming || message.loading),
    );
  if (assistant) {
    assistant.loading = false;
    assistant.streaming = false;
    assistant.queueing = false;
    assistant.content = getVisibleMessageContent(assistant) || "Stopped.";
  }
  setMessagesForStreamTarget(target, stream.messages || []);
  renderStreamTarget(target);
  return true;
};

const stopActiveGeneration = () => {
  const key = currentStreamKey();
  const stream = state.activeStreams.get(key);
  if (stream) {
    stopStreamTarget(stream.target);
    return;
  }
  for (const item of state.activeStreams.values()) {
    stopStreamTarget(item.target);
    return;
  }
};

const refreshBusyState = () => {
  state.busy = state.activeStreams.size > 0;
  els.messages?.classList.toggle("streaming-render", isCurrentViewStreaming());
  els.messageScroll?.classList.toggle(
    "streaming-scroll",
    isCurrentViewStreaming(),
  );
  els.sendButton.classList.toggle("is-stopping", state.busy);
  els.sendButton.querySelector("span").textContent = state.busy
    ? "Stop"
    : "Send";
  els.sendButton.disabled = false;
};

const replaceHashWithoutRouting = (hash) => {
  const next = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(null, "", next);
};

let nextMessageClientKey = 1;

const getMessageRenderKey = (message, index) => {
  if (message._clientKey) return message._clientKey;
  if (message.id)
    return `${message.role || message.type || "message"}:${message.id}`;
  if (!message._clientKey) {
    message._clientKey = `client:${nextMessageClientKey}:${index}`;
    nextMessageClientKey += 1;
  }
  return message._clientKey;
};

const isNearMessageBottom = (threshold = 160) => {
  if (!els.messageScroll) return true;
  const distanceFromBottom =
    els.messageScroll.scrollHeight -
    els.messageScroll.scrollTop -
    els.messageScroll.clientHeight;
  return distanceFromBottom < threshold;
};

const scrollMessagesToBottomNow = ({ smooth = false } = {}) => {
  if (!els.messageScroll) return;
  const top = Math.max(
    0,
    els.messageScroll.scrollHeight - els.messageScroll.clientHeight,
  );
  const canSmooth =
    smooth &&
    !state.busy &&
    !prefersReducedMotion() &&
    typeof els.messageScroll.scrollTo === "function";
  if (canSmooth) {
    els.messageScroll.scrollTo({ top, behavior: "smooth" });
    return;
  }
  els.messageScroll.scrollTop = top;
};

const queueBottomLock = ({ smooth = false } = {}) => {
  if (queueBottomLock.frame) cancelAnimationFrame(queueBottomLock.frame);
  if (queueBottomLock.secondFrame)
    cancelAnimationFrame(queueBottomLock.secondFrame);

  scrollMessagesToBottomNow({ smooth });
  queueBottomLock.frame = requestAnimationFrame(() => {
    scrollMessagesToBottomNow({ smooth });
    queueBottomLock.secondFrame = requestAnimationFrame(() => {
      scrollMessagesToBottomNow({ smooth });
      queueBottomLock.frame = null;
      queueBottomLock.secondFrame = null;
    });
  });
};

const getMessageElement = (message) => {
  if (message._messageEl?.isConnected) return message._messageEl;
  const renderKey = getMessageRenderKey(message, 0);
  message._messageEl =
    Array.from(els.messages.querySelectorAll("[data-render-key]")).find(
      (element) => element.dataset.renderKey === renderKey,
    ) || null;
  return message._messageEl;
};

const updateStreamingMessageContent = (message) => {
  const messageElement = getMessageElement(message);
  const streamBody = messageElement?.querySelector(".stream-plain");
  if (!streamBody) return false;

  streamBody.textContent = getVisibleMessageContent(message);
  if (state.busy || isNearMessageBottom()) queueBottomLock();
  return true;
};

const makeGuestId = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

const ensureGuestId = () => {
  if (state.guestId) return;
  state.guestId = makeGuestId();
  storageSet("guest_id", state.guestId);
};

const setRequiredCookieAck = () => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `gatita_required_cookies=${LEGAL_VERSION}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
};

const hasLegalAcceptance = () =>
  storageGet("legal_accept_version") === LEGAL_VERSION;
const hasCookieAcknowledgement = () =>
  storageGet("required_cookies_version") === LEGAL_VERSION ||
  document.cookie
    .split(";")
    .some(
      (cookie) => cookie.trim() === `gatita_required_cookies=${LEGAL_VERSION}`,
    );

const lockForConsent = () => {
  document.body.classList.add("consent-locked");
};

const unlockConsent = () => {
  document.body.classList.remove("consent-locked");
};

const acceptRequiredLegal = () => {
  storageSet("legal_accept_version", LEGAL_VERSION);
  storageSet("required_cookies_version", LEGAL_VERSION);
  setRequiredCookieAck();
  hideWithMotion(els.legalGateModal);
  unlockConsent();
  initializeApp().catch((error) => {
    showToast(error.message || "Ask could not load.");
    renderChats();
    renderMessages();
  });
};

const showCookieBannerIfNeeded = () => {
  if (hasCookieAcknowledgement()) return;
  showWithMotion(els.cookieBanner);
};

const iconRefresh = () => {
  if (window.lucide?.createIcons) window.lucide.createIcons();
};

const loadMathJax = () =>
  new Promise((resolve) => {
    if (window.MathJax?.typesetPromise) return resolve();
    const existing = document.querySelector("script[data-mathjax]");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
    script.defer = true;
    script.dataset.mathjax = "true";
    script.addEventListener("load", resolve, { once: true });
    document.head.appendChild(script);
  });

const queueMathTypeset = () => {
  if (isCurrentViewStreaming()) return;
  const hasMath = state.messages.some(
    (message) =>
      message.role === "assistant" &&
      /(\$\$|\\\(|\\\[|\$[^$\n]{1,160}\$)/.test(
        getVisibleMessageContent(message),
      ),
  );
  if (!hasMath) return;
  const shouldStickToBottom = isNearMessageBottom(220);
  clearTimeout(queueMathTypeset.timer);
  queueMathTypeset.timer = setTimeout(async () => {
    await loadMathJax();
    window.MathJax.typesetPromise([els.messages])
      .then(() => {
        if (shouldStickToBottom) queueBottomLock({ smooth: true });
      })
      .catch(() => {});
  }, 160);
};

const showToast = (message) => {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 3200);
};

const supportsNotifications = () =>
  Boolean(window.Notification) && window.isSecureContext;

const getNotificationPermission = () => {
  if (!supportsNotifications()) return "unsupported";
  return window.Notification.permission;
};

const notificationsEnabled = () =>
  storageGet("notifications_enabled") === "1" &&
  getNotificationPermission() === "granted";

const setNotificationsEnabled = (enabled) => {
  storageSet("notifications_enabled", enabled ? "1" : "0");
  updateNotificationUi();
};

const updateNotificationUi = () => {
  if (!els.notificationsToggle) return;
  const permission = getNotificationPermission();
  const unavailable = permission === "unsupported" || permission === "denied";
  const wrapper = els.notificationsToggle.closest(".account-toggle");
  const helper = wrapper?.querySelector("small");

  els.notificationsToggle.checked = notificationsEnabled();
  els.notificationsToggle.disabled = unavailable;
  wrapper?.classList.toggle("disabled", unavailable);

  if (!helper) return;
  if (permission === "denied") {
    helper.textContent = "Notifications are blocked in this browser.";
  } else if (permission === "unsupported") {
    helper.textContent = "Notifications need a supported secure browser.";
  } else if (notificationsEnabled()) {
    helper.textContent = "On. Gatita can notify you when a response finishes.";
  } else {
    helper.textContent =
      "Get a browser notification when Gatita finishes answering.";
  }
};

const markNotificationPrompted = () => {
  storageSet("notifications_prompted_at", String(Date.now()));
};

const shouldPromptNotifications = () => {
  if (!supportsNotifications()) return false;
  if (getNotificationPermission() !== "default") return false;
  if (notificationsEnabled()) return false;
  const promptedAt = Number(storageGet("notifications_prompted_at") || 0);
  return (
    !promptedAt || Date.now() - promptedAt >= NOTIFICATION_PROMPT_INTERVAL_MS
  );
};

const closeNotificationPrompt = ({ remember = true } = {}) => {
  if (remember) markNotificationPrompted();
  hideWithMotion(els.notificationPromptModal);
  updateNotificationUi();
};

const showNotificationPrompt = ({ force = false } = {}) => {
  const permission = getNotificationPermission();
  if (permission === "granted") {
    if (force) setNotificationsEnabled(true);
    return false;
  }
  if (permission === "denied" || permission === "unsupported") {
    setNotificationsEnabled(false);
    return false;
  }
  if (!force && !shouldPromptNotifications()) return false;

  markNotificationPrompted();
  showWithMotion(els.notificationPromptModal);
  iconRefresh();
  return true;
};

const requestNotificationPermission = async () => {
  if (!supportsNotifications()) {
    setNotificationsEnabled(false);
    showToast("Browser notifications are not available here.");
    closeNotificationPrompt({ remember: false });
    return;
  }

  let permission = getNotificationPermission();
  if (permission === "default") {
    permission = await window.Notification.requestPermission();
  }

  setNotificationsEnabled(permission === "granted");
  closeNotificationPrompt({ remember: false });
  if (permission !== "granted") {
    showToast(
      permission === "denied"
        ? "Notifications are blocked in this browser."
        : "Notifications were left off.",
    );
  }
};

const notifyGenerationDone = (target, message) => {
  if (!notificationsEnabled()) return;
  const userIsWatchingResponse =
    document.visibilityState === "visible" &&
    document.hasFocus() &&
    isStreamTargetActive(target);
  if (userIsWatchingResponse) return;

  const body =
    getVisibleMessageContent(message)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140) || "Your answer is ready.";

  try {
    new window.Notification("Gatita Ask is done", {
      body,
      icon: "assets/avatar.webp",
      tag: target?.isTemporary
        ? "gatita-ask-temporary"
        : `gatita-ask-chat-${target?.chatId || "current"}`,
    });
  } catch (_) {}
};

const apiFetch = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    "X-Ask-Guest-Id": state.guestId,
    ...(options.headers || {}),
  };

  if (state.authToken) headers.Authorization = `Bearer ${state.authToken}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(json.error || "Request failed.");
    error.status = response.status;
    error.data = json;
    throw error;
  }

  return json;
};

const createApiHeaders = (extra = {}) => {
  const headers = {
    "Content-Type": "application/json",
    "X-Ask-Guest-Id": state.guestId,
    ...extra,
  };
  if (state.authToken) headers.Authorization = `Bearer ${state.authToken}`;
  return headers;
};

const parseSseChunk = (buffer, onEvent) => {
  const events = buffer.split("\n\n");
  const rest = events.pop() || "";

  for (const rawEvent of events) {
    const lines = rawEvent.split("\n");
    let eventName = "message";
    const dataLines = [];

    for (const line of lines) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }

    if (dataLines.length === 0) continue;
    let payload = {};
    try {
      payload = JSON.parse(dataLines.join("\n"));
    } catch (_) {}
    onEvent(eventName, payload);
  }

  return rest;
};

const streamApi = async (path, payload, onEvent, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: createApiHeaders({ Accept: "text/event-stream" }),
    body: JSON.stringify(payload),
    signal: options.signal,
    credentials: "include",
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const error = new Error(json.error || "Request failed.");
    error.status = response.status;
    error.data = json;
    throw error;
  }

  if (!response.body) {
    throw new Error("Streaming is not supported by this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = parseSseChunk(buffer, onEvent);
  }

  buffer += decoder.decode();
  if (buffer.trim()) parseSseChunk(`${buffer}\n\n`, onEvent);
};

const updateUsage = (usage) => {
  if (!usage) return;
  state.usage = usage;
  if (state.user) {
    els.usageText.textContent = "Free";
  } else if (usage.dailyLimit) {
    els.usageText.textContent = `${usage.dailyRemaining}/${usage.dailyLimit} guest messages left`;
  } else {
    els.usageText.textContent = "Guest";
  }
  renderAccountWindow();
};

const formatDuration = (ms) => {
  const minutes = Math.max(1, Math.ceil(Number(ms || 0) / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
};

const greetingForUser = () => {
  const displayName =
    state.user?.displayName || state.user?.email?.split("@")[0] || (window.i18n ? window.i18n("welcome.there") : "there");
  const hour = new Date().getHours();
  const dayPart = hour < 12 ? (window.i18n ? window.i18n("welcome.morning") : "morning") : hour < 17 ? (window.i18n ? window.i18n("welcome.afternoon") : "afternoon") : (window.i18n ? window.i18n("welcome.evening") : "evening");
  
  let greetings = [];
  if (window.i18n && window.i18n("welcome.g1") !== "welcome.g1") {
    greetings = [
      window.i18n("welcome.g1").replace("{dayPart}", dayPart).replace("{name}", displayName),
      window.i18n("welcome.g2").replace("{name}", displayName),
      window.i18n("welcome.g3"),
      window.i18n("welcome.g4"),
      window.i18n("welcome.g5")
    ];
  } else {
    // English Fallback
    greetings = [
      `Good ${dayPart}, ${displayName}`,
      `What will we work on today, ${displayName}?`,
      "What are we making better today?",
      "Ready when you are.",
      "Bring me the messy idea.",
    ];
  }
  
  const seed =
    Math.floor(Date.now() / (1000 * 60 * 30)) + String(displayName).length;
  return greetings[seed % greetings.length];
};

const updateWelcomeText = () => {
  if (!els.welcomeText) return;
  els.welcomeText.textContent = state.user
    ? greetingForUser()
    : "What can I help with?";
};

const updateChatBlockedOverlay = () => {
  if (!els.blockedOverlay) return;
  const status = state.accountStatus || {};
  const blockedMs = Number(status.chatBlockedUntil || 0) - Date.now();
  const locked = Boolean(status.banned) || blockedMs > 0;
  els.blockedOverlay.classList.toggle("hidden", !locked);
  els.composer.classList.toggle("is-blocked", locked);
  els.messageInput.disabled = locked;
  els.attachButton.disabled = locked;
  if (!state.busy) els.sendButton.disabled = locked;
  const label = status.banned
    ? "This account is permanently banned"
    : `Chat access paused for ${formatDuration(blockedMs)}`;
  els.blockedOverlay.querySelector("span").textContent = label;
};

const updateAccountStatus = (status) => {
  state.accountStatus = status || null;
  updateChatBlockedOverlay();
  if (!state.user || !state.accountStatus) {
    hideWithMotion(els.strikeModal);
    hideWithMotion(els.banModal);
    return;
  }

  if (state.accountStatus.banned) {
    els.banModalMessage.textContent = state.accountStatus.banReason
      ? `This account is permanently banned from Gatita Ask. ${state.accountStatus.banReason}`
      : "This account is permanently banned from Gatita Ask.";
    hideWithMotion(els.strikeModal);
    showWithMotion(els.banModal);
    return;
  }

  hideWithMotion(els.banModal);
  if (state.accountStatus.strikeAckRequired) {
    const strikes = Number(state.accountStatus.strikes || 0);
    const blockedMs = Number(state.accountStatus.chatBlockedRemainingMs || 0);
    els.strikeModalMessage.textContent =
      "Your account has a strike for attempting to bypass Gatita Ask safety controls.";
    els.strikeModalStatus.textContent =
      blockedMs > 0
        ? `Strike ${strikes}. Chat access is paused for about ${formatDuration(blockedMs)}.`
        : `Strike ${strikes}. Future strikes may pause chat access or permanently ban the account.`;
    showWithMotion(els.strikeModal);
  } else {
    hideWithMotion(els.strikeModal);
  }
};

const renderAccountWindow = () => {
  if (!els.accountModalName) return;
  const usage = state.usage || {};
  const minuteRemaining =
    usage.minuteRemaining ?? state.config?.limits?.perMinute ?? "-";
  const minuteLimit =
    usage.minuteLimit ?? state.config?.limits?.perMinute ?? "-";
  const deep = usage.research?.deep || {};
  const deepRemaining =
    deep.dailyRemaining ?? state.config?.limits?.deepResearchDaily ?? "-";
  const deepLimit =
    deep.dailyLimit ?? state.config?.limits?.deepResearchDaily ?? "-";

  els.accountModalName.textContent =
    state.user?.displayName || state.user?.email || "Guest";
  els.accountModalEmail.textContent = state.user?.email || "Signed out";
  els.accountMinuteLimit.textContent = `${minuteRemaining}/${minuteLimit} left this minute`;
  els.accountDeepLimit.textContent = state.user
    ? `${deepRemaining}/${deepLimit} left today`
    : "Sign in required";
  const deletionScheduledAt = Number(state.user?.deletionScheduledAt || 0);
  if (els.accountDeletionStatus) {
    els.accountDeletionStatus.classList.toggle("hidden", !deletionScheduledAt);
    els.accountDeletionStatus.textContent = deletionScheduledAt
      ? `Deletion scheduled for ${formatAccountDeletionTime(deletionScheduledAt)}. Sign in before then to cancel it.`
      : "";
  }
  updateNotificationUi();
};

const updateAccount = () => {
  const setGuestLockedToggle = (input, locked) => {
    input.disabled = locked;
    input.closest(".thinking-toggle")?.classList.toggle("disabled", locked);
  };

  updateWelcomeText();
  updateChatBlockedOverlay();

  if (state.user) {
    els.accountName.textContent =
      state.user.displayName || state.user.email || "Account";
    setAvatar(state.user.email, state.user.displayName || state.user.email);
    // els.accountButton.textContent = 'Account';
    setGuestLockedToggle(els.thinkingToggle, false);
    setGuestLockedToggle(els.researchToggle, false);
    setGuestLockedToggle(els.autoWebToggle, false);
    setGuestLockedToggle(els.deepResearchToggle, false);
    setGuestLockedToggle(els.agenticToggle, false);
  } else {
    els.accountName.textContent = "Guest";
    setAvatar(null, "Guest");
    // els.accountButton.textContent = 'Sign in';
    if (state.usage?.dailyLimit) {
      els.usageText.textContent = `${state.usage.dailyRemaining}/${state.usage.dailyLimit} guest messages left`;
    } else {
      els.usageText.textContent = "Guest mode";
    }
    els.thinkingToggle.checked = false;
    els.researchToggle.checked = false;
    els.autoWebToggle.checked = false;
    els.deepResearchToggle.checked = false;
    els.agenticToggle.checked = false;
    setGuestLockedToggle(els.thinkingToggle, true);
    setGuestLockedToggle(els.researchToggle, true);
    setGuestLockedToggle(els.autoWebToggle, true);
    setGuestLockedToggle(els.deepResearchToggle, true);
    setGuestLockedToggle(els.agenticToggle, true);
  }
  renderAccountWindow();
  renderUpdates();
  updateSettingsSummary();
};

const renderSelects = () => {
  const models = state.config?.models || [];
  const personalities = state.config?.personalities || [];
  const savedModel =
    storageGet("model") || state.config?.defaultModelId || models[0]?.id || "";
  const savedPersonality = storageGet("personality") || "smart";
  const savedThinking = storageGet("thinking") === "1";
  const savedResearch = storageGet("research") === "1";
  const savedAutoWeb = storageGet("auto_web") === "1";
  const savedDeepResearch = storageGet("deep_research") === "1";
  const savedAgenticChat = storageGet("agentic_chat") === "1";

  els.modelSelect.innerHTML = models
    .map((model) => `<option value="${model.id}">${model.name}</option>`)
    .join("");
  els.personalitySelect.innerHTML = personalities
    .map(
      (personality) =>
        `<option value="${personality.id}">${personality.name}</option>`,
    )
    .join("");

  els.modelSelect.value = models.some((model) => model.id === savedModel)
    ? savedModel
    : state.config?.defaultModelId || "";
  els.personalitySelect.value = personalities.some(
    (item) => item.id === savedPersonality,
  )
    ? savedPersonality
    : "smart";
  els.thinkingToggle.checked = savedThinking && Boolean(state.user);
  els.researchToggle.checked = savedResearch && Boolean(state.user);
  els.autoWebToggle.checked = savedAutoWeb && Boolean(state.user);
  els.deepResearchToggle.checked = savedDeepResearch && Boolean(state.user);
  els.agenticToggle.checked = savedAgenticChat && Boolean(state.user);
  renderCustomSelect("model");
  renderCustomSelect("personality");
  updateSettingsSummary();
};

const updateSettingsSummary = () => {
  if (!els.settingsSummary) return;
  const modelName =
    els.modelSelect.selectedOptions?.[0]?.textContent || "Model";
  const extras = [
    els.thinkingToggle.checked ? "Thinking" : "",
    els.deepResearchToggle.checked
      ? "Deep research"
      : els.researchToggle.checked
        ? "Research"
        : "",
    els.agenticToggle.checked ? "Gatita Agent" : "",
  ].filter(Boolean);
  if (els.settingsModelName) els.settingsModelName.textContent = modelName;

  const summary = extras.join(" · ");
  els.settingsSummary.textContent = summary;
  if (els.settingsButton) {
    els.settingsButton.setAttribute(
      "aria-label",
      `Ask controls: ${modelName}${summary ? `, ${summary}` : ""}`,
    );
    els.settingsButton.title = "Ask controls";
  }
};

const renderChats = () => {
  const groups = new Map();
  for (const chat of state.chats) {
    const key = chat.pinned ? "Pinned" : chat.folder || "Chats";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(chat);
  }

  const temporaryItem = `
        <article class="chat-row ${state.temporaryMode ? "active" : ""}">
            <button class="chat-item-main" type="button" data-temporary-chat="1">
                <span class="chat-title-row">
                    <span class="chat-title">Temporary chat</span>
                    <span class="chat-count"><i data-lucide="message-square"></i>${state.temporaryMessages.length || 0}</span>
                </span>
                <span class="chat-preview">Not saved</span>
            </button>
        </article>
    `;

  const newItem = `
        <article class="chat-row ${!state.activeChatId && !state.activeSharedToken && !state.temporaryMode ? "active" : ""}">
            <button class="chat-item-main" type="button" data-new-chat="1">
                <span class="chat-title-row">
                    <span class="chat-title">${window.i18n ? window.i18n("chat.newChat") : "New chat"}</span>
                    <span class="chat-count"><i data-lucide="message-square"></i>0</span>
                </span>
                <span class="chat-preview">${window.i18n ? window.i18n("chat.ready") : "Ready"}</span>
            </button>
        </article>
    `;

  const groupHtml = [...groups.entries()]
    .map(
      ([name, chats]) => `
        <section class="chat-group">
            <h3>${escapeHtml(name)}</h3>
            ${chats
              .map(
                (chat) => `
                <article class="chat-row has-actions ${chat.id === state.activeChatId ? "active" : ""}" data-chat-row="${chat.id}">
                    <button class="chat-item-main" type="button" data-chat-id="${chat.id}">
                        <span class="chat-title-row">
                            <span class="chat-title">${chat.pinned ? "Pinned " : ""}${escapeHtml(chat.title || (window.i18n ? window.i18n("chat.newChat") : "New chat"))}</span>
                            <span class="chat-count"><i data-lucide="message-square"></i>${chat.messageCount || 0}</span>
                        </span>
                        <span class="chat-preview">${escapeHtml(chat.lastMessage || (window.i18n ? window.i18n("chat.ready") : "Ready"))}</span>
                    </button>
                    <div class="chat-actions">
                        <button type="button" data-pin-chat="${chat.id}" aria-label="${chat.pinned ? "Unpin" : "Pin"} chat" title="${chat.pinned ? "Unpin" : "Pin"}"><i data-lucide="pin"></i></button>
                        <button type="button" data-rename-chat="${chat.id}" aria-label="Rename chat" title="Rename"><i data-lucide="pencil"></i></button>
                        <button type="button" data-folder-chat="${chat.id}" aria-label="Set folder" title="Folder"><i data-lucide="folder"></i></button>
                        <button type="button" data-share-chat="${chat.id}" aria-label="Share chat" title="Share"><i data-lucide="link"></i></button>
                        <button type="button" data-delete-chat="${chat.id}" aria-label="Delete chat" title="Delete"><i data-lucide="trash-2"></i></button>
                    </div>
                </article>
            `,
              )
              .join("")}
        </section>
    `,
    )
    .join("");

  els.chatList.innerHTML = `${temporaryItem}${newItem}${groupHtml || '<p class="empty-list">No saved chats found.</p>'}`;
  iconRefresh();
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getCustomSelectParts = (kind) => {
  if (kind === "model") {
    return {
      select: els.modelSelect,
      button: els.modelSelectButton,
      value: els.modelSelectValue,
      menu: els.modelSelectMenu,
    };
  }
  return {
    select: els.personalitySelect,
    button: els.personalitySelectButton,
    value: els.personalitySelectValue,
    menu: els.personalitySelectMenu,
  };
};

const closeCustomSelects = () => {
  state.openCustomSelect = "";
  ["model", "personality"].forEach((kind) => {
    const parts = getCustomSelectParts(kind);
    parts.menu?.classList.add("hidden");
    parts.button?.setAttribute("aria-expanded", "false");
  });
};

const renderCustomSelect = (kind) => {
  const { select, button, value, menu } = getCustomSelectParts(kind);
  if (!select || !button || !value || !menu) return;

  const options = Array.from(select.options || []);
  const selected =
    options.find((option) => option.value === select.value) || options[0];
  value.textContent =
    selected?.textContent || (kind === "model" ? "Model" : "Personality");
  button.disabled = options.length === 0;
  button.setAttribute(
    "aria-expanded",
    state.openCustomSelect === kind ? "true" : "false",
  );

  menu.innerHTML = options
    .map((option) => {
      const active = option.value === select.value;
      return `
            <button class="custom-select-option ${active ? "active" : ""}" type="button" role="option" aria-selected="${active ? "true" : "false"}" data-custom-select-value="${escapeHtml(option.value)}">
                <span>${escapeHtml(option.textContent)}</span>
                ${active ? '<i data-lucide="check"></i>' : ""}
            </button>
        `;
    })
    .join("");
  menu.classList.toggle("hidden", state.openCustomSelect !== kind);
  iconRefresh();
};

const toggleCustomSelect = (kind) => {
  state.openCustomSelect = state.openCustomSelect === kind ? "" : kind;
  renderCustomSelect("model");
  renderCustomSelect("personality");
};

const chooseCustomSelectValue = (kind, nextValue) => {
  const { select } = getCustomSelectParts(kind);
  if (!select) return;
  if (select.value !== nextValue) {
    select.value = nextValue;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
  closeCustomSelects();
};

const isSettingsMenuOpen = () =>
  Boolean(
    els.settingsMenu &&
    !els.settingsMenu.classList.contains("hidden") &&
    !els.settingsMenu.classList.contains("is-closing"),
  );

const shouldPortalSettingsMenu = () =>
  window.matchMedia?.(COMPACT_SHELL_QUERY)?.matches ||
  window.innerWidth <= COMPACT_SHELL_WIDTH;

const syncSettingsMenuPortal = () => {
  if (!els.settingsMenu || !els.settingsWrap) return;
  const shouldPortal = shouldPortalSettingsMenu();
  els.settingsMenu.classList.toggle("settings-menu-portal", shouldPortal);
  if (shouldPortal && els.settingsMenu.parentElement !== document.body) {
    document.body.appendChild(els.settingsMenu);
    return;
  }
  if (!shouldPortal && els.settingsMenu.parentElement !== els.settingsWrap) {
    els.settingsWrap.appendChild(els.settingsMenu);
  }
};

const openSettingsMenu = () => {
  syncSettingsMenuPortal();
  showWithMotion(els.settingsMenu);
  els.settingsButton.setAttribute("aria-expanded", "true");
};

const closeSettingsMenu = () => {
  hideWithMotion(els.settingsMenu);
  els.settingsButton.setAttribute("aria-expanded", "false");
  closeCustomSelects();
};

const toggleSettingsMenu = () => {
  if (isSettingsMenuOpen()) {
    closeSettingsMenu();
  } else {
    openSettingsMenu();
  }
};

const bindCustomSelect = (kind) => {
  const { button, menu } = getCustomSelectParts(kind);
  button?.addEventListener("click", () => toggleCustomSelect(kind));
  menu?.addEventListener("click", (event) => {
    const option = event.target.closest("[data-custom-select-value]");
    if (!option) return;
    chooseCustomSelectValue(kind, option.dataset.customSelectValue || "");
  });
};

const stripNotebookBlocks = (value) =>
  String(value || "").replace(NOTEBOOK_STRIP_RE, "").trim();

const TOOL_BLOCK_RE = /<gatita-tool\b([\s\S]*?)<\/gatita-tool>/gi;
const TOOL_RESULT_RE = /<gatita-tool-result\b([\s\S]*?)<\/gatita-tool-result>/gi;
const TOOL_PARTIAL_RE = /<gatita-tool\b[\s\S]*$/i;
const TOOL_RESULT_PARTIAL_RE = /<gatita-tool-result\b[\s\S]*$/i;

const stripToolBlocks = (value) =>
  String(value || "")
    .replace(TOOL_BLOCK_RE, "")
    .replace(TOOL_RESULT_RE, "")
    .replace(TOOL_PARTIAL_RE, "")
    .replace(TOOL_RESULT_PARTIAL_RE, "")
    .trim();

const parseToolBlock = (raw) => {
  const text = String(raw || "");
  TOOL_BLOCK_RE.lastIndex = 0;
  const matches = [...text.matchAll(TOOL_BLOCK_RE)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  try {
    const parsed = JSON.parse(String(last[1] || "").trim());
    if (parsed && typeof parsed.tool === "string") return parsed;
  } catch (_) {}
  return null;
};

const guessPartialToolBlock = (raw) => {
  const text = String(raw || "");
  if (!/<gatita-tool\b/i.test(text)) return null;
  if (/"tool"\s*:\s*"search"/i.test(text)) return { tool: "search" };
  if (/"tool"\s*:\s*"research"/i.test(text)) return { tool: "research" };
  if (/"tool"\s*:\s*"think"/i.test(text)) return { tool: "think" };
  if (/"tool"\s*:\s*"summarize"/i.test(text)) return { tool: "summarize" };
  return { tool: "think" };
};

const describeToolActivity = (toolCall) => {
  if (!toolCall || typeof toolCall !== "object") return null;
  const tool = String(toolCall.tool || "").trim().toLowerCase();
  if (!tool) return null;
  if (tool === "search") {
    const query = String(toolCall.query || "").trim();
    return {
      kind: "research",
      label: "Research",
      summary: query ? `Searching: ${query.slice(0, 120)}` : "Searching the web",
    };
  }
  if (tool === "research") {
    const topic = String(toolCall.topic || "").trim();
    return {
      kind: "research",
      label: "Research",
      summary: topic ? `Researching: ${topic.slice(0, 120)}` : "Researching the topic",
    };
  }
  if (tool === "think") {
    const content = String(toolCall.content || "").trim();
    return {
      kind: "thinking",
      label: "Thinking",
      summary: content ? content.slice(0, 120) : "Thinking through the answer",
    };
  }
  if (tool === "summarize") {
    return {
      kind: "thinking",
      label: "Thinking",
      summary: "Summarizing information",
    };
  }
  return {
    kind: "thinking",
    label: "Thinking",
    summary: "Working through the answer",
  };
};

const getVisibleMessageContent = (message) =>
  stripToolBlocks(stripNotebookBlocks(message?.content || ""));


const isSafeUrl = (value) => {
  try {
    const parsed = new URL(value, window.location.href);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch (_) {
    return false;
  }
};

const renderInlineMarkdown = (value) => {
  const codeSpans = [];
  let text = String(value || "").replace(/`([^`]+)`/g, (match, code) => {
    const token = `@@CODESPAN_${codeSpans.length}@@`;
    codeSpans.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  text = escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (match, alt, url) => {
      if (!isSafeUrl(url)) return escapeHtml(alt);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(alt || url)}</a>`;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => {
      if (!isSafeUrl(url)) return escapeHtml(label);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    })
    .replace(
      /(^|[\s(])((?:https?:\/\/)[^\s<)]+)/g,
      (match, prefix, url) =>
        `${prefix}<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`,
    )
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/___([^_]+)___/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  codeSpans.forEach((html, index) => {
    text = text.replace(`@@CODESPAN_${index}@@`, html);
  });
  return text;
};

const isTableSeparator = (line) =>
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

const parseTableRow = (line) => {
  const cleaned = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return cleaned.split("|").map((cell) => cell.trim());
};

const normalizeCodeLanguage = (value) => {
  const raw = String(value || "")
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();
  const aliases = {
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    yml: "yaml",
    md: "markdown",
    cplusplus: "cpp",
    "c++": "cpp",
    cs: "csharp",
    "c#": "csharp",
  };
  return (aliases[raw] || raw).replace(/[^\w-]/g, "");
};

const renderMarkdown = (value) => {
  const source = String(value || "").replace(/\r\n/g, "\n");
  const codeBlocks = [];
  const protectedSource = source.replace(
    /```([^\n`]*)?\n?([\s\S]*?)```/g,
    (match, lang, code) => {
      const token = `@@CODEBLOCK_${codeBlocks.length}@@`;
      codeBlocks.push({
        lang: normalizeCodeLanguage(lang),
        code: escapeHtml(code.trim()),
      });
      return token;
    },
  );

  const lines = protectedSource.split("\n");
  const out = [];
  let listType = null;
  let paragraph = [];
  let blockquote = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const flushBlockquote = () => {
    if (blockquote.length > 0) {
      out.push(
        `<blockquote>${blockquote.map((line) => `<p>${renderInlineMarkdown(line)}</p>`).join("")}</blockquote>`,
      );
      blockquote = [];
    }
  };
  const closeLooseBlocks = () => {
    flushParagraph();
    closeList();
    flushBlockquote();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      closeLooseBlocks();
      continue;
    }

    const codeToken = trimmed.match(/^@@CODEBLOCK_(\d+)@@$/);
    if (codeToken) {
      closeLooseBlocks();
      const block = codeBlocks[Number(codeToken[1])];
      const lang = block?.lang || "";
      out.push(
        `<pre${lang ? ` data-code-lang="${escapeHtml(lang)}"` : ""}><button class="copy-code-btn" type="button" data-copy-code title="Copy code" aria-label="Copy code"><i data-lucide="copy"></i></button><code${lang ? ` class="language-${lang}"` : ""}>${block?.code || ""}</code></pre>`,
      );
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeLooseBlocks();
      out.push("<hr>");
      continue;
    }

    if (
      trimmed.includes("|") &&
      lines[i + 1] &&
      isTableSeparator(lines[i + 1])
    ) {
      closeLooseBlocks();
      const headers = parseTableRow(trimmed);
      i += 2;
      const rows = [];
      while (
        i < lines.length &&
        lines[i].trim().includes("|") &&
        lines[i].trim()
      ) {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      i -= 1;
      out.push(
        [
          '<div class="table-wrap"><table>',
          `<thead><tr>${headers.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join("")}</tr></thead>`,
          `<tbody>${rows.map((row) => `<tr>${headers.map((_, index) => `<td>${renderInlineMarkdown(row[index] || "")}</td>`).join("")}</tr>`).join("")}</tbody>`,
          "</table></div>",
        ].join(""),
      );
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeLooseBlocks();
      const level = heading[1].length;
      out.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const quote = trimmed.match(/^>\s?(.+)$/);
    if (quote) {
      flushParagraph();
      closeList();
      blockquote.push(quote[1]);
      continue;
    }

    const task = trimmed.match(/^[-*]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      flushParagraph();
      flushBlockquote();
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(
        `<li class="task-item"><input type="checkbox" disabled${task[1].toLowerCase() === "x" ? " checked" : ""}> ${renderInlineMarkdown(task[2])}</li>`,
      );
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      flushBlockquote();
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${renderInlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      flushBlockquote();
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${renderInlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList();
    flushBlockquote();
    paragraph.push(trimmed);
  }

  closeLooseBlocks();
  return out.join("");
};

const highlightCodeBlocks = (root = document) => {
  if (!window.hljs || !root) return;
  root.querySelectorAll("pre code:not([data-highlighted])").forEach((block) => {
    try {
      window.hljs.highlightElement(block);
    } catch (_) {
      block.dataset.highlighted = "yes";
    }
  });
};

const renderSources = (sources) => {
  if (!Array.isArray(sources) || sources.length === 0) return "";
  return `
        <details class="sources-menu">
            <summary>Sources</summary>
            <div class="source-links">
                ${sources
                  .map(
                    (source) => `
                    <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
                        ${source.icon ? `<img src="${escapeHtml(source.icon)}" alt="">` : ""}
                        <span>${escapeHtml(source.domain || source.title || "Source")}</span>
                    </a>
                `,
                  )
                  .join("")}
            </div>
        </details>
    `;
};

const normalizeActivityEntry = (item, fallbackSummary = "") => {
  if (!item) return null;
  if (typeof item === "string") {
    const text = String(item || "").trim();
    if (!text) return null;
    return {
      summary: text,
      detail: text,
    };
  }

  const summary = String(item.summary || item.message || fallbackSummary || "")
    .trim()
    .slice(0, 140);
  const detail = String(item.message || item.detail || summary || "")
    .trim()
    .slice(0, 220);
  if (!summary && !detail) return null;
  return {
    summary: summary || detail,
    detail: detail || summary,
  };
};

const getMarkdownHtml = (message) => {
  const content = getVisibleMessageContent(message);
  if (message._markdownSource === content && message._markdownHtml) {
    return message._markdownHtml;
  }
  message._markdownSource = content;
  message._markdownHtml = renderMarkdown(content);
  return message._markdownHtml;
};

const renderActivityPanel = (activity) => {
  if (!activity) return "";
  const thinking = Array.isArray(activity.thinking)
    ? activity.thinking.slice(-1)
    : [];
  const research = Array.isArray(activity.research)
    ? activity.research.slice(-1)
    : [];
  const sources = Array.isArray(activity.sources)
    ? activity.sources.slice(-6)
    : [];
  if (thinking.length === 0 && research.length === 0 && sources.length === 0)
    return "";

  const latestThinking = normalizeActivityEntry(
    thinking[thinking.length - 1],
    "Thinking",
  );
  const latestResearch = normalizeActivityEntry(
    research[research.length - 1],
    "Researching",
  );

  return `
        <div class="activity-panel activity-inline-panel">
            ${
              latestThinking
                ? `
                <p class="activity-inline activity-inline-thinking" aria-live="polite">
                    <span class="activity-inline-label">Thinking</span>
                    <span class="activity-inline-summary">${escapeHtml(latestThinking.summary)}</span>
                </p>
            `
                : ""
            }
            ${
              latestResearch || sources.length
                ? `
                <p class="activity-inline activity-inline-research" aria-live="polite">
                    <span class="activity-inline-label">Research</span>
                    <span class="activity-inline-summary">${escapeHtml(latestResearch?.summary || "Checking sources")}</span>
                </p>
                ${
                  sources.length
                    ? `
                        <div class="activity-sites activity-sites-inline">
                            ${sources
                              .map(
                                (source) => `
                                <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
                                    ${source.icon ? `<img src="${escapeHtml(source.icon)}" alt="">` : ""}
                                    <span>${escapeHtml(source.domain || source.title || "source")}</span>
                                </a>
                            `,
                              )
                              .join("")}
                        </div>
                    `
                    : ""
                }
            `
                : ""
            }
        </div>
    `;
};

const renderRawStreamPanel = (message) => {
  if (!state.user?.isAdmin) return "";
  const rows = Array.isArray(message?.rawResponses)
    ? message.rawResponses.filter((item) => item?.text).slice(-400)
    : [];
  if (rows.length === 0 && !message?.rawTruncated && !message?.rawStatus)
    return "";

  const rawText = rows
    .map((item) => item.text)
    .join("\n")
    .trim();
  const byteCount = Number(message?.rawByteCount || 0);
  const meta = [
    rows.length ? `${rows.length} chunk${rows.length === 1 ? "" : "s"}` : "",
    byteCount ? formatBytes(byteCount) : "",
    message?.rawTruncated ? "truncated" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return `
        <details class="raw-stream-panel">
            <summary>
                <span>Raw stream</span>
                ${meta ? `<small>${escapeHtml(meta)}</small>` : ""}
            </summary>
            ${
              rawText
                ? `<pre>${escapeHtml(rawText)}</pre>`
                : `<p>${escapeHtml(message?.rawStatus || "Raw stream is waiting for data.")}</p>`
            }
        </details>
    `;
};

const renderQueueIndicator = (message) => {
  if (!message?.queueing) return "";
  return `
        <div class="queue-indicator" aria-label="Waiting for response">
            <i data-lucide="hourglass"></i>
            <span>Waiting</span>
        </div>
    `;
};

const renderMessages = () => {
  const viewStreaming = isCurrentViewStreaming();
  const shouldStickToBottom = viewStreaming || isNearMessageBottom();
  updateWelcomeText();
  updateChatBlockedOverlay();
  els.emptyState.classList.toggle("hidden", state.messages.length > 0);
  document
    .querySelector(".chat-main")
    .classList.toggle("chat-is-empty", state.messages.length === 0);

  els.messages.classList.toggle("streaming-render", viewStreaming);
  els.messageScroll.classList.toggle("streaming-scroll", viewStreaming);
  els.messages.innerHTML = state.messages
    .map((message, index) => {
      const renderKey = getMessageRenderKey(message, index);
      const entering = !renderMessages.seenKeys?.has(renderKey);
      const entryClass = entering && !viewStreaming ? " entering" : "";
      renderMessages.seenKeys = renderMessages.seenKeys || new Set();
      renderMessages.seenKeys.add(renderKey);

      if (message.type === "policy") {
        return `
                <article class="policy-banner${entryClass}">
                    <strong>${escapeHtml(message.content || "This prompt is against the Terms of Service.")}</strong>
                    <a href="${escapeHtml(message.tosUrl || getTosUrl())}" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                </article>
            `;
      }

      if (message.loading) {
        const raw = renderRawStreamPanel(message);
        return `
                <article class="message assistant" data-render-key="${escapeHtml(renderKey)}">
                    <div class="message-stack">
                        ${raw}
                        ${renderQueueIndicator(message)}
                        <div class="bubble loading" aria-label="Loading">
                            ${renderActivityPanel(message.activity)}
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                        </div>
                    </div>
                </article>
            `;
      }

      const chips =
        Array.isArray(message.attachments) && message.attachments.length
          ? `<div class="file-chip-row">${message.attachments.map((file) => `<span class="file-chip">${escapeHtml(file.name || "file")}</span>`).join("")}</div>`
          : "";
      const visibleContent = getVisibleMessageContent(message);
      const body =
        message.role === "assistant"
          ? message.streaming
            ? `<div class="stream-plain">${escapeHtml(visibleContent)}</div>`
            : `<div class="markdown-body">${getMarkdownHtml(message)}</div>`
          : escapeHtml(visibleContent);
      const streaming = message.streaming
        ? '<span class="stream-cursor" aria-hidden="true"></span>'
        : "";
      const sources =
        message.role === "assistant" ? renderSources(message.sources) : "";
      const activity =
        message.role === "assistant"
          ? renderActivityPanel(message.activity)
          : "";
      const raw =
        message.role === "assistant" ? renderRawStreamPanel(message) : "";
      const queue =
        message.role === "assistant" ? renderQueueIndicator(message) : "";
      const actions =
        message.id && !state.activeSharedToken
          ? `
            <div class="message-actions">
                ${
                  message.role === "assistant"
                    ? `
                    <button type="button" data-copy-message="${message.id}" title="Copy" aria-label="Copy response"><i data-lucide="copy"></i></button>
                    <button type="button" data-regenerate-message="${message.id}" title="Regenerate" aria-label="Regenerate response"><i data-lucide="refresh-cw"></i></button>
                `
                    : `
                    <button type="button" data-edit-message="${message.id}" title="Edit and resend" aria-label="Edit and resend"><i data-lucide="pencil"></i></button>
                `
                }
                <button type="button" data-delete-message="${message.id}" title="Delete" aria-label="Delete message"><i data-lucide="trash-2"></i></button>
            </div>
        `
          : "";

      return `
            <article class="message ${message.role === "user" ? "user" : "assistant"}${message.streaming ? " streaming" : ""}${entryClass}" data-message-id="${message.id || ""}" data-render-key="${escapeHtml(renderKey)}">
                <div class="message-stack">${raw}${queue}<div class="bubble">${activity}${body}${streaming}${chips}${sources}</div>${actions}</div>
            </article>
        `;
    })
    .join("");
  if (shouldStickToBottom) queueBottomLock({ smooth: !viewStreaming });
  requestAnimationFrame(() => {
    if (!viewStreaming) {
      highlightCodeBlocks(els.messages);
      queueMathTypeset();
      iconRefresh();
    }
  });
};

const formatUpdateTime = (value) =>
  new Date(Number(value || Date.now())).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatAccountDeletionTime = (value) =>
  new Date(Number(value || Date.now())).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const renderUpdates = () => {
  if (!els.updatesList) return;
  const canPost = Boolean(state.user?.isAdmin);
  els.updatesForm?.classList.toggle("hidden", !canPost);
  els.updatesList.innerHTML = state.updates.length
    ? state.updates
        .map(
          (item) => `
        <article class="update-card">
            <header>
                <div>
                    <span class="mode-label">Update</span>
                    <h3>${escapeHtml(item.title || "Update")}</h3>
                </div>
                <time datetime="${new Date(Number(item.publishedAt || Date.now())).toISOString()}">${escapeHtml(formatUpdateTime(item.publishedAt))}</time>
            </header>
            <div class="markdown-body">${renderMarkdown(item.content || "")}</div>
        </article>
    `,
        )
        .join("")
    : '<p class="empty-list">No updates yet.</p>';
  highlightCodeBlocks(els.updatesList);
  iconRefresh();
  if (
    state.updates.some((item) =>
      /(\$\$|\\\(|\\\[|\$[^$\n]{1,160}\$)/.test(item.content || ""),
    )
  ) {
    loadMathJax()
      .then(() => window.MathJax.typesetPromise([els.updatesList]))
      .catch(() => {});
  }
};

const fetchUpdates = async () => {
  const data = await apiFetch("/updates");
  state.updates = data.updates || [];
  renderUpdates();
  return data;
};

const openUpdatesModal = async () => {
  showWithMotion(els.updatesModal);
  els.updatesButton?.setAttribute("aria-expanded", "true");
  renderUpdates();
  await fetchUpdates().catch((error) =>
    showToast(error.message || "Updates could not load."),
  );
};

const closeUpdatesModal = () => {
  hideWithMotion(els.updatesModal);
  els.updatesButton?.setAttribute("aria-expanded", "false");
};

const scheduleRenderMessages = () => {
  if (scheduleRenderMessages.queued) return;
  scheduleRenderMessages.queued = true;
  const now = performance.now();
  const elapsed = now - (scheduleRenderMessages.lastRenderAt || 0);
  const delay = isCurrentViewStreaming()
    ? Math.max(0, STREAM_RENDER_INTERVAL_MS - elapsed)
    : 0;
  const render = () =>
    requestAnimationFrame(() => {
      scheduleRenderMessages.queued = false;
      scheduleRenderMessages.timer = null;
      scheduleRenderMessages.lastRenderAt = performance.now();
      renderMessages();
    });
  if (delay > 0) {
    scheduleRenderMessages.timer = setTimeout(render, delay);
    return;
  }
  render();
};

const renderAttachments = () => {
  const maxFileBytes = state.config?.limits?.maxFileBytes || 8 * 1024 * 1024;
  els.attachmentRow.innerHTML = state.pendingFiles
    .map(
      (file, index) => `
        <span class="file-chip ${file.size > maxFileBytes || !file.type ? "warning" : ""}" title="${escapeHtml(file.type || "application/octet-stream")}">
            <span>
                <strong>${escapeHtml(file.name)}</strong>
                <small>${escapeHtml(file.type || "unknown")} · ${formatBytes(file.size)}</small>
            </span>
            <button type="button" data-remove-file="${index}" aria-label="Remove ${escapeHtml(file.name)}">×</button>
        </span>
    `,
    )
    .join("");
};

const autoGrowInput = () => {
  els.messageInput.style.height = "auto";
  els.messageInput.style.height = `${Math.min(180, els.messageInput.scrollHeight)}px`;
};

const getBrowserCheckParts = (kind = "message") => {
  if (kind === "auth") {
    return {
      status: els.authBrowserCheckStatus,
      proofKey: "authBrowserProof",
      action: "ask_auth",
    };
  }

  return {
    status: els.browserCheckStatus,
    proofKey: "browserProof",
    action: "ask_message",
  };
};

const setBrowserCheckStatus = (kind, message, tone = "") => {
  const { status } = getBrowserCheckParts(kind);
  if (!status) return;
  status.textContent = message || "";
  status.parentElement?.classList.toggle("hidden", !message);
  status.classList.toggle("hidden", !message);
  status.classList.toggle("error", tone === "error");
  status.classList.toggle("ready", tone === "ready");
};

const clearBrowserCheckStatus = (kind) => setBrowserCheckStatus(kind, "");

const hideBrowserCheckStatus = (kind) => {
  const { status } = getBrowserCheckParts(kind);
  status?.parentElement?.classList.add("hidden");
  status?.classList.add("hidden");
};

const renderBrowserCheck = () => {
  if (!state.config?.browserCheckRequired) {
    hideBrowserCheckStatus("message");
    hideBrowserCheckStatus("auth");
    return;
  }

  clearBrowserCheckStatus("message");
  clearBrowserCheckStatus("auth");
};

const hasRecentBrowserCheckPass = () =>
  Date.now() < Number(state.browserCheckVerifiedUntil || 0);

const rememberBrowserCheckPass = () => {
  const ttl = Math.max(0, Number(state.config?.browserCheckPassTtlMs || 0));
  if (!ttl) return;
  state.browserCheckVerifiedUntil = Date.now() + Math.max(0, ttl - 15000);
};

const forgetBrowserCheckPass = () => {
  state.browserCheckVerifiedUntil = 0;
};

const resetBrowserCheck = (kind = "message") => {
  const parts = getBrowserCheckParts(kind);
  state[parts.proofKey] = null;
  clearBrowserCheckStatus(kind);
};

const yieldBrowserCheck = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

const sha256Hex = async (value) => {
  const bytes = new TextEncoder().encode(String(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const countLeadingZeroBits = (hex) => {
  let count = 0;
  for (const char of String(hex || "")) {
    const value = Number.parseInt(char, 16);
    if (!Number.isFinite(value)) return count;
    if (value === 0) {
      count += 4;
      continue;
    }
    return count + Math.clz32(value) - 28;
  }
  return count;
};

const solveBrowserCheck = async (challenge) => {
  if (!window.crypto?.subtle || !window.TextEncoder) {
    throw new Error("Security check needs a modern secure browser.");
  }

  const difficulty = Math.max(0, Number(challenge?.difficulty || 0));
  const maxAttempts = Math.max(1, Number(challenge?.maxAttempts || 2500000));
  const expiresAt = Number(challenge?.expiresAt || 0);
  const action = String(challenge?.action || "");
  const prefix = `${challenge?.id}:${challenge?.nonce}:${action}:${expiresAt}:`;

  for (let counter = 0; counter <= maxAttempts; counter += 1) {
    if (expiresAt && Date.now() > expiresAt - 1000) {
      throw new Error("Security check expired. Please try again.");
    }

    const hash = await sha256Hex(`${prefix}${counter}`);
    if (countLeadingZeroBits(hash) >= difficulty) {
      return {
        id: challenge.id,
        nonce: challenge.nonce,
        action,
        expiresAt,
        counter,
        hash,
      };
    }

    if (counter > 0 && counter % BROWSER_CHECK_YIELD_EVERY === 0) {
      await yieldBrowserCheck();
    }
  }

  throw new Error("Security check took too long. Please try again.");
};

const ensureBrowserCheckProof = async (kind = "message") => {
  if (!state.config?.browserCheckRequired) return true;
  if (kind === "message" && hasRecentBrowserCheckPass()) return true;

  const parts = getBrowserCheckParts(kind);
  if (state[parts.proofKey]) return true;

  setBrowserCheckStatus(kind, "Preparing security check...");

  try {
    const data = await apiFetch("/browser-check/challenge", {
      method: "POST",
      body: JSON.stringify({ action: parts.action }),
    });

    if (!data.required) {
      clearBrowserCheckStatus(kind);
      return true;
    }

    if (!data.challenge?.id || !data.challenge?.nonce) {
      throw new Error("Security check is unavailable.");
    }

    state[parts.proofKey] = await solveBrowserCheck(data.challenge);
    setBrowserCheckStatus(kind, "Security check complete.", "ready");
    clearTimeout(setBrowserCheckStatus[`${kind}Timer`]);
    setBrowserCheckStatus[`${kind}Timer`] = setTimeout(
      () => clearBrowserCheckStatus(kind),
      1200,
    );
    return true;
  } catch (error) {
    state[parts.proofKey] = null;
    setBrowserCheckStatus(
      kind,
      error.message || "Security check failed. Please try again.",
      "error",
    );
    throw error;
  }
};

const readFilePayload = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve({
        name: file.name,
        contentType: file.type || "application/octet-stream",
        data: result.split(",")[1] || "",
      });
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });

const fetchConfig = async () => {
  const data = await apiFetch("/config");
  state.config = data;
  updateUsage(data.usage);
  updateAccountStatus(data.accountStatus);
  renderSelects();
  renderBrowserCheck();
};

const fetchMe = async () => {
  const data = await apiFetch("/me");
  state.user = data.user || null;
  updateUsage(data.usage);
  updateAccountStatus(data.accountStatus);
  updateAccount();
  if (state.user && storageGet("thinking") === "1") {
    els.thinkingToggle.checked = true;
  }
  if (state.user && storageGet("auto_web") === "1") {
    els.autoWebToggle.checked = true;
  }
  if (state.user && storageGet("agentic_chat") === "1") {
    els.agenticToggle.checked = true;
  }
  if (state.user && storageGet("research") === "1") {
    els.researchToggle.checked = true;
  }
  if (state.user && storageGet("deep_research") === "1") {
    els.deepResearchToggle.checked = true;
    els.researchToggle.checked = true;
  }
  updateSettingsSummary();
};

const fetchChats = async () => {
  const query = state.chatSearch
    ? `?q=${encodeURIComponent(state.chatSearch)}`
    : "";
  const data = await apiFetch(`/chats${query}`);
  state.chats = data.chats || [];
  renderChats();
};

const createChat = async ({
  navigate = true,
  resetMessages = true,
  reloadList = true,
} = {}) => {
  const data = await apiFetch("/chats", {
    method: "POST",
    body: JSON.stringify({
      title: window.i18n ? window.i18n("chat.newChat") : "New chat",
      modelId: els.modelSelect.value,
      personality: els.personalitySelect.value,
    }),
  });
  state.activeChatId = data.chat.id;
  state.activeSharedToken = "";
  state.temporaryMode = false;
  state.chats = [
    data.chat,
    ...state.chats.filter((chat) => chat.id !== data.chat.id),
  ];
  if (resetMessages) state.messages = [];
  if (navigate) {
    window.location.hash = chatUrl(data.chat.id);
  } else {
    replaceHashWithoutRouting(chatUrl(data.chat.id));
  }
  if (reloadList) await fetchChats();
  renderChats();
  if (resetMessages) renderMessages();
};

const ensureChat = async () => {
  if (state.activeChatId) return state.activeChatId;
  await createChat({
    navigate: false,
    resetMessages: false,
    reloadList: false,
  });
  return state.activeChatId;
};

const loadMessages = async (chatId) => {
  saveComposerDraft();
  const data = await apiFetch(`/chats/${chatId}/messages`);
  state.activeChatId = Number(chatId);
  state.activeSharedToken = "";
  state.temporaryMode = false;
  const stream = state.activeStreams.get(chatStreamKey(chatId));
  state.messages = stream?.messages || data.messages || [];
  if (
    data.chat?.model &&
    state.config?.models?.some((model) => model.id === data.chat.model)
  ) {
    els.modelSelect.value = data.chat.model;
  }
  if (
    data.chat?.personality &&
    state.config?.personalities?.some(
      (item) => item.id === data.chat.personality,
    )
  ) {
    els.personalitySelect.value = data.chat.personality;
  }
  updateSettingsSummary();
  loadComposerDraft();
  renderChats();
  renderMessages();
  scheduleActiveChatSync();
};

const hasPendingSavedResponse = () =>
  state.messages.some(
    (message) =>
      message.role === "assistant" && message.loading && !message.streaming,
  );

const scheduleActiveChatSync = () => {
  clearTimeout(scheduleActiveChatSync.timer);
  if (!state.activeChatId || state.activeSharedToken || state.temporaryMode)
    return;
  if (state.activeStreams.has(chatStreamKey(state.activeChatId))) return;
  if (!hasPendingSavedResponse()) return;

  const chatId = Number(state.activeChatId);
  scheduleActiveChatSync.timer = setTimeout(() => {
    if (
      Number(state.activeChatId) !== chatId ||
      state.temporaryMode ||
      state.activeSharedToken
    )
      return;
    if (state.activeStreams.has(chatStreamKey(chatId))) return;
    loadMessages(chatId).catch((error) =>
      showToast(error.message || "Chat could not sync."),
    );
  }, 2500);
};

const syncActiveChat = async () => {
  if (!state.activeChatId || state.temporaryMode || state.activeSharedToken)
    return;
  if (state.activeStreams.has(chatStreamKey(state.activeChatId))) return;
  await loadMessages(state.activeChatId);
};

const loadSharedChat = async (token) => {
  saveComposerDraft();
  const data = await apiFetch(`/shared/${encodeURIComponent(token)}`);
  state.activeChatId = null;
  state.activeSharedToken = token;
  state.temporaryMode = false;
  state.messages = data.messages || [];
  loadComposerDraft();
  renderChats();
  renderMessages();
};

const startNewChat = () => {
  saveComposerDraft();
  if (state.temporaryMode) state.temporaryMessages = state.messages;
  state.activeChatId = null;
  state.activeSharedToken = "";
  state.temporaryMode = false;
  state.messages = [];
  window.location.hash = newChatUrl();
  updateSettingsSummary();
  loadComposerDraft();
  renderChats();
  renderMessages();
};

const startTemporaryChat = () => {
  saveComposerDraft();
  if (!state.temporaryMode) {
    state.temporaryMessages = state.temporaryMessages || [];
  }
  state.activeChatId = null;
  state.activeSharedToken = "";
  state.temporaryMode = true;
  state.messages = state.temporaryMessages;
  window.location.hash = "#/temp";
  updateSettingsSummary();
  loadComposerDraft();
  renderChats();
  renderMessages();
};

const routeFromHash = async () => {
  const hash = window.location.hash || newChatUrl();
  const chatMatch = hash.match(/^#\/chat\/(\d+)$/);
  const shareMatch = hash.match(/^#\/share\/([a-zA-Z0-9_-]+)$/);
  if (hash === "#/temp") {
    startTemporaryChat();
    return;
  }
  if (chatMatch) {
    await loadMessages(Number(chatMatch[1]));
    return;
  }
  if (shareMatch) {
    await loadSharedChat(shareMatch[1]);
    return;
  }
  startNewChat();
};

const updateChat = async (chatId, patch) => {
  const data = await apiFetch(`/chats/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  state.chats = state.chats.map((chat) =>
    chat.id === Number(chatId) ? data.chat : chat,
  );
  renderChats();
  return data.chat;
};

const deleteChat = async (chatId) => {
  await apiFetch(`/chats/${chatId}`, {
    method: "DELETE",
    body: JSON.stringify({}),
  });
  if (state.activeChatId === Number(chatId)) startNewChat();
  await fetchChats();
};

const shareChat = async (chatId) => {
  const data = await apiFetch(`/chats/${chatId}/share`, {
    method: "POST",
    body: JSON.stringify({ enabled: true }),
  });
  const url =
    data.shareUrl ||
    `${window.location.origin}${window.location.pathname}${sharedUrl(data.shareToken)}`;
  if (navigator.clipboard?.writeText)
    await navigator.clipboard.writeText(url).catch(() => {});
  showToast("Share link copied.");
  await fetchChats();
};

const copyText = async (text) => {
  const value = String(text || "");
  let copied = false;
  if (navigator.clipboard?.writeText) {
    copied = await navigator.clipboard
      .writeText(value)
      .then(() => true)
      .catch(() => false);
  }
  if (!copied) {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    field.style.top = "0";
    document.body.appendChild(field);
    field.focus();
    field.select();
    copied = document.execCommand("copy");
    field.remove();
  }
  showToast(copied ? "Copied." : "Copy was blocked by the browser.");
};

const deleteMessage = async (messageId) => {
  if (!state.activeChatId) return;
  await apiFetch(`/chats/${state.activeChatId}/messages/${messageId}`, {
    method: "DELETE",
    body: JSON.stringify({}),
  });
  state.messages = state.messages.filter(
    (message) => message.id !== Number(messageId),
  );
  await fetchChats();
  renderMessages();
};

const editAndResend = async (messageId) => {
  const message = state.messages.find((item) => item.id === Number(messageId));
  if (!message || message.role !== "user") return;
  const next = await openActionModal({
    title: "Edit Message",
    message:
      "Resending will replace this message and remove later replies in the chat.",
    kind: "textarea",
    label: "Message",
    value: message.content || "",
    confirmText: "Resend",
    required: true,
    maxLength: state.config?.limits?.messageMaxChars || 12000,
  });
  if (next === null) return;
  const text = next.trim();
  if (!text) return;
  await sendMessage({ text, resendMessageId: Number(messageId) });
};

const regenerateMessage = async (messageId) => {
  const message = state.messages.find((item) => item.id === Number(messageId));
  if (!message || message.role !== "assistant") return;
  await sendMessage({ text: "", regenerateMessageId: Number(messageId) });
};

const sendMessage = async (options = {}) => {
  const text = (options.text ?? els.messageInput.value).trim();
  const draftKeyBeforeSend =
    state.composerDraftKey || composerDraftKeyForCurrentView();
  const isRegenerate = Boolean(options.regenerateMessageId);
  const isResend = Boolean(options.resendMessageId);
  if (!text && state.pendingFiles.length === 0 && !isRegenerate) return;
  if (state.accountStatus?.banned) {
    updateAccountStatus(state.accountStatus);
    return;
  }
  if (Number(state.accountStatus?.chatBlockedUntil || 0) > Date.now()) {
    showToast(
      `Chat access is paused for about ${formatDuration(Number(state.accountStatus.chatBlockedUntil) - Date.now())}.`,
    );
    return;
  }
  if (
    (els.thinkingToggle.checked ||
      els.researchToggle.checked ||
      els.autoWebToggle.checked ||
      els.deepResearchToggle.checked ||
      els.agenticToggle.checked) &&
    !state.user
  ) {
    els.thinkingToggle.checked = false;
    els.researchToggle.checked = false;
    els.autoWebToggle.checked = false;
    els.deepResearchToggle.checked = false;
    els.agenticToggle.checked = false;
    state.messages.push({
      type: "policy",
      content:
        "Thinking, web, and research tools are only available for signed-in accounts.",
      tosUrl: getTosUrl(),
    });
    updateSettingsSummary();
    renderMessages();
    return;
  }
  if (state.config?.browserCheckRequired && !hasRecentBrowserCheckPass()) {
    els.sendButton.disabled = true;
    try {
      await ensureBrowserCheckProof("message");
    } catch (error) {
      els.sendButton.disabled = false;
      showToast(error.message || "Security check failed. Please try again.");
      return;
    }
    els.sendButton.disabled = false;
  }

  state.busy = true;
  els.sendButton.disabled = true;
  showNotificationPrompt();
  sendMessage.userDraft = null;
  const isTemporary = state.temporaryMode;
  let streamTarget = null;
  let messageList = state.messages;
  const shouldAutoHideSidebar = !isRegenerate && !isResend;

  try {
    const temporaryHistory = isTemporary
      ? state.messages
          .filter(
            (message) =>
              message.role === "user" || message.role === "assistant",
          )
          .slice(-(state.config?.limits?.contextMessages || 50))
          .map((message) => ({
            role: message.role,
            content: getVisibleMessageContent(message),
          }))
      : [];
    const chatId = isTemporary
      ? null
      : state.activeChatId || (await ensureChat());
    streamTarget = { isTemporary, chatId };
    if (shouldAutoHideSidebar) hideSidebarForActiveChat();
    const streamKey = streamTargetKey(streamTarget);
    const controller = new AbortController();
    messageList = isTemporary ? state.temporaryMessages : state.messages;
    state.activeStreams.set(streamKey, {
      target: streamTarget,
      messages: messageList,
      controller,
      stopped: false,
    });
    refreshBusyState();
    const filesToSend = isRegenerate || isResend ? [] : state.pendingFiles;
    const attachments = await Promise.all(filesToSend.map(readFilePayload));
    const publicAttachments = filesToSend.map((file) => ({
      name: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }));

    if (isResend) {
      const edited = messageList.find(
        (item) => item.id === options.resendMessageId,
      );
      messageList = messageList.filter((message) => {
        if (message.id === options.resendMessageId) {
          message.content = text;
          return true;
        }
        return (
          !edited?.createdAt ||
          !message.createdAt ||
          message.createdAt <= edited.createdAt
        );
      });
    } else if (isRegenerate) {
      messageList = messageList.filter(
        (message) => message.id !== options.regenerateMessageId,
      );
    } else {
      const userDraft = {
        role: "user",
        content: text || "[File upload]",
        attachments: publicAttachments,
      };
      messageList.push(userDraft);
      sendMessage.userDraft = userDraft;
    }
    setMessagesForStreamTarget(streamTarget, messageList);

    const assistantDraft = {
      role: "assistant",
      content: "",
      attachments: [],
      sources: [],
      activity: {
        thinking: [],
        research: [],
        sources: [],
      },
      streaming: true,
      loading: true,
      queueing: false,
      rawResponses: [],
      rawByteCount: 0,
      rawTruncated: false,
      rawStatus: "",
    };
    messageList.push(assistantDraft);
    setMessagesForStreamTarget(streamTarget, messageList);
    renderStreamTarget(streamTarget);

    els.messageInput.value = "";
    autoGrowInput();
    storageRemove(draftKeyBeforeSend);
    storageRemove(composerDraftKeyForCurrentView());
    if (!isRegenerate && !isResend) state.pendingFiles = [];
    renderAttachments();

    const payload = {
      message: text,
      attachments,
      modelId: els.modelSelect.value,
      personality: els.personalitySelect.value,
      userLanguage: navigator.language || navigator.userLanguage || "en-US",
      thinking: Boolean(state.user && els.thinkingToggle.checked),
      research: Boolean(
        state.user &&
        (els.researchToggle.checked || els.deepResearchToggle.checked),
      ),
      autoWeb: Boolean(state.user && els.autoWebToggle.checked),
      deepResearch: Boolean(state.user && els.deepResearchToggle.checked),
      agenticChat: Boolean(state.user && els.agenticToggle.checked),
      regenerateMessageId: options.regenerateMessageId || undefined,
      resendMessageId: options.resendMessageId || undefined,
      displayName: state.user?.displayName || state.user?.email || "Guest",
      history: temporaryHistory,
      stream: true,
      browserProof: state.browserProof,
    };

    let donePayload = null;
    let policyHandled = false;
    const endpoint = isTemporary
      ? "/temporary/messages"
      : `/chats/${chatId}/messages`;
    await streamApi(
      endpoint,
      payload,
      (event, data) => {
        if (event === "policy") {
          policyHandled = true;
          updateAccountStatus(data.accountStatus);
          messageList = messageList.filter(
            (message) => message !== assistantDraft,
          );
          messageList.push({
            type: "policy",
            content:
              data.policyViolation?.message ||
              "This prompt is against the Terms of Service.",
            tosUrl: data.policyViolation?.tosUrl || getTosUrl(),
          });
          setMessagesForStreamTarget(streamTarget, messageList);
          renderStreamTarget(streamTarget);
          return;
        }

        if (event === "message_ids") {
          if (data.userMessageId && sendMessage.userDraft) {
            sendMessage.userDraft.id = data.userMessageId;
            sendMessage.userDraft.createdAt = Date.now();
          }
          if (data.assistantMessageId) {
            assistantDraft.id = data.assistantMessageId;
            assistantDraft.createdAt = Date.now();
          }
          if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
          return;
        }

        if (event === "queue_status") {
          assistantDraft.queueing = data.active !== false;
          if (data.active) assistantDraft.loading = true;
          if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
          return;
        }

        if (event === "research_status") {
          assistantDraft.loading = false;
          assistantDraft.queueing = false;
          assistantDraft.activity.research.push({
            message: data.message || "Researching...",
            summary: data.summary || data.message || "Researching...",
          });
          assistantDraft.activity.research =
            assistantDraft.activity.research.slice(-8);
          if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
          return;
        }

        if (event === "thinking_status") {
          assistantDraft.loading = false;
          assistantDraft.queueing = false;
          assistantDraft.activity.thinking.push({
            message: data.message || "Thinking...",
            summary: data.summary || data.message || "Thinking...",
          });
          assistantDraft.activity.thinking =
            assistantDraft.activity.thinking.slice(-6);
          if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
          return;
        }

        if (event === "research_source") {
          if (data.source) {
            assistantDraft.activity.sources = [
              ...assistantDraft.activity.sources.filter(
                (source) => source.url !== data.source.url,
              ),
              data.source,
            ].slice(-8);
          }
          if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
          return;
        }

        if (event === "sources") {
          assistantDraft.sources = data.sources || [];
          assistantDraft.activity.sources =
            data.sources || assistantDraft.activity.sources;
          if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
          return;
        }

        if (event === "raw_status") {
          if (!state.user?.isAdmin) return;
          assistantDraft.rawStatus = String(data.message || "");
          assistantDraft.rawByteCount = Number(data.totalBytes || assistantDraft.rawByteCount || 0);
          if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
          return;
        }

        if (event === "raw_response") {
          if (!state.user?.isAdmin) return;
          assistantDraft.rawStatus = "";
          assistantDraft.rawResponses = [
            ...(assistantDraft.rawResponses || []),
            {
              index: Number(data.index || 0),
              text: String(data.text || ""),
            },
          ].slice(-400);
          assistantDraft.rawByteCount = Number(data.totalBytes || 0);
          if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
          return;
        }

        if (event === "raw_limit") {
          if (!state.user?.isAdmin) return;
          assistantDraft.rawTruncated = Boolean(data.truncated);
          assistantDraft.rawByteCount = Number(data.totalBytes || 0);
          if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
          return;
        }

        if (event === "delta") {
          assistantDraft.loading = false;
          assistantDraft.queueing = false;
          assistantDraft.content += data.delta || "";
          const visibleContent = getVisibleMessageContent(assistantDraft);
          const toolCall =
            parseToolBlock(assistantDraft.content) ||
            guessPartialToolBlock(assistantDraft.content);
          const toolActivity = describeToolActivity(toolCall);
          if (toolActivity && !visibleContent.trim()) {
            assistantDraft.activity.thinking = [];
            assistantDraft.activity.research = [];
            assistantDraft.activity.sources = [];
            assistantDraft.activity[toolActivity.kind] = [
              {
                message: toolActivity.summary,
                summary: toolActivity.summary,
              },
            ];
          } else if (visibleContent.trim()) {
            assistantDraft.activity.thinking = [];
            assistantDraft.activity.research = [];
            assistantDraft.activity.sources = [];
          }
          if (
            isStreamTargetActive(streamTarget) &&
            !updateStreamingMessageContent(assistantDraft)
          ) {
            scheduleRenderMessages();
          }
          return;
        }

        if (event === "error") {
          if (data.accountStatus) updateAccountStatus(data.accountStatus);
          throw Object.assign(
            new Error(data.error || "Ask could not respond."),
            { data },
          );
        }

        if (event === "stopped") {
          assistantDraft.loading = false;
          assistantDraft.streaming = false;
          assistantDraft.queueing = false;
          assistantDraft.activity.thinking = [];
          assistantDraft.activity.research = [];
          assistantDraft.activity.sources = [];
          assistantDraft.content =
            getVisibleMessageContent(assistantDraft) || "Stopped.";
          return;
        }

        if (event === "done") {
          donePayload = data;
        }
      },
      { signal: controller.signal },
    );

    if (donePayload?.policyViolation && !policyHandled) {
      updateAccountStatus(donePayload.accountStatus);
      messageList = messageList.filter((message) => message !== assistantDraft);
      messageList.push({
        type: "policy",
        content: donePayload.policyViolation.message,
        tosUrl: donePayload.policyViolation.tosUrl,
      });
    } else if (donePayload?.policyViolation) {
      updateAccountStatus(donePayload.accountStatus);
      messageList = messageList.filter((message) => message !== assistantDraft);
    } else if (donePayload?.message) {
      if (donePayload.userMessageId && sendMessage.userDraft) {
        sendMessage.userDraft.id = donePayload.userMessageId;
        sendMessage.userDraft.createdAt = Date.now();
      }
      Object.assign(assistantDraft, donePayload.message, {
        loading: false,
        streaming: false,
        queueing: false,
      });
      assistantDraft.activity.thinking = [];
      assistantDraft.activity.research = [];
      assistantDraft.activity.sources = [];
      notifyGenerationDone(streamTarget, assistantDraft);
    } else {
      assistantDraft.loading = false;
      assistantDraft.streaming = false;
      assistantDraft.queueing = false;
      assistantDraft.activity.thinking = [];
      assistantDraft.activity.research = [];
      assistantDraft.activity.sources = [];
    }
    setMessagesForStreamTarget(streamTarget, messageList);

    updateUsage(donePayload?.usage);
    updateAccountStatus(donePayload?.accountStatus || state.accountStatus);
    rememberBrowserCheckPass();
    resetBrowserCheck("message");
    if (isTemporary) {
      state.temporaryMessages = messageList;
      renderChats();
    } else {
      await fetchChats();
      if (isStreamTargetActive(streamTarget) && state.activeChatId) {
        replaceHashWithoutRouting(chatUrl(state.activeChatId));
      }
    }
  } catch (error) {
    const target =
      streamTarget ||
      (isTemporary
        ? { isTemporary: true, chatId: null }
        : { isTemporary: false, chatId: state.activeChatId });
    const stream = state.activeStreams.get(streamTargetKey(target));
    if (stream?.stopped || error.name === "AbortError") {
      setMessagesForStreamTarget(target, stream?.messages || state.messages);
      resetBrowserCheck("message");
      return;
    }
    const nextMessages = (stream?.messages || state.messages).filter(
      (message) => !message.loading && !message.streaming,
    );
    setMessagesForStreamTarget(target, nextMessages);
    resetBrowserCheck("message");
    if (error.status === 403) forgetBrowserCheckPass();
    if (error.data?.usage) updateUsage(error.data.usage);
    if (error.data?.accountStatus)
      updateAccountStatus(error.data.accountStatus);
    showToast(error.message || "Ask could not respond.");
  } finally {
    const target =
      streamTarget ||
      (isTemporary
        ? { isTemporary: true, chatId: null }
        : { isTemporary: false, chatId: state.activeChatId });
    state.activeStreams.delete(streamTargetKey(target));
    refreshBusyState();
    els.messages.classList.toggle("streaming-render", isCurrentViewStreaming());
    renderStreamTarget(target);
    queueMathTypeset();
  }
};

const openAuthModal = () => {
  showWithMotion(els.authModal);
  clearBrowserCheckStatus("auth");
  els.authEmail.focus();
};

const closeAuthModal = () => {
  hideWithMotion(els.authModal);
  els.authError.textContent = "";
};

const openAccountModal = () => {
  renderAccountWindow();
  showWithMotion(els.accountModal);
};

const closeAccountModal = () => {
  hideWithMotion(els.accountModal);
};

const getSpeechRecognitionConstructor = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition;

const voiceModelLabel = () =>
  state.config?.voice?.modelName || "Gatita 5.1";

const voiceInputLabel = () =>
  state.voice.inputMode === "server"
    ? "Server speech detection"
    : voiceModelLabel();

const setVoiceStatus = (status, substatus = voiceModelLabel()) => {
  if (els.voiceStatus) els.voiceStatus.textContent = status;
  if (els.voiceSubstatus) els.voiceSubstatus.textContent = substatus;
};

const isBraveBrowser = async () => {
  try {
    return Boolean(await navigator.brave?.isBrave?.());
  } catch (_) {
    return Boolean(navigator.brave);
  }
};

const hasServerSpeechDetection = () =>
  state.config?.voice?.stt?.configured !== false;

const getVoiceInputMode = async () => {
  if (state.voice.inputMode === "server" || state.voice.inputMode === "speech") {
    return state.voice.inputMode;
  }
  const Recognition = getSpeechRecognitionConstructor();
  if (!Recognition && hasServerSpeechDetection()) return "server";
  if ((await isBraveBrowser()) && hasServerSpeechDetection()) return "server";
  return "speech";
};

const renderVoiceTranscript = () => {
  if (!els.voiceTranscript) return;
  const pending = [state.voice.pendingText, state.voice.pendingInterim]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const rows = [
    ...state.voice.history,
    pending ? { role: "user", content: pending, pending: true } : null,
  ].filter(Boolean);

  els.voiceTranscript.innerHTML = rows.length
    ? rows
        .slice(-12)
        .map(
          (item) => `
            <article class="voice-line ${item.role === "assistant" ? "assistant" : "user"}${item.pending ? " pending" : ""}">
              <span>${item.role === "assistant" ? "Gatita" : "You"}</span>
              <p>${escapeHtml(item.content)}</p>
            </article>
          `,
        )
        .join("")
    : '<p class="voice-empty">Voice beta</p>';
  els.voiceTranscript.scrollTop = els.voiceTranscript.scrollHeight;
};

const updateVoiceUi = () => {
  const active = state.voice.active;
  const modal = els.voiceModal;
  modal?.classList.toggle("listening", state.voice.listening);
  modal?.classList.toggle("thinking", state.voice.thinking);
  modal?.classList.toggle("speaking", state.voice.speaking);
  modal?.classList.toggle("muted", state.voice.muted);
  modal?.classList.toggle("transcribing", state.voice.captureBusy);
  els.voiceCallButton?.setAttribute("aria-pressed", active ? "true" : "false");
  if (els.voiceMuteButton) {
    els.voiceMuteButton.setAttribute(
      "aria-label",
      state.voice.muted ? "Unmute microphone" : "Mute microphone",
    );
    els.voiceMuteButton.innerHTML = state.voice.muted
      ? '<i data-lucide="mic-off"></i>'
      : '<i data-lucide="mic"></i>';
  }

  if (state.voice.muted) {
    setVoiceStatus("Muted");
  } else if (state.voice.speaking) {
    setVoiceStatus("Speaking");
  } else if (state.voice.thinking) {
    setVoiceStatus("Thinking");
  } else if (state.voice.captureBusy) {
    setVoiceStatus("Transcribing", "Server speech detection");
  } else if (state.voice.listening) {
    setVoiceStatus("Listening", voiceInputLabel());
  } else if (active) {
    setVoiceStatus("Ready", voiceInputLabel());
  }
  iconRefresh();
};

const stopVoiceAudio = () => {
  if (state.voice.audio) {
    state.voice.audio.pause?.();
    state.voice.audio.src = "";
    state.voice.audio = null;
  }
  window.speechSynthesis?.cancel?.();
  state.voice.speaking = false;
};

const stopVoiceRecognition = () => {
  state.voice.requestedStop = true;
  window.clearTimeout(state.voice.restartTimer);
  try {
    state.voice.recognition?.stop?.();
  } catch (_) {}
  state.voice.listening = false;
};

const stopVoiceCapture = () => {
  state.voice.captureRecording = false;
  state.voice.captureChunks = [];
  if (state.voice.captureProcessor) {
    try {
      state.voice.captureProcessor.disconnect();
    } catch (_) {}
  }
  if (state.voice.captureSource) {
    try {
      state.voice.captureSource.disconnect();
    } catch (_) {}
  }
  if (state.voice.captureContext) {
    try {
      state.voice.captureContext.close?.();
    } catch (_) {}
  }
  if (state.voice.captureStream) {
    try {
      state.voice.captureStream.getTracks?.().forEach((track) => track.stop?.());
    } catch (_) {}
  }
  state.voice.captureStream = null;
  state.voice.captureContext = null;
  state.voice.captureSource = null;
  state.voice.captureProcessor = null;
  state.voice.captureStartedAt = 0;
  state.voice.captureLastSpeechAt = 0;
  state.voice.captureSampleRate = 0;
  state.voice.listening = false;
};

const scheduleVoiceRestart = (delay = 350) => {
  window.clearTimeout(state.voice.restartTimer);
  if (
    !state.voice.active ||
    state.voice.muted ||
    state.voice.thinking ||
    state.voice.speaking ||
    state.voice.captureBusy
  ) {
    return;
  }
  state.voice.restartTimer = window.setTimeout(() => {
    startVoiceInput();
  }, delay);
};

const isVoiceTurnUnfinished = (text) => {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return true;
  if (/[,.!?;:]$/.test(normalized)) return false;
  return /(\b(uh|um|erm|hmm|like|and|or|but|because|so|for|to|a|an|the|of|with|about|on|in|at|from|into|by)|\.\.\.)$/.test(
    normalized,
  );
};

const getVoiceTurnDelay = (text) => {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (isVoiceTurnUnfinished(text)) return VOICE_TURN_MAX_PAUSE_MS;
  if (/[.!?]$/.test(text.trim())) return 700;
  if (words.length >= 10) return VOICE_TURN_MIN_PAUSE_MS;
  return VOICE_TURN_LONG_PAUSE_MS;
};

const scheduleVoiceTurnDetection = () => {
  window.clearTimeout(state.voice.turnTimer);
  if (!state.voice.active || state.voice.muted || state.voice.thinking) return;
  const text = state.voice.pendingText.trim();
  if (!text || state.voice.pendingInterim) return;
  state.voice.turnTimer = window.setTimeout(() => {
    const readyText = state.voice.pendingText.trim();
    if (!readyText || state.voice.pendingInterim || state.voice.thinking) {
      return;
    }
    sendVoiceTurn(readyText).catch((error) => {
      showToast(error.message || "Voice could not respond.");
      state.voice.thinking = false;
      updateVoiceUi();
      scheduleVoiceRestart();
    });
  }, getVoiceTurnDelay(text));
};

const flattenFloat32Chunks = (chunks) => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const samples = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    samples.set(chunk, offset);
    offset += chunk.length;
  }
  return samples;
};

const resampleFloat32 = (samples, fromRate, toRate = 16000) => {
  const inputRate = Number(fromRate || 0);
  if (!samples.length || !inputRate || Math.abs(inputRate - toRate) < 1) {
    return samples;
  }
  const outputLength = Math.max(1, Math.round((samples.length * toRate) / inputRate));
  const output = new Float32Array(outputLength);
  const ratio = inputRate / toRate;
  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const left = Math.floor(sourceIndex);
    const right = Math.min(samples.length - 1, left + 1);
    const mix = sourceIndex - left;
    output[index] = samples[left] * (1 - mix) + samples[right] * mix;
  }
  return output;
};

const float32ToPcm16Base64 = (samples) => {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(
      index * 2,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true,
    );
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

const transcribeVoiceAudio = async (chunks, sampleRate) => {
  const samples = flattenFloat32Chunks(chunks);
  if (!samples.length) return "";
  const targetSampleRate = 16000;
  const normalizedSamples = resampleFloat32(samples, sampleRate, targetSampleRate);
  const audioPcm = float32ToPcm16Base64(normalizedSamples);
  if (state.config?.browserCheckRequired && !hasRecentBrowserCheckPass()) {
    await ensureBrowserCheckProof("message");
  }
  const data = await apiFetch("/voice/transcribe", {
    method: "POST",
    body: JSON.stringify({
      audioPcm,
      sampleRateHertz: targetSampleRate,
      languageCode: navigator.language || navigator.userLanguage || "en-US",
      browserProof: state.browserProof,
    }),
  });
  if (data.accountStatus) updateAccountStatus(data.accountStatus);
  rememberBrowserCheckPass();
  resetBrowserCheck("message");
  return String(data.text || "").trim();
};

async function finalizeVoiceCapture() {
  if (!state.voice.captureRecording || state.voice.captureBusy) return;

  const chunks = state.voice.captureChunks.slice();
  const sampleRate = state.voice.captureSampleRate || 16000;
  const elapsed = performance.now() - state.voice.captureStartedAt;
  state.voice.captureRecording = false;
  state.voice.captureChunks = [];
  if (!chunks.length || elapsed < VOICE_CAPTURE_MIN_MS) return;

  state.voice.captureBusy = true;
  stopVoiceCapture();
  updateVoiceUi();
  setVoiceStatus("Transcribing", "Server speech detection");

  try {
    const text = await transcribeVoiceAudio(chunks, sampleRate);
    if (text) {
      await sendVoiceTurn(text);
      return;
    }
    setVoiceStatus("Could not hear that", "Try speaking a little closer");
  } catch (error) {
    state.voice.thinking = false;
    showToast(error.message || "Voice transcription could not start.");
    renderVoiceTranscript();
    updateVoiceUi();
    setVoiceStatus("Voice paused", "Tap the mic to resume");
  } finally {
    state.voice.captureBusy = false;
    updateVoiceUi();
    if (
      state.voice.active &&
      !state.voice.muted &&
      !state.voice.thinking &&
      !state.voice.speaking
    ) {
      scheduleVoiceRestart(450);
    }
  }
}

function handleVoiceAudioProcess(event) {
  const output = event.outputBuffer?.getChannelData?.(0);
  if (output) output.fill(0);
  if (
    !state.voice.active ||
    state.voice.muted ||
    state.voice.thinking ||
    state.voice.speaking ||
    state.voice.captureBusy
  ) {
    return;
  }

  const input = event.inputBuffer?.getChannelData?.(0);
  if (!input?.length) return;

  let sum = 0;
  for (let index = 0; index < input.length; index += 1) {
    sum += input[index] * input[index];
  }
  const now = performance.now();
  const rms = Math.sqrt(sum / input.length);
  const hasSpeech = rms >= VOICE_CAPTURE_RMS_THRESHOLD;

  if (hasSpeech) {
    state.voice.captureLastSpeechAt = now;
    if (!state.voice.captureRecording) {
      state.voice.captureRecording = true;
      state.voice.captureStartedAt = now;
      state.voice.captureChunks = [];
    }
  }

  if (!state.voice.captureRecording) return;

  state.voice.captureChunks.push(new Float32Array(input));
  const elapsed = now - state.voice.captureStartedAt;
  const silence = now - state.voice.captureLastSpeechAt;
  const hasCompletePause =
    elapsed >= VOICE_CAPTURE_MIN_MS && silence >= VOICE_CAPTURE_SILENCE_MS;
  if (hasCompletePause || elapsed >= VOICE_CAPTURE_MAX_MS) {
    finalizeVoiceCapture().catch((error) => {
      showToast(error.message || "Voice transcription could not start.");
      state.voice.captureBusy = false;
      scheduleVoiceRestart(450);
    });
  }
}

async function startVoiceCapture() {
  if (
    !state.voice.active ||
    state.voice.muted ||
    state.voice.thinking ||
    state.voice.speaking ||
    state.voice.captureBusy
  ) {
    return false;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setVoiceStatus("Microphone unavailable", "Use a browser with mic capture");
    return false;
  }
  if (state.voice.captureStream) {
    state.voice.listening = true;
    updateVoiceUi();
    return true;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) throw new Error("Audio capture is unavailable.");
    const context = new AudioContextCtor();
    await context.resume?.();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(2048, 1, 1);
    processor.onaudioprocess = handleVoiceAudioProcess;
    source.connect(processor);
    processor.connect(context.destination);

    state.voice.requestedStop = false;
    state.voice.captureStream = stream;
    state.voice.captureContext = context;
    state.voice.captureSource = source;
    state.voice.captureProcessor = processor;
    state.voice.captureSampleRate = context.sampleRate || 16000;
    state.voice.listening = true;
    state.voice.recognitionFastEndCount = 0;
    updateVoiceUi();
    return true;
  } catch (error) {
    state.voice.muted = true;
    state.voice.listening = false;
    updateVoiceUi();
    setVoiceStatus("Microphone blocked", "Check browser permissions");
    return false;
  }
}

async function startVoiceInput() {
  if (
    !state.voice.active ||
    state.voice.muted ||
    state.voice.thinking ||
    state.voice.speaking ||
    state.voice.captureBusy
  ) {
    return false;
  }
  const mode = await getVoiceInputMode();
  state.voice.inputMode = mode;
  if (mode === "server") return startVoiceCapture();
  return startVoiceRecognition();
}

const ensureVoiceRecognition = () => {
  if (state.voice.recognition) return state.voice.recognition;
  const Recognition = getSpeechRecognitionConstructor();
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || navigator.userLanguage || "en-US";

  recognition.onstart = () => {
    state.voice.requestedStop = false;
    state.voice.recognitionStartedAt = performance.now();
    state.voice.recognitionHadResult = false;
    state.voice.listening = true;
    updateVoiceUi();
  };

  recognition.onresult = (event) => {
    if (!state.voice.active || state.voice.thinking || state.voice.speaking) {
      return;
    }
    state.voice.recognitionHadResult = true;
    state.voice.recognitionFastEndCount = 0;
    let finalText = "";
    let interimText = "";
    for (let index = event.resultIndex; index < event.results.length; index++) {
      const result = event.results[index];
      const transcript = result?.[0]?.transcript || "";
      if (result.isFinal) finalText += ` ${transcript}`;
      else interimText += ` ${transcript}`;
    }
    if (finalText.trim()) {
      state.voice.pendingText = [state.voice.pendingText, finalText]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }
    state.voice.pendingInterim = interimText.replace(/\s+/g, " ").trim();
    renderVoiceTranscript();
    scheduleVoiceTurnDetection();
  };

  recognition.onerror = (event) => {
    if (state.voice.requestedStop) return;
    if (event.error === "no-speech") {
      scheduleVoiceRestart(500);
      return;
    }
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      state.voice.muted = true;
      state.voice.listening = false;
      updateVoiceUi();
      setVoiceStatus("Microphone blocked", "Check browser permissions");
    } else {
      state.voice.listening = false;
      updateVoiceUi();
      setVoiceStatus("Voice paused", "Tap the mic to resume");
    }
  };

  recognition.onend = () => {
    const endedQuickly =
      performance.now() - Number(state.voice.recognitionStartedAt || 0) < 900;
    state.voice.listening = false;
    updateVoiceUi();
    if (
      !state.voice.requestedStop &&
      endedQuickly &&
      !state.voice.recognitionHadResult &&
      hasServerSpeechDetection()
    ) {
      state.voice.recognitionFastEndCount += 1;
      if (state.voice.recognitionFastEndCount >= 2) {
        state.voice.inputMode = "server";
        setVoiceStatus("Listening", "Server speech detection");
        startVoiceInput();
        return;
      }
    }
    if (!state.voice.requestedStop) scheduleVoiceRestart();
  };

  state.voice.recognition = recognition;
  return recognition;
};

function startVoiceRecognition() {
  const recognition = ensureVoiceRecognition();
  if (!recognition) {
    setVoiceStatus("Speech unavailable", "Use Chrome or Edge for voice beta");
    return false;
  }
  if (
    !state.voice.active ||
    state.voice.muted ||
    state.voice.thinking ||
    state.voice.speaking ||
    state.voice.listening
  ) {
    return false;
  }
  try {
    state.voice.requestedStop = false;
    recognition.start();
    return true;
  } catch (_) {
    return false;
  }
}

const speakWithBrowserFallback = (text) =>
  new Promise((resolve) => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = navigator.language || "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = finish;
    utterance.onerror = finish;
    const timer = window.setTimeout(
      finish,
      Math.min(12000, Math.max(1600, String(text || "").length * 70)),
    );
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });

const playVoiceReply = async (text, audio) => {
  stopVoiceAudio();
  state.voice.speaking = true;
  updateVoiceUi();

  if (audio?.data && audio?.contentType) {
    const player = new Audio(`data:${audio.contentType};base64,${audio.data}`);
    state.voice.audio = player;
    await new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve();
      };
      const timer = window.setTimeout(finish, 45000);
      player.onended = finish;
      player.onerror = finish;
      player.play().catch(finish);
    });
  } else {
    await speakWithBrowserFallback(text);
  }

  state.voice.speaking = false;
  state.voice.audio = null;
  updateVoiceUi();
  scheduleVoiceRestart();
};

async function sendVoiceTurn(text) {
  const message = text.trim();
  if (!message || state.voice.thinking) return;
  stopVoiceRecognition();
  stopVoiceCapture();
  state.voice.pendingText = "";
  state.voice.pendingInterim = "";
  const historyBeforeTurn = state.voice.history.slice(-8);
  state.voice.history.push({ role: "user", content: message });
  state.voice.thinking = true;
  renderVoiceTranscript();
  updateVoiceUi();

  if (state.config?.browserCheckRequired && !hasRecentBrowserCheckPass()) {
    await ensureBrowserCheckProof("message");
  }

  const data = await apiFetch("/voice/respond", {
    method: "POST",
    body: JSON.stringify({
      message,
      history: historyBeforeTurn,
      displayName: state.user?.displayName || state.user?.email || "Guest",
      userLanguage: navigator.language || navigator.userLanguage || "en-US",
      browserProof: state.browserProof,
    }),
  });

  state.voice.thinking = false;
  if (data.accountStatus) updateAccountStatus(data.accountStatus);
  if (data.usage) updateUsage(data.usage);
  rememberBrowserCheckPass();
  resetBrowserCheck("message");

  if (data.policyViolation) {
    const policyText =
      data.policyViolation.message || "That request is not available in voice.";
    state.voice.history.push({ role: "assistant", content: policyText });
    renderVoiceTranscript();
    updateVoiceUi();
    await playVoiceReply(policyText, null);
    return;
  }

  const reply = data.message?.content || "I could not answer that.";
  state.voice.history.push({ role: "assistant", content: reply });
  renderVoiceTranscript();
  updateVoiceUi();
  if (data.ttsError && !data.audio && !state.voice.fallbackNotified) {
    state.voice.fallbackNotified = true;
    showToast("Server voice is in fallback mode.");
  }
  await playVoiceReply(reply, data.audio);
}

const openVoiceCall = async () => {
  state.voice.active = true;
  state.voice.muted = false;
  state.voice.inputMode = "auto";
  state.voice.recognitionFastEndCount = 0;
  state.voice.recognitionHadResult = false;
  state.voice.pendingText = "";
  state.voice.pendingInterim = "";
  showWithMotion(els.voiceModal);
  hideSidebarForActiveChat();
  renderVoiceTranscript();
  updateVoiceUi();
  await startVoiceInput();
};

const closeVoiceCall = () => {
  state.voice.active = false;
  state.voice.muted = false;
  state.voice.thinking = false;
  state.voice.pendingText = "";
  state.voice.pendingInterim = "";
  window.clearTimeout(state.voice.turnTimer);
  stopVoiceRecognition();
  stopVoiceCapture();
  stopVoiceAudio();
  state.voice.inputMode = "auto";
  state.voice.captureBusy = false;
  state.voice.recognitionFastEndCount = 0;
  state.voice.recognitionHadResult = false;
  hideWithMotion(els.voiceModal);
  updateVoiceUi();
};

const toggleVoiceMute = () => {
  if (!state.voice.active) return;
  state.voice.muted = !state.voice.muted;
  if (state.voice.muted) {
    stopVoiceRecognition();
    stopVoiceCapture();
  } else {
    startVoiceInput();
  }
  updateVoiceUi();
};

const isCompactViewport = () =>
  window.matchMedia?.(COMPACT_SHELL_QUERY)?.matches ||
  window.innerWidth <= COMPACT_SHELL_WIDTH;

const hideSidebarForActiveChat = () => {
  document.body.classList.add("sidebar-collapsed");
  delete document.body.dataset.sidebarUserToggled;
  updateSidebarScrim();
};

const updateSidebarScrim = () => {
  const scrim = els.sidebarScrim;
  if (!scrim) return;
  if (!isCompactViewport()) {
    scrim.classList.add("hidden");
    scrim.classList.remove("show");
    return;
  }
  scrim.classList.remove("hidden");
  scrim.classList.toggle(
    "show",
    !document.body.classList.contains("sidebar-collapsed"),
  );
};

const closeSidebarOnCompact = () => {
  if (!isCompactViewport()) return;
  hideSidebarForActiveChat();
};

const syncResponsiveShell = () => {
  if (!isCompactViewport()) {
    document.body.classList.remove("sidebar-collapsed");
    delete document.body.dataset.sidebarUserToggled;
    updateSidebarScrim();
    return;
  }
  if (!document.body.dataset.sidebarUserToggled) {
    document.body.classList.add("sidebar-collapsed");
  }
  updateSidebarScrim();
};

const toggleSidebar = () => {
  document.body.dataset.sidebarUserToggled = "1";
  document.body.classList.toggle("sidebar-collapsed");
  updateSidebarScrim();
};

const setAuthMode = (mode) => {
  state.authMode = mode;
  document.querySelectorAll(".auth-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });
  document.querySelectorAll(".register-only").forEach((item) => {
    item.classList.toggle("hidden", mode !== "register");
  });
  els.authPassword.autocomplete =
    mode === "login" ? "current-password" : "new-password";
};

const submitAuth = async () => {
  els.authError.textContent = "";
  if (state.config?.browserCheckRequired) {
    try {
      await ensureBrowserCheckProof("auth");
    } catch (error) {
      els.authError.textContent =
        error.message || "Security check failed. Please try again.";
      return;
    }
  }

  const isRegister = state.authMode === "register";
  const payload = {
    email: els.authEmail.value.trim(),
    password: els.authPassword.value,
    displayName: els.authDisplayName.value.trim(),
    browserProof: state.authBrowserProof,
  };

  try {
    const data = await apiFetch(isRegister ? "/auth/register" : "/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.authToken = data.token;
    storageSet("token", state.authToken);
    state.user = data.user;
    updateAccountStatus(data.accountStatus || null);
    updateAccount();
    resetBrowserCheck("auth");
    closeAuthModal();
    state.activeChatId = null;
    state.activeSharedToken = "";
    state.temporaryMode = false;
    state.messages = [];
    const postLoginRedirect = getPostLoginRedirect();
    if (postLoginRedirect) {
      window.location.assign(postLoginRedirect);
      return;
    }
    window.location.hash = newChatUrl();
    await fetchMe();
    await fetchChats();
    renderMessages();
    if (data.deletionCanceled) {
      showToast("Account deletion canceled.");
    }
  } catch (error) {
    resetBrowserCheck("auth");
    els.authError.textContent = error.message || "Unable to continue.";
  }
};

const resetSignedOutState = async () => {
  state.authToken = "";
  state.user = null;
  state.accountStatus = null;
  state.activeChatId = null;
  state.activeSharedToken = "";
  state.temporaryMode = false;
  state.messages = [];
  storageRemove("token");
  updateAccount();
  closeAccountModal();
  window.location.hash = newChatUrl();
  await fetchMe();
  await fetchChats();
  renderMessages();
};

const signOut = async () => {
  await apiFetch("/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  }).catch(() => {});
  await resetSignedOutState();
};

els.composer.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.busy) {
    stopActiveGeneration();
    return;
  }
  sendMessage();
});

els.messageInput.addEventListener("input", () => {
  autoGrowInput();
  saveComposerDraft();
});
els.messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (state.busy) {
      stopActiveGeneration();
      return;
    }
    sendMessage();
  }
});

els.messages.addEventListener("click", (event) => {
  const codeButton = event.target.closest("[data-copy-code]");
  if (codeButton) {
    const code =
      codeButton.closest("pre")?.querySelector("code")?.textContent || "";
    copyText(code);
    return;
  }

  const copyButton = event.target.closest("[data-copy-message]");
  if (copyButton) {
    const message = state.messages.find(
      (item) => item.id === Number(copyButton.dataset.copyMessage),
    );
    copyText(getVisibleMessageContent(message));
    return;
  }

  const regenerateButton = event.target.closest("[data-regenerate-message]");
  if (regenerateButton) {
    regenerateMessage(regenerateButton.dataset.regenerateMessage).catch(
      (error) => showToast(error.message),
    );
    return;
  }

  const editButton = event.target.closest("[data-edit-message]");
  if (editButton) {
    editAndResend(editButton.dataset.editMessage).catch((error) =>
      showToast(error.message),
    );
    return;
  }

  const deleteButton = event.target.closest("[data-delete-message]");
  if (deleteButton) {
    openActionModal({
      title: "Delete Message",
      message: "This message will be removed from the chat.",
      kind: "confirm",
      confirmText: "Delete",
      danger: true,
    }).then((confirmed) => {
      if (confirmed)
        deleteMessage(deleteButton.dataset.deleteMessage).catch((error) =>
          showToast(error.message),
        );
    });
    return;
  }

});

els.templateTray.addEventListener("click", (event) => {
  const button = event.target.closest("[data-template-id]");
  if (!button) return;
  const template = PROMPT_TEMPLATES[button.dataset.templateId];
  if (!template) return;
  els.messageInput.value = template;
  autoGrowInput();
  saveComposerDraft();
  els.messageInput.focus();
  pulseElement(els.composer);
});

els.attachButton.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", () => {
  const limit = state.config?.limits?.maxFiles || 5;
  const maxFileBytes = state.config?.limits?.maxFileBytes || 8 * 1024 * 1024;
  const selected = Array.from(els.fileInput.files || []);
  const accepted = [];

  for (const file of selected) {
    if (accepted.length + state.pendingFiles.length >= limit) break;
    if (file.size > maxFileBytes) {
      showToast(`${file.name} is too large.`);
      continue;
    }
    accepted.push(file);
  }

  state.pendingFiles = [...state.pendingFiles, ...accepted].slice(0, limit);
  els.fileInput.value = "";
  renderAttachments();
  if (accepted.length) pulseElement(els.composer);
});

els.chatSearchInput.addEventListener("input", () => {
  state.chatSearch = els.chatSearchInput.value.trim();
  clearTimeout(els.chatSearchInput.searchTimer);
  els.chatSearchInput.searchTimer = setTimeout(() => {
    fetchChats().catch((error) => showToast(error.message));
  }, 180);
});

els.attachmentRow.addEventListener("click", (event) => {
  const index = event.target?.dataset?.removeFile;
  if (index === undefined) return;
  state.pendingFiles.splice(Number(index), 1);
  renderAttachments();
});

els.chatList.addEventListener("click", (event) => {
  const temporaryButton = event.target.closest("[data-temporary-chat]");
  if (temporaryButton) {
    startTemporaryChat();
    closeSidebarOnCompact();
    return;
  }
  const newButton = event.target.closest("[data-new-chat]");
  if (newButton) {
    startNewChat();
    closeSidebarOnCompact();
    return;
  }
  const action = event.target.closest(".chat-actions button");
  if (action) {
    const chatId = Number(
      action.dataset.pinChat ||
        action.dataset.renameChat ||
        action.dataset.folderChat ||
        action.dataset.shareChat ||
        action.dataset.deleteChat,
    );
    const chat = state.chats.find((item) => item.id === chatId);
    if (!chat) return;
    if (action.dataset.pinChat) {
      updateChat(chatId, { pinned: !chat.pinned }).catch((error) =>
        showToast(error.message),
      );
    } else if (action.dataset.renameChat) {
      openActionModal({
        title: "Rename Chat",
        kind: "input",
        label: "Chat title",
        value: chat.title || "New chat",
        confirmText: "Rename",
        required: true,
        maxLength: 80,
      }).then((title) => {
        if (title !== null)
          updateChat(chatId, { title }).catch((error) =>
            showToast(error.message),
          );
      });
    } else if (action.dataset.folderChat) {
      openActionModal({
        title: "Move To Folder",
        message: "Leave this blank to move the chat back to Chats.",
        kind: "input",
        label: "Folder name",
        value: chat.folder || "",
        confirmText: "Move",
        maxLength: 60,
      }).then((folder) => {
        if (folder !== null)
          updateChat(chatId, { folder }).catch((error) =>
            showToast(error.message),
          );
      });
    } else if (action.dataset.shareChat) {
      shareChat(chatId).catch((error) => showToast(error.message));
    } else if (action.dataset.deleteChat) {
      openActionModal({
        title: "Delete Chat",
        message: `Delete "${chat.title || "New chat"}"? This removes the saved chat.`,
        kind: "confirm",
        confirmText: "Delete",
        danger: true,
      }).then((confirmed) => {
        if (confirmed)
          deleteChat(chatId).catch((error) => showToast(error.message));
      });
    }
    return;
  }
  const button = event.target.closest("[data-chat-id]");
  if (!button) return;
  window.location.hash = chatUrl(button.dataset.chatId);
  closeSidebarOnCompact();
});

els.chatList.addEventListener("pointerover", (event) => {
  if (event.pointerType === "touch") return;
  const row = event.target.closest(".chat-row.has-actions");
  if (!row || row.contains(event.relatedTarget)) return;
  clearTimeout(row._actionTimer);
  row._actionTimer = setTimeout(() => row.classList.add("actions-ready"), 420);
});

els.chatList.addEventListener("pointerout", (event) => {
  const row = event.target.closest(".chat-row.has-actions");
  if (!row || row.contains(event.relatedTarget)) return;
  clearTimeout(row._actionTimer);
  row.classList.remove("actions-ready");
});

els.chatList.addEventListener("pointerdown", (event) => {
  const row = event.target.closest(".chat-row.has-actions");
  if (!row || event.target.closest(".chat-actions")) return;
  if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
  clearTimeout(els.chatList._touchActionTimer);
  els.chatList._touchActionTimer = setTimeout(() => {
    document.querySelectorAll(".chat-row.actions-ready").forEach((item) => {
      if (item !== row) item.classList.remove("actions-ready");
    });
    row.classList.add("actions-ready");
  }, 520);
});

["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
  els.chatList.addEventListener(eventName, () => {
    clearTimeout(els.chatList._touchActionTimer);
  });
});

els.newChatButton.addEventListener("click", () => {
  startNewChat();
  closeSidebarOnCompact();
});

els.modelSelect.addEventListener("change", () => {
  storageSet("model", els.modelSelect.value);
  if (state.activeChatId)
    updateChat(state.activeChatId, { modelId: els.modelSelect.value }).catch(
      () => {},
    );
  renderCustomSelect("model");
  updateSettingsSummary();
});

els.personalitySelect.addEventListener("change", () => {
  storageSet("personality", els.personalitySelect.value);
  if (state.activeChatId)
    updateChat(state.activeChatId, {
      personality: els.personalitySelect.value,
    }).catch(() => {});
  renderCustomSelect("personality");
  updateSettingsSummary();
});

bindCustomSelect("model");
bindCustomSelect("personality");

els.thinkingToggle.addEventListener("change", () => {
  if (els.thinkingToggle.checked && !state.user) {
    els.thinkingToggle.checked = false;
    storageSet("thinking", "0");
    showToast("Sign in to use Thinking.");
    updateSettingsSummary();
    return;
  }
  storageSet("thinking", els.thinkingToggle.checked ? "1" : "0");
  updateSettingsSummary();
});

els.researchToggle.addEventListener("change", () => {
  if (els.researchToggle.checked && !state.user) {
    els.researchToggle.checked = false;
    storageSet("research", "0");
    showToast("Sign in to use Research.");
    updateSettingsSummary();
    return;
  }
  if (!els.researchToggle.checked) {
    els.deepResearchToggle.checked = false;
    storageSet("deep_research", "0");
  }
  storageSet("research", els.researchToggle.checked ? "1" : "0");
  updateSettingsSummary();
});

els.autoWebToggle.addEventListener("change", () => {
  if (els.autoWebToggle.checked && !state.user) {
    els.autoWebToggle.checked = false;
    storageSet("auto_web", "0");
    showToast("Sign in to use Auto web check.");
    updateSettingsSummary();
    return;
  }
  storageSet("auto_web", els.autoWebToggle.checked ? "1" : "0");
  updateSettingsSummary();
});

els.deepResearchToggle.addEventListener("change", () => {
  if (els.deepResearchToggle.checked && !state.user) {
    els.deepResearchToggle.checked = false;
    storageSet("deep_research", "0");
    showToast("Sign in to use Deep research.");
    updateSettingsSummary();
    return;
  }
  if (els.deepResearchToggle.checked) {
    els.researchToggle.checked = true;
    storageSet("research", "1");
  }
  storageSet("deep_research", els.deepResearchToggle.checked ? "1" : "0");
  updateSettingsSummary();
});

els.agenticToggle.addEventListener("change", () => {
  if (els.agenticToggle.checked && !state.user) {
    els.agenticToggle.checked = false;
    storageSet("agentic_chat", "0");
    showToast("Sign in to use Gatita Agent.");
    updateSettingsSummary();
    return;
  }
  storageSet("agentic_chat", els.agenticToggle.checked ? "1" : "0");
  updateSettingsSummary();
});

els.settingsButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleSettingsMenu();
});

els.settingsMenu.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.closest?.(".custom-select-shell")) closeCustomSelects();
});

els.sidebarToggleButton.addEventListener("click", toggleSidebar);
els.sidebarScrim?.addEventListener("click", closeSidebarOnCompact);
els.voiceCallButton?.addEventListener("click", openVoiceCall);
els.voiceCloseButton?.addEventListener("click", closeVoiceCall);
els.voiceEndButton?.addEventListener("click", closeVoiceCall);
els.voiceMuteButton?.addEventListener("click", toggleVoiceMute);
els.voiceModal?.addEventListener("click", (event) => {
  if (event.target === els.voiceModal) closeVoiceCall();
});
els.updatesButton.addEventListener("click", () => {
  openUpdatesModal();
});
els.closeUpdatesButton.addEventListener("click", closeUpdatesModal);
els.updatesModal.addEventListener("click", (event) => {
  if (event.target === els.updatesModal) closeUpdatesModal();
});
els.updatesForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.updatesError.textContent = "";
  try {
    await apiFetch("/updates", {
      method: "POST",
      body: JSON.stringify({
        title: els.updateTitleInput.value,
        content: els.updateContentInput.value,
      }),
    });
    els.updateTitleInput.value = "";
    els.updateContentInput.value = "";
    await fetchUpdates();
    showToast("Update posted.");
  } catch (error) {
    els.updatesError.textContent = error.message || "Could not post update.";
  }
});

document.addEventListener(
  "pointerdown",
  (event) => {
    const target = event.target;
    const sidebar = els.chatList?.closest(".chat-sidebar");
    if (
      isCompactViewport() &&
      !document.body.classList.contains("sidebar-collapsed") &&
      !eventIncludesElement(event, sidebar) &&
      !eventIncludesElement(event, els.sidebarToggleButton)
    ) {
      closeSidebarOnCompact();
    }
    if (!target.closest?.(".custom-select-shell")) closeCustomSelects();
    if (!target.closest?.(".chat-row")) {
      document
        .querySelectorAll(".chat-row.actions-ready")
        .forEach((row) => row.classList.remove("actions-ready"));
    }
    if (!isSettingsMenuOpen()) return;
    if (
      eventIncludesElement(event, els.settingsMenu) ||
      eventIncludesElement(event, els.settingsButton)
    )
      return;
    closeSettingsMenu();
  },
  true,
);

const isEditableShortcutTarget = (target) =>
  Boolean(
    target?.closest?.(
      'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]',
    ),
  );

const browserEditShortcutKeys = new Set([
  "a",
  "c",
  "v",
  "x",
  "y",
  "z",
  "insert",
]);

document.addEventListener("keydown", (event) => {
  const isModifier = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();
  if (
    isModifier &&
    (isEditableShortcutTarget(event.target) || browserEditShortcutKeys.has(key))
  ) {
    return;
  }
  if (isModifier && key === "k") {
    event.preventDefault();
    els.messageInput.focus();
    return;
  }
  if (isModifier && key === "n") {
    event.preventDefault();
    startNewChat();
    return;
  }
  if (isModifier && key === "b") {
    event.preventDefault();
    toggleSidebar();
    return;
  }
  if (event.key !== "Escape") return;
  if (
    !els.banModal.classList.contains("hidden") ||
    !els.strikeModal.classList.contains("hidden")
  )
    return;
  closeCustomSelects();
  if (isSettingsMenuOpen()) closeSettingsMenu();
  if (!els.actionModal.classList.contains("hidden")) closeActionModal(null);
  if (!els.notificationPromptModal.classList.contains("hidden"))
    closeNotificationPrompt();
  if (!els.updatesModal.classList.contains("hidden")) closeUpdatesModal();
  if (!els.accountModal.classList.contains("hidden")) closeAccountModal();
  if (!els.voiceModal.classList.contains("hidden")) closeVoiceCall();
  if (!els.authModal.classList.contains("hidden")) closeAuthModal();
  if (isCompactViewport() && !document.body.classList.contains("sidebar-collapsed"))
    closeSidebarOnCompact();
});

els.accountButton.addEventListener("click", () => {
  if (state.user) {
    openAccountModal();
  } else {
    openAuthModal();
  }
});

els.closeAuthButton.addEventListener("click", closeAuthModal);
els.authModal.addEventListener("click", (event) => {
  if (event.target === els.authModal) closeAuthModal();
});
els.closeAccountButton.addEventListener("click", closeAccountModal);
els.accountModal.addEventListener("click", (event) => {
  if (event.target === els.accountModal) closeAccountModal();
});
els.accountSignOutButton.addEventListener("click", () => {
  signOut().catch((error) => showToast(error.message));
});

els.strikeAcknowledgeButton.addEventListener("click", async () => {
  try {
    const data = await apiFetch("/account/strike-ack", {
      method: "POST",
      body: JSON.stringify({}),
    });
    updateAccountStatus(data.accountStatus);
  } catch (error) {
    showToast(error.message || "Could not acknowledge strike.");
  }
});

els.banSignOutButton.addEventListener("click", () => {
  signOut().catch((error) => showToast(error.message));
});

els.actionModalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitActionModal();
});
els.actionModalCancelButton.addEventListener("click", () =>
  closeActionModal(null),
);
els.actionModalCloseButton.addEventListener("click", () =>
  closeActionModal(null),
);
els.actionModal.addEventListener("click", (event) => {
  if (event.target === els.actionModal) closeActionModal(null);
});

els.notificationsToggle.addEventListener("change", () => {
  if (!els.notificationsToggle.checked) {
    setNotificationsEnabled(false);
    return;
  }

  const permission = getNotificationPermission();
  if (permission === "granted") {
    setNotificationsEnabled(true);
    return;
  }

  setNotificationsEnabled(false);
  if (permission === "denied") {
    showToast("Notifications are blocked in this browser.");
    return;
  }
  if (permission === "unsupported") {
    showToast("Browser notifications are not available here.");
    return;
  }
  showNotificationPrompt({ force: true });
});

els.notificationPromptCloseButton.addEventListener("click", () =>
  closeNotificationPrompt(),
);
els.notificationLaterButton.addEventListener("click", () =>
  closeNotificationPrompt(),
);
els.notificationEnableButton.addEventListener("click", () => {
  requestNotificationPermission().catch(() => {
    setNotificationsEnabled(false);
    closeNotificationPrompt();
    showToast("Notifications could not be enabled.");
  });
});
els.notificationPromptModal.addEventListener("click", (event) => {
  if (event.target === els.notificationPromptModal) closeNotificationPrompt();
});

els.passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.passwordError.textContent = "";
  try {
    await apiFetch("/auth/password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: els.currentPassword.value,
        newPassword: els.newPassword.value,
      }),
    });
    els.currentPassword.value = "";
    els.newPassword.value = "";
    showToast("Password changed.");
  } catch (error) {
    els.passwordError.textContent =
      error.message || "Could not change password.";
  }
});

els.deleteAccountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.deleteAccountError.textContent = "";
  if (!els.deleteAccountPassword.value) {
    els.deleteAccountError.textContent =
      "Enter your current password to schedule deletion.";
    els.deleteAccountPassword.focus();
    return;
  }

  const confirmed = await openActionModal({
    title: "Schedule Account Deletion",
    message:
      "Your account, saved chats, and sessions will be deleted after 7 days. Signing back in before then cancels the deletion.",
    kind: "confirm",
    confirmText: "Schedule deletion",
    danger: true,
  });
  if (!confirmed) return;

  try {
    const data = await apiFetch("/auth/delete", {
      method: "POST",
      body: JSON.stringify({
        password: els.deleteAccountPassword.value,
      }),
    });
    els.deleteAccountPassword.value = "";
    showToast(
      `Account deletion scheduled for ${formatAccountDeletionTime(data.deletionScheduledAt)}. Sign in before then to cancel.`,
    );
    await resetSignedOutState();
  } catch (error) {
    els.deleteAccountError.textContent =
      error.message || "Could not schedule account deletion.";
  }
});

document.querySelectorAll(".auth-tab").forEach((button) => {
  button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
});

els.authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuth();
});

window.addEventListener("load", () => {
  iconRefresh();
  highlightCodeBlocks(els.messages);
});
window.addEventListener("hashchange", () => {
  routeFromHash().catch((error) => {
    showToast(error.message || "Chat could not load.");
    startNewChat();
  });
});
window.addEventListener("focus", () => {
  updateNotificationUi();
  syncActiveChat().catch(() => {});
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  updateNotificationUi();
  syncActiveChat().catch(() => {});
});

els.legalAcceptCheckbox.addEventListener("change", () => {
  els.legalAcceptButton.disabled = !els.legalAcceptCheckbox.checked;
});

els.legalAcceptButton.addEventListener("click", () => {
  if (!els.legalAcceptCheckbox.checked) return;
  acceptRequiredLegal();
});

els.cookieAcceptButton.addEventListener("click", () => {
  storageSet("required_cookies_version", LEGAL_VERSION);
  setRequiredCookieAck();
  hideWithMotion(els.cookieBanner);
});

const showLegalGate = () => {
  lockForConsent();
  showWithMotion(els.legalGateModal);
  els.legalAcceptButton.disabled = !els.legalAcceptCheckbox.checked;
  iconRefresh();
};

window.addEventListener("resize", () => {
  clearTimeout(syncResponsiveShell.resizeTimer);
  syncResponsiveShell.resizeTimer = setTimeout(() => {
    syncResponsiveShell();
    syncSettingsMenuPortal();
  }, 120);
});

const initializeApp = async () => {
  ensureGuestId();
  syncResponsiveShell();
  syncSettingsMenuPortal();
  iconRefresh();
  updateNotificationUi();
  await fetchConfig();
  await fetchMe();
  if (isLoginEntryPage() && !state.authToken) {
    openAuthModal();
  } else if (isLoginEntryPage() && state.authToken) {
    const postLoginRedirect = getPostLoginRedirect();
    if (postLoginRedirect) {
      window.location.replace(postLoginRedirect);
      return;
    }
  }
  await fetchChats();
  await routeFromHash();
  showCookieBannerIfNeeded();
};

(async () => {
  if (!hasLegalAcceptance()) {
    showLegalGate();
    return;
  }

  try {
    unlockConsent();
    await initializeApp();
  } catch (error) {
    showToast(error.message || "Ask could not load.");
    renderChats();
    renderMessages();
  }
})();

async function setAvatar(email, displayName) {
  const avatarEl = document.getElementById("accountAvatar");
  if (!avatarEl) return;
  if (!email) {
    avatarEl.outerHTML = `<div class="account-avatar" id="accountAvatar">${(displayName || "G").charAt(0).toUpperCase()}</div>`;
    return;
  }
  try {
    const msgUint8 = new TextEncoder().encode(email.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    avatarEl.outerHTML = `<img class="account-avatar" id="accountAvatar" src="https://www.gravatar.com/avatar/${hashHex}?d=404" onerror="this.outerHTML='<div class=\'account-avatar\' id=\'accountAvatar\'>${(displayName || email || "G").charAt(0).toUpperCase()}</div>'"/>`;
  } catch (e) {
    avatarEl.outerHTML = `<div class="account-avatar" id="accountAvatar">${(displayName || email || "G").charAt(0).toUpperCase()}</div>`;
  }
}

// 3 Buttons logic
const TRAY_ICONS = {
  coding: "code-2",
  school: "graduation-cap",
  writing: "edit-3",
  research: "search",
  "research-compare": "git-compare-arrows",
};
const TRAY_LABELS = {
  coding: "Debug code",
  school: "Study guide",
  writing: "Rewrite",
  research: "Research brief",
  "research-compare": "Compare sources"
};

function getTrayLabel(k) {
  if (window.i18n) {
    const keyMap = {
      coding: "template.coding",
      school: "template.school",
      writing: "template.writing",
      research: "template.research",
      "research-compare": "template.researchCompare"
    };
    return window.i18n(keyMap[k]);
  }
  return TRAY_LABELS[k];
};

function renderRandomTemplates() {
  const tray = document.getElementById("templateTray");
  if (!tray) return;
  const keys = Object.keys(PROMPT_TEMPLATES);
  const shuffled = keys.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);

  let html = `<span>${window.i18n ? window.i18n("template.tryTitle") : "Try"}</span>`;
  selected.forEach((k) => {
    html += `<button type="button" data-template-id="${k}">
            <i data-lucide="${TRAY_ICONS[k] || "zap"}"></i>
            <div class="tray-btn-content">
                <strong>${getTrayLabel(k)}</strong>
                <span>${window.i18n ? window.i18n("template.try") : "Try this template"}</span>
            </div>
        </button>`;
  });
  tray.innerHTML = html;
  if (typeof iconRefresh !== "undefined" && iconRefresh) iconRefresh();
  else if (window.lucide?.createIcons) window.lucide.createIcons();
}
document.addEventListener("DOMContentLoaded", renderRandomTemplates);

document.addEventListener("i18nReady", () => { renderRandomTemplates(); updateWelcomeText(); });
