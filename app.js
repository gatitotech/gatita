const LEGACY_API_BASE_KEY = ['CL4', 'NKR_ASK_API_BASE'].join('');
const STORAGE_PREFIX = 'gatita_ask_';
const LEGACY_STORAGE_PREFIX = ['cl4', 'nkr_ask_'].join('');
const API_BASE = window.GATITA_ASK_API_BASE || window[LEGACY_API_BASE_KEY] || 'https://api.clankr.tech/ask-api';
const LEGAL_VERSION = '2026-05-16';
const STREAM_RENDER_INTERVAL_MS = 40;
const NOTIFICATION_PROMPT_INTERVAL_MS = 30 * 60 * 1000;
const BROWSER_CHECK_YIELD_EVERY = 150;
const NOTEBOOK_BLOCK_RE = /<gatita-notebook\b([^>]*)>([\s\S]*?)<\/gatita-notebook>/gi;
const NOTEBOOK_PARTIAL_RE = /<gatita-notebook\b[\s\S]*$/i;
const NOTEBOOK_MARKDOWN_EXTENSIONS = new Set(['md', 'markdown']);
const NOTEBOOK_LANGUAGE_BY_EXT = {
    bash: 'bash',
    c: 'c',
    cc: 'cpp',
    cjs: 'javascript',
    cpp: 'cpp',
    cs: 'csharp',
    css: 'css',
    go: 'go',
    h: 'c',
    hpp: 'cpp',
    html: 'html',
    java: 'java',
    js: 'javascript',
    json: 'json',
    jsx: 'javascript',
    kt: 'kotlin',
    log: '',
    lua: 'lua',
    md: 'markdown',
    markdown: 'markdown',
    mjs: 'javascript',
    php: 'php',
    py: 'python',
    rb: 'ruby',
    rs: 'rust',
    sh: 'bash',
    sql: 'sql',
    swift: 'swift',
    toml: 'ini',
    ts: 'typescript',
    tsx: 'typescript',
    txt: '',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml'
};
const PROMPT_TEMPLATES = {
    coding: 'Debug this code and explain the fix clearly. I will paste the code below:\n\n```\n// paste code here\n```',
    'coding-notebook': 'Create a concise notebook note for this coding topic. Include key ideas, examples, and pitfalls, but do not create project files. Topic: ',
    school: 'Make me a study guide for this topic with key terms, examples, and a quick self-quiz: ',
    'school-essay': 'Create notebook notes for a strong essay. Topic: [topic]. Include thesis options, structure, evidence ideas, and a short draft plan.',
    writing: 'Rewrite this to be clearer, more natural, and more polished while keeping my meaning:\n\n',
    'writing-story': 'Create notebook notes for a story idea with three opening options and revision notes. Genre: ',
    research: 'Make a concise research brief with current context, important facts, and open questions. Topic: ',
    'research-compare': 'Compare two sides of this topic fairly, list what evidence would settle the disagreement, and suggest reliable sources to check: '
};

const storageGet = (key) => localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    ?? localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${key}`)
    ?? '';
const storageSet = (key, value) => {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
    localStorage.setItem(`${LEGACY_STORAGE_PREFIX}${key}`, value);
};
const storageRemove = (key) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    localStorage.removeItem(`${LEGACY_STORAGE_PREFIX}${key}`);
};
const getTosUrl = () => state.config?.tosUrl || 'https://gatita.tech/legal';
const chatUrl = (chatId) => `#/chat/${chatId}`;
const sharedUrl = (token) => `#/share/${token}`;
const newChatUrl = () => '#/new';
const formatBytes = (bytes = 0) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const els = {
    chatList: document.getElementById('chatList'),
    chatSearchInput: document.getElementById('chatSearchInput'),
    messages: document.getElementById('messages'),
    emptyState: document.getElementById('emptyState'),
    messageScroll: document.getElementById('messageScroll'),
    scrollSentinel: document.getElementById('scrollSentinel'),
    composer: document.getElementById('composer'),
    messageInput: document.getElementById('messageInput'),
    fileInput: document.getElementById('fileInput'),
    attachButton: document.getElementById('attachButton'),
    attachmentRow: document.getElementById('attachmentRow'),
    sendButton: document.getElementById('sendButton'),
    newChatButton: document.getElementById('newChatButton'),
    settingsButton: document.getElementById('settingsButton'),
    settingsMenu: document.getElementById('settingsMenu'),
    settingsModelName: document.getElementById('settingsModelName'),
    settingsSummary: document.getElementById('settingsSummary'),
    sidebarToggleButton: document.getElementById('sidebarToggleButton'),
    modelSelect: document.getElementById('modelSelect'),
    modelSelectButton: document.getElementById('modelSelectButton'),
    modelSelectValue: document.getElementById('modelSelectValue'),
    modelSelectMenu: document.getElementById('modelSelectMenu'),
    personalitySelect: document.getElementById('personalitySelect'),
    personalitySelectButton: document.getElementById('personalitySelectButton'),
    personalitySelectValue: document.getElementById('personalitySelectValue'),
    personalitySelectMenu: document.getElementById('personalitySelectMenu'),
    thinkingToggle: document.getElementById('thinkingToggle'),
    researchToggle: document.getElementById('researchToggle'),
    autoWebToggle: document.getElementById('autoWebToggle'),
    temporaryToggle: document.getElementById('temporaryToggle'),
    deepResearchToggle: document.getElementById('deepResearchToggle'),
    updatesButton: document.getElementById('updatesButton'),
    updatesModal: document.getElementById('updatesModal'),
    closeUpdatesButton: document.getElementById('closeUpdatesButton'),
    updatesList: document.getElementById('updatesList'),
    updatesForm: document.getElementById('updatesForm'),
    updateTitleInput: document.getElementById('updateTitleInput'),
    updateContentInput: document.getElementById('updateContentInput'),
    updatesError: document.getElementById('updatesError'),
    notebookToggleButton: document.getElementById('notebookToggleButton'),
    usageText: document.getElementById('usageText'),
    accountName: document.getElementById('accountName'),
    accountButton: document.getElementById('accountButton'),
    accountModal: document.getElementById('accountModal'),
    closeAccountButton: document.getElementById('closeAccountButton'),
    accountModalName: document.getElementById('accountModalName'),
    accountModalEmail: document.getElementById('accountModalEmail'),
    accountMinuteLimit: document.getElementById('accountMinuteLimit'),
    accountDeepLimit: document.getElementById('accountDeepLimit'),
    notificationsToggle: document.getElementById('notificationsToggle'),
    accountSignOutButton: document.getElementById('accountSignOutButton'),
    passwordForm: document.getElementById('passwordForm'),
    currentPassword: document.getElementById('currentPassword'),
    newPassword: document.getElementById('newPassword'),
    passwordError: document.getElementById('passwordError'),
    notificationPromptModal: document.getElementById('notificationPromptModal'),
    notificationPromptCloseButton: document.getElementById('notificationPromptCloseButton'),
    notificationEnableButton: document.getElementById('notificationEnableButton'),
    notificationLaterButton: document.getElementById('notificationLaterButton'),
    legalGateModal: document.getElementById('legalGateModal'),
    legalAcceptCheckbox: document.getElementById('legalAcceptCheckbox'),
    legalAcceptButton: document.getElementById('legalAcceptButton'),
    cookieBanner: document.getElementById('cookieBanner'),
    cookieAcceptButton: document.getElementById('cookieAcceptButton'),
    authModal: document.getElementById('authModal'),
    closeAuthButton: document.getElementById('closeAuthButton'),
    authForm: document.getElementById('authForm'),
    authEmail: document.getElementById('authEmail'),
    authDisplayName: document.getElementById('authDisplayName'),
    authPassword: document.getElementById('authPassword'),
    authError: document.getElementById('authError'),
    toast: document.getElementById('toast'),
    browserCheckStatus: document.getElementById('browserCheckStatus'),
    authBrowserCheckStatus: document.getElementById('authBrowserCheckStatus'),
    templateTray: document.getElementById('templateTray'),
    notebookPanel: document.getElementById('notebookPanel'),
    closeNotebookButton: document.getElementById('closeNotebookButton'),
    notebookPanelTitle: document.getElementById('notebookPanelTitle'),
    notebookScopeText: document.getElementById('notebookScopeText'),
    notebookFileList: document.getElementById('notebookFileList'),
    notebookChangeTabs: document.getElementById('notebookChangeTabs'),
    notebookAiDiff: document.getElementById('notebookAiDiff'),
    notebookEditor: document.getElementById('notebookEditor'),
    notebookPreview: document.getElementById('notebookPreview'),
    notebookMeta: document.getElementById('notebookMeta'),
    notebookWorkspace: document.querySelector('.notebook-workspace'),
    newNotebookFileButton: document.getElementById('newNotebookFileButton'),
    copyNotebookButton: document.getElementById('copyNotebookButton'),
    editNotebookButton: document.getElementById('editNotebookButton'),
    saveNotebookButton: document.getElementById('saveNotebookButton'),
    actionModal: document.getElementById('actionModal'),
    actionModalForm: document.getElementById('actionModalForm'),
    actionModalTitle: document.getElementById('actionModalTitle'),
    actionModalMessage: document.getElementById('actionModalMessage'),
    actionModalInputWrap: document.getElementById('actionModalInputWrap'),
    actionModalInputLabel: document.getElementById('actionModalInputLabel'),
    actionModalInput: document.getElementById('actionModalInput'),
    actionModalTextareaWrap: document.getElementById('actionModalTextareaWrap'),
    actionModalTextareaLabel: document.getElementById('actionModalTextareaLabel'),
    actionModalTextarea: document.getElementById('actionModalTextarea'),
    actionModalError: document.getElementById('actionModalError'),
    actionModalSubmitButton: document.getElementById('actionModalSubmitButton'),
    actionModalCancelButton: document.getElementById('actionModalCancelButton'),
    actionModalCloseButton: document.getElementById('actionModalCloseButton')
};

const state = {
    config: null,
    usage: null,
    chats: [],
    messages: [],
    activeChatId: null,
    activeSharedToken: '',
    temporaryMode: false,
    temporaryMessages: [],
    updates: [],
    chatSearch: '',
    editingMessageId: null,
    authToken: storageGet('token'),
    guestId: storageGet('guest_id'),
    user: null,
    pendingFiles: [],
    browserProof: null,
    browserCheckVerifiedUntil: 0,
    authBrowserProof: null,
    authMode: 'login',
    notebook: null,
    notebookDrafts: new Map(),
    notebookOpen: false,
    composerDraftKey: '',
    actionModalResolve: null,
    actionModalOptions: null,
    openCustomSelect: '',
    activeStreams: new Map(),
    busy: false
};

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

const showWithMotion = (element) => {
    if (!element) return;
    window.clearTimeout(element._motionHideTimer);
    element.classList.remove('hidden', 'is-closing');
};

const hideWithMotion = (element, { duration = 190 } = {}) => {
    if (!element || element.classList.contains('hidden')) return;
    window.clearTimeout(element._motionHideTimer);
    if (prefersReducedMotion()) {
        element.classList.add('hidden');
        element.classList.remove('is-closing');
        return;
    }
    element.classList.add('is-closing');
    element._motionHideTimer = window.setTimeout(() => {
        element.classList.add('hidden');
        element.classList.remove('is-closing');
    }, duration);
};

const pulseElement = (element, className = 'soft-feedback') => {
    if (!element || prefersReducedMotion()) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), 560);
};

