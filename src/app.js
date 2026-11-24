/**
 * Trace — Browser History Simulator
 * Application Integration (app.js)
 * 
 * Connects the HTML5 frontend to the BrowserHistoryController.
 * Handles DOM events, input validation, state synchronization, and visualization.
 */

// Determine environment
const isBrowser = (typeof document !== 'undefined');

// Resolve controller instance: uses WasmBrowserHistoryController
let controller = null;
if (isBrowser && typeof wasmController !== 'undefined') {
    controller = wasmController;
} else if (typeof require !== 'undefined') {
    try {
        const { WasmBrowserHistoryController } = require('./wasmController');
        controller = new WasmBrowserHistoryController();
    } catch (e) {
        controller = null;
    }
}

// DOM Element References (initialized only in browser environment)
const elements = isBrowser ? {
    // Navigation controls
    btnBack: document.getElementById('btnBack'),
    btnForward: document.getElementById('btnForward'),
    addressBarForm: document.getElementById('addressBarForm'),
    urlInput: document.getElementById('urlInput'),
    btnVisit: document.getElementById('btnVisit'),
    quickCards: document.querySelectorAll('.quick-card'),

    // Viewport screens
    startScreen: document.getElementById('startScreen'),
    activePageScreen: document.getElementById('activePageScreen'),
    pageTitle: document.getElementById('pageTitle'),
    pageUrl: document.getElementById('pageUrl'),
    siteAvatar: document.querySelector('.site-icon-avatar'),
    statusMessage: document.getElementById('statusMessage'),

    // History panel
    btnHistoryToggle: document.getElementById('btnHistoryToggle'),
    btnCloseHistory: document.getElementById('btnCloseHistory'),
    historyPanel: document.getElementById('historyPanel'),
    historyList: document.getElementById('historyList'),
    historyEmptyState: document.getElementById('historyEmptyState'),
    btnClearHistory: document.getElementById('btnClearHistory'),

    // Data Structure Inspector
    btnInspectorToggle: document.getElementById('btnInspectorToggle'),
    btnCloseInspector: document.getElementById('btnCloseInspector'),
    dsInspector: document.getElementById('dsInspector'),
    backStackList: document.getElementById('backStackList'),
    backStackEmpty: document.getElementById('backStackEmpty'),
    forwardStackList: document.getElementById('forwardStackList'),
    forwardStackEmpty: document.getElementById('forwardStackEmpty'),
    dllList: document.getElementById('dllList'),
    dllEmpty: document.getElementById('dllEmpty')
} : {};

// SVG icons for active page avatar
const SITE_ICONS = {
    google: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>`,
    youtube: `<svg width="22" height="16" viewBox="0 0 24 18" fill="none"><path d="M23.498 2.625a3.016 3.016 0 0 0-2.122-2.136C19.505 0 12 0 12 0S4.495 0 2.624.489A3.016 3.016 0 0 0 .502 2.625C0 4.512 0 8.45 0 8.45s0 3.938.502 5.825a3.016 3.016 0 0 0 2.122 2.136c1.871.5 9.376.5 9.376.5s7.505 0 9.376-.5a3.016 3.016 0 0 0 2.122-2.136C24 12.388 24 8.45 24 8.45s0-3.938-.502-5.825z" fill="#FF0000"/><polygon points="9.6 12.05 15.82 8.45 9.6 4.85 9.6 12.05" fill="#FFFFFF"/></svg>`,
    wikipedia: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#263238"><path d="M12.09 13.048L9.78 6.94H7.29L2.83 17.51h2.29l1.1-2.65h4.15l.98 2.65h4.89l-4.15-4.462zm-4.99 2.5l1.63-3.92 1.48 3.92H7.1zm14.07-8.608h-2.52l-3.37 7.79-2.31-6.19h-1.63l3.22 8.52h1.63l4.98-10.12z"/></svg>`,
    github: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#24292e"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
    generic: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
};

/**
 * Validates whether a hostname string is a well-formed Internet domain or localhost.
 * Rejects consecutive dots, leading/trailing dots, invalid characters, and malformed labels.
 * 
 * @param {string} host - The hostname to validate.
 * @returns {boolean}
 */
function isValidHostname(host) {
    if (!host || typeof host !== 'string') return false;
    if (host === 'localhost') return true;
    if (host.includes('..') || host.startsWith('.') || host.endsWith('.')) return false;

    const labels = host.split('.');
    if (labels.length < 2) return false;

    const labelRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    for (let i = 0; i < labels.length; i++) {
        if (!labelRegex.test(labels[i])) return false;
    }

    // Top-level domain must be purely alphabetic and at least 2 characters long
    const tld = labels[labels.length - 1];
    if (!/^[a-z]{2,}$/.test(tld)) return false;

    return true;
}

