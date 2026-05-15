const LEGACY_API_BASE_KEY = ['CL4', 'NKR_ASK_API_BASE'].join('');
const STORAGE_PREFIX = 'gatita_ask_';
const LEGACY_STORAGE_PREFIX = ['cl4', 'nkr_ask_'].join('');
const API_BASE = window.GATITA_ASK_API_BASE || window[LEGACY_API_BASE_KEY] || 'https://api.clankr.tech/ask-api';

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
const getTosUrl = () => state.config?.tosUrl || 'https://gatita.tech/tos.html';

const els = {
    chatList: document.getElementById('chatList'),
    messages: document.getElementById('messages'),
    emptyState: document.getElementById('emptyState'),
    messageScroll: document.getElementById('messageScroll'),
    composer: document.getElementById('composer'),
    messageInput: document.getElementById('messageInput'),
    fileInput: document.getElementById('fileInput'),
    attachButton: document.getElementById('attachButton'),
    attachmentRow: document.getElementById('attachmentRow'),
    sendButton: document.getElementById('sendButton'),
    newChatButton: document.getElementById('newChatButton'),
    settingsButton: document.getElementById('settingsButton'),
    settingsMenu: document.getElementById('settingsMenu'),
    settingsSummary: document.getElementById('settingsSummary'),
    modelSelect: document.getElementById('modelSelect'),
    personalitySelect: document.getElementById('personalitySelect'),
    thinkingToggle: document.getElementById('thinkingToggle'),
    researchToggle: document.getElementById('researchToggle'),
    deepResearchToggle: document.getElementById('deepResearchToggle'),
    usageText: document.getElementById('usageText'),
    accountName: document.getElementById('accountName'),
    accountButton: document.getElementById('accountButton'),
    accountModal: document.getElementById('accountModal'),
    closeAccountButton: document.getElementById('closeAccountButton'),
    accountModalName: document.getElementById('accountModalName'),
    accountModalEmail: document.getElementById('accountModalEmail'),
    accountMinuteLimit: document.getElementById('accountMinuteLimit'),
    accountDeepLimit: document.getElementById('accountDeepLimit'),
    accountSignOutButton: document.getElementById('accountSignOutButton'),
    authModal: document.getElementById('authModal'),
    closeAuthButton: document.getElementById('closeAuthButton'),
    authForm: document.getElementById('authForm'),
    authEmail: document.getElementById('authEmail'),
    authDisplayName: document.getElementById('authDisplayName'),
    authPassword: document.getElementById('authPassword'),
    authError: document.getElementById('authError'),
    toast: document.getElementById('toast'),
    turnstileBox: document.getElementById('turnstileBox'),
    authTurnstileBox: document.getElementById('authTurnstileBox')
};

const state = {
    config: null,
    usage: null,
    chats: [],
    messages: [],
    activeChatId: null,
    authToken: storageGet('token'),
    guestId: storageGet('guest_id'),
    user: null,
    pendingFiles: [],
    turnstileToken: '',
    authTurnstileToken: '',
    turnstileWidgetId: null,
    authTurnstileWidgetId: null,
    authMode: 'login',
    busy: false
};

const makeGuestId = () => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((value) => value.toString(16).padStart(2, '0')).join('');
};

if (!state.guestId) {
    state.guestId = makeGuestId();
    storageSet('guest_id', state.guestId);
}

const iconRefresh = () => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
};

const queueMathTypeset = () => {
    if (!window.MathJax?.typesetPromise) return;
    clearTimeout(queueMathTypeset.timer);
    queueMathTypeset.timer = setTimeout(() => {
        window.MathJax.typesetPromise([els.messages]).catch(() => {});
    }, 80);
};

const showToast = (message) => {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 3200);
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

const streamApi = async (path, payload, onEvent) => {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: createApiHeaders({ Accept: 'text/event-stream' }),
        body: JSON.stringify(payload)
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
    els.usageText.textContent = state.user ? 'Account menu' : 'Guest mode';
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
};