const eventIncludesElement = (event, element) => {
    if (!element) return false;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
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
    title = 'Action',
    message = '',
    kind = 'confirm',
    label = 'Value',
    value = '',
    placeholder = '',
    confirmText = 'Save',
    danger = false,
    required = false,
    maxLength = 0
} = {}) => new Promise((resolve) => {
    state.actionModalResolve = resolve;
    state.actionModalOptions = { kind, required };
    els.actionModalTitle.textContent = title;
    els.actionModalMessage.textContent = message;
    els.actionModalMessage.classList.toggle('hidden', !message);
    els.actionModalError.textContent = '';
    els.actionModalSubmitButton.textContent = confirmText;
    els.actionModalSubmitButton.classList.toggle('danger-action', Boolean(danger));

    const usesInput = kind === 'input';
    const usesTextarea = kind === 'textarea';
    els.actionModalInputWrap.classList.toggle('hidden', !usesInput);
    els.actionModalTextareaWrap.classList.toggle('hidden', !usesTextarea);
    els.actionModalInputLabel.textContent = label;
    els.actionModalTextareaLabel.textContent = label;
    els.actionModalInput.value = usesInput ? String(value || '') : '';
    els.actionModalTextarea.value = usesTextarea ? String(value || '') : '';
    els.actionModalInput.placeholder = placeholder;
    els.actionModalTextarea.placeholder = placeholder;
    els.actionModalInput.required = Boolean(required && usesInput);
    els.actionModalTextarea.required = Boolean(required && usesTextarea);
    els.actionModalInput.maxLength = usesInput && maxLength ? maxLength : 524288;
    els.actionModalTextarea.maxLength = usesTextarea && maxLength ? maxLength : 524288;

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
    const field = options.kind === 'textarea' ? els.actionModalTextarea : els.actionModalInput;
    if (options.kind === 'input' || options.kind === 'textarea') {
        const value = field.value.trim();
        if (options.required && !value) {
            els.actionModalError.textContent = 'This field is required.';
            field.focus();
            return;
        }
        closeActionModal(value);
        return;
    }
    closeActionModal(true);
};

const chatStreamKey = (chatId) => `chat:${Number(chatId)}`;
const temporaryStreamKey = () => 'temporary';

const streamTargetKey = (target) => (
    target?.isTemporary ? temporaryStreamKey() : chatStreamKey(target?.chatId)
);

const currentStreamKey = () => {
    if (state.temporaryMode) return temporaryStreamKey();
    if (state.activeChatId && !state.activeSharedToken) return chatStreamKey(state.activeChatId);
    return '';
};

const composerDraftKeyForCurrentView = () => {
    if (state.temporaryMode) return 'composer_draft_temporary';
    if (state.activeChatId && !state.activeSharedToken) return `composer_draft_chat_${Number(state.activeChatId)}`;
    if (state.activeSharedToken) return `composer_draft_share_${state.activeSharedToken}`;
    return 'composer_draft_new';
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

const isCurrentViewStreaming = () => state.activeStreams.has(currentStreamKey());

const isStreamTargetActive = (target) => {
    if (!target) return false;
    if (target.isTemporary) return state.temporaryMode;
    return !state.temporaryMode
        && !state.activeSharedToken
        && Number(state.activeChatId) === Number(target.chatId);
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
    const assistant = [...(stream.messages || [])].reverse().find((message) => (
        message.role === 'assistant'
        && message.id
        && (message.streaming || message.loading)
    ));
    if (!assistant?.id || !stream.target?.chatId) return;
    apiFetch(`/chats/${stream.target.chatId}/messages/${assistant.id}/stop`, {
        method: 'POST',
        body: JSON.stringify({})
    }).catch(() => {});
};

const stopStreamTarget = (target) => {
    const stream = state.activeStreams.get(streamTargetKey(target));
    if (!stream) return false;
    stream.stopped = true;
    requestStopForStream(stream);
    stream.controller?.abort();
    const assistant = [...(stream.messages || [])].reverse().find((message) => message.role === 'assistant' && (message.streaming || message.loading));
    if (assistant) {
        assistant.loading = false;
        assistant.streaming = false;
        assistant.queueing = false;
        assistant.content = getVisibleMessageContent(assistant) || 'Stopped.';
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
    els.messages?.classList.toggle('streaming-render', isCurrentViewStreaming());
    els.messageScroll?.classList.toggle('streaming-scroll', isCurrentViewStreaming());
    els.sendButton.classList.toggle('is-stopping', state.busy);
    els.sendButton.querySelector('span').textContent = state.busy ? 'Stop' : 'Send';
    els.sendButton.disabled = false;
};

const replaceHashWithoutRouting = (hash) => {
    const next = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(null, '', next);
};

let nextMessageClientKey = 1;

const getMessageRenderKey = (message, index) => {
    if (message._clientKey) return message._clientKey;
    if (message.id) return `${message.role || message.type || 'message'}:${message.id}`;
    if (!message._clientKey) {
        message._clientKey = `client:${nextMessageClientKey}:${index}`;
        nextMessageClientKey += 1;
    }
    return message._clientKey;
};

const isNearMessageBottom = (threshold = 160) => {
    if (!els.messageScroll) return true;
    const distanceFromBottom = els.messageScroll.scrollHeight
        - els.messageScroll.scrollTop
        - els.messageScroll.clientHeight;
    return distanceFromBottom < threshold;
};

const scrollMessagesToBottomNow = ({ smooth = false } = {}) => {
    if (!els.messageScroll) return;
    const top = Math.max(0, els.messageScroll.scrollHeight - els.messageScroll.clientHeight);
    const canSmooth = smooth
        && !state.busy
        && !prefersReducedMotion()
        && typeof els.messageScroll.scrollTo === 'function';
    if (canSmooth) {
        els.messageScroll.scrollTo({ top, behavior: 'smooth' });
        return;
    }
    els.messageScroll.scrollTop = top;
};

const queueBottomLock = ({ smooth = false } = {}) => {
    if (queueBottomLock.frame) cancelAnimationFrame(queueBottomLock.frame);
    if (queueBottomLock.secondFrame) cancelAnimationFrame(queueBottomLock.secondFrame);

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
    message._messageEl = Array.from(els.messages.querySelectorAll('[data-render-key]'))
        .find((element) => element.dataset.renderKey === renderKey) || null;
    return message._messageEl;
};

const updateStreamingMessageContent = (message) => {
    const messageElement = getMessageElement(message);
    const streamBody = messageElement?.querySelector('.stream-plain');
    if (!streamBody) return false;

    streamBody.textContent = getVisibleMessageContent(message);
    if (state.busy || isNearMessageBottom()) queueBottomLock();
    return true;
};

const makeGuestId = () => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((value) => value.toString(16).padStart(2, '0')).join('');
};

const ensureGuestId = () => {
    if (state.guestId) return;
    state.guestId = makeGuestId();
    storageSet('guest_id', state.guestId);
};

const setRequiredCookieAck = () => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `gatita_required_cookies=${LEGAL_VERSION}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
};

const hasLegalAcceptance = () => storageGet('legal_accept_version') === LEGAL_VERSION;
const hasCookieAcknowledgement = () => storageGet('required_cookies_version') === LEGAL_VERSION
    || document.cookie.split(';').some((cookie) => cookie.trim() === `gatita_required_cookies=${LEGAL_VERSION}`);

const lockForConsent = () => {
    document.body.classList.add('consent-locked');
};

const unlockConsent = () => {
    document.body.classList.remove('consent-locked');
};

const acceptRequiredLegal = () => {
    storageSet('legal_accept_version', LEGAL_VERSION);
    storageSet('required_cookies_version', LEGAL_VERSION);
    setRequiredCookieAck();
    hideWithMotion(els.legalGateModal);
    unlockConsent();
    initializeApp().catch((error) => {
        showToast(error.message || 'Ask could not load.');
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

const loadMathJax = () => new Promise((resolve) => {
    if (window.MathJax?.typesetPromise) return resolve();
    const existing = document.querySelector('script[data-mathjax]');
    if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
    script.defer = true;
    script.dataset.mathjax = 'true';
    script.addEventListener('load', resolve, { once: true });
    document.head.appendChild(script);
});

const queueMathTypeset = () => {
    if (isCurrentViewStreaming()) return;
    const hasMath = state.messages.some((message) => (
        message.role === 'assistant'
        && /(\$\$|\\\(|\\\[|\$[^$\n]{1,160}\$)/.test(getVisibleMessageContent(message))
    ));
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
    els.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 3200);
};

const supportsNotifications = () => Boolean(window.Notification) && window.isSecureContext;

const getNotificationPermission = () => {
    if (!supportsNotifications()) return 'unsupported';
    return window.Notification.permission;
};

const notificationsEnabled = () => (
    storageGet('notifications_enabled') === '1'
    && getNotificationPermission() === 'granted'
);

const setNotificationsEnabled = (enabled) => {
    storageSet('notifications_enabled', enabled ? '1' : '0');
    updateNotificationUi();
};

const updateNotificationUi = () => {
    if (!els.notificationsToggle) return;
    const permission = getNotificationPermission();
    const unavailable = permission === 'unsupported' || permission === 'denied';
    const wrapper = els.notificationsToggle.closest('.account-toggle');
    const helper = wrapper?.querySelector('small');

    els.notificationsToggle.checked = notificationsEnabled();
    els.notificationsToggle.disabled = unavailable;
    wrapper?.classList.toggle('disabled', unavailable);

    if (!helper) return;
    if (permission === 'denied') {
        helper.textContent = 'Notifications are blocked in this browser.';
    } else if (permission === 'unsupported') {
        helper.textContent = 'Notifications need a supported secure browser.';
    } else if (notificationsEnabled()) {
        helper.textContent = 'On. Gatita can notify you when a response finishes.';
    } else {
        helper.textContent = 'Get a browser notification when Gatita finishes answering.';
    }
};

const markNotificationPrompted = () => {
    storageSet('notifications_prompted_at', String(Date.now()));
};

const shouldPromptNotifications = () => {
    if (!supportsNotifications()) return false;
    if (getNotificationPermission() !== 'default') return false;
    if (notificationsEnabled()) return false;
    const promptedAt = Number(storageGet('notifications_prompted_at') || 0);
    return !promptedAt || Date.now() - promptedAt >= NOTIFICATION_PROMPT_INTERVAL_MS;
};

const closeNotificationPrompt = ({ remember = true } = {}) => {
    if (remember) markNotificationPrompted();
    hideWithMotion(els.notificationPromptModal);
    updateNotificationUi();
};

const showNotificationPrompt = ({ force = false } = {}) => {
    const permission = getNotificationPermission();
    if (permission === 'granted') {
        if (force) setNotificationsEnabled(true);
        return false;
    }
    if (permission === 'denied' || permission === 'unsupported') {
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
        showToast('Browser notifications are not available here.');
        closeNotificationPrompt({ remember: false });
        return;
    }

    let permission = getNotificationPermission();
    if (permission === 'default') {
        permission = await window.Notification.requestPermission();
    }

    setNotificationsEnabled(permission === 'granted');
    closeNotificationPrompt({ remember: false });
    if (permission !== 'granted') {
        showToast(permission === 'denied'
            ? 'Notifications are blocked in this browser.'
            : 'Notifications were left off.');
    }
};

const notifyGenerationDone = (target, message) => {
    if (!notificationsEnabled()) return;
    const userIsWatchingResponse = document.visibilityState === 'visible'
        && document.hasFocus()
        && isStreamTargetActive(target);
    if (userIsWatchingResponse) return;

    const body = getVisibleMessageContent(message)
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 140) || 'Your answer is ready.';

    try {
        new window.Notification('Gatita Ask is done', {
            body,
            icon: 'assets/avatar.webp',
            tag: target?.isTemporary ? 'gatita-ask-temporary' : `gatita-ask-chat-${target?.chatId || 'current'}`
        });
    } catch (_) {}
};

const apiFetch = async (path, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        'X-Ask-Guest-Id': state.guestId,
        ...(options.headers || {})
    };

    if (state.authToken) headers.Authorization = `Bearer ${state.authToken}`;

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(json.error || 'Request failed.');
        error.status = response.status;
        error.data = json;
        throw error;
    }

    return json;
};

const createApiHeaders = (extra = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        'X-Ask-Guest-Id': state.guestId,
        ...extra
    };
    if (state.authToken) headers.Authorization = `Bearer ${state.authToken}`;
    return headers;
};

const parseSseChunk = (buffer, onEvent) => {
    const events = buffer.split('\n\n');
    const rest = events.pop() || '';

    for (const rawEvent of events) {
        const lines = rawEvent.split('\n');
        let eventName = 'message';
        const dataLines = [];

        for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
        }

        if (dataLines.length === 0) continue;
        let payload = {};
        try {
            payload = JSON.parse(dataLines.join('\n'));
        } catch (_) {}
        onEvent(eventName, payload);
    }

    return rest;
};

const streamApi = async (path, payload, onEvent, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: createApiHeaders({ Accept: 'text/event-stream' }),
        body: JSON.stringify(payload),
        signal: options.signal
    });

    if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const error = new Error(json.error || 'Request failed.');
        error.status = response.status;
        error.data = json;
        throw error;
    }

    if (!response.body) {
        throw new Error('Streaming is not supported by this browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
        els.usageText.textContent = 'Free';
    } else if (usage.dailyLimit) {
        els.usageText.textContent = `${usage.dailyRemaining}/${usage.dailyLimit} guest messages left`;
    } else {
        els.usageText.textContent = 'Guest';
    }
    renderAccountWindow();
};

const renderAccountWindow = () => {
    if (!els.accountModalName) return;
    const usage = state.usage || {};
    const minuteRemaining = usage.minuteRemaining ?? state.config?.limits?.perMinute ?? '-';
    const minuteLimit = usage.minuteLimit ?? state.config?.limits?.perMinute ?? '-';
    const deep = usage.research?.deep || {};
    const deepRemaining = deep.dailyRemaining ?? state.config?.limits?.deepResearchDaily ?? '-';
    const deepLimit = deep.dailyLimit ?? state.config?.limits?.deepResearchDaily ?? '-';

    els.accountModalName.textContent = state.user?.displayName || state.user?.email || 'Guest';
    els.accountModalEmail.textContent = state.user?.email || 'Signed out';
    els.accountMinuteLimit.textContent = `${minuteRemaining}/${minuteLimit} left this minute`;
    els.accountDeepLimit.textContent = state.user
        ? `${deepRemaining}/${deepLimit} left today`
        : 'Sign in required';
    updateNotificationUi();
};

const updateAccount = () => {
    const setGuestLockedToggle = (input, locked) => {
        input.disabled = locked;
        input.closest('.thinking-toggle')?.classList.toggle('disabled', locked);
    };

    if (state.user) {
        els.accountName.textContent = state.user.displayName || state.user.email || 'Account';
        els.accountButton.textContent = 'Account';
        setGuestLockedToggle(els.thinkingToggle, false);
        setGuestLockedToggle(els.researchToggle, false);
        setGuestLockedToggle(els.autoWebToggle, false);
        setGuestLockedToggle(els.deepResearchToggle, false);
    } else {
        els.accountName.textContent = 'Guest';
        els.accountButton.textContent = 'Sign in';
        if (state.usage?.dailyLimit) {
            els.usageText.textContent = `${state.usage.dailyRemaining}/${state.usage.dailyLimit} guest messages left`;
        } else {
            els.usageText.textContent = 'Guest mode';
        }
        els.thinkingToggle.checked = false;
        els.researchToggle.checked = false;
        els.autoWebToggle.checked = false;
        els.deepResearchToggle.checked = false;
        setGuestLockedToggle(els.thinkingToggle, true);
        setGuestLockedToggle(els.researchToggle, true);
        setGuestLockedToggle(els.autoWebToggle, true);
        setGuestLockedToggle(els.deepResearchToggle, true);
    }
    renderAccountWindow();
    renderUpdates();
    updateSettingsSummary();
};

const renderSelects = () => {
    const models = state.config?.models || [];
    const personalities = state.config?.personalities || [];
    const savedModel = storageGet('model') || state.config?.defaultModelId || models[0]?.id || '';
    const savedPersonality = storageGet('personality') || 'smart';
    const savedThinking = storageGet('thinking') === '1';
    const savedResearch = storageGet('research') === '1';
    const savedAutoWeb = storageGet('auto_web') === '1';
    const savedDeepResearch = storageGet('deep_research') === '1';

    els.modelSelect.innerHTML = models.map((model) => (
        `<option value="${model.id}">${model.name}</option>`
    )).join('');
    els.personalitySelect.innerHTML = personalities.map((personality) => (
        `<option value="${personality.id}">${personality.name}</option>`
    )).join('');

    els.modelSelect.value = models.some((model) => model.id === savedModel) ? savedModel : state.config?.defaultModelId || '';
    els.personalitySelect.value = personalities.some((item) => item.id === savedPersonality) ? savedPersonality : 'smart';
    els.thinkingToggle.checked = savedThinking && Boolean(state.user);
    els.researchToggle.checked = savedResearch && Boolean(state.user);
    els.autoWebToggle.checked = savedAutoWeb && Boolean(state.user);
    els.temporaryToggle.checked = state.temporaryMode;
    els.deepResearchToggle.checked = savedDeepResearch && Boolean(state.user);
    renderCustomSelect('model');
    renderCustomSelect('personality');
    updateSettingsSummary();
};

const updateSettingsSummary = () => {
    if (!els.settingsSummary) return;
    const modelName = els.modelSelect.selectedOptions?.[0]?.textContent || 'Model';
    const personalityName = els.personalitySelect.selectedOptions?.[0]?.textContent || 'Personality';
    const extras = [
        els.thinkingToggle.checked ? 'Thinking' : '',
        els.autoWebToggle.checked ? 'Auto web' : '',
        els.deepResearchToggle.checked ? 'Deep research' : (els.researchToggle.checked ? 'Research' : ''),
        state.temporaryMode ? 'Temporary' : ''
    ].filter(Boolean);
    if (els.settingsModelName) els.settingsModelName.textContent = modelName;
    const chips = [personalityName, ...extras];
    els.settingsSummary.innerHTML = chips.map((chip) => (
        `<span class="settings-chip">${escapeHtml(chip)}</span>`
    )).join('');
};

const renderChats = () => {
    const groups = new Map();
    for (const chat of state.chats) {
        const key = chat.pinned ? 'Pinned' : (chat.folder || 'Chats');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(chat);
    }

    const temporaryItem = `
        <article class="chat-row ${state.temporaryMode ? 'active' : ''}">
            <button class="chat-item-main" type="button" data-temporary-chat="1">
                <span>
                    <span class="chat-title">Temporary chat</span>
                    <span class="chat-preview">Not saved</span>
                </span>
                <span class="chat-count">${state.temporaryMessages.length || 0}</span>
            </button>
        </article>
    `;

    const newItem = `
        <article class="chat-row ${!state.activeChatId && !state.activeSharedToken && !state.temporaryMode ? 'active' : ''}">
            <button class="chat-item-main" type="button" data-new-chat="1">
                <span>
                    <span class="chat-title">New chat</span>
                    <span class="chat-preview">Ready</span>
                </span>
                <span class="chat-count">0</span>
            </button>
        </article>
    `;

    const groupHtml = [...groups.entries()].map(([name, chats]) => `
        <section class="chat-group">
            <h3>${escapeHtml(name)}</h3>
            ${chats.map((chat) => `
                <article class="chat-row has-actions ${chat.id === state.activeChatId ? 'active' : ''}" data-chat-row="${chat.id}">
                    <button class="chat-item-main" type="button" data-chat-id="${chat.id}">
                        <span>
                            <span class="chat-title">${chat.pinned ? 'Pinned ' : ''}${escapeHtml(chat.title || 'New chat')}</span>
                            <span class="chat-preview">${escapeHtml(chat.lastMessage || 'Ready')}</span>
                        </span>
                        <span class="chat-count">${chat.messageCount || 0}</span>
                    </button>
                    <div class="chat-actions">
                        <button type="button" data-pin-chat="${chat.id}" aria-label="${chat.pinned ? 'Unpin' : 'Pin'} chat" title="${chat.pinned ? 'Unpin' : 'Pin'}"><i data-lucide="pin"></i></button>
                        <button type="button" data-rename-chat="${chat.id}" aria-label="Rename chat" title="Rename"><i data-lucide="pencil"></i></button>
                        <button type="button" data-folder-chat="${chat.id}" aria-label="Set folder" title="Folder"><i data-lucide="folder"></i></button>
                        <button type="button" data-share-chat="${chat.id}" aria-label="Share chat" title="Share"><i data-lucide="link"></i></button>
                        <button type="button" data-delete-chat="${chat.id}" aria-label="Delete chat" title="Delete"><i data-lucide="trash-2"></i></button>
                    </div>
                </article>
            `).join('')}
        </section>
    `).join('');

    els.chatList.innerHTML = `${temporaryItem}${newItem}${groupHtml || '<p class="empty-list">No saved chats found.</p>'}`;
    iconRefresh();
};

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getCustomSelectParts = (kind) => {
    if (kind === 'model') {
        return {
            select: els.modelSelect,
            button: els.modelSelectButton,
            value: els.modelSelectValue,
            menu: els.modelSelectMenu
        };
    }
    return {
        select: els.personalitySelect,
        button: els.personalitySelectButton,
        value: els.personalitySelectValue,
        menu: els.personalitySelectMenu
    };
};

const closeCustomSelects = () => {
    state.openCustomSelect = '';
    ['model', 'personality'].forEach((kind) => {
        const parts = getCustomSelectParts(kind);
        parts.menu?.classList.add('hidden');
        parts.button?.setAttribute('aria-expanded', 'false');
    });
};

const renderCustomSelect = (kind) => {
    const { select, button, value, menu } = getCustomSelectParts(kind);
    if (!select || !button || !value || !menu) return;

    const options = Array.from(select.options || []);
    const selected = options.find((option) => option.value === select.value) || options[0];
    value.textContent = selected?.textContent || (kind === 'model' ? 'Model' : 'Personality');
    button.disabled = options.length === 0;
    button.setAttribute('aria-expanded', state.openCustomSelect === kind ? 'true' : 'false');

    menu.innerHTML = options.map((option) => {
        const active = option.value === select.value;
        return `
            <button class="custom-select-option ${active ? 'active' : ''}" type="button" role="option" aria-selected="${active ? 'true' : 'false'}" data-custom-select-value="${escapeHtml(option.value)}">
                <span>${escapeHtml(option.textContent)}</span>
                ${active ? '<i data-lucide="check"></i>' : ''}
            </button>
        `;
    }).join('');
    menu.classList.toggle('hidden', state.openCustomSelect !== kind);
    iconRefresh();
};

const toggleCustomSelect = (kind) => {
    state.openCustomSelect = state.openCustomSelect === kind ? '' : kind;
    renderCustomSelect('model');
    renderCustomSelect('personality');
};

const chooseCustomSelectValue = (kind, nextValue) => {
    const { select } = getCustomSelectParts(kind);
    if (!select) return;
    if (select.value !== nextValue) {
        select.value = nextValue;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    closeCustomSelects();
};

const isSettingsMenuOpen = () => Boolean(
    els.settingsMenu
    && !els.settingsMenu.classList.contains('hidden')
    && !els.settingsMenu.classList.contains('is-closing')
);

const openSettingsMenu = () => {
    showWithMotion(els.settingsMenu);
    els.settingsButton.setAttribute('aria-expanded', 'true');
};

const closeSettingsMenu = () => {
    hideWithMotion(els.settingsMenu);
    els.settingsButton.setAttribute('aria-expanded', 'false');
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
    button?.addEventListener('click', () => toggleCustomSelect(kind));
    menu?.addEventListener('click', (event) => {
        const option = event.target.closest('[data-custom-select-value]');
        if (!option) return;
        chooseCustomSelectValue(kind, option.dataset.customSelectValue || '');
    });
};

const parseNotebookAttributes = (value) => {
    const attrs = {};
    String(value || '').replace(/([\w-]+)\s*=\s*(["'])(.*?)\2/g, (match, key, quote, raw) => {
        attrs[key.toLowerCase()] = raw;
        return match;
    });
    return attrs;
};

const getNotebookExtension = (path = '') => {
    const match = String(path || '').toLowerCase().match(/\.([a-z0-9]{1,16})$/);
    return match ? match[1] : '';
};

const getNotebookLanguageForPath = (path = '', fallback = '') => {
    const ext = getNotebookExtension(path);
    return NOTEBOOK_LANGUAGE_BY_EXT[ext] ?? String(fallback || ext || '').replace(/[^\w-]/g, '').slice(0, 30);
};

const normalizeNotebookLanguage = (value, path = '') => {
    const normalized = normalizeCodeLanguage(value || getNotebookLanguageForPath(path));
    return normalized || getNotebookLanguageForPath(path);
};

const normalizeNotebookPath = (value, fallback = 'note.md') => {
    let cleaned = String(value || fallback)
        .replace(/\\/g, '/')
        .replace(/\.\./g, '')
        .replace(/[<>:"|?*\u0000-\u001f]/g, '')
        .replace(/\/+/g, '/')
        .replace(/^\/+/, '')
        .trim()
        .slice(0, 160);
    if (!cleaned) cleaned = fallback;
    const leaf = cleaned.split('/').pop() || '';
    if (!/\.[a-z0-9]{1,16}$/i.test(leaf)) cleaned = `${cleaned}.md`;
    return cleaned || fallback;
};

const parseNotebookActionsFromText = (value) => {
    const actions = [];
    String(value || '').replace(NOTEBOOK_BLOCK_RE, (match, attrText, content) => {
        const attrs = parseNotebookAttributes(attrText);
        const path = normalizeNotebookPath(attrs.path || attrs.name || attrs.title || 'note.md');
        actions.push({
            action: ['upsert', 'edit', 'create'].includes(String(attrs.action || '').toLowerCase())
                ? String(attrs.action || 'upsert').toLowerCase()
                : 'upsert',
            path,
            title: String(attrs.title || path.split('/').pop() || 'Notebook item').slice(0, 100),
            language: normalizeNotebookLanguage(attrs.language, path),
            kind: String(attrs.kind || 'file').replace(/[^\w-]/g, '').slice(0, 30) || 'file',
            content: String(content || '').replace(/^\n+|\n+$/g, '').slice(0, 100000)
        });
        return '';
    });
    return actions.slice(0, 6);
};

const stripNotebookBlocks = (value) => String(value || '')
    .replace(NOTEBOOK_BLOCK_RE, '')
    .replace(NOTEBOOK_PARTIAL_RE, '')
    .trim();

const getNotebookActions = (message) => {
    const noticeActions = message?.notice?.notebookActions;
    if (Array.isArray(noticeActions) && noticeActions.length > 0) return noticeActions;
    return parseNotebookActionsFromText(message?.content || '');
};

const getVisibleMessageContent = (message) => stripNotebookBlocks(message?.content || '');

const notebookStorageKeyForChat = (chatId) => `notebook_chat_${Number(chatId)}`;

const currentNotebookStorageKey = () => {
    if (state.temporaryMode || state.activeSharedToken || !state.activeChatId) return '';
    return notebookStorageKeyForChat(state.activeChatId);
};

const canPersistNotebook = () => Boolean(currentNotebookStorageKey());

const emptyNotebook = () => ({
    files: [],
    activeFileId: '',
    editingFileId: '',
    pendingChanges: [],
    activeChangeId: ''
});

const loadNotebook = () => {
    const storageKey = currentNotebookStorageKey();
    if (!storageKey) return emptyNotebook();
    try {
        let raw = storageGet(storageKey);
        if (!raw && storageGet('notebook') && storageGet('notebook_migrated') !== '1') {
            raw = storageGet('notebook');
            storageSet(storageKey, raw);
            storageSet('notebook_migrated', '1');
        }
        const parsed = JSON.parse(raw || '');
        if (parsed && Array.isArray(parsed.files)) {
            return {
                ...emptyNotebook(),
                ...parsed,
                files: parsed.files.map((file) => ({
                    id: file.id || crypto.randomUUID?.() || `file-${Date.now()}-${Math.random()}`,
                    path: normalizeNotebookPath(file.path || file.title || 'note.md'),
                    title: String(file.title || file.path || 'Notebook item').slice(0, 100),
                    language: normalizeNotebookLanguage(file.language, file.path || file.title || 'note.md'),
                    kind: String(file.kind || 'file').replace(/[^\w-]/g, '').slice(0, 30) || 'file',
                    content: String(file.content || ''),
                    updatedAt: Number(file.updatedAt || Date.now()),
                    versions: Array.isArray(file.versions) ? file.versions.slice(-30) : []
                })),
                pendingChanges: Array.isArray(parsed.pendingChanges)
                    ? parsed.pendingChanges.map((change) => ({
                        id: change.id || crypto.randomUUID?.() || `change-${Date.now()}-${Math.random()}`,
                        fileId: change.fileId || '',
                        path: normalizeNotebookPath(change.path || change.title || 'note.md'),
                        title: String(change.title || change.path || 'Notebook change').slice(0, 100),
                        diff: String(change.diff || ''),
                        createdAt: Number(change.createdAt || Date.now())
                    })).slice(-12)
                    : [],
                activeChangeId: parsed.activeChangeId || ''
            };
        }
    } catch (_) {}
    return emptyNotebook();
};

const saveNotebook = () => {
    const storageKey = currentNotebookStorageKey();
    if (!storageKey) return;
    storageSet(storageKey, JSON.stringify(state.notebook || emptyNotebook()));
};

const getActiveNotebookFile = () => {
    if (!state.notebook) return null;
    return state.notebook.files.find((file) => file.id === state.notebook.activeFileId) || state.notebook.files[0] || null;
};

const notebookFileIcon = (file) => {
    const lower = String(file?.path || '').toLowerCase();
    if (/\.(js|mjs|cjs|ts|tsx|jsx|py|css|html|json|java|go|rs|rb|php|sql|sh|yaml|yml)$/i.test(lower)) return 'file-code-2';
    if (/research|source|brief|notes?\//.test(lower)) return 'book-open-text';
    return 'file-text';
};

const createNotebookVersion = ({ file, content, sourceKey = 'manual' }) => ({
    id: crypto.randomUUID?.() || `version-${Date.now()}-${Math.random()}`,
    createdAt: Date.now(),
    sourceKey,
    content: String(content || ''),
    previousContent: String(file?.content || '')
});

const upsertNotebookFile = (action, sourceKey = 'manual') => {
    state.notebook = state.notebook || emptyNotebook();
    upsertNotebookFile.lastChange = null;
    const path = normalizeNotebookPath(action.path || action.title || 'note.md');
    let file = state.notebook.files.find((item) => item.path.toLowerCase() === path.toLowerCase());
    if (!file) {
        file = {
            id: crypto.randomUUID?.() || `file-${Date.now()}-${Math.random()}`,
            path,
            title: String(action.title || path.split('/').pop() || 'Notebook item').slice(0, 100),
            language: normalizeNotebookLanguage(action.language, path),
            kind: String(action.kind || 'file').replace(/[^\w-]/g, '').slice(0, 30) || 'file',
            content: '',
            updatedAt: Date.now(),
            versions: []
        };
        state.notebook.files.push(file);
    }

    if (file.versions.some((version) => version.sourceKey === sourceKey) && sourceKey !== 'manual') {
        return file;
    }

    const nextContent = String(action.content || '');
    const previousContent = String(file.content || '');
    if (nextContent !== file.content || sourceKey !== 'manual') {
        file.versions.push(createNotebookVersion({ file, content: nextContent, sourceKey }));
        file.versions = file.versions.slice(-30);
        file.content = nextContent;
        file.updatedAt = Date.now();
        state.notebookDrafts?.delete(file.id);
        if (nextContent !== previousContent) {
            upsertNotebookFile.lastChange = {
                file,
                previousContent,
                nextContent,
                diff: buildSimpleDiff(previousContent, nextContent)
            };
        }
    }
    file.title = String(action.title || file.title || path.split('/').pop() || 'Notebook item').slice(0, 100);
    file.language = normalizeNotebookLanguage(action.language || file.language, path);
    file.kind = String(action.kind || file.kind || 'file').replace(/[^\w-]/g, '').slice(0, 30) || 'file';
    state.notebook.activeFileId = file.id;
    return file;
};

const addNotebookChangeTab = (change) => {
    if (!change?.file || !change.diff) return;
    state.notebook.pendingChanges = Array.isArray(state.notebook.pendingChanges)
        ? state.notebook.pendingChanges
        : [];
    const item = {
        id: crypto.randomUUID?.() || `change-${Date.now()}-${Math.random()}`,
        fileId: change.file.id,
        path: change.file.path,
        title: change.file.title || change.file.path,
        diff: change.diff,
        createdAt: Date.now()
    };
    state.notebook.pendingChanges = [
        item,
        ...state.notebook.pendingChanges.filter((existing) => existing.fileId !== change.file.id)
    ].slice(0, 12);
    state.notebook.activeChangeId = item.id;
};

const clearNotebookChangesForFile = (fileId) => {
    if (!state.notebook?.pendingChanges?.length || !fileId) return;
    state.notebook.pendingChanges = state.notebook.pendingChanges.filter((change) => change.fileId !== fileId);
    if (!state.notebook.pendingChanges.some((change) => change.id === state.notebook.activeChangeId)) {
        state.notebook.activeChangeId = state.notebook.pendingChanges[0]?.id || '';
    }
};

const closeNotebookChange = (changeId) => {
    if (!state.notebook) return;
    state.notebook.pendingChanges = (state.notebook.pendingChanges || []).filter((change) => change.id !== changeId);
    if (state.notebook.activeChangeId === changeId) {
        state.notebook.activeChangeId = state.notebook.pendingChanges[0]?.id || '';
    }
    saveNotebook();
    renderNotebookPanel();
};

const renderNotebookEmbeds = (message) => {
    const actions = getNotebookActions(message);
    if (!actions.length) return '';
    return `
        <div class="notebook-embeds">
            ${actions.map((action) => `
                <button type="button" data-open-notebook-path="${escapeHtml(normalizeNotebookPath(action.path || action.title || 'note.md'))}">
                    <i data-lucide="notebook-tabs"></i>
                    <span>${escapeHtml(action.title || action.path || 'Notebook')}</span>
                </button>
            `).join('')}
        </div>
    `;
};

const processNotebookActionsForMessage = (message) => {
    if (!canPersistNotebook()) return;
    const actions = getNotebookActions(message);
    if (!actions.length) return;
    const sourceKey = message.id ? `message:${message.id}` : (message._clientKey || getMessageRenderKey(message, 0));
    if (message._notebookSourceKey === sourceKey) return;
    message._notebookSourceKey = sourceKey;
    actions.forEach((action, index) => {
        upsertNotebookFile(action, `${sourceKey}:${index}`);
        addNotebookChangeTab(upsertNotebookFile.lastChange);
    });
    saveNotebook();
    renderNotebookPanel();
};

const processNotebookActionsForMessages = () => {
    state.messages
        .filter((message) => message.role === 'assistant')
        .forEach(processNotebookActionsForMessage);
};

const formatNotebookTime = (value) => new Date(Number(value || Date.now())).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
});

const buildSimpleDiff = (oldText = '', newText = '') => {
    const oldValue = String(oldText);
    const newValue = String(newText);
    const oldLines = oldValue ? oldValue.split('\n') : [];
    const newLines = newValue ? newValue.split('\n') : [];
    const max = Math.max(oldLines.length, newLines.length);
    const rows = [];
    for (let index = 0; index < max; index += 1) {
        const left = oldLines[index];
        const right = newLines[index];
        if (left === right) {
            rows.push(`  ${left || ''}`);
        } else {
            if (left !== undefined) rows.push(`- ${left}`);
            if (right !== undefined) rows.push(`+ ${right}`);
        }
    }
    return rows.join('\n') || 'No differences.';
};

const renderNotebookDiff = (change) => {
    const lines = String(change?.diff || 'No differences.').split('\n');
    let oldLine = 1;
    let newLine = 1;
    let additions = 0;
    let deletions = 0;

    const rows = lines.map((line) => {
        const raw = String(line || '');
        const marker = raw.slice(0, 2);
        let type = 'meta';
        let sign = '';
        let oldNumber = '';
        let newNumber = '';
        let text = raw;

        if (marker === '+ ') {
            type = 'add';
            sign = '+';
            text = raw.slice(2);
            newNumber = newLine;
            newLine += 1;
            additions += 1;
        } else if (marker === '- ') {
            type = 'remove';
            sign = '-';
            text = raw.slice(2);
            oldNumber = oldLine;
            oldLine += 1;
            deletions += 1;
        } else if (marker === '  ') {
            type = 'same';
            sign = ' ';
            text = raw.slice(2);
            oldNumber = oldLine;
            newNumber = newLine;
            oldLine += 1;
            newLine += 1;
        }

        return `
            <span class="diff-row diff-${type}">
                <span class="diff-line-no">${oldNumber}</span>
                <span class="diff-line-no">${newNumber}</span>
                <span class="diff-marker">${escapeHtml(sign)}</span>
                <span class="diff-code">${escapeHtml(text)}</span>
            </span>
        `;
    }).join('');

    return `
        <div class="diff-card">
            <div class="diff-head">
                <span>${escapeHtml(change?.path || 'Notebook diff')}</span>
                <strong><span>+${additions}</span><span>-${deletions}</span></strong>
            </div>
            <code class="diff-grid">${rows}</code>
        </div>
    `;
};

const renderNotebookFileContent = (file, content) => {
    const value = String(content || '');
    if (!value.trim()) return '<p class="empty-list">This file is empty.</p>';
    const ext = getNotebookExtension(file?.path || '');
    if (NOTEBOOK_MARKDOWN_EXTENSIONS.has(ext)) {
        return `<div class="markdown-body">${renderMarkdown(value)}</div>`;
    }
    const language = normalizeNotebookLanguage(file?.language, file?.path || '');
    return `
        <div class="markdown-body notebook-code-view">
            <pre${language ? ` data-code-lang="${escapeHtml(language)}"` : ''}><button class="copy-code-btn" type="button" data-copy-code title="Copy file" aria-label="Copy file"><i data-lucide="copy"></i></button><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${escapeHtml(value)}</code></pre>
        </div>
    `;
};

const renderNotebookPanel = () => {
    if (!state.notebook) state.notebook = loadNotebook();
    const file = getActiveNotebookFile();
    if (file && state.notebook.activeFileId !== file.id) state.notebook.activeFileId = file.id;
    const files = [...state.notebook.files].sort((a, b) => a.path.localeCompare(b.path));
    const writable = canPersistNotebook();
    const editing = Boolean(file && state.notebook.editingFileId === file.id);
    const pendingChanges = Array.isArray(state.notebook.pendingChanges) ? state.notebook.pendingChanges : [];
    const activeChange = pendingChanges.find((change) => change.id === state.notebook.activeChangeId) || pendingChanges[0] || null;
    if (activeChange && state.notebook.activeChangeId !== activeChange.id) state.notebook.activeChangeId = activeChange.id;

    els.notebookWorkspace?.classList.toggle('is-editing', editing);
    els.notebookWorkspace?.classList.toggle('has-active-change', Boolean(activeChange));
    els.notebookPanel.classList.toggle('hidden', !state.notebookOpen);
    document.body.classList.toggle('notebook-open', state.notebookOpen);
    els.notebookToggleButton?.setAttribute('aria-expanded', state.notebookOpen ? 'true' : 'false');
    els.notebookPanelTitle.textContent = files.length ? `${files.length} notebook file${files.length === 1 ? '' : 's'}` : 'Chat Notebook';
    els.notebookScopeText.textContent = writable
        ? 'Saved only to this chat'
        : (state.temporaryMode ? 'Temporary chat notes are not saved' : 'Open a saved chat to save notes');
    els.newNotebookFileButton.disabled = !writable;
    els.copyNotebookButton.disabled = !file;
    els.editNotebookButton.disabled = !writable || !file;
    els.saveNotebookButton.disabled = !writable || !file || !editing;
    els.editNotebookButton.querySelector('span').textContent = editing ? 'Cancel' : 'Edit';
    els.notebookFileList.innerHTML = files.length ? files.map((item) => `
        <button class="${item.id === file?.id ? 'active' : ''} ${pendingChanges.some((change) => change.fileId === item.id) ? 'has-change' : ''}" type="button" data-notebook-file="${escapeHtml(item.id)}">
            <i data-lucide="${notebookFileIcon(item)}"></i>
            <span>
                <strong>${escapeHtml(item.path)}</strong>
                <small>${escapeHtml(item.language || getNotebookLanguageForPath(item.path) || 'text')} · ${escapeHtml(formatNotebookTime(item.updatedAt))}</small>
            </span>
        </button>
    `).join('') : '<p class="empty-list">No chat notes yet.</p>';

    els.notebookChangeTabs.classList.toggle('hidden', pendingChanges.length === 0);
    els.notebookChangeTabs.innerHTML = pendingChanges.map((change) => `
        <button class="notebook-change-tab ${change.id === activeChange?.id ? 'active' : ''}" type="button" data-notebook-change="${escapeHtml(change.id)}">
            <i data-lucide="git-compare-arrows"></i>
            <span>${escapeHtml(change.path)}</span>
            <strong>AI change</strong>
            <i data-lucide="x" data-close-notebook-change="${escapeHtml(change.id)}"></i>
        </button>
    `).join('');
    els.notebookAiDiff.classList.toggle('hidden', !activeChange);
    els.notebookAiDiff.innerHTML = activeChange ? renderNotebookDiff(activeChange) : '';

    if (!file) {
        els.notebookWorkspace?.classList.remove('is-editing');
        els.notebookMeta.textContent = 'No file selected';
        els.notebookEditor.value = '';
        els.notebookPreview.innerHTML = '<p class="empty-list">Ask Gatita to create notes in this chat, or add a new note after the chat exists.</p>';
        els.notebookEditor.classList.add('hidden');
        els.notebookPreview.classList.remove('hidden');
        els.notebookPreview.classList.remove('is-live-preview');
        iconRefresh();
        return;
    }

    const draftContent = state.notebookDrafts.get(file.id);
    const editorContent = draftContent ?? file.content ?? '';
    els.notebookMeta.textContent = `${file.path} · ${file.language || getNotebookLanguageForPath(file.path) || 'text'} · saved ${formatNotebookTime(file.updatedAt)}${draftContent !== undefined ? ' · unsaved edits' : ''}`;
    els.notebookEditor.spellcheck = NOTEBOOK_MARKDOWN_EXTENSIONS.has(getNotebookExtension(file.path)) || getNotebookExtension(file.path) === 'txt';
    if (document.activeElement !== els.notebookEditor) els.notebookEditor.value = editorContent;
    els.notebookEditor.classList.toggle('hidden', !editing);
    els.notebookPreview.classList.remove('hidden');
    els.notebookPreview.classList.toggle('is-live-preview', editing);
    els.notebookPreview.innerHTML = renderNotebookFileContent(file, editing ? editorContent : file.content || '');
    highlightCodeBlocks(els.notebookPreview);
    iconRefresh();
};

const openNotebookPanel = (path = '') => {
    state.notebookOpen = true;
    if (path && state.notebook) {
        const file = state.notebook.files.find((item) => item.path.toLowerCase() === normalizeNotebookPath(path).toLowerCase());
        if (file) state.notebook.activeFileId = file.id;
    }
    renderNotebookPanel();
};

const closeNotebookPanel = () => {
    state.notebookOpen = false;
    renderNotebookPanel();
};

const isSafeUrl = (value) => {
    try {
        const parsed = new URL(value, window.location.href);
        return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
    } catch (_) {
        return false;
    }
};

const renderInlineMarkdown = (value) => {
    const codeSpans = [];
    let text = String(value || '').replace(/`([^`]+)`/g, (match, code) => {
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
        .replace(/(^|[\s(])((?:https?:\/\/)[^\s<)]+)/g, (match, prefix, url) => (
            `${prefix}<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`
        ))
        .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
        .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
        .replace(/~~([^~]+)~~/g, '<del>$1</del>');

    codeSpans.forEach((html, index) => {
        text = text.replace(`@@CODESPAN_${index}@@`, html);
    });
    return text;
};

const isTableSeparator = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

const parseTableRow = (line) => {
    const cleaned = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return cleaned.split('|').map((cell) => cell.trim());
};

const normalizeCodeLanguage = (value) => {
    const raw = String(value || '').trim().split(/\s+/)[0].toLowerCase();
    const aliases = {
        js: 'javascript',
        mjs: 'javascript',
        cjs: 'javascript',
        ts: 'typescript',
        py: 'python',
        rb: 'ruby',
        sh: 'bash',
        shell: 'bash',
        zsh: 'bash',
        yml: 'yaml',
        md: 'markdown',
        cplusplus: 'cpp',
        'c++': 'cpp',
        cs: 'csharp',
        'c#': 'csharp'
    };
    return (aliases[raw] || raw).replace(/[^\w-]/g, '');
};

const renderMarkdown = (value) => {
    const source = String(value || '').replace(/\r\n/g, '\n');
    const codeBlocks = [];
    const protectedSource = source.replace(/```([^\n`]*)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        const token = `@@CODEBLOCK_${codeBlocks.length}@@`;
        codeBlocks.push({
            lang: normalizeCodeLanguage(lang),
            code: escapeHtml(code.trim())
        });
        return token;
    });

    const lines = protectedSource.split('\n');
    const out = [];
    let listType = null;
    let paragraph = [];
    let blockquote = [];

    const flushParagraph = () => {
        if (paragraph.length > 0) {
            out.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
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
            out.push(`<blockquote>${blockquote.map((line) => `<p>${renderInlineMarkdown(line)}</p>`).join('')}</blockquote>`);
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
            const lang = block?.lang || '';
            out.push(`<pre${lang ? ` data-code-lang="${escapeHtml(lang)}"` : ''}><button class="copy-code-btn" type="button" data-copy-code title="Copy code" aria-label="Copy code"><i data-lucide="copy"></i></button><code${lang ? ` class="language-${lang}"` : ''}>${block?.code || ''}</code></pre>`);
            continue;
        }

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            closeLooseBlocks();
            out.push('<hr>');
            continue;
        }

        if (trimmed.includes('|') && lines[i + 1] && isTableSeparator(lines[i + 1])) {
            closeLooseBlocks();
            const headers = parseTableRow(trimmed);
            i += 2;
            const rows = [];
            while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim()) {
                rows.push(parseTableRow(lines[i]));
                i += 1;
            }
            i -= 1;
            out.push([
                '<div class="table-wrap"><table>',
                `<thead><tr>${headers.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('')}</tr></thead>`,
                `<tbody>${rows.map((row) => `<tr>${headers.map((_, index) => `<td>${renderInlineMarkdown(row[index] || '')}</td>`).join('')}</tr>`).join('')}</tbody>`,
                '</table></div>'
            ].join(''));
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
            if (listType !== 'ul') {
                closeList();
                out.push('<ul>');
                listType = 'ul';
            }
            out.push(`<li class="task-item"><input type="checkbox" disabled${task[1].toLowerCase() === 'x' ? ' checked' : ''}> ${renderInlineMarkdown(task[2])}</li>`);
            continue;
        }

        const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
        if (bullet) {
            flushParagraph();
            flushBlockquote();
            if (listType !== 'ul') {
                closeList();
                out.push('<ul>');
                listType = 'ul';
            }
            out.push(`<li>${renderInlineMarkdown(bullet[1])}</li>`);
            continue;
        }

        const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
        if (ordered) {
            flushParagraph();
            flushBlockquote();
            if (listType !== 'ol') {
                closeList();
                out.push('<ol>');
                listType = 'ol';
            }
            out.push(`<li>${renderInlineMarkdown(ordered[1])}</li>`);
            continue;
        }

        closeList();
        flushBlockquote();
        paragraph.push(trimmed);
    }

    closeLooseBlocks();
    return out.join('');
};