/**
 * Normalizes input address to valid HTTP/HTTPS URL and derives a readable title.
 * Rejects unsupported protocols, malformed hostnames, or arbitrary text.
 * 
 * @param {string} input - User input string.
 * @returns {{url: string, title: string}|null}
 */
function normalizeAddress(input) {
    if (!input || typeof input !== 'string') return null;

    let trimmed = input.trim();
    if (trimmed.length === 0) return null;

    // Check for disallowed protocol schemes (ftp://, javascript:, file://, etc.)
    const protocolMatch = trimmed.match(/^([a-zA-Z0-9+.-]+):/);
    if (protocolMatch) {
        const scheme = protocolMatch[1].toLowerCase();
        if (scheme !== 'http' && scheme !== 'https') {
            return null; // Reject unsupported protocol
        }
    } else {
        // Automatically prepend https:// for naked domains (e.g. google.com)
        trimmed = 'https://' + trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }

        const host = parsed.hostname.toLowerCase();
        if (!isValidHostname(host)) {
            return null;
        }

        // Derive clean title from hostname
        let title = host.replace(/^www\./, '');
        if (host === 'localhost') {
            title = 'localhost';
        } else {
            const parts = title.split('.');
            if (parts.length >= 2) {
                title = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            }
        }

        return {
            url: parsed.href,
            title: title
        };
    } catch (err) {
        return null;
    }
}

/**
 * Sets concise feedback message in bottom status bar.
 * @param {string} message
 */
function setStatus(message) {
    if (elements.statusMessage) {
        elements.statusMessage.textContent = message;
    }
}

/**
 * Enables or disables interactive input controls during engine initialization.
 * @param {boolean} enabled
 */
function setControlsEnabled(enabled) {
    if (!isBrowser) return;
    if (elements.btnVisit) elements.btnVisit.disabled = !enabled;
    if (elements.urlInput) elements.urlInput.disabled = !enabled;
    if (elements.quickCards) {
        elements.quickCards.forEach(card => {
            card.disabled = !enabled;
            card.style.pointerEvents = enabled ? 'auto' : 'none';
            card.style.opacity = enabled ? '1' : '0.6';
        });
    }
}

/**
 * Handles visiting a page.
 * Validates address, calls WebAssembly C engine, and updates UI.
 * 
 * @param {string} rawUrl - Entered address or quick shortcut URL.
 * @param {string} [presetTitle] - Optional explicit title.
 * @returns {Object|null}
 */
function handleVisit(rawUrl, presetTitle) {
    if (!controller || !controller.isReady()) {
        setStatus('C engine is loading, please wait...');
        return null;
    }

    const normalized = normalizeAddress(rawUrl);

    if (!normalized) {
        setStatus('Enter a valid web address');
        if (elements.urlInput) {
            elements.urlInput.focus();
            elements.urlInput.select();
        }
        return null;
    }

    const title = presetTitle || normalized.title;
    const hadForwardHistory = controller.canGoForward();

    const result = controller.visit(normalized.url, title);
    if (!result || !result.success) {
        const errorText = (result && result.error) ? result.error : 'Enter a valid web address';
        setStatus(errorText);
        return null;
    }

    const node = result.page;

    // Set contextual status message
    try {
        const domain = new URL(node.url).hostname.replace(/^www\./, '');
        if (hadForwardHistory) {
            setStatus(`Forward history cleared · Visited ${domain}`);
        } else {
            setStatus(`Visited ${domain}`);
        }
    } catch (e) {
        setStatus(`Visited ${node.title}`);
    }

    updateUI();
    return node;
}

/**
 * Central UI synchronization function.
 * Synchronizes viewport, address bar, navigation buttons, history, and inspector with controller state.
 */