const updateAccount = () => {
    if (state.user) {
        els.accountName.textContent = state.user.displayName || state.user.email || 'Account';
        els.accountButton.textContent = 'Account';
        els.researchToggle.disabled = false;
        els.deepResearchToggle.disabled = false;
        els.researchToggle.closest('.research-control')?.classList.remove('disabled');
        els.deepResearchToggle.closest('.research-control')?.classList.remove('disabled');
    } else {
        els.accountName.textContent = 'Guest';
        els.accountButton.textContent = 'Sign in';
        els.usageText.textContent = 'Guest mode';
        els.researchToggle.checked = false;
        els.deepResearchToggle.checked = false;
        els.researchToggle.disabled = true;
        els.deepResearchToggle.disabled = true;
        els.researchToggle.closest('.research-control')?.classList.add('disabled');
        els.deepResearchToggle.closest('.research-control')?.classList.add('disabled');
    }
    if (state.user) els.usageText.textContent = 'Account menu';
    renderAccountWindow();
    updateSettingsSummary();
};

const renderSelects = () => {
    const models = state.config?.models || [];
    const personalities = state.config?.personalities || [];
    const savedModel = storageGet('model') || state.config?.defaultModelId || models[0]?.id || '';
    const savedPersonality = storageGet('personality') || 'smart';
    const savedThinking = storageGet('thinking') === '1';
    const savedResearch = storageGet('research') === '1';
    const savedDeepResearch = storageGet('deep_research') === '1';

    els.modelSelect.innerHTML = models.map((model) => (
        `<option value="${model.id}">${model.name}</option>`
    )).join('');
    els.personalitySelect.innerHTML = personalities.map((personality) => (
        `<option value="${personality.id}">${personality.name}</option>`
    )).join('');

    els.modelSelect.value = models.some((model) => model.id === savedModel) ? savedModel : state.config?.defaultModelId || '';
    els.personalitySelect.value = personalities.some((item) => item.id === savedPersonality) ? savedPersonality : 'smart';
    els.thinkingToggle.checked = savedThinking;
    els.researchToggle.checked = savedResearch && Boolean(state.user);
    els.deepResearchToggle.checked = savedDeepResearch && Boolean(state.user);
    updateSettingsSummary();
};

const updateSettingsSummary = () => {
    if (!els.settingsSummary) return;
    const modelName = els.modelSelect.selectedOptions?.[0]?.textContent || 'Model';
    const personalityName = els.personalitySelect.selectedOptions?.[0]?.textContent || 'Personality';
    const extras = [
        els.thinkingToggle.checked ? 'Thinking' : '',
        els.deepResearchToggle.checked ? 'Deep research' : (els.researchToggle.checked ? 'Research' : '')
    ].filter(Boolean);
    els.settingsSummary.textContent = [modelName, personalityName, ...extras].join(' · ');
};

const renderChats = () => {
    if (!state.chats.length) {
        els.chatList.innerHTML = '<button class="chat-item active" type="button"><span><span class="chat-title">New chat</span><span class="chat-preview">Ready</span></span><span class="chat-count">0</span></button>';
        return;
    }

    els.chatList.innerHTML = state.chats.map((chat) => `
        <button class="chat-item ${chat.id === state.activeChatId ? 'active' : ''}" type="button" data-chat-id="${chat.id}">
            <span>
                <span class="chat-title">${escapeHtml(chat.title || 'New chat')}</span>
                <span class="chat-preview">${escapeHtml(chat.lastMessage || 'Ready')}</span>
            </span>
            <span class="chat-count">${chat.messageCount || 0}</span>
        </button>
    `).join('');
};

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

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