const highlightCodeBlocks = (root = document) => {
    if (!window.hljs || !root) return;
    root.querySelectorAll('pre code:not([data-highlighted])').forEach((block) => {
        try {
            window.hljs.highlightElement(block);
        } catch (_) {
            block.dataset.highlighted = 'yes';
        }
    });
};

const renderSources = (sources) => {
    if (!Array.isArray(sources) || sources.length === 0) return '';
    return `
        <details class="sources-menu">
            <summary>Sources</summary>
            <div class="source-links">
                ${sources.map((source) => `
                    <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
                        ${source.icon ? `<img src="${escapeHtml(source.icon)}" alt="">` : ''}
                        <span>${escapeHtml(source.domain || source.title || 'Source')}</span>
                    </a>
                `).join('')}
            </div>
        </details>
    `;
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
    if (!activity) return '';
    const thinking = Array.isArray(activity.thinking) ? activity.thinking.slice(-3) : [];
    const research = Array.isArray(activity.research) ? activity.research.slice(-4) : [];
    const sources = Array.isArray(activity.sources) ? activity.sources.slice(-6) : [];
    if (thinking.length === 0 && research.length === 0 && sources.length === 0) return '';

    return `
        <div class="activity-panel">
            ${thinking.length ? `
                <section>
                    <span class="activity-title">Thinking</span>
                    ${thinking.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
                </section>
            ` : ''}
            ${research.length || sources.length ? `
                <section>
                    <span class="activity-title">Research</span>
                    ${research.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
                    ${sources.length ? `
                        <div class="activity-sites">
                            ${sources.map((source) => `
                                <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
                                    ${source.icon ? `<img src="${escapeHtml(source.icon)}" alt="">` : ''}
                                    <span>${escapeHtml(source.domain || source.title || 'source')}</span>
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                </section>
            ` : ''}
        </div>
    `;
};

const renderQueueIndicator = (message) => {
    if (!message?.queueing) return '';
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
    els.emptyState.classList.toggle('hidden', state.messages.length > 0);
    els.messages.classList.toggle('streaming-render', viewStreaming);
    els.messageScroll.classList.toggle('streaming-scroll', viewStreaming);
    els.messages.innerHTML = state.messages.map((message, index) => {
        const renderKey = getMessageRenderKey(message, index);
        const entering = !renderMessages.seenKeys?.has(renderKey);
        const entryClass = entering && !viewStreaming ? ' entering' : '';
        renderMessages.seenKeys = renderMessages.seenKeys || new Set();
        renderMessages.seenKeys.add(renderKey);

        if (message.type === 'policy') {
            return `
                <article class="policy-banner${entryClass}">
                    <strong>${escapeHtml(message.content || 'This prompt is against the Terms of Service.')}</strong>
                    <a href="${escapeHtml(message.tosUrl || getTosUrl())}" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                </article>
            `;
        }

        if (message.loading) {
            return `
                <article class="message assistant" data-render-key="${escapeHtml(renderKey)}">
                    <div class="message-stack">
                        ${renderActivityPanel(message.activity)}
                        ${renderQueueIndicator(message)}
                        <div class="bubble loading" aria-label="Loading">
                            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                        </div>
                    </div>
                </article>
            `;
        }

        const chips = Array.isArray(message.attachments) && message.attachments.length
            ? `<div class="file-chip-row">${message.attachments.map((file) => `<span class="file-chip">${escapeHtml(file.name || 'file')}</span>`).join('')}</div>`
            : '';
        const visibleContent = getVisibleMessageContent(message);
        const body = message.role === 'assistant'
            ? (message.streaming
                ? `<div class="stream-plain">${escapeHtml(visibleContent)}</div>`
                : `<div class="markdown-body">${getMarkdownHtml(message)}</div>`)
            : escapeHtml(visibleContent);
        const streaming = message.streaming ? '<span class="stream-cursor" aria-hidden="true"></span>' : '';
        const sources = message.role === 'assistant' ? renderSources(message.sources) : '';
        const activity = message.role === 'assistant' ? renderActivityPanel(message.activity) : '';
        const queue = message.role === 'assistant' ? renderQueueIndicator(message) : '';
        const notebookEmbeds = message.role === 'assistant' && !message.streaming ? renderNotebookEmbeds(message) : '';
        const actions = message.id && !state.activeSharedToken ? `
            <div class="message-actions">
                ${message.role === 'assistant' ? `
                    <button type="button" data-copy-message="${message.id}" title="Copy" aria-label="Copy response"><i data-lucide="copy"></i></button>
                    <button type="button" data-regenerate-message="${message.id}" title="Regenerate" aria-label="Regenerate response"><i data-lucide="refresh-cw"></i></button>
                ` : `
                    <button type="button" data-edit-message="${message.id}" title="Edit and resend" aria-label="Edit and resend"><i data-lucide="pencil"></i></button>
                `}
                <button type="button" data-delete-message="${message.id}" title="Delete" aria-label="Delete message"><i data-lucide="trash-2"></i></button>
            </div>
        ` : '';

        return `
            <article class="message ${message.role === 'user' ? 'user' : 'assistant'}${message.streaming ? ' streaming' : ''}${entryClass}" data-message-id="${message.id || ''}" data-render-key="${escapeHtml(renderKey)}">
                <div class="message-stack">${activity}${queue}<div class="bubble">${body}${streaming}${chips}${sources}${notebookEmbeds}</div>${actions}</div>
            </article>
        `;
    }).join('');
    if (shouldStickToBottom) queueBottomLock({ smooth: !viewStreaming });
    requestAnimationFrame(() => {
        if (!viewStreaming) {
            highlightCodeBlocks(els.messages);
            queueMathTypeset();
            iconRefresh();
        }
    });
};

const formatUpdateTime = (value) => new Date(Number(value || Date.now())).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
});

const renderUpdates = () => {
    if (!els.updatesList) return;
    const canPost = Boolean(state.user?.isAdmin);
    els.updatesForm?.classList.toggle('hidden', !canPost);
    els.updatesList.innerHTML = state.updates.length ? state.updates.map((item) => `
        <article class="update-card">
            <header>
                <div>
                    <span class="mode-label">Update</span>
                    <h3>${escapeHtml(item.title || 'Update')}</h3>
                </div>
                <time datetime="${new Date(Number(item.publishedAt || Date.now())).toISOString()}">${escapeHtml(formatUpdateTime(item.publishedAt))}</time>
            </header>
            <div class="markdown-body">${renderMarkdown(item.content || '')}</div>
        </article>
    `).join('') : '<p class="empty-list">No updates yet.</p>';
    highlightCodeBlocks(els.updatesList);
    iconRefresh();
    if (state.updates.some((item) => /(\$\$|\\\(|\\\[|\$[^$\n]{1,160}\$)/.test(item.content || ''))) {
        loadMathJax()
            .then(() => window.MathJax.typesetPromise([els.updatesList]))
            .catch(() => {});
    }
};

const fetchUpdates = async () => {
    const data = await apiFetch('/updates');
    state.updates = data.updates || [];
    renderUpdates();
    return data;
};

const openUpdatesModal = async () => {
    showWithMotion(els.updatesModal);
    els.updatesButton?.setAttribute('aria-expanded', 'true');
    renderUpdates();
    await fetchUpdates().catch((error) => showToast(error.message || 'Updates could not load.'));
};

const closeUpdatesModal = () => {
    hideWithMotion(els.updatesModal);
    els.updatesButton?.setAttribute('aria-expanded', 'false');
};

const scheduleRenderMessages = () => {
    if (scheduleRenderMessages.queued) return;
    scheduleRenderMessages.queued = true;
    const now = performance.now();
    const elapsed = now - (scheduleRenderMessages.lastRenderAt || 0);
    const delay = isCurrentViewStreaming() ? Math.max(0, STREAM_RENDER_INTERVAL_MS - elapsed) : 0;
    const render = () => requestAnimationFrame(() => {
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
    els.attachmentRow.innerHTML = state.pendingFiles.map((file, index) => `
        <span class="file-chip ${file.size > maxFileBytes || !file.type ? 'warning' : ''}" title="${escapeHtml(file.type || 'application/octet-stream')}">
            <span>
                <strong>${escapeHtml(file.name)}</strong>
                <small>${escapeHtml(file.type || 'unknown')} · ${formatBytes(file.size)}</small>
            </span>
            <button type="button" data-remove-file="${index}" aria-label="Remove ${escapeHtml(file.name)}">×</button>
        </span>
    `).join('');
};

const autoGrowInput = () => {
    els.messageInput.style.height = 'auto';
    els.messageInput.style.height = `${Math.min(180, els.messageInput.scrollHeight)}px`;
};

const getBrowserCheckParts = (kind = 'message') => {
    if (kind === 'auth') {
        return {
            status: els.authBrowserCheckStatus,
            proofKey: 'authBrowserProof',
            action: 'ask_auth'
        };
    }

    return {
        status: els.browserCheckStatus,
        proofKey: 'browserProof',
        action: 'ask_message'
    };
};

const setBrowserCheckStatus = (kind, message, tone = '') => {
    const { status } = getBrowserCheckParts(kind);
    if (!status) return;
    status.textContent = message || '';
    status.parentElement?.classList.toggle('hidden', !message);
    status.classList.toggle('hidden', !message);
    status.classList.toggle('error', tone === 'error');
    status.classList.toggle('ready', tone === 'ready');
};

const clearBrowserCheckStatus = (kind) => setBrowserCheckStatus(kind, '');

const hideBrowserCheckStatus = (kind) => {
    const { status } = getBrowserCheckParts(kind);
    status?.parentElement?.classList.add('hidden');
    status?.classList.add('hidden');
};

const renderBrowserCheck = () => {
    if (!state.config?.browserCheckRequired) {
        hideBrowserCheckStatus('message');
        hideBrowserCheckStatus('auth');
        return;
    }

    clearBrowserCheckStatus('message');
    clearBrowserCheckStatus('auth');
};

const hasRecentBrowserCheckPass = () => Date.now() < Number(state.browserCheckVerifiedUntil || 0);

const rememberBrowserCheckPass = () => {
    const ttl = Math.max(0, Number(state.config?.browserCheckPassTtlMs || 0));
    if (!ttl) return;
    state.browserCheckVerifiedUntil = Date.now() + Math.max(0, ttl - 15000);
};

const forgetBrowserCheckPass = () => {
    state.browserCheckVerifiedUntil = 0;
};

const resetBrowserCheck = (kind = 'message') => {
    const parts = getBrowserCheckParts(kind);
    state[parts.proofKey] = null;
    clearBrowserCheckStatus(kind);
};

const yieldBrowserCheck = () => new Promise((resolve) => setTimeout(resolve, 0));

const sha256Hex = async (value) => {
    const bytes = new TextEncoder().encode(String(value));
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
};

const countLeadingZeroBits = (hex) => {
    let count = 0;
    for (const char of String(hex || '')) {
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
        throw new Error('Security check needs a modern secure browser.');
    }

    const difficulty = Math.max(0, Number(challenge?.difficulty || 0));
    const maxAttempts = Math.max(1, Number(challenge?.maxAttempts || 2500000));
    const expiresAt = Number(challenge?.expiresAt || 0);
    const action = String(challenge?.action || '');
    const prefix = `${challenge?.id}:${challenge?.nonce}:${action}:${expiresAt}:`;

    for (let counter = 0; counter <= maxAttempts; counter += 1) {
        if (expiresAt && Date.now() > expiresAt - 1000) {
            throw new Error('Security check expired. Please try again.');
        }

        const hash = await sha256Hex(`${prefix}${counter}`);
        if (countLeadingZeroBits(hash) >= difficulty) {
            return {
                id: challenge.id,
                nonce: challenge.nonce,
                action,
                expiresAt,
                counter,
                hash
            };
        }

        if (counter > 0 && counter % BROWSER_CHECK_YIELD_EVERY === 0) {
            await yieldBrowserCheck();
        }
    }

    throw new Error('Security check took too long. Please try again.');
};

const ensureBrowserCheckProof = async (kind = 'message') => {
    if (!state.config?.browserCheckRequired) return true;
    if (kind === 'message' && hasRecentBrowserCheckPass()) return true;

    const parts = getBrowserCheckParts(kind);
    if (state[parts.proofKey]) return true;

    setBrowserCheckStatus(kind, 'Preparing security check...');

    try {
        const data = await apiFetch('/browser-check/challenge', {
            method: 'POST',
            body: JSON.stringify({ action: parts.action })
        });

        if (!data.required) {
            clearBrowserCheckStatus(kind);
            return true;
        }

        if (!data.challenge?.id || !data.challenge?.nonce) {
            throw new Error('Security check is unavailable.');
        }

        state[parts.proofKey] = await solveBrowserCheck(data.challenge);
        setBrowserCheckStatus(kind, 'Security check complete.', 'ready');
        clearTimeout(setBrowserCheckStatus[`${kind}Timer`]);
        setBrowserCheckStatus[`${kind}Timer`] = setTimeout(() => clearBrowserCheckStatus(kind), 1200);
        return true;
    } catch (error) {
        state[parts.proofKey] = null;
        setBrowserCheckStatus(kind, error.message || 'Security check failed. Please try again.', 'error');
        throw error;
    }
};

const readFilePayload = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const result = String(reader.result || '');
        resolve({
            name: file.name,
            contentType: file.type || 'application/octet-stream',
            data: result.split(',')[1] || ''
        });
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
});

const fetchConfig = async () => {
    const data = await apiFetch('/config');
    state.config = data;
    updateUsage(data.usage);
    renderSelects();
    renderBrowserCheck();
};

const fetchMe = async () => {
    const data = await apiFetch('/me');
    state.user = data.user || null;
    updateUsage(data.usage);
    updateAccount();
    if (state.user && storageGet('thinking') === '1') {
        els.thinkingToggle.checked = true;
    }
    if (state.user && storageGet('auto_web') === '1') {
        els.autoWebToggle.checked = true;
    }
    if (state.user && storageGet('research') === '1') {
        els.researchToggle.checked = true;
    }
    if (state.user && storageGet('deep_research') === '1') {
        els.deepResearchToggle.checked = true;
        els.researchToggle.checked = true;
    }
    updateSettingsSummary();
};

const fetchChats = async () => {
    const query = state.chatSearch ? `?q=${encodeURIComponent(state.chatSearch)}` : '';
    const data = await apiFetch(`/chats${query}`);
    state.chats = data.chats || [];
    renderChats();
};

const createChat = async ({ navigate = true, resetMessages = true, reloadList = true } = {}) => {
    const data = await apiFetch('/chats', {
        method: 'POST',
        body: JSON.stringify({
            title: 'New chat',
            modelId: els.modelSelect.value,
            personality: els.personalitySelect.value
        })
    });
    state.activeChatId = data.chat.id;
    state.activeSharedToken = '';
    state.temporaryMode = false;
    els.temporaryToggle.checked = false;
    state.chats = [
        data.chat,
        ...state.chats.filter((chat) => chat.id !== data.chat.id)
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
    await createChat({ navigate: false, resetMessages: false, reloadList: false });
    return state.activeChatId;
};

const loadMessages = async (chatId) => {
    saveComposerDraft();
    const data = await apiFetch(`/chats/${chatId}/messages`);
    state.activeChatId = Number(chatId);
    state.activeSharedToken = '';
    state.temporaryMode = false;
    els.temporaryToggle.checked = false;
    state.notebook = loadNotebook();
    state.notebookDrafts = new Map();
    const stream = state.activeStreams.get(chatStreamKey(chatId));
    state.messages = stream?.messages || data.messages || [];
    processNotebookActionsForMessages();
    if (data.chat?.model && state.config?.models?.some((model) => model.id === data.chat.model)) {
        els.modelSelect.value = data.chat.model;
    }
    if (data.chat?.personality && state.config?.personalities?.some((item) => item.id === data.chat.personality)) {
        els.personalitySelect.value = data.chat.personality;
    }
    updateSettingsSummary();
    loadComposerDraft();
    renderChats();
    renderMessages();
    scheduleActiveChatSync();
};

const hasPendingSavedResponse = () => state.messages.some((message) => (
    message.role === 'assistant'
    && message.loading
    && !message.streaming
));

const scheduleActiveChatSync = () => {
    clearTimeout(scheduleActiveChatSync.timer);
    if (!state.activeChatId || state.activeSharedToken || state.temporaryMode) return;
    if (state.activeStreams.has(chatStreamKey(state.activeChatId))) return;
    if (!hasPendingSavedResponse()) return;

    const chatId = Number(state.activeChatId);
    scheduleActiveChatSync.timer = setTimeout(() => {
        if (Number(state.activeChatId) !== chatId || state.temporaryMode || state.activeSharedToken) return;
        if (state.activeStreams.has(chatStreamKey(chatId))) return;
        loadMessages(chatId).catch((error) => showToast(error.message || 'Chat could not sync.'));
    }, 2500);
};

const syncActiveChat = async () => {
    if (!state.activeChatId || state.temporaryMode || state.activeSharedToken) return;
    if (state.activeStreams.has(chatStreamKey(state.activeChatId))) return;
    await loadMessages(state.activeChatId);
};

const loadSharedChat = async (token) => {
    saveComposerDraft();
    const data = await apiFetch(`/shared/${encodeURIComponent(token)}`);
    state.activeChatId = null;
    state.activeSharedToken = token;
    state.temporaryMode = false;
    els.temporaryToggle.checked = false;
    state.notebook = emptyNotebook();
    state.notebookDrafts = new Map();
    state.messages = data.messages || [];
    loadComposerDraft();
    renderChats();
    renderNotebookPanel();
    renderMessages();
};

const startNewChat = () => {
    saveComposerDraft();
    if (state.temporaryMode) state.temporaryMessages = state.messages;
    state.activeChatId = null;
    state.activeSharedToken = '';
    state.temporaryMode = false;
    els.temporaryToggle.checked = false;
    state.messages = [];
    state.notebook = emptyNotebook();
    state.notebookDrafts = new Map();
    window.location.hash = newChatUrl();
    updateSettingsSummary();
    loadComposerDraft();
    renderChats();
    renderNotebookPanel();
    renderMessages();
};

const startTemporaryChat = () => {
    saveComposerDraft();
    if (!state.temporaryMode) {
        state.temporaryMessages = state.temporaryMessages || [];
    }
    state.activeChatId = null;
    state.activeSharedToken = '';
    state.temporaryMode = true;
    els.temporaryToggle.checked = true;
    state.messages = state.temporaryMessages;
    state.notebook = emptyNotebook();
    state.notebookDrafts = new Map();
    window.location.hash = '#/temp';
    updateSettingsSummary();
    loadComposerDraft();
    renderChats();
    renderNotebookPanel();
    renderMessages();
};

const routeFromHash = async () => {
    const hash = window.location.hash || newChatUrl();
    const chatMatch = hash.match(/^#\/chat\/(\d+)$/);
    const shareMatch = hash.match(/^#\/share\/([a-zA-Z0-9_-]+)$/);
    if (hash === '#/temp') {
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
        method: 'PATCH',
        body: JSON.stringify(patch)
    });
    state.chats = state.chats.map((chat) => chat.id === Number(chatId) ? data.chat : chat);
    renderChats();
    return data.chat;
};

const deleteChat = async (chatId) => {
    await apiFetch(`/chats/${chatId}`, { method: 'DELETE', body: JSON.stringify({}) });
    storageRemove(notebookStorageKeyForChat(chatId));
    if (state.activeChatId === Number(chatId)) startNewChat();
    await fetchChats();
};

const shareChat = async (chatId) => {
    const data = await apiFetch(`/chats/${chatId}/share`, {
        method: 'POST',
        body: JSON.stringify({ enabled: true })
    });
    const url = data.shareUrl || `${window.location.origin}${window.location.pathname}${sharedUrl(data.shareToken)}`;
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url).catch(() => {});
    showToast('Share link copied.');
    await fetchChats();
};

const copyText = async (text) => {
    const value = String(text || '');
    let copied = false;
    if (navigator.clipboard?.writeText) {
        copied = await navigator.clipboard.writeText(value).then(() => true).catch(() => false);
    }
    if (!copied) {
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.left = '-9999px';
        field.style.top = '0';
        document.body.appendChild(field);
        field.focus();
        field.select();
        copied = document.execCommand('copy');
        field.remove();
    }
    showToast(copied ? 'Copied.' : 'Copy was blocked by the browser.');
};

const deleteMessage = async (messageId) => {
    if (!state.activeChatId) return;
    await apiFetch(`/chats/${state.activeChatId}/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({})
    });
    state.messages = state.messages.filter((message) => message.id !== Number(messageId));
    await fetchChats();
    renderMessages();
};

const editAndResend = async (messageId) => {
    const message = state.messages.find((item) => item.id === Number(messageId));
    if (!message || message.role !== 'user') return;
    const next = await openActionModal({
        title: 'Edit Message',
        message: 'Resending will replace this message and remove later replies in the chat.',
        kind: 'textarea',
        label: 'Message',
        value: message.content || '',
        confirmText: 'Resend',
        required: true,
        maxLength: state.config?.limits?.messageMaxChars || 12000
    });
    if (next === null) return;
    const text = next.trim();
    if (!text) return;
    await sendMessage({ text, resendMessageId: Number(messageId) });
};

const regenerateMessage = async (messageId) => {
    const message = state.messages.find((item) => item.id === Number(messageId));
    if (!message || message.role !== 'assistant') return;
    await sendMessage({ text: '', regenerateMessageId: Number(messageId) });
};

const sendMessage = async (options = {}) => {
    const text = (options.text ?? els.messageInput.value).trim();
    const draftKeyBeforeSend = state.composerDraftKey || composerDraftKeyForCurrentView();
    const isRegenerate = Boolean(options.regenerateMessageId);
    const isResend = Boolean(options.resendMessageId);
    if (!text && state.pendingFiles.length === 0 && !isRegenerate) return;
    if ((els.thinkingToggle.checked || els.researchToggle.checked || els.autoWebToggle.checked || els.deepResearchToggle.checked) && !state.user) {
        els.thinkingToggle.checked = false;
        els.researchToggle.checked = false;
        els.autoWebToggle.checked = false;
        els.deepResearchToggle.checked = false;
        state.messages.push({
            type: 'policy',
            content: 'Thinking, web, and research tools are only available for signed-in accounts.',
            tosUrl: getTosUrl()
        });
        updateSettingsSummary();
        renderMessages();
        return;
    }
    if (state.config?.browserCheckRequired && !hasRecentBrowserCheckPass()) {
        els.sendButton.disabled = true;
        try {
            await ensureBrowserCheckProof('message');
        } catch (error) {
            els.sendButton.disabled = false;
            showToast(error.message || 'Security check failed. Please try again.');
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

    try {
        const temporaryHistory = isTemporary
            ? state.messages
                .filter((message) => message.role === 'user' || message.role === 'assistant')
                .slice(-(state.config?.limits?.contextMessages || 50))
                .map((message) => ({
                    role: message.role,
                    content: getVisibleMessageContent(message)
                }))
            : [];
        const chatId = isTemporary ? null : (state.activeChatId || await ensureChat());
        streamTarget = { isTemporary, chatId };
        const streamKey = streamTargetKey(streamTarget);
        const controller = new AbortController();
        messageList = isTemporary ? state.temporaryMessages : state.messages;
        state.activeStreams.set(streamKey, {
            target: streamTarget,
            messages: messageList,
            controller,
            stopped: false
        });
        refreshBusyState();
        const filesToSend = (isRegenerate || isResend) ? [] : state.pendingFiles;
        const attachments = await Promise.all(filesToSend.map(readFilePayload));
        const publicAttachments = filesToSend.map((file) => ({
            name: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size
        }));

        if (isResend) {
            const edited = messageList.find((item) => item.id === options.resendMessageId);
            messageList = messageList.filter((message) => {
                if (message.id === options.resendMessageId) {
                    message.content = text;
                    return true;
                }
                return !edited?.createdAt || !message.createdAt || message.createdAt <= edited.createdAt;
            });
        } else if (isRegenerate) {
            messageList = messageList.filter((message) => message.id !== options.regenerateMessageId);
        } else {
            const userDraft = {
                role: 'user',
                content: text || '[File upload]',
                attachments: publicAttachments
            };
            messageList.push(userDraft);
            sendMessage.userDraft = userDraft;
        }
        setMessagesForStreamTarget(streamTarget, messageList);

        const assistantDraft = {
            role: 'assistant',
            content: '',
            attachments: [],
            sources: [],
            activity: {
                thinking: [],
                research: [],
                sources: []
            },
            streaming: true,
            loading: true,
            queueing: false
        };
        messageList.push(assistantDraft);
        setMessagesForStreamTarget(streamTarget, messageList);
        renderStreamTarget(streamTarget);

        els.messageInput.value = '';
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
            thinking: Boolean(state.user && els.thinkingToggle.checked),
            research: Boolean(state.user && (els.researchToggle.checked || els.deepResearchToggle.checked)),
            autoWeb: Boolean(state.user && els.autoWebToggle.checked),
            deepResearch: Boolean(state.user && els.deepResearchToggle.checked),
            regenerateMessageId: options.regenerateMessageId || undefined,
            resendMessageId: options.resendMessageId || undefined,
            displayName: state.user?.displayName || state.user?.email || 'Guest',
            history: temporaryHistory,
            stream: true,
            browserProof: state.browserProof
        };

        let donePayload = null;
        let policyHandled = false;
        const endpoint = isTemporary ? '/temporary/messages' : `/chats/${chatId}/messages`;
        await streamApi(endpoint, payload, (event, data) => {
            if (event === 'policy') {
                policyHandled = true;
                messageList = messageList.filter((message) => message !== assistantDraft);
                messageList.push({
                    type: 'policy',
                    content: data.policyViolation?.message || 'This prompt is against the Terms of Service.',
                    tosUrl: data.policyViolation?.tosUrl || getTosUrl()
                });
                setMessagesForStreamTarget(streamTarget, messageList);
                renderStreamTarget(streamTarget);
                return;
            }

            if (event === 'message_ids') {
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

            if (event === 'queue_status') {
                assistantDraft.queueing = data.active !== false;
                if (data.active) assistantDraft.loading = true;
                if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
                return;
            }

            if (event === 'research_status') {
                assistantDraft.loading = false;
                assistantDraft.queueing = false;
                assistantDraft.activity.research.push(data.message || 'Researching...');
                assistantDraft.activity.research = assistantDraft.activity.research.slice(-8);
                if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
                return;
            }

            if (event === 'thinking_status') {
                assistantDraft.loading = false;
                assistantDraft.queueing = false;
                assistantDraft.activity.thinking.push(data.message || 'Thinking...');
                assistantDraft.activity.thinking = assistantDraft.activity.thinking.slice(-6);
                if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
                return;
            }

            if (event === 'research_source') {
                if (data.source) {
                    assistantDraft.activity.sources = [
                        ...assistantDraft.activity.sources.filter((source) => source.url !== data.source.url),
                        data.source
                    ].slice(-8);
                }
                if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
                return;
            }

            if (event === 'sources') {
                assistantDraft.sources = data.sources || [];
                assistantDraft.activity.sources = data.sources || assistantDraft.activity.sources;
                if (isStreamTargetActive(streamTarget)) scheduleRenderMessages();
                return;
            }

            if (event === 'delta') {
                assistantDraft.loading = false;
                assistantDraft.queueing = false;
                assistantDraft.content += data.delta || '';
                if (isStreamTargetActive(streamTarget) && !updateStreamingMessageContent(assistantDraft)) {
                    scheduleRenderMessages();
                }
                return;
            }

            if (event === 'error') {
                throw Object.assign(new Error(data.error || 'Ask could not respond.'), { data });
            }

            if (event === 'stopped') {
                assistantDraft.loading = false;
                assistantDraft.streaming = false;
                assistantDraft.queueing = false;
                assistantDraft.content = getVisibleMessageContent(assistantDraft) || 'Stopped.';
                return;
            }

            if (event === 'done') {
                donePayload = data;
            }
        }, { signal: controller.signal });

        if (donePayload?.policyViolation && !policyHandled) {
            messageList = messageList.filter((message) => message !== assistantDraft);
            messageList.push({
                type: 'policy',
                content: donePayload.policyViolation.message,
                tosUrl: donePayload.policyViolation.tosUrl
            });
        } else if (donePayload?.policyViolation) {
            messageList = messageList.filter((message) => message !== assistantDraft);
        } else if (donePayload?.message) {
            if (donePayload.userMessageId && sendMessage.userDraft) {
                sendMessage.userDraft.id = donePayload.userMessageId;
                sendMessage.userDraft.createdAt = Date.now();
            }
            Object.assign(assistantDraft, donePayload.message, {
                loading: false,
                streaming: false,
                queueing: false
            });
            processNotebookActionsForMessage(assistantDraft);
            notifyGenerationDone(streamTarget, assistantDraft);
        } else {
            assistantDraft.loading = false;
            assistantDraft.streaming = false;
            assistantDraft.queueing = false;
        }
        setMessagesForStreamTarget(streamTarget, messageList);

        updateUsage(donePayload?.usage);
        rememberBrowserCheckPass();
        resetBrowserCheck('message');
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
        const target = streamTarget || (isTemporary
            ? { isTemporary: true, chatId: null }
            : { isTemporary: false, chatId: state.activeChatId });
        const stream = state.activeStreams.get(streamTargetKey(target));
        if (stream?.stopped || error.name === 'AbortError') {
            setMessagesForStreamTarget(target, stream?.messages || state.messages);
            resetBrowserCheck('message');
            return;
        }
        const nextMessages = (stream?.messages || state.messages).filter((message) => !message.loading && !message.streaming);
        setMessagesForStreamTarget(target, nextMessages);
        resetBrowserCheck('message');
        if (error.status === 403) forgetBrowserCheckPass();
        if (error.data?.usage) updateUsage(error.data.usage);
        showToast(error.message || 'Ask could not respond.');
    } finally {
        const target = streamTarget || (isTemporary
            ? { isTemporary: true, chatId: null }
            : { isTemporary: false, chatId: state.activeChatId });
        state.activeStreams.delete(streamTargetKey(target));
        refreshBusyState();
        els.messages.classList.toggle('streaming-render', isCurrentViewStreaming());
        renderStreamTarget(target);
        queueMathTypeset();
    }
};

const openAuthModal = () => {
    showWithMotion(els.authModal);
    clearBrowserCheckStatus('auth');
    els.authEmail.focus();
};

const closeAuthModal = () => {
    hideWithMotion(els.authModal);
    els.authError.textContent = '';
};

const openAccountModal = () => {
    renderAccountWindow();
    showWithMotion(els.accountModal);
};

const closeAccountModal = () => {
    hideWithMotion(els.accountModal);
};

const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-collapsed');
};

const setAuthMode = (mode) => {
    state.authMode = mode;
    document.querySelectorAll('.auth-tab').forEach((button) => {
        button.classList.toggle('active', button.dataset.authMode === mode);
    });
    document.querySelectorAll('.register-only').forEach((item) => {
        item.classList.toggle('hidden', mode !== 'register');
    });
    els.authPassword.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
};

const submitAuth = async () => {
    els.authError.textContent = '';
    if (state.config?.browserCheckRequired) {
        try {
            await ensureBrowserCheckProof('auth');
        } catch (error) {
            els.authError.textContent = error.message || 'Security check failed. Please try again.';
            return;
        }
    }

    const isRegister = state.authMode === 'register';
    const payload = {
        email: els.authEmail.value.trim(),
        password: els.authPassword.value,
        displayName: els.authDisplayName.value.trim(),
        browserProof: state.authBrowserProof
    };

    try {
        const data = await apiFetch(isRegister ? '/auth/register' : '/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        state.authToken = data.token;
        storageSet('token', state.authToken);
        state.user = data.user;
        updateAccount();
        resetBrowserCheck('auth');
        closeAuthModal();
        state.activeChatId = null;
        state.activeSharedToken = '';
        state.temporaryMode = false;
        els.temporaryToggle.checked = false;
        state.messages = [];
        window.location.hash = newChatUrl();
        await fetchMe();
        await fetchChats();
        renderMessages();
    } catch (error) {
        resetBrowserCheck('auth');
        els.authError.textContent = error.message || 'Unable to continue.';
    }
};

const signOut = async () => {
    await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
    state.authToken = '';
    state.user = null;
    state.activeChatId = null;
    state.activeSharedToken = '';
    state.temporaryMode = false;
    els.temporaryToggle.checked = false;
    state.messages = [];
    storageRemove('token');
    updateAccount();
    closeAccountModal();
    window.location.hash = newChatUrl();
    await fetchMe();
    await fetchChats();
    renderMessages();
};

els.composer.addEventListener('submit', (event) => {
    event.preventDefault();
    if (state.busy) {
        stopActiveGeneration();
        return;
    }
    sendMessage();
});

els.messageInput.addEventListener('input', () => {
    autoGrowInput();
    saveComposerDraft();
});
els.messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (state.busy) {
            stopActiveGeneration();
            return;
        }
        sendMessage();
    }
});

els.messages.addEventListener('click', (event) => {
    const codeButton = event.target.closest('[data-copy-code]');
    if (codeButton) {
        const code = codeButton.closest('pre')?.querySelector('code')?.textContent || '';
        copyText(code);
        return;
    }

    const copyButton = event.target.closest('[data-copy-message]');
    if (copyButton) {
        const message = state.messages.find((item) => item.id === Number(copyButton.dataset.copyMessage));
        copyText(getVisibleMessageContent(message));
        return;
    }

    const regenerateButton = event.target.closest('[data-regenerate-message]');
    if (regenerateButton) {
        regenerateMessage(regenerateButton.dataset.regenerateMessage).catch((error) => showToast(error.message));
        return;
    }

    const editButton = event.target.closest('[data-edit-message]');
    if (editButton) {
        editAndResend(editButton.dataset.editMessage).catch((error) => showToast(error.message));
        return;
    }

    const deleteButton = event.target.closest('[data-delete-message]');
    if (deleteButton) {
        openActionModal({
            title: 'Delete Message',
            message: 'This message will be removed from the chat.',
            kind: 'confirm',
            confirmText: 'Delete',
            danger: true
        }).then((confirmed) => {
            if (confirmed) deleteMessage(deleteButton.dataset.deleteMessage).catch((error) => showToast(error.message));
        });
        return;
    }

    const notebookButton = event.target.closest('[data-open-notebook-path]');
    if (notebookButton) {
        openNotebookPanel(notebookButton.dataset.openNotebookPath || '');
    }
});

els.templateTray.addEventListener('click', (event) => {
    const button = event.target.closest('[data-template-id]');
    if (!button) return;
    const template = PROMPT_TEMPLATES[button.dataset.templateId];
    if (!template) return;
    els.messageInput.value = template;
    autoGrowInput();
    saveComposerDraft();
    els.messageInput.focus();
    pulseElement(els.composer);
});

els.attachButton.addEventListener('click', () => els.fileInput.click());
els.fileInput.addEventListener('change', () => {
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
    els.fileInput.value = '';
    renderAttachments();
    if (accepted.length) pulseElement(els.composer);
});

els.chatSearchInput.addEventListener('input', () => {
    state.chatSearch = els.chatSearchInput.value.trim();
    clearTimeout(els.chatSearchInput.searchTimer);
    els.chatSearchInput.searchTimer = setTimeout(() => {
        fetchChats().catch((error) => showToast(error.message));
    }, 180);
});

els.attachmentRow.addEventListener('click', (event) => {
    const index = event.target?.dataset?.removeFile;
    if (index === undefined) return;
    state.pendingFiles.splice(Number(index), 1);
    renderAttachments();
});

els.chatList.addEventListener('click', (event) => {
    const temporaryButton = event.target.closest('[data-temporary-chat]');
    if (temporaryButton) {
        startTemporaryChat();
        return;
    }
    const newButton = event.target.closest('[data-new-chat]');
    if (newButton) {
        startNewChat();
        return;
    }
    const action = event.target.closest('.chat-actions button');
    if (action) {
        const chatId = Number(action.dataset.pinChat
            || action.dataset.renameChat
            || action.dataset.folderChat
            || action.dataset.shareChat
            || action.dataset.deleteChat);
        const chat = state.chats.find((item) => item.id === chatId);
        if (!chat) return;
        if (action.dataset.pinChat) {
            updateChat(chatId, { pinned: !chat.pinned }).catch((error) => showToast(error.message));
        } else if (action.dataset.renameChat) {
            openActionModal({
                title: 'Rename Chat',
                kind: 'input',
                label: 'Chat title',
                value: chat.title || 'New chat',
                confirmText: 'Rename',
                required: true,
                maxLength: 80
            }).then((title) => {
                if (title !== null) updateChat(chatId, { title }).catch((error) => showToast(error.message));
            });
        } else if (action.dataset.folderChat) {
            openActionModal({
                title: 'Move To Folder',
                message: 'Leave this blank to move the chat back to Chats.',
                kind: 'input',
                label: 'Folder name',
                value: chat.folder || '',
                confirmText: 'Move',
                maxLength: 60
            }).then((folder) => {
                if (folder !== null) updateChat(chatId, { folder }).catch((error) => showToast(error.message));
            });
        } else if (action.dataset.shareChat) {
            shareChat(chatId).catch((error) => showToast(error.message));
        } else if (action.dataset.deleteChat) {
            openActionModal({
                title: 'Delete Chat',
                message: `Delete "${chat.title || 'New chat'}"? This removes the saved chat and its local notebook.`,
                kind: 'confirm',
                confirmText: 'Delete',
                danger: true
            }).then((confirmed) => {
                if (confirmed) deleteChat(chatId).catch((error) => showToast(error.message));
            });
        }
        return;
    }
    const button = event.target.closest('[data-chat-id]');
    if (!button) return;
    window.location.hash = chatUrl(button.dataset.chatId);
});

els.chatList.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') return;
    const row = event.target.closest('.chat-row.has-actions');
    if (!row || row.contains(event.relatedTarget)) return;
    clearTimeout(row._actionTimer);
    row._actionTimer = setTimeout(() => row.classList.add('actions-ready'), 420);
});

els.chatList.addEventListener('pointerout', (event) => {
    const row = event.target.closest('.chat-row.has-actions');
    if (!row || row.contains(event.relatedTarget)) return;
    clearTimeout(row._actionTimer);
    row.classList.remove('actions-ready');
});

els.chatList.addEventListener('pointerdown', (event) => {
    const row = event.target.closest('.chat-row.has-actions');
    if (!row || event.target.closest('.chat-actions')) return;
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    clearTimeout(els.chatList._touchActionTimer);
    els.chatList._touchActionTimer = setTimeout(() => {
        document.querySelectorAll('.chat-row.actions-ready').forEach((item) => {
            if (item !== row) item.classList.remove('actions-ready');
        });
        row.classList.add('actions-ready');
    }, 520);
});

['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
    els.chatList.addEventListener(eventName, () => {
        clearTimeout(els.chatList._touchActionTimer);
    });
});

els.newChatButton.addEventListener('click', startNewChat);

els.modelSelect.addEventListener('change', () => {
    storageSet('model', els.modelSelect.value);
    if (state.activeChatId) updateChat(state.activeChatId, { modelId: els.modelSelect.value }).catch(() => {});
    renderCustomSelect('model');
    updateSettingsSummary();
});

els.personalitySelect.addEventListener('change', () => {
    storageSet('personality', els.personalitySelect.value);
    if (state.activeChatId) updateChat(state.activeChatId, { personality: els.personalitySelect.value }).catch(() => {});
    renderCustomSelect('personality');
    updateSettingsSummary();
});

bindCustomSelect('model');
bindCustomSelect('personality');

els.thinkingToggle.addEventListener('change', () => {
    if (els.thinkingToggle.checked && !state.user) {
        els.thinkingToggle.checked = false;
        storageSet('thinking', '0');
        showToast('Sign in to use Thinking.');
        updateSettingsSummary();
        return;
    }
    storageSet('thinking', els.thinkingToggle.checked ? '1' : '0');
    updateSettingsSummary();
});

els.researchToggle.addEventListener('change', () => {
    if (els.researchToggle.checked && !state.user) {
        els.researchToggle.checked = false;
        storageSet('research', '0');
        showToast('Sign in to use Research.');
        updateSettingsSummary();
        return;
    }
    if (!els.researchToggle.checked) {
        els.deepResearchToggle.checked = false;
        storageSet('deep_research', '0');
    }
    storageSet('research', els.researchToggle.checked ? '1' : '0');
    updateSettingsSummary();
});

els.autoWebToggle.addEventListener('change', () => {
    if (els.autoWebToggle.checked && !state.user) {
        els.autoWebToggle.checked = false;
        storageSet('auto_web', '0');
        showToast('Sign in to use Auto web check.');
        updateSettingsSummary();
        return;
    }
    storageSet('auto_web', els.autoWebToggle.checked ? '1' : '0');
    updateSettingsSummary();
});

els.temporaryToggle.addEventListener('change', () => {
    if (els.temporaryToggle.checked) {
        startTemporaryChat();
    } else {
        startNewChat();
    }
});

els.deepResearchToggle.addEventListener('change', () => {
    if (els.deepResearchToggle.checked && !state.user) {
        els.deepResearchToggle.checked = false;
        storageSet('deep_research', '0');
        showToast('Sign in to use Deep research.');
        updateSettingsSummary();
        return;
    }
    if (els.deepResearchToggle.checked) {
        els.researchToggle.checked = true;
        storageSet('research', '1');
    }
    storageSet('deep_research', els.deepResearchToggle.checked ? '1' : '0');
    updateSettingsSummary();
});

els.settingsButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleSettingsMenu();
});

els.settingsMenu.addEventListener('click', (event) => {
    const target = event.target;
    if (!target.closest?.('.custom-select-shell')) closeCustomSelects();
});

els.sidebarToggleButton.addEventListener('click', toggleSidebar);
els.updatesButton.addEventListener('click', () => {
    openUpdatesModal();
});
els.closeUpdatesButton.addEventListener('click', closeUpdatesModal);
els.updatesModal.addEventListener('click', (event) => {
    if (event.target === els.updatesModal) closeUpdatesModal();
});
els.updatesForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    els.updatesError.textContent = '';
    try {
        await apiFetch('/updates', {
            method: 'POST',
            body: JSON.stringify({
                title: els.updateTitleInput.value,
                content: els.updateContentInput.value
            })
        });
        els.updateTitleInput.value = '';
        els.updateContentInput.value = '';
        await fetchUpdates();
        showToast('Update posted.');
    } catch (error) {
        els.updatesError.textContent = error.message || 'Could not post update.';
    }
});
els.notebookToggleButton.addEventListener('click', () => {
    if (state.notebookOpen) {
        closeNotebookPanel();
    } else {
        openNotebookPanel();
    }
});
els.closeNotebookButton.addEventListener('click', closeNotebookPanel);
els.newNotebookFileButton.addEventListener('click', async () => {
    if (!canPersistNotebook()) {
        showToast('Open or create a saved chat before adding notes.');
        return;
    }
    const path = await openActionModal({
        title: 'New Notebook File',
        message: 'Use folders and extensions like notes/idea.md, src/example.js, styles/card.css, or data/sample.json.',
        kind: 'input',
        label: 'File path',
        value: 'notes/new-note.md',
        confirmText: 'Create',
        required: true,
        maxLength: 160
    });
    if (path === null) return;
    const normalizedPath = normalizeNotebookPath(path, 'notes/new-note.md');
    const file = upsertNotebookFile({
        path: normalizedPath,
        title: normalizedPath.split('/').pop(),
        language: getNotebookLanguageForPath(normalizedPath),
        kind: 'file',
        content: ''
    }, 'manual');
    state.notebook.activeFileId = file.id;
    state.notebook.editingFileId = file.id;
    saveNotebook();
    openNotebookPanel(file.path);
});
els.copyNotebookButton.addEventListener('click', () => {
    const file = getActiveNotebookFile();
    if (!file) return;
    const value = state.notebookDrafts.get(file.id) ?? file.content ?? '';
    copyText(value);
});
els.editNotebookButton.addEventListener('click', () => {
    if (!canPersistNotebook()) {
        showToast('Open or create a saved chat before editing notes.');
        return;
    }
    const file = getActiveNotebookFile();
    if (!file) return;
    if (state.notebook.editingFileId === file.id) {
        state.notebook.editingFileId = '';
        state.notebookDrafts.delete(file.id);
        renderNotebookPanel();
        return;
    }
    clearNotebookChangesForFile(file.id);
    state.notebook.editingFileId = file.id;
    state.notebookDrafts.set(file.id, file.content || '');
    saveNotebook();
    renderNotebookPanel();
    requestAnimationFrame(() => els.notebookEditor.focus());
});
els.saveNotebookButton.addEventListener('click', () => {
    if (!canPersistNotebook()) {
        showToast('Open or create a saved chat before saving notes.');
        return;
    }
    const file = getActiveNotebookFile();
    if (!file) return;
    const nextContent = state.notebookDrafts.get(file.id) ?? els.notebookEditor.value;
    if (nextContent !== file.content) {
        file.versions.push(createNotebookVersion({ file, content: nextContent, sourceKey: 'manual' }));
        file.versions = file.versions.slice(-30);
        file.content = nextContent;
        file.updatedAt = Date.now();
    }
    clearNotebookChangesForFile(file.id);
    state.notebook.editingFileId = '';
    state.notebookDrafts.delete(file.id);
    saveNotebook();
    renderNotebookPanel();
    showToast('Notebook saved.');
});
els.notebookEditor.addEventListener('input', () => {
    const file = getActiveNotebookFile();
    if (!file) return;
    state.notebookDrafts.set(file.id, els.notebookEditor.value);
    clearNotebookChangesForFile(file.id);
    els.notebookMeta.textContent = `${file.path} · saved ${formatNotebookTime(file.updatedAt)} · unsaved edits`;
    saveNotebook();
    renderNotebookPanel();
});
els.notebookPreview.addEventListener('click', (event) => {
    const codeButton = event.target.closest('[data-copy-code]');
    if (!codeButton) return;
    const code = codeButton.closest('pre')?.querySelector('code')?.textContent || '';
    copyText(code);
});
els.notebookChangeTabs.addEventListener('click', (event) => {
    const closeButton = event.target.closest('[data-close-notebook-change]');
    if (closeButton) {
        closeNotebookChange(closeButton.dataset.closeNotebookChange || '');
        return;
    }
    const button = event.target.closest('[data-notebook-change]');
    if (!button) return;
    state.notebook.activeChangeId = button.dataset.notebookChange || '';
    const change = state.notebook.pendingChanges?.find((item) => item.id === state.notebook.activeChangeId);
    const file = change ? state.notebook.files.find((item) => item.id === change.fileId) : null;
    if (file) state.notebook.activeFileId = file.id;
    saveNotebook();
    renderNotebookPanel();
});
els.notebookFileList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-notebook-file]');
    if (!button) return;
    state.notebook.activeFileId = button.dataset.notebookFile;
    state.notebook.editingFileId = '';
    const change = state.notebook.pendingChanges?.find((item) => item.fileId === state.notebook.activeFileId);
    if (change) state.notebook.activeChangeId = change.id;
    renderNotebookPanel();
});

document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!target.closest?.('.custom-select-shell')) closeCustomSelects();
    if (!target.closest?.('.chat-row')) {
        document.querySelectorAll('.chat-row.actions-ready').forEach((row) => row.classList.remove('actions-ready'));
    }
    if (!isSettingsMenuOpen()) return;
    if (eventIncludesElement(event, els.settingsMenu) || eventIncludesElement(event, els.settingsButton)) return;
    closeSettingsMenu();
}, true);

const isEditableShortcutTarget = (target) => Boolean(target?.closest?.(
    'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]'
));

const browserEditShortcutKeys = new Set(['a', 'c', 'v', 'x', 'y', 'z', 'insert']);

document.addEventListener('keydown', (event) => {
    const isModifier = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    if (isModifier && (isEditableShortcutTarget(event.target) || browserEditShortcutKeys.has(key))) {
        return;
    }
    if (isModifier && key === 'k') {
        event.preventDefault();
        els.messageInput.focus();
        return;
    }
    if (isModifier && key === 'n') {
        event.preventDefault();
        startNewChat();
        return;
    }
    if (isModifier && key === 'b') {
        event.preventDefault();
        toggleSidebar();
        return;
    }
    if (event.key !== 'Escape') return;
    closeCustomSelects();
    if (isSettingsMenuOpen()) closeSettingsMenu();
    if (!els.actionModal.classList.contains('hidden')) closeActionModal(null);
    if (!els.notificationPromptModal.classList.contains('hidden')) closeNotificationPrompt();
    if (!els.updatesModal.classList.contains('hidden')) closeUpdatesModal();
    if (!els.accountModal.classList.contains('hidden')) closeAccountModal();
    if (!els.authModal.classList.contains('hidden')) closeAuthModal();
    if (state.notebookOpen) closeNotebookPanel();
});

els.accountButton.addEventListener('click', () => {
    if (state.user) {
        openAccountModal();
    } else {
        openAuthModal();
    }
});

els.closeAuthButton.addEventListener('click', closeAuthModal);
els.authModal.addEventListener('click', (event) => {
    if (event.target === els.authModal) closeAuthModal();
});
els.closeAccountButton.addEventListener('click', closeAccountModal);
els.accountModal.addEventListener('click', (event) => {
    if (event.target === els.accountModal) closeAccountModal();
});
els.accountSignOutButton.addEventListener('click', () => {
    signOut().catch((error) => showToast(error.message));
});

els.actionModalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitActionModal();
});
els.actionModalCancelButton.addEventListener('click', () => closeActionModal(null));
els.actionModalCloseButton.addEventListener('click', () => closeActionModal(null));
els.actionModal.addEventListener('click', (event) => {
    if (event.target === els.actionModal) closeActionModal(null);
});

els.notificationsToggle.addEventListener('change', () => {
    if (!els.notificationsToggle.checked) {
        setNotificationsEnabled(false);
        return;
    }

    const permission = getNotificationPermission();
    if (permission === 'granted') {
        setNotificationsEnabled(true);
        return;
    }

    setNotificationsEnabled(false);
    if (permission === 'denied') {
        showToast('Notifications are blocked in this browser.');
        return;
    }
    if (permission === 'unsupported') {
        showToast('Browser notifications are not available here.');
        return;
    }
    showNotificationPrompt({ force: true });
});

els.notificationPromptCloseButton.addEventListener('click', () => closeNotificationPrompt());
els.notificationLaterButton.addEventListener('click', () => closeNotificationPrompt());
els.notificationEnableButton.addEventListener('click', () => {
    requestNotificationPermission().catch(() => {
        setNotificationsEnabled(false);
        closeNotificationPrompt();
        showToast('Notifications could not be enabled.');
    });
});
els.notificationPromptModal.addEventListener('click', (event) => {
    if (event.target === els.notificationPromptModal) closeNotificationPrompt();
});

els.passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    els.passwordError.textContent = '';
    try {
        await apiFetch('/auth/password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword: els.currentPassword.value,
                newPassword: els.newPassword.value
            })
        });
        els.currentPassword.value = '';
        els.newPassword.value = '';
        showToast('Password changed.');
    } catch (error) {
        els.passwordError.textContent = error.message || 'Could not change password.';
    }
});

document.querySelectorAll('.auth-tab').forEach((button) => {
    button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
});

els.authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitAuth();
});

window.addEventListener('load', () => {
    iconRefresh();
    highlightCodeBlocks(els.messages);
    highlightCodeBlocks(els.notebookPreview);
});
window.addEventListener('hashchange', () => {
    routeFromHash().catch((error) => {
        showToast(error.message || 'Chat could not load.');
        startNewChat();
    });
});
window.addEventListener('focus', () => {
    updateNotificationUi();
    syncActiveChat().catch(() => {});
});
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    updateNotificationUi();
    syncActiveChat().catch(() => {});
});

els.legalAcceptCheckbox.addEventListener('change', () => {
    els.legalAcceptButton.disabled = !els.legalAcceptCheckbox.checked;
});

els.legalAcceptButton.addEventListener('click', () => {
    if (!els.legalAcceptCheckbox.checked) return;
    acceptRequiredLegal();
});

els.cookieAcceptButton.addEventListener('click', () => {
    storageSet('required_cookies_version', LEGAL_VERSION);
    setRequiredCookieAck();
    hideWithMotion(els.cookieBanner);
});

const showLegalGate = () => {
    lockForConsent();
    showWithMotion(els.legalGateModal);
    els.legalAcceptButton.disabled = !els.legalAcceptCheckbox.checked;
    iconRefresh();
};

const initializeApp = async () => {
    ensureGuestId();
    state.notebook = loadNotebook();
    renderNotebookPanel();
    iconRefresh();
    updateNotificationUi();
    await fetchConfig();
    await fetchMe();
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
        showToast(error.message || 'Ask could not load.');
        renderChats();
        renderMessages();
    }
})();