function updateUI() {
    if (!isBrowser || !controller || !controller.isReady()) return;

    const current = controller.getCurrentPage();

    // 1. Navigation Button States
    elements.btnBack.disabled = !controller.canGoBack();
    elements.btnForward.disabled = !controller.canGoForward();

    // 2. Viewport Screen & Address Bar
    if (current === null) {
        // Empty browsing session -> Start Screen
        elements.startScreen.classList.remove('is-hidden');
        elements.activePageScreen.classList.add('is-hidden');
        elements.urlInput.value = '';
    } else {
        // Active page exists
        elements.startScreen.classList.add('is-hidden');
        elements.activePageScreen.classList.remove('is-hidden');

        elements.pageTitle.textContent = current.title;
        elements.pageUrl.textContent = current.url;
        elements.pageUrl.href = current.url;
        elements.urlInput.value = current.url;

        // Render matching site icon avatar
        const lowerUrl = current.url.toLowerCase();
        let iconHtml = SITE_ICONS.generic;
        if (lowerUrl.includes('google.')) iconHtml = SITE_ICONS.google;
        else if (lowerUrl.includes('youtube.')) iconHtml = SITE_ICONS.youtube;
        else if (lowerUrl.includes('wikipedia.')) iconHtml = SITE_ICONS.wikipedia;
        else if (lowerUrl.includes('github.')) iconHtml = SITE_ICONS.github;

        elements.siteAvatar.innerHTML = iconHtml;
    }

    // 3. History Panel Synchronization
    updateHistoryView();

    // 4. Data Structure Inspector Synchronization
    updateInspectorView();
}

/**
 * Synchronizes the History panel list.
 */
function updateHistoryView() {
    if (!isBrowser || !controller || !controller.isReady()) return;

    const history = controller.getHistory();

    elements.historyList.textContent = ''; // Safe clear

    if (history.length === 0) {
        elements.historyEmptyState.classList.remove('is-hidden');
        elements.historyList.classList.add('is-hidden');
    } else {
        elements.historyEmptyState.classList.add('is-hidden');
        elements.historyList.classList.remove('is-hidden');

        // Render history items in chronological order
        history.forEach(node => {
            const row = document.createElement('div');
            row.className = 'history-row-item';

            // Use C pointer-based isCurrent flag to highlight active page
            if (node.isCurrent) {
                row.classList.add('is-current');
            }

            const titleEl = document.createElement('div');
            titleEl.className = 'row-title';
            titleEl.textContent = node.title;

            const urlEl = document.createElement('div');
            urlEl.className = 'row-url';
            urlEl.textContent = node.url;

            row.appendChild(titleEl);
            row.appendChild(urlEl);
            elements.historyList.appendChild(row);
        });
    }
}

/**
 * Synchronizes the Data Structure Inspector (Back Stack, Forward Stack, Doubly Linked List).
 */
function updateInspectorView() {
    if (!isBrowser || !controller || !controller.isReady()) return;

    const current = controller.getCurrentPage();

    // --- Back Stack ---
    const backItems = controller.getBackStack(); // ordered bottom-to-top
    elements.backStackList.textContent = '';

    if (backItems.length === 0) {
        elements.backStackEmpty.classList.remove('is-hidden');
    } else {
        elements.backStackEmpty.classList.add('is-hidden');
        // Render from top down to bottom so Top is visually at the top
        for (let i = backItems.length - 1; i >= 0; i--) {
            const pill = document.createElement('div');
            pill.className = 'stack-pill';
            pill.textContent = backItems[i].title;

            if (i === backItems.length - 1) {
                pill.classList.add('is-top');
            }
            elements.backStackList.appendChild(pill);
        }
    }

    // --- Forward Stack ---
    const forwardItems = controller.getForwardStack(); // ordered bottom-to-top
    elements.forwardStackList.textContent = '';

    if (forwardItems.length === 0) {
        elements.forwardStackEmpty.classList.remove('is-hidden');
    } else {
        elements.forwardStackEmpty.classList.add('is-hidden');
        // Render from top down to bottom so Top is visually at the top
        for (let i = forwardItems.length - 1; i >= 0; i--) {
            const pill = document.createElement('div');
            pill.className = 'stack-pill';
            pill.textContent = forwardItems[i].title;

            if (i === forwardItems.length - 1) {
                pill.classList.add('is-top');
            }
            elements.forwardStackList.appendChild(pill);
        }
    }

    // --- Doubly Linked List ---
    const dllNodes = controller.getHistory();
    elements.dllList.textContent = '';

    if (dllNodes.length === 0) {
        elements.dllEmpty.classList.remove('is-hidden');
    } else {
        elements.dllEmpty.classList.add('is-hidden');

        dllNodes.forEach((node, index) => {
            const nodeItem = document.createElement('div');
            nodeItem.className = 'dll-node-item';

            const card = document.createElement('div');
            card.className = 'dll-card';

            const isCurrent = node.isCurrent;
            const isHead = (index === 0);
            const isTail = (index === dllNodes.length - 1);

            if (isCurrent) {
                card.classList.add('is-current');
            }

            // Determine non-overlapping label badges
            const labelParts = [];
            if (isHead) labelParts.push('HEAD');
            if (isCurrent) labelParts.push('CURRENT');
            if (isTail) labelParts.push('TAIL');

            if (labelParts.length > 0) {
                const badge = document.createElement('span');
                badge.className = 'node-badge-tag';
                badge.textContent = labelParts.join(' · ');
                card.appendChild(badge);
            }

            const title = document.createElement('span');
            title.className = 'node-title-text';
            title.textContent = node.title;

            const url = document.createElement('span');
            url.className = 'node-url-text';
            url.textContent = node.url;

            card.appendChild(title);
            card.appendChild(url);
            nodeItem.appendChild(card);

            // Append bidirectional connector arrow between nodes
            if (index < dllNodes.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'dll-connector-arrow';
                connector.textContent = '⇄';
                nodeItem.appendChild(connector);
            }

            elements.dllList.appendChild(nodeItem);
        });
    }
}

