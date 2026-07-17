// Gatita API Dashboard Frontend
(function() {
    'use strict';

    // API Base URL (same pattern as app.js)
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
        "https://api.clankr.tech/ask-api";

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

    // State
    let currentUser = null;
    let currentTier = null;
    let currentTab = 'overview';
    let charts = {};
    let revokeKeyId = null;
    let authToken = storageGet("token");

    // DOM Elements
    const elements = {
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebar: document.querySelector('.api-sidebar'),
        navItems: document.querySelectorAll('.api-nav-item[data-tab]'),
        tabPanels: document.querySelectorAll('.api-tab-panel'),
        pageTitle: document.getElementById('pageTitle'),
        pageSubtitle: document.getElementById('pageSubtitle'),
        accountName: document.getElementById('accountName'),
        accountTier: document.getElementById('accountTier'),
        accountAvatar: document.getElementById('accountAvatar'),
        newKeyBtn: document.getElementById('newKeyBtn'),
        newKeyBtnHero: document.getElementById('newKeyBtnHero'),
        createFirstKeyBtn: document.getElementById('createFirstKeyBtn'),
        apiKeysList: document.getElementById('apiKeysList'),
        noKeysState: document.getElementById('noKeysState'),
        createKeyModal: document.getElementById('createKeyModal'),
        createKeyModalBackdrop: document.getElementById('createKeyModalBackdrop'),
        createKeyModalClose: document.getElementById('createKeyModalClose'),
        createKeyForm: document.getElementById('createKeyForm'),
        createKeyCancel: document.getElementById('createKeyCancel'),
        showKeyModal: document.getElementById('showKeyModal'),
        showKeyModalBackdrop: document.getElementById('showKeyModalBackdrop'),
        newApiKey: document.getElementById('newApiKey'),
        copyKeyBtn: document.getElementById('copyKeyBtn'),
        showKeyDone: document.getElementById('showKeyDone'),
        revokeKeyModal: document.getElementById('revokeKeyModal'),
        revokeKeyModalBackdrop: document.getElementById('revokeKeyModalBackdrop'),
        revokeKeyName: document.getElementById('revokeKeyName'),
        revokeKeyCancel: document.getElementById('revokeKeyCancel'),
        revokeKeyConfirm: document.getElementById('revokeKeyConfirm'),
        toastContainer: document.getElementById('toastContainer'),
        contactUpgradeBtn: document.getElementById('contactUpgradeBtn'),
        planCards: document.getElementById('planCards'),
    };

    // Tab configurations
    const tabConfig = {
        overview: { title: 'Overview', subtitle: 'Your API dashboard at a glance', icon: 'layout-dashboard' },
        keys: { title: 'API Keys', subtitle: 'Manage your API keys', icon: 'key' },
        analytics: { title: 'Analytics', subtitle: 'Detailed usage statistics and trends', icon: 'bar-chart-3' },
        plan: { title: 'Plan & Upgrade', subtitle: 'Upgrade to unlock higher limits and more models', icon: 'crown' },
        usage: { title: 'Usage & Limits', subtitle: 'Monitor your current usage against plan limits', icon: 'activity' },
        strikes: { title: 'Strikes & Status', subtitle: 'View your account strikes and API access status', icon: 'alert-triangle' }
    };

    // Tier configurations
    const tierConfigs = {
        free: {
            id: 'free',
            name: 'Free',
            displayName: 'Free',
            color: '#6b7280',
            dailyRequestLimit: 200,
            requestsPerMinute: 6,
            maxTokensPerRequest: 4096,
            allowedModels: ['powershot', 'deepwater', 'ultimate', 'northstar'],
            canUseResearch: false,
            canUseDeepResearch: false,
            canUseAgent: false,
            strikeBypass: false,
            features: ['200 requests/day', '6 req/min', '4 models', 'Basic support']
        },
        plus: {
            id: 'plus',
            name: 'Plus',
            displayName: 'Plus',
            color: '#3b82f6',
            dailyRequestLimit: 2000,
            requestsPerMinute: 30,
            maxTokensPerRequest: 8192,
            allowedModels: ['powershot', 'deepwater', 'ultimate', 'northstar'],
            canUseResearch: true,
            canUseDeepResearch: true,
            canUseAgent: true,
            strikeBypass: true,
            features: ['2,000 requests/day', '30 req/min', '4 models', 'Research', 'Deep Research', 'Agent', 'Strike bypass', 'Priority support']
        },
        pro: {
            id: 'pro',
            name: 'Pro',
            displayName: 'Pro',
            color: '#8b5cf6',
            dailyRequestLimit: 10000,
            requestsPerMinute: 100,
            maxTokensPerRequest: 32768,
            allowedModels: ['powershot', 'deepwater', 'ultimate', 'northstar'],
            canUseResearch: true,
            canUseDeepResearch: true,
            canUseAgent: true,
            strikeBypass: true,
            features: ['10,000 requests/day', '100 req/min', '4 models', 'All Plus features', 'Highest limits', 'Custom models', 'Dedicated support']
        }
    };

    // API fetch helper (same pattern as app.js)
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
            const error = new Error(json.error || "Request failed.");
            error.status = response.status;
            error.data = json;
            throw error;
        }

        return json;
    }

    // Initialize
    async function init() {
        setupEventListeners();
        await checkAuth();
        if (currentUser) {
            await loadDashboardData();
            initCharts();
            setupRealtimeUpdates();
        }
        lucide.createIcons();
    }

    // Event Listeners
    function setupEventListeners() {
        // Sidebar toggle
        elements.sidebarToggle?.addEventListener('click', toggleSidebar);

        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.dataset.tab;
                if (tab) switchTab(tab);
            });
        });

        // New key buttons
        elements.newKeyBtn?.addEventListener('click', () => openCreateKeyModal());
        elements.createFirstKeyBtn?.addEventListener('click', () => openCreateKeyModal());
        elements.newKeyBtnHero?.addEventListener('click', () => openCreateKeyModal());

        // Create key modal
        elements.createKeyModalClose?.addEventListener('click', closeCreateKeyModal);
        elements.createKeyModalBackdrop?.addEventListener('click', closeCreateKeyModal);
        elements.createKeyCancel?.addEventListener('click', closeCreateKeyModal);
        elements.createKeyForm?.addEventListener('submit', handleCreateKey);

        // Show key modal
        elements.showKeyModalBackdrop?.addEventListener('click', closeShowKeyModal);
        elements.copyKeyBtn?.addEventListener('click', copyApiKey);
        elements.showKeyDone?.addEventListener('click', closeShowKeyModal);

        // Revoke key modal
        elements.revokeKeyModalBackdrop?.addEventListener('click', closeRevokeKeyModal);
        elements.revokeKeyCancel?.addEventListener('click', closeRevokeKeyModal);
        elements.revokeKeyConfirm?.addEventListener('click', confirmRevokeKey);

        // Contact upgrade
        elements.contactUpgradeBtn?.addEventListener('click', () => {
            window.open('https://discord.gg/gatita', '_blank');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeCreateKeyModal();
                closeShowKeyModal();
                closeRevokeKeyModal();
            }
        });

        // Chart period buttons
        document.querySelectorAll('.api-chart-period').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.api-chart-period').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateRequestsChart(btn.dataset.period);
            });
        });
    }

    // Authentication check
    async function checkAuth() {
        try {
            const data = await apiFetch("/me");
            currentUser = data.user;
            currentTier = data.tier;
            updateAccountDisplay();
        } catch (error) {
            console.error('Auth check failed:', error);
            if (error.status === 401) {
                // Token expired or invalid
                authToken = "";
                storageRemove("token");
                window.location.href = '/login.html?redirect=/api.html';
            } else {
                showToast('error', 'Failed to verify authentication');
            }
        }
    }

    // Update account display in sidebar
    function updateAccountDisplay() {
        if (!currentUser) return;
        
        elements.accountName.textContent = currentUser.display_name || currentUser.email;
        elements.accountAvatar.textContent = (currentUser.display_name || currentUser.email).charAt(0).toUpperCase();
        
        if (currentTier) {
            const tier = tierConfigs[currentTier];
            elements.accountTier.textContent = tier.displayName;
            elements.accountTier.style.background = tier.color;
        }
    }

    // Load dashboard data
    async function loadDashboardData() {
        try {
            // Load tier info
            const tierData = await apiFetch("/tier");
            currentTier = tierData.tier;
            updateAccountDisplay();
            renderPlanCards();
            renderUsageLimits();
            renderAvailableModels();
            renderStrikes(tierData);
            updateStatusCard(tierData);

            // Load API keys
            await loadApiKeys();

            // Load analytics overview
            await loadAnalyticsOverview();

            // Load realtime data
            await loadRealtimeAnalytics();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showToast('error', 'Failed to load dashboard data');
        }
    }

    // Load API keys
    async function loadApiKeys() {
        try {
            const data = await apiFetch("/keys");
            renderApiKeys(data.keys);
        } catch (error) {
            console.error('Failed to load API keys:', error);
        }
    }
    function renderApiKeys(keys) {
        if (!keys || keys.length === 0) {
            elements.apiKeysList.style.display = 'none';
            elements.noKeysState.style.display = 'block';
            return;
        }

        elements.apiKeysList.style.display = 'grid';
        elements.noKeysState.style.display = 'none';

        elements.apiKeysList.innerHTML = keys.map(key => `
            <article class="api-key-card" data-key-id="${key.id}">
                <header class="api-key-header">
                    <div class="api-key-info">
                        <h3 class="api-key-name">${escapeHtml(key.name)}</h3>
                        <span class="api-key-prefix">${escapeHtml(key.key_prefix)}</span>
                    </div>
                    <div class="api-key-status ${key.revoked_at ? 'revoked' : 'active'}">
                        ${key.revoked_at ? 'Revoked' : 'Active'}
                    </div>
                </header>
                <div class="api-key-meta">
                    <span class="api-key-meta-item">
                        <i data-lucide="calendar"></i>
                        <span>${formatDate(key.created_at)}</span>
                    </span>
                    ${key.last_used_at ? `
                        <span class="api-key-meta-item">
                            <i data-lucide="clock"></i>
                            <span>Last used: ${formatRelativeTime(key.last_used_at)}</span>
                        </span>
                    ` : ''}
                    ${key.expires_at ? `
                        <span class="api-key-meta-item ${Date.now() > key.expires_at ? 'expired' : ''}">
                            <i data-lucide="alert-triangle"></i>
                            <span>Expires: ${formatDate(key.expires_at)}</span>
                        </span>
                    ` : ''}
                </div>
                <footer class="api-key-actions">
                    <button class="api-btn api-btn-ghost api-btn-sm revoke-key-btn" data-key-id="${key.id}" data-key-name="${escapeHtml(key.name)}" ${key.revoked_at ? 'disabled' : ''}>
                        <i data-lucide="trash-2"></i>
                        <span data-i18n="api.keys.revoke">Revoke</span>
                    </button>
                </footer>
            </article>
        `).join('');

        // Add event listeners to revoke buttons
        document.querySelectorAll('.revoke-key-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const keyId = parseInt(e.currentTarget.dataset.keyId);
                const keyName = e.currentTarget.dataset.keyName;
                openRevokeKeyModal(keyId, keyName);
            });
        });

        lucide.createIcons();
    }

    // Load analytics overview
    async function loadAnalyticsOverview() {
        try {
            const data = await apiFetch("/overview");
            renderOverviewStats(data);
            renderRequestsChart(data.dailyStats);
            renderModelsChart(data.modelUsage);
            renderRecentActivity(data.dailyStats);
        } catch (error) {
            console.error('Failed to load analytics overview:', error);
        }
    }

    // Load realtime analytics
    async function loadRealtimeAnalytics() {
        try {
            const data = await apiFetch("/realtime");
            updateRealtimeDisplay(data);
        } catch (error) {
            console.error('Failed to load realtime analytics:', error);
        }
    }

    // Update realtime display
    function updateRealtimeDisplay(data) {
        // Update usage cards
        updateProgressRing('daily', data.dailyUsed, data.dailyLimit);
        updateProgressRing('rate', data.currentMinute, data.minuteLimit);
        
        // Update stat cards
        document.getElementById('statTodayRequests').textContent = formatNumber(data.dailyUsed);
    }

    // Render overview stats
    function renderOverviewStats(data) {
        document.getElementById('statTotalKeys').textContent = data.usage?.month?.requests ? '—' : '0'; // Will be updated from keys
        document.getElementById('statTodayRequests').textContent = formatNumber(data.usage?.today?.requests || 0);
        document.getElementById('statTotalTokens').textContent = formatNumber(data.usage?.month?.tokens || 0);
        document.getElementById('statAvgLatency').textContent = '—'; // Would need backend support
    }

    // Render requests chart
    function renderRequestsChart(dailyStats) {
        const ctx = document.getElementById('requestsChart');
        if (!ctx) return;

        const labels = dailyStats.slice(-30).reverse().map(d => d.date);
        const requests = dailyStats.slice(-30).reverse().map(d => d.requests);
        const tokens = dailyStats.slice(-30).reverse().map(d => d.tokens);

        if (charts.requests) charts.requests.destroy();

        charts.requests = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Requests',
                        data: requests,
                        borderColor: '#ff6600',
                        backgroundColor: 'rgba(255, 102, 0, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ]
            },
            options: getChartOptions('Requests')
        });
    }

    // Update requests chart for different periods
    function updateRequestsChart(period) {
        // Would fetch new data based on period
        loadAnalyticsOverview();
    }

    // Render models chart
    function renderModelsChart(modelUsage) {
        const ctx = document.getElementById('modelsChart');
        if (!ctx) return;

        const labels = modelUsage.slice(0, 5).map(m => m.model);
        const data = modelUsage.slice(0, 5).map(m => m.requests);

        if (charts.models) charts.models.destroy();

        charts.models = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: [
                        '#ff6600',
                        '#3b82f6',
                        '#22c55e',
                        '#f59e0b',
                        '#8b5cf6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 16,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Render recent activity
    function renderRecentActivity(dailyStats) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const recentDays = dailyStats.slice(0, 5);
        
        if (recentDays.length === 0 || recentDays.every(d => d.requests === 0)) {
            container.innerHTML = '<div class="api-empty-state" data-i18n="api.activity.noActivity">No recent API activity</div>';
            return;
        }

        container.innerHTML = recentDays.map(day => `
            <article class="api-activity-item">
                <div class="api-activity-date">${formatDate(day.date + 'T00:00:00')}</div>
                <div class="api-activity-stats">
                    <span><i data-lucide="activity"></i> ${formatNumber(day.requests)} requests</span>
                    <span><i data-lucide="cpu"></i> ${formatNumber(day.tokens)} tokens</span>
                    <span><i data-lucide="check-circle"></i> ${day.successful}% success</span>
                </div>
            </article>
        `).join('');

        lucide.createIcons();
    }

    // Render plan cards
    function renderPlanCards() {
        if (!elements.planCards) return;

        const currentTierId = currentTier || 'free';
        
        elements.planCards.innerHTML = Object.values(tierConfigs).map(tier => {
            const isCurrent = tier.id === currentTierId;
            const isUpgrade = tierConfigs[currentTierId] && tierConfigs[tier.id].sort_order > tierConfigs[currentTierId].sort_order;
            
            return `
                <article class="api-plan-card ${isCurrent ? 'current' : ''} ${isUpgrade ? 'upgrade' : ''}" data-tier="${tier.id}">
                    <header class="api-plan-header" style="--plan-color: ${tier.color}">
                        <h3 class="api-plan-name">${tier.displayName}</h3>
                        ${isCurrent ? '<span class="api-plan-badge current" data-i18n="api.plan.current">Current Plan</span>' : ''}
                        ${isUpgrade ? '<span class="api-plan-badge upgrade" data-i18n="api.plan.upgrade">Upgrade</span>' : ''}
                    </header>
                    <div class="api-plan-features">
                        ${tier.features.map(f => `<li><i data-lucide="check"></i> ${f}</li>`).join('')}
                    </div>
                    <footer class="api-plan-footer">
                        ${isCurrent ? `
                            <button class="api-btn api-btn-secondary api-btn-block" disabled data-i18n="api.plan.currentPlan">Current Plan</button>
                        ` : isUpgrade ? `
                            <button class="api-btn api-btn-primary api-btn-block upgrade-plan-btn" data-tier="${tier.id}" data-i18n="api.plan.upgradeTo">Upgrade to ${tier.displayName}</button>
                        ` : `
                            <button class="api-btn api-btn-secondary api-btn-block" disabled data-i18n="api.plan.downgrade">Downgrade</button>
                        `}
                    </footer>
                </article>
            `;
        }).join('');

        // Add upgrade button listeners
        document.querySelectorAll('.upgrade-plan-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tierId = btn.dataset.tier;
                showToast('info', `Stripe checkout is available for ${tierId} from the plan card.`);
            });
        });

        lucide.createIcons();
    }

    // Render usage limits
    function renderUsageLimits() {
        if (!currentTier) return;
        const tier = tierConfigs[currentTier];

        // Update daily limit card
        document.getElementById('dailyProgressMax').textContent = `/ ${formatNumber(tier.dailyRequestLimit)}`;
        document.getElementById('dailyProgressFill').style.stroke = tier.color;

        // Update rate limit card
        document.getElementById('rateProgressMax').textContent = `/ ${tier.requestsPerMinute}`;
        document.getElementById('rateProgressFill').style.stroke = tier.color;

        // Update token limit card
        document.getElementById('tokenProgressMax').textContent = `/ ${formatNumber(tier.maxTokensPerRequest)}`;
        document.getElementById('tokenProgressFill').style.stroke = tier.color;

        // Update reset time
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('dailyResetTime').textContent = `Resets ${formatRelativeTime(tomorrow.getTime())}`;
    }

    // Render available models
    function renderAvailableModels() {
        const container = document.getElementById('availableModelsGrid');
        if (!container || !currentTier) return;

        const tier = tierConfigs[currentTier];
        
        container.innerHTML = tier.allowedModels.map(model => `
            <article class="api-model-card">
                <span class="api-model-name">${model}</span>
                <span class="api-model-badge available" data-i18n="api.usage.available">Available</span>
            </article>
        `).join('');
    }

    // Render strikes
    function renderStrikes(tierData) {
        const strikeCount = tierData.strikeCount || 0;
        const hasStrikes = tierData.hasActiveStrikes || false;
        const strikesBypass = tierData.strikesBypass || false;

        document.getElementById('strikeCount').textContent = strikeCount;
        document.getElementById('currentTierDisplay').textContent = tierConfigs[currentTier]?.displayName || 'Free';
        document.getElementById('strikeBypassStatus').textContent = strikesBypass 
            ? 'Enabled (Plus/Pro tier)' 
            : 'Not available (Free tier)';
        document.getElementById('strikeBypassStatus').className = strikesBypass ? 'api-status-value success' : 'api-status-value warning';

        // Update status indicator
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const apiAccessStatus = document.getElementById('apiAccessStatus');

        if (hasStrikes && !strikesBypass) {
            statusDot.className = 'api-status-dot blocked';
            statusText.textContent = 'Blocked';
            statusText.setAttribute('data-i18n', 'api.strikes.blocked');
            apiAccessStatus.textContent = 'Blocked';
            apiAccessStatus.className = 'api-status-value danger';
        } else {
            statusDot.className = 'api-status-dot active';
            statusText.textContent = 'Active';
            statusText.setAttribute('data-i18n', 'api.strikes.active');
            apiAccessStatus.textContent = 'Enabled';
            apiAccessStatus.className = 'api-status-value success';
        }
    }

    // Update status card
    function updateStatusCard(tierData) {
        // Already handled in renderStrikes
    }

    // Update progress ring
    function updateProgressRing(type, used, max) {
        const fill = document.getElementById(`${type}ProgressFill`);
        const value = document.getElementById(`${type}ProgressValue`);
        const usedEl = document.getElementById(`${type}Used`);
        const remainingEl = document.getElementById(`${type}Remaining`);

        if (!fill || !value) return;

        const percentage = max > 0 ? Math.min(used / max, 1) : 0;
        const circumference = 339; // 2 * PI * 54
        const offset = circumference * (1 - percentage);

        fill.style.strokeDashoffset = offset;
        value.textContent = formatNumber(used);

        if (usedEl) usedEl.textContent = `${formatNumber(used)} used this minute`;
        if (remainingEl) remainingEl.textContent = `${formatNumber(Math.max(0, max - used))} remaining`;

        // Color coding
        fill.classList.remove('warning', 'danger');
        if (percentage >= 0.9) fill.classList.add('danger');
        else if (percentage >= 0.7) fill.classList.add('warning');
    }

    // Initialize charts
    function initCharts() {
        // Charts are initialized when data loads
    }

    // Setup realtime updates
    function setupRealtimeUpdates() {
        // Update realtime data every 5 seconds
        setInterval(loadRealtimeAnalytics, 5000);
    }

    // Tab switching
    function switchTab(tab) {
        if (!tabConfig[tab]) return;

        currentTab = tab;

        // Update nav items
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });

        // Update tab panels
        elements.tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tab}`);
        });

        // Update page title
        const config = tabConfig[tab];
        document.querySelector('#pageTitle h1').textContent = config.title;
        document.getElementById('pageSubtitle').textContent = config.subtitle;

        // Load tab-specific data
        loadTabData(tab);

        // Close sidebar on mobile
        if (window.innerWidth < 860) {
            closeSidebar();
        }

        lucide.createIcons();
    }

    // Load tab-specific data
    async function loadTabData(tab) {
        switch (tab) {
            case 'analytics':
                await loadFullAnalytics();
                break;
            case 'keys':
                await loadApiKeys();
                break;
            case 'plan':
                renderPlanCards();
                break;
            case 'usage':
                renderUsageLimits();
                renderAvailableModels();
                break;
            case 'strikes':
                // Already loaded in loadDashboardData
                break;
        }
    }

    // Load full analytics
    async function loadFullAnalytics() {
        try {
            const data = await apiFetch("/overview");
            renderAnalyticsCharts(data);
            renderDailyBreakdown(data.dailyStats);
        } catch (error) {
            console.error('Failed to load full analytics:', error);
        }
    }

    // Render analytics charts
    function renderAnalyticsCharts(data) {
        // Endpoints chart
        const endpointsCtx = document.getElementById('endpointsChart');
        if (endpointsCtx && data.endpointUsage) {
            if (charts.endpoints) charts.endpoints.destroy();
            charts.endpoints = new Chart(endpointsCtx, {
                type: 'bar',
                data: {
                    labels: data.endpointUsage.map(e => e.endpoint),
                    datasets: [{
                        label: 'Requests',
                        data: data.endpointUsage.map(e => e.requests),
                        backgroundColor: 'rgba(255, 102, 0, 0.7)',
                        borderColor: '#ff6600',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: getChartOptions('Requests by Endpoint')
            });
        }

        // Models detail chart
        const modelsDetailCtx = document.getElementById('modelsDetailChart');
        if (modelsDetailCtx && data.modelUsage) {
            if (charts.modelsDetail) charts.modelsDetail.destroy();
            charts.modelsDetail = new Chart(modelsDetailCtx, {
                type: 'pie',
                data: {
                    labels: data.modelUsage.map(m => m.model),
                    datasets: [{
                        data: data.modelUsage.map(m => m.requests),
                        backgroundColor: [
                            '#ff6600', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6',
                            '#ec4899', '#06b6d4', '#84cc16', '#f97316'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#ffffff', padding: 12, usePointStyle: true }
                        }
                    }
                }
            });
        }

        // Tokens chart
        const tokensCtx = document.getElementById('tokensChart');
        if (tokensCtx && data.dailyStats) {
            const daily = data.dailyStats.slice(-30).reverse();
            if (charts.tokens) charts.tokens.destroy();
            charts.tokens = new Chart(tokensCtx, {
                type: 'line',
                data: {
                    labels: daily.map(d => d.date),
                    datasets: [{
                        label: 'Tokens',
                        data: daily.map(d => d.tokens),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }]
                },
                options: getChartOptions('Token Usage')
            });
        }

        // Errors chart
        const errorsCtx = document.getElementById('errorsChart');
        if (errorsCtx && data.dailyStats) {
            const daily = data.dailyStats.slice(-30).reverse();
            if (charts.errors) charts.errors.destroy();
            charts.errors = new Chart(errorsCtx, {
                type: 'line',
                data: {
                    labels: daily.map(d => d.date),
                    datasets: [{
                        label: 'Error Rate %',
                        data: daily.map(d => d.requests > 0 ? ((d.failed / d.requests) * 100).toFixed(2) : 0),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }]
                },
                options: getChartOptions('Error Rate %', { min: 0, max: 100 })
            });
        }
    }

    // Render daily breakdown table
    function renderDailyBreakdown(dailyStats) {
        const tbody = document.getElementById('dailyBreakdownBody');
        if (!tbody) return;

        const recent = dailyStats.slice(0, 30);
        
        if (recent.length === 0) {
            tbody.innerHTML = '<tr class="api-empty-row"><td colspan="5" data-i18n="api.analytics.noData">No data available</td></tr>';
            return;
        }

        tbody.innerHTML = recent.map(day => `
            <tr>
                <td>${formatDate(day.date + 'T00:00:00')}</td>
                <td>${formatNumber(day.total_requests)}</td>
                <td>${formatNumber(day.total_tokens)}</td>
                <td>${day.total_requests > 0 ? ((day.successful_requests / day.total_requests) * 100).toFixed(1) : 0}%</td>
                <td>—</td>
            </tr>
        `).join('');
    }

    // Modal functions
    function openCreateKeyModal() {
        elements.createKeyModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('keyName').focus(), 100);
    }

    function closeCreateKeyModal() {
        elements.createKeyModal.classList.add('hidden');
        document.body.style.overflow = '';
        elements.createKeyForm.reset();
    }

    function openShowKeyModal(key) {
        elements.newApiKey.textContent = key;
        elements.showKeyModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeShowKeyModal() {
        elements.showKeyModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function openRevokeKeyModal(keyId, keyName) {
        revokeKeyId = keyId;
        elements.revokeKeyName.textContent = keyName;
        elements.revokeKeyModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeRevokeKeyModal() {
        elements.revokeKeyModal.classList.add('hidden');
        document.body.style.overflow = '';
        revokeKeyId = null;
    }

    async function confirmRevokeKey() {
        if (!revokeKeyId) return;

        try {
            await apiFetch(`/keys/${revokeKeyId}`, { method: 'DELETE' });
            showToast('success', 'API key revoked');
            closeRevokeKeyModal();
            await loadApiKeys();
        } catch (error) {
            console.error('Revoke key error:', error);
            showToast('error', error.data?.error || 'Failed to revoke key');
        }
    }

    async function handleCreateKey(e) {
        e.preventDefault();
        
        const formData = new FormData(elements.createKeyForm);
        const name = formData.get('name').trim();
        const expiresInDays = parseInt(formData.get('expiresInDays')) || 0;

        if (!name) {
            showToast('error', 'Key name is required');
            return;
        }

        try {
            const data = await apiFetch('/keys', {
                method: 'POST',
                body: JSON.stringify({ name, expiresInDays })
            });
            closeCreateKeyModal();
            openShowKeyModal(data.key.key);
            await loadApiKeys();
        } catch (error) {
            console.error('Create key error:', error);
            showToast('error', error.data?.error || 'Failed to create key');
        }
    }

    async function copyApiKey() {
        const key = elements.newApiKey.textContent;
        try {
            await navigator.clipboard.writeText(key);
            showToast('success', 'API key copied to clipboard');
            elements.copyKeyBtn.innerHTML = '<i data-lucide="check"></i> <span data-i18n="api.keys.copied">Copied!</span>';
            lucide.createIcons();
            setTimeout(() => {
                elements.copyKeyBtn.innerHTML = '<i data-lucide="copy"></i> <span data-i18n="api.keys.copy">Copy</span>';
                lucide.createIcons();
            }, 2000);
        } catch (error) {
            showToast('error', 'Failed to copy key');
        }
    }

    // Sidebar functions
    function toggleSidebar() {
        document.body.classList.toggle('sidebar-collapsed');
        const expanded = !document.body.classList.contains('sidebar-collapsed');
        elements.sidebarToggle.setAttribute('aria-expanded', expanded);
    }

    function closeSidebar() {
        if (window.innerWidth < 860) {
            document.body.classList.add('sidebar-collapsed');
            elements.sidebarToggle.setAttribute('aria-expanded', 'false');
        }
    }

    // Toast notifications
    function showToast(type, message) {
        const toast = document.createElement('div');
        toast.className = `api-toast api-toast-${type}`;
        toast.setAttribute('role', 'alert');
        
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        toast.innerHTML = `
            <i data-lucide="${icons[type]}"></i>
            <span>${escapeHtml(message)}</span>
            <button class="api-toast-close" aria-label="Dismiss">
                <i data-lucide="x"></i>
            </button>
        `;

        toast.querySelector('.api-toast-close').addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 200);
        });

        elements.toastContainer.appendChild(toast);
        lucide.createIcons();

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 200);
            }
        }, 5000);
    }

    // Chart options helper
    function getChartOptions(label, scaleOptions = {}) {
        return {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 30, 0.97)',
                    titleColor: '#ffffff',
                    bodyColor: '#aaaaaa',
                    borderColor: 'rgba(255, 255, 255, 0.14)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#777777', font: { size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#777777', font: { size: 11 } },
                    ...scaleOptions
                }
            }
        };
    }

    // Utility functions
    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = timestamp - now;
        
        if (diff < 0) return 'just now';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