const renderMarkdown = (value) => {
    const source = String(value || '').replace(/\r\n/g, '\n');
    const codeBlocks = [];
    const protectedSource = source.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        const token = `@@CODEBLOCK_${codeBlocks.length}@@`;
        codeBlocks.push({
            lang: String(lang || '').replace(/[^\w-]/g, ''),
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
            out.push(`<pre><code${block?.lang ? ` class="language-${block.lang}"` : ''}>${block?.code || ''}</code></pre>`);
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

const renderMessages = () => {
    els.emptyState.classList.toggle('hidden', state.messages.length > 0);
    els.messages.classList.toggle('streaming-render', state.busy);
    els.messages.innerHTML = state.messages.map((message) => {
        if (message.type === 'policy') {
            return `
                <article class="policy-banner">
                    <strong>${escapeHtml(message.content || 'This prompt is against the Terms of Service.')}</strong>
                    <a href="${escapeHtml(message.tosUrl || getTosUrl())}" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                </article>
            `;
        }

        if (message.loading) {
            return `
                <article class="message assistant">
                    <div class="message-stack">
                        ${renderActivityPanel(message.activity)}
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
        const body = message.role === 'assistant'
            ? `<div class="markdown-body">${renderMarkdown(message.content || '')}</div>`
            : escapeHtml(message.content || '');
        const streaming = message.streaming ? '<span class="stream-cursor" aria-hidden="true"></span>' : '';
        const sources = message.role === 'assistant' ? renderSources(message.sources) : '';
        const activity = message.role === 'assistant' ? renderActivityPanel(message.activity) : '';

        return `
            <article class="message ${message.role === 'user' ? 'user' : 'assistant'}${message.streaming ? ' streaming' : ''}">
                <div class="message-stack">${activity}<div class="bubble">${body}${streaming}${chips}${sources}</div></div>
            </article>
        `;
    }).join('');
    requestAnimationFrame(() => {
        els.messageScroll.scrollTop = els.messageScroll.scrollHeight;
        if (!state.busy) queueMathTypeset();
    });
};

const renderAttachments = () => {
    els.attachmentRow.innerHTML = state.pendingFiles.map((file, index) => `
        <span class="file-chip">
            ${escapeHtml(file.name)}
            <button type="button" data-remove-file="${index}" aria-label="Remove ${escapeHtml(file.name)}">×</button>
        </span>
    `).join('');
};

const autoGrowInput = () => {
    els.messageInput.style.height = 'auto';
    els.messageInput.style.height = `${Math.min(180, els.messageInput.scrollHeight)}px`;
};

const loadTurnstileScript = () => new Promise((resolve) => {
    if (window.turnstile) return resolve();
    const existing = document.querySelector('script[data-turnstile]');
    if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.addEventListener('load', resolve, { once: true });
    document.head.appendChild(script);
});

const renderTurnstile = async () => {
    if (!state.config?.turnstileRequired || !state.config?.turnstileSiteKey) {
        els.turnstileBox.classList.add('hidden');
        els.authTurnstileBox.classList.add('hidden');
        return;
    }

    await loadTurnstileScript();
    if (!window.turnstile) return;

    if (state.turnstileWidgetId === null) {
        state.turnstileWidgetId = window.turnstile.render(els.turnstileBox, {
            sitekey: state.config.turnstileSiteKey,
            theme: 'dark',
            callback: (token) => {
                state.turnstileToken = token;
            },
            'expired-callback': () => {
                state.turnstileToken = '';
            },
            'error-callback': () => {
                state.turnstileToken = '';
            }
        });
    }

    if (state.authTurnstileWidgetId === null) {
        state.authTurnstileWidgetId = window.turnstile.render(els.authTurnstileBox, {
            sitekey: state.config.turnstileSiteKey,
            theme: 'dark',
            callback: (token) => {
                state.authTurnstileToken = token;
            },
            'expired-callback': () => {
                state.authTurnstileToken = '';
            },
            'error-callback': () => {
                state.authTurnstileToken = '';
            }
        });
    }
};

const resetTurnstile = (kind = 'message') => {
    if (!window.turnstile) return;
    if (kind === 'message' && state.turnstileWidgetId !== null) {
        state.turnstileToken = '';
        window.turnstile.reset(state.turnstileWidgetId);
    }
    if (kind === 'auth' && state.authTurnstileWidgetId !== null) {
        state.authTurnstileToken = '';
        window.turnstile.reset(state.authTurnstileWidgetId);
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
    await renderTurnstile();
};

const fetchMe = async () => {
    const data = await apiFetch('/me');
    state.user = data.user || null;
    updateUsage(data.usage);
    updateAccount();
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
    const data = await apiFetch('/chats');
    state.chats = data.chats || [];
    if (!state.activeChatId && state.chats.length) {
        state.activeChatId = state.chats[0].id;
        await loadMessages(state.activeChatId);
    } else {
        renderChats();
    }
};

const createChat = async () => {
    const data = await apiFetch('/chats', {
        method: 'POST',
        body: JSON.stringify({ title: 'New chat' })
    });
    state.activeChatId = data.chat.id;
    state.messages = [];
    await fetchChats();
    renderMessages();
};

const ensureChat = async () => {
    if (state.activeChatId) return state.activeChatId;
    await createChat();
    return state.activeChatId;
};

const loadMessages = async (chatId) => {
    const data = await apiFetch(`/chats/${chatId}/messages`);
    state.activeChatId = Number(chatId);
    state.messages = data.messages || [];
    renderChats();
    renderMessages();
};

const sendMessage = async () => {
    const text = els.messageInput.value.trim();
    if (!text && state.pendingFiles.length === 0) return;
    if (state.config?.turnstileRequired && !state.turnstileToken) {
        showToast('Complete verification first.');
        return;
    }
    if ((els.researchToggle.checked || els.deepResearchToggle.checked) && !state.user) {
        state.messages.push({
            type: 'policy',
            content: 'Research is only available for signed-in accounts.',
            tosUrl: getTosUrl()
        });
        renderMessages();
        return;
    }

    state.busy = true;
    els.sendButton.disabled = true;

    try {
        const chatId = await ensureChat();
        const attachments = await Promise.all(state.pendingFiles.map(readFilePayload));
        const publicAttachments = state.pendingFiles.map((file) => ({
            name: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size
        }));

        state.messages.push({
            role: 'user',
            content: text || '[File upload]',
            attachments: publicAttachments
        });
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
            loading: true
        };
        state.messages.push(assistantDraft);
        renderMessages();

        els.messageInput.value = '';
        autoGrowInput();
        state.pendingFiles = [];
        renderAttachments();

        const payload = {
            message: text,
            attachments,
            modelId: els.modelSelect.value,
            personality: els.personalitySelect.value,
            thinking: els.thinkingToggle.checked,
            research: els.researchToggle.checked || els.deepResearchToggle.checked,
            deepResearch: els.deepResearchToggle.checked,
            displayName: state.user?.displayName || state.user?.email || 'Guest',
            stream: true,
            turnstileToken: state.turnstileToken
        };

        let donePayload = null;
        let policyHandled = false;
        await streamApi(`/chats/${chatId}/messages`, payload, (event, data) => {
            if (event === 'policy') {
                policyHandled = true;
                state.messages = state.messages.filter((message) => message !== assistantDraft);
                state.messages.push({
                    type: 'policy',
                    content: data.policyViolation?.message || 'This prompt is against the Terms of Service.',
                    tosUrl: data.policyViolation?.tosUrl || getTosUrl()
                });
                renderMessages();
                return;
            }

            if (event === 'research_status') {
                assistantDraft.loading = false;
                assistantDraft.activity.research.push(data.message || 'Researching...');
                assistantDraft.activity.research = assistantDraft.activity.research.slice(-8);
                renderMessages();
                return;
            }

            if (event === 'thinking_status') {
                assistantDraft.loading = false;
                assistantDraft.activity.thinking.push(data.message || 'Thinking...');
                assistantDraft.activity.thinking = assistantDraft.activity.thinking.slice(-6);
                renderMessages();
                return;
            }

            if (event === 'research_source') {
                if (data.source) {
                    assistantDraft.activity.sources = [
                        ...assistantDraft.activity.sources.filter((source) => source.url !== data.source.url),
                        data.source
                    ].slice(-8);
                }
                renderMessages();
                return;
            }

            if (event === 'sources') {
                assistantDraft.sources = data.sources || [];
                assistantDraft.activity.sources = data.sources || assistantDraft.activity.sources;
                renderMessages();
                return;
            }

            if (event === 'delta') {
                assistantDraft.loading = false;
                assistantDraft.content += data.delta || '';
                renderMessages();
                return;
            }

            if (event === 'error') {
                throw Object.assign(new Error(data.error || 'Ask could not respond.'), { data });
            }

            if (event === 'done') {
                donePayload = data;
            }
        });

        if (donePayload?.policyViolation && !policyHandled) {
            state.messages = state.messages.filter((message) => message !== assistantDraft);
            state.messages.push({
                type: 'policy',
                content: donePayload.policyViolation.message,
                tosUrl: donePayload.policyViolation.tosUrl
            });
        } else if (donePayload?.policyViolation) {
            state.messages = state.messages.filter((message) => message !== assistantDraft);
        } else if (donePayload?.message) {
            Object.assign(assistantDraft, donePayload.message, {
                loading: false,
                streaming: false
            });
        } else {
            assistantDraft.loading = false;
            assistantDraft.streaming = false;
        }

        updateUsage(donePayload?.usage);
        resetTurnstile('message');
        await fetchChats();
        renderMessages();
    } catch (error) {
        state.messages = state.messages.filter((message) => !message.loading && !message.streaming);
        renderMessages();
        resetTurnstile('message');
        if (error.data?.usage) updateUsage(error.data.usage);
        showToast(error.message || 'Ask could not respond.');
    } finally {
        state.busy = false;
        els.messages.classList.remove('streaming-render');
        queueMathTypeset();
        els.sendButton.disabled = false;
    }
};

const openAuthModal = () => {
    els.authModal.classList.remove('hidden');
    els.authEmail.focus();
};

const closeAuthModal = () => {
    els.authModal.classList.add('hidden');
    els.authError.textContent = '';
};

const openAccountModal = () => {
    renderAccountWindow();
    els.accountModal.classList.remove('hidden');
};

const closeAccountModal = () => {
    els.accountModal.classList.add('hidden');
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
    if (state.config?.turnstileRequired && !state.authTurnstileToken) {
        els.authError.textContent = 'Complete verification first.';
        return;
    }

    els.authError.textContent = '';
    const isRegister = state.authMode === 'register';
    const payload = {
        email: els.authEmail.value.trim(),
        password: els.authPassword.value,
        displayName: els.authDisplayName.value.trim(),
        turnstileToken: state.authTurnstileToken
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
        resetTurnstile('auth');
        closeAuthModal();
        state.activeChatId = null;
        state.messages = [];
        await fetchMe();
        await fetchChats();
        renderMessages();
    } catch (error) {
        resetTurnstile('auth');
        els.authError.textContent = error.message || 'Unable to continue.';
    }
};

const signOut = async () => {
    await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
    state.authToken = '';
    state.user = null;
    state.activeChatId = null;
    state.messages = [];
    storageRemove('token');
    updateAccount();
    closeAccountModal();
    await fetchMe();
    await fetchChats();
    renderMessages();
};

els.composer.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage();
});

els.messageInput.addEventListener('input', autoGrowInput);
els.messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
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
});

els.attachmentRow.addEventListener('click', (event) => {
    const index = event.target?.dataset?.removeFile;
    if (index === undefined) return;
    state.pendingFiles.splice(Number(index), 1);
    renderAttachments();
});

els.chatList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-chat-id]');
    if (!button) return;
    loadMessages(button.dataset.chatId).catch((error) => showToast(error.message));
});

els.newChatButton.addEventListener('click', () => createChat().catch((error) => showToast(error.message)));

els.modelSelect.addEventListener('change', () => {
    storageSet('model', els.modelSelect.value);
    updateSettingsSummary();
});

els.personalitySelect.addEventListener('change', () => {
    storageSet('personality', els.personalitySelect.value);
    updateSettingsSummary();
});

els.thinkingToggle.addEventListener('change', () => {
    storageSet('thinking', els.thinkingToggle.checked ? '1' : '0');
    updateSettingsSummary();
});

els.researchToggle.addEventListener('change', () => {
    if (els.researchToggle.checked && !state.user) {
        els.researchToggle.checked = false;
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

els.deepResearchToggle.addEventListener('change', () => {
    if (els.deepResearchToggle.checked && !state.user) {
        els.deepResearchToggle.checked = false;
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

els.settingsButton.addEventListener('click', () => {
    const willOpen = els.settingsMenu.classList.contains('hidden');
    els.settingsMenu.classList.toggle('hidden', !willOpen);
    els.settingsButton.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
});

document.addEventListener('click', (event) => {
    const target = event.target;
    if (!els.settingsMenu || els.settingsMenu.classList.contains('hidden')) return;
    if (els.settingsMenu.contains(target) || els.settingsButton.contains(target)) return;
    els.settingsMenu.classList.add('hidden');
    els.settingsButton.setAttribute('aria-expanded', 'false');
});

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!els.settingsMenu.classList.contains('hidden')) {
        els.settingsMenu.classList.add('hidden');
        els.settingsButton.setAttribute('aria-expanded', 'false');
    }
    if (!els.accountModal.classList.contains('hidden')) closeAccountModal();
    if (!els.authModal.classList.contains('hidden')) closeAuthModal();
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

document.querySelectorAll('.auth-tab').forEach((button) => {
    button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
});

els.authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitAuth();
});

window.addEventListener('load', iconRefresh);

(async () => {
    try {
        iconRefresh();
        await fetchConfig();
        await fetchMe();
        await fetchChats();
        renderChats();
        renderMessages();
    } catch (error) {
        showToast(error.message || 'Ask could not load.');
        renderChats();
        renderMessages();
    }
})();