// --------------------------------------------------------------------------
// EVENT LISTENERS & USER INTERACTIONS (Browser only)
// --------------------------------------------------------------------------
if (isBrowser) {
    // Address bar form submission (Enter key or Visit button click)
    elements.addressBarForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleVisit(elements.urlInput.value);
    });

    // Quick Access shortcut cards
    elements.quickCards.forEach(card => {
        card.addEventListener('click', () => {
            const url = card.dataset.quickUrl;
            const title = card.dataset.quickTitle;
            handleVisit(url, title);
        });
    });

    // Back Navigation
    elements.btnBack.addEventListener('click', () => {
        if (!controller || !controller.canGoBack()) return;
        const newCurrent = controller.back();
        if (newCurrent) {
            setStatus(`Moved back to ${newCurrent.title}`);
            updateUI();
        }
    });

    // Forward Navigation
    elements.btnForward.addEventListener('click', () => {
        if (!controller || !controller.canGoForward()) return;
        const newCurrent = controller.forward();
        if (newCurrent) {
            setStatus(`Moved forward to ${newCurrent.title}`);
            updateUI();
        }
    });

    // Prevent URL link from navigating away from simulator
    elements.pageUrl.addEventListener('click', (e) => {
        e.preventDefault();
    });

    // History Panel Toggle
    elements.btnHistoryToggle.addEventListener('click', () => {
        elements.historyPanel.classList.toggle('is-hidden');
        if (!elements.historyPanel.classList.contains('is-hidden')) {
            updateHistoryView();
        }
    });

    elements.btnCloseHistory.addEventListener('click', () => {
        elements.historyPanel.classList.add('is-hidden');
    });

    // Clear History Button
    elements.btnClearHistory.addEventListener('click', () => {
        if (!controller || !controller.isReady()) return;
        controller.clearHistory();
        setStatus('History cleared');
        updateUI();
    });

    // Data Structure Inspector Toggle
    elements.btnInspectorToggle.addEventListener('click', () => {
        elements.dsInspector.classList.toggle('is-hidden');
        if (!elements.dsInspector.classList.contains('is-hidden')) {
            updateInspectorView();
        }
    });

    elements.btnCloseInspector.addEventListener('click', () => {
        elements.dsInspector.classList.add('is-hidden');
    });

    // Keyboard interaction: Escape key closes any open drawer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            let closedAny = false;
            if (elements.historyPanel && !elements.historyPanel.classList.contains('is-hidden')) {
                elements.historyPanel.classList.add('is-hidden');
                closedAny = true;
            }
            if (elements.dsInspector && !elements.dsInspector.classList.contains('is-hidden')) {
                elements.dsInspector.classList.add('is-hidden');
                closedAny = true;
            }
            if (closedAny && elements.urlInput) {
                elements.urlInput.focus();
            }
        }
    });

    // Asynchronous WebAssembly Engine Initialization
    setControlsEnabled(false);
    elements.btnBack.disabled = true;
    elements.btnForward.disabled = true;
    setStatus('Loading C navigation engine (WebAssembly)...');

    if (controller && typeof controller.init === 'function') {
        controller.init().then(() => {
            setControlsEnabled(true);
            updateUI();
            setStatus('Ready · Pure C engine active');
        }).catch(err => {
            console.error('Fatal: Failed to initialize C WebAssembly engine:', err);
            setStatus('Error: C WebAssembly engine failed to load');
            setControlsEnabled(false);
        });
    } else {
        setStatus('Error: WebAssembly controller unavailable');
    }
}

// Export for Node.js test environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidHostname,
        normalizeAddress,
        controller,
        handleVisit
    };
}
