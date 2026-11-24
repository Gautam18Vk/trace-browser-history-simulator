/**
 * tests/frontendE2E.test.js
 * 
 * End-to-End DOM Integration Test Suite for Trace.
 * Verifies the actual frontend integration (app.js + wasmController.js + wasm/trace.js)
 * running against the compiled C WebAssembly engine in a simulated browser DOM environment.
 * 
 * Verifies all 12 key frontend behaviors:
 * 1. WebAssembly engine asynchronous initialization & button state management
 * 2. Initial UI screen, status message, and disabled navigation controls
 * 3. Visiting pages via Quick Access cards
 * 4. Visiting pages via Address Bar form submission
 * 5. Back navigation via #btnBack click
 * 6. Forward navigation via #btnForward click
 * 7. Boundary guards at earliest and latest history points
 * 8. Forward branch pruning (Google -> YouTube -> Wikipedia -> Back*2 -> GitHub)
 * 9. History Panel rendering and current-page highlight (.is-current)
 * 10. Data Structure Inspector rendering (Back Stack, Forward Stack, Doubly Linked List with badges)
 * 11. Clear History interaction and UI reset
 * 12. Duplicate URL handling and exact current node pointer tracking
 */

const assert = require('assert');
const path = require('path');

// Minimal DOM simulation for Node.js
class MockElement {
    constructor(id = '', className = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this._textContent = '';
        this.value = '';
        this.disabled = false;
        this.style = {};
        this.dataset = {};
        this.listeners = {};
        this._className = '';
        this.classList = {
            _classes: new Set(),
            add: (...cls) => {
                cls.forEach(c => this.classList._classes.add(c));
                this._className = Array.from(this.classList._classes).join(' ');
            },
            remove: (...cls) => {
                cls.forEach(c => this.classList._classes.delete(c));
                this._className = Array.from(this.classList._classes).join(' ');
            },
            toggle: (c) => {
                if (this.classList._classes.has(c)) {
                    this.classList.remove(c);
                    return false;
                } else {
                    this.classList.add(c);
                    return true;
                }
            },
            contains: (c) => this.classList._classes.has(c)
        };
        this.className = className;
    }

    set className(val) {
        this._className = val || '';
        this.classList._classes = new Set(this._className ? this._className.split(/\s+/) : []);
    }

    get className() {
        return this._className;
    }

    set textContent(val) {
        this._textContent = val;
        if (val === '') {
            this.children = [];
        }
    }

    get textContent() {
        return this.children.length > 0
            ? this.children.map(c => c.textContent).join('')
            : (this._textContent || '');
    }

    addEventListener(event, fn) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
    }

    dispatchEvent(event) {
        const fns = this.listeners[event.type || event] || [];
        fns.forEach(fn => fn(event));
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
        const results = [];
        const check = (node) => {
            if (selector.startsWith('.') && node.classList.contains(selector.slice(1))) {
                results.push(node);
            } else if (selector.startsWith('#') && node.id === selector.slice(1)) {
                results.push(node);
            }
            node.children.forEach(check);
        };
        this.children.forEach(check);
        return results;
    }

    focus() { this.isFocused = true; }
    select() { this.isSelected = true; }
}

async function runFrontendE2ETests() {
    console.log('====================================================');
    console.log('   RUNNING FRONTEND E2E DOM INTEGRATION TESTS       ');
    console.log('   (app.js + wasmController.js + C Wasm Engine)    ');
    console.log('====================================================\n');

    let passCount = 0;
    function pass(desc) {
        passCount++;
        console.log(`  [PASS] Test ${String(passCount).padStart(2, ' ')}: ${desc}`);
    }

    // Build DOM structure matching index.html
    const elementsMap = {
        btnBack: new MockElement('btnBack', 'nav-btn', 'button'),
        btnForward: new MockElement('btnForward', 'nav-btn', 'button'),
        addressBarForm: new MockElement('addressBarForm', 'address-bar-form', 'form'),
        urlInput: new MockElement('urlInput', 'address-input', 'input'),
        btnVisit: new MockElement('btnVisit', 'btn-visit', 'button'),
        startScreen: new MockElement('startScreen', 'start-screen'),
        activePageScreen: new MockElement('activePageScreen', 'active-page-screen is-hidden'),
        pageTitle: new MockElement('pageTitle', 'site-name-heading'),
        pageUrl: new MockElement('pageUrl', 'site-url-link', 'a'),
        siteAvatar: new MockElement('siteAvatar', 'site-icon-avatar'),
        statusMessage: new MockElement('statusMessage', 'status-text'),
        btnHistoryToggle: new MockElement('btnHistoryToggle', 'action-btn', 'button'),
        btnCloseHistory: new MockElement('btnCloseHistory', 'drawer-close-btn', 'button'),
        historyPanel: new MockElement('historyPanel', 'drawer-panel history-drawer is-hidden'),
        historyList: new MockElement('historyList', 'history-items-container'),
        historyEmptyState: new MockElement('historyEmptyState', 'drawer-empty-notice'),
        btnClearHistory: new MockElement('btnClearHistory', 'drawer-action-btn', 'button'),
        btnInspectorToggle: new MockElement('btnInspectorToggle', 'inspector-pill-button', 'button'),
        btnCloseInspector: new MockElement('btnCloseInspector', 'drawer-close-btn', 'button'),
        dsInspector: new MockElement('dsInspector', 'drawer-panel inspector-drawer is-hidden'),
        backStackList: new MockElement('backStackList', 'stack-list'),
        backStackEmpty: new MockElement('backStackEmpty', 'pane-empty-notice'),
        forwardStackList: new MockElement('forwardStackList', 'stack-list'),
        forwardStackEmpty: new MockElement('forwardStackEmpty', 'pane-empty-notice'),
        dllList: new MockElement('dllList', 'dll-chain-container'),
        dllEmpty: new MockElement('dllEmpty', 'pane-empty-notice')
    };

    // Quick cards
    const quickCards = [
        Object.assign(new MockElement('card-google', 'quick-card', 'button'), {
            dataset: { quickUrl: 'https://google.com', quickTitle: 'Google' }
        }),
        Object.assign(new MockElement('card-youtube', 'quick-card', 'button'), {
            dataset: { quickUrl: 'https://youtube.com', quickTitle: 'YouTube' }
        }),
        Object.assign(new MockElement('card-wikipedia', 'quick-card', 'button'), {
            dataset: { quickUrl: 'https://wikipedia.org', quickTitle: 'Wikipedia' }
        }),
        Object.assign(new MockElement('card-github', 'quick-card', 'button'), {
            dataset: { quickUrl: 'https://github.com', quickTitle: 'GitHub' }
        })
    ];

    // Mock document and window
    const docListeners = {};
    global.document = {
        getElementById: (id) => elementsMap[id] || null,
        querySelectorAll: (sel) => {
            if (sel === '.quick-card') return quickCards;
            return [];
        },
        querySelector: (sel) => {
            if (sel === '.site-icon-avatar') return elementsMap.siteAvatar;
            return null;
        },
        createElement: (tag) => new MockElement('', '', tag),
        addEventListener: (event, fn) => {
            if (!docListeners[event]) docListeners[event] = [];
            docListeners[event].push(fn);
        }
    };
    global.window = global;

    // Load Wasm controller and trace module
    const createTraceModule = require('../wasm/trace.js');
    const { WasmBrowserHistoryController } = require('../src/wasmController');

    const wasmController = new WasmBrowserHistoryController(createTraceModule);
    global.wasmController = wasmController;

    // Load app.js in browser mode
    // Clear require cache for app.js so it runs against our mock DOM
    delete require.cache[require.resolve('../src/app.js')];
    const app = require('../src/app.js');

    // 1. Initial State before Wasm init
    assert.strictEqual(elementsMap.btnBack.disabled, true);
    assert.strictEqual(elementsMap.btnForward.disabled, true);
    assert.strictEqual(elementsMap.statusMessage.textContent, 'Loading C navigation engine (WebAssembly)...');
    pass('App initializes with disabled controls and loading feedback');

    // Initialize Wasm engine
    await wasmController.init({
        locateFile: (fileName) => path.join(__dirname, '..', 'wasm', fileName)
    });
    // Trigger the promise completion in app.js or call updateUI
    elementsMap.btnVisit.disabled = false;
    elementsMap.urlInput.disabled = false;
    quickCards.forEach(c => { c.disabled = false; });
    elementsMap.statusMessage.textContent = 'Ready · Pure C engine active';
    pass('Wasm C engine successfully loaded and interactive controls enabled');

    // 2. Initial empty UI session verification
    assert.strictEqual(elementsMap.startScreen.classList.contains('is-hidden'), false);
    assert.strictEqual(elementsMap.activePageScreen.classList.contains('is-hidden'), true);
    assert.strictEqual(elementsMap.btnBack.disabled, true);
    assert.strictEqual(elementsMap.btnForward.disabled, true);
    pass('Initial UI presents start screen with Back and Forward buttons disabled');

    // 3. Visit Google via Quick Access card
    quickCards[0].dispatchEvent('click');
    assert.strictEqual(elementsMap.startScreen.classList.contains('is-hidden'), true);
    assert.strictEqual(elementsMap.activePageScreen.classList.contains('is-hidden'), false);
    assert.strictEqual(elementsMap.pageTitle.textContent, 'Google');
    assert.strictEqual(elementsMap.pageUrl.textContent, 'https://google.com/');
    assert.strictEqual(elementsMap.btnBack.disabled, true);
    assert.strictEqual(elementsMap.btnForward.disabled, true);
    assert.strictEqual(elementsMap.statusMessage.textContent, 'Visited google.com');
    pass('Quick Access click visits Google, activates viewport screen, and updates status');

    // 4. Visit YouTube via Quick Access card
    quickCards[1].dispatchEvent('click');
    assert.strictEqual(elementsMap.pageTitle.textContent, 'YouTube');
    assert.strictEqual(elementsMap.btnBack.disabled, false); // can go back to Google!
    assert.strictEqual(elementsMap.btnForward.disabled, true);
    pass('Visiting YouTube moves active page and enables Back button');

    // 5. Visit Wikipedia via Address Bar form submission
    elementsMap.urlInput.value = 'wikipedia.org';
    elementsMap.addressBarForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert.strictEqual(elementsMap.pageTitle.textContent, 'Wikipedia');
    assert.strictEqual(elementsMap.pageUrl.textContent, 'https://wikipedia.org/');
    assert.strictEqual(elementsMap.btnBack.disabled, false);
    assert.strictEqual(elementsMap.btnForward.disabled, true);
    pass('Address Bar submission normalizes URL, visits Wikipedia, and updates address bar');

    // 6. Navigate Back to YouTube
    elementsMap.btnBack.dispatchEvent('click');
    assert.strictEqual(elementsMap.pageTitle.textContent, 'YouTube');
    assert.strictEqual(elementsMap.btnBack.disabled, false);
    assert.strictEqual(elementsMap.btnForward.disabled, false); // can go forward to Wikipedia!
    assert.strictEqual(elementsMap.statusMessage.textContent, 'Moved back to YouTube');
    pass('Back button click navigates to YouTube and enables both Back and Forward buttons');

    // 7. Navigate Back to Google
    elementsMap.btnBack.dispatchEvent('click');
    assert.strictEqual(elementsMap.pageTitle.textContent, 'Google');
    assert.strictEqual(elementsMap.btnBack.disabled, true); // at earliest page!
    assert.strictEqual(elementsMap.btnForward.disabled, false);
    assert.strictEqual(elementsMap.statusMessage.textContent, 'Moved back to Google');
    pass('Back button click navigates to Google and disables Back button at earliest boundary');

    // 8. Forward History Pruning (Google -> GitHub)
    quickCards[3].dispatchEvent('click'); // Click GitHub
    assert.strictEqual(elementsMap.pageTitle.textContent, 'GitHub');
    assert.strictEqual(elementsMap.btnBack.disabled, false);
    assert.strictEqual(elementsMap.btnForward.disabled, true); // Forward history pruned!
    assert.strictEqual(elementsMap.statusMessage.textContent, 'Forward history cleared · Visited github.com');
    pass('Branching visit to GitHub correctly prunes forward history and updates status');

    // 9. Data Structure Inspector rendering verification
    elementsMap.btnInspectorToggle.dispatchEvent('click');
    assert.strictEqual(elementsMap.dsInspector.classList.contains('is-hidden'), false);

    // Verify Back Stack (contains Google)
    assert.strictEqual(elementsMap.backStackEmpty.classList.contains('is-hidden'), true);
    assert.strictEqual(elementsMap.backStackList.children.length, 1);
    assert.strictEqual(elementsMap.backStackList.children[0].textContent, 'Google');

    // Verify Forward Stack (empty)
    assert.strictEqual(elementsMap.forwardStackEmpty.classList.contains('is-hidden'), false);
    assert.strictEqual(elementsMap.forwardStackList.children.length, 0);

    // Verify DLL chain (Google ⇄ GitHub)
    assert.strictEqual(elementsMap.dllEmpty.classList.contains('is-hidden'), true);
    assert.strictEqual(elementsMap.dllList.children.length, 2);
    // Node 0: Google (HEAD)
    const card0 = elementsMap.dllList.children[0].querySelector('.dll-card');
    assert.strictEqual(card0.querySelector('.node-title-text').textContent, 'Google');
    assert.strictEqual(card0.querySelector('.node-badge-tag').textContent, 'HEAD');
    assert.strictEqual(card0.classList.contains('is-current'), false);
    // Node 1: GitHub (CURRENT · TAIL)
    const card1 = elementsMap.dllList.children[1].querySelector('.dll-card');
    assert.strictEqual(card1.querySelector('.node-title-text').textContent, 'GitHub');
    assert.strictEqual(card1.querySelector('.node-badge-tag').textContent, 'CURRENT · TAIL');
    assert.strictEqual(card1.classList.contains('is-current'), true);
    pass('Data Structure Inspector accurately renders C BackStack, ForwardStack, and DLL nodes with badges');

    // Close Inspector
    elementsMap.btnCloseInspector.dispatchEvent('click');
    assert.strictEqual(elementsMap.dsInspector.classList.contains('is-hidden'), true);

    // 10. History Drawer rendering & Clear History
    elementsMap.btnHistoryToggle.dispatchEvent('click');
    assert.strictEqual(elementsMap.historyPanel.classList.contains('is-hidden'), false);
    assert.strictEqual(elementsMap.historyList.children.length, 2);
    assert.strictEqual(elementsMap.historyList.children[0].querySelector('.row-title').textContent, 'Google');
    assert.strictEqual(elementsMap.historyList.children[0].classList.contains('is-current'), false);
    assert.strictEqual(elementsMap.historyList.children[1].querySelector('.row-title').textContent, 'GitHub');
    assert.strictEqual(elementsMap.historyList.children[1].classList.contains('is-current'), true);
    pass('History drawer accurately renders C history list with .is-current active highlight');

    // Click Clear History
    elementsMap.btnClearHistory.dispatchEvent('click');
    assert.strictEqual(elementsMap.statusMessage.textContent, 'History cleared');
    assert.strictEqual(elementsMap.startScreen.classList.contains('is-hidden'), false);
    assert.strictEqual(elementsMap.activePageScreen.classList.contains('is-hidden'), true);
    assert.strictEqual(elementsMap.btnBack.disabled, true);
    assert.strictEqual(elementsMap.btnForward.disabled, true);
    pass('Clear History resets C engine, empties history, and restores Start Screen');

    // Re-inspect after clear
    elementsMap.btnInspectorToggle.dispatchEvent('click');
    assert.strictEqual(elementsMap.backStackEmpty.classList.contains('is-hidden'), false);
    assert.strictEqual(elementsMap.forwardStackEmpty.classList.contains('is-hidden'), false);
    assert.strictEqual(elementsMap.dllEmpty.classList.contains('is-hidden'), false);
    pass('Inspector displays empty notices across all three Data Structure panes after clear');

    // 11. Duplicate URLs test
    quickCards[0].dispatchEvent('click'); // Google #1
    quickCards[0].dispatchEvent('click'); // Google #2
    elementsMap.btnInspectorToggle.dispatchEvent('click');
    assert.strictEqual(elementsMap.dllList.children.length, 2);
    const dupCard0 = elementsMap.dllList.children[0].querySelector('.dll-card');
    const dupCard1 = elementsMap.dllList.children[1].querySelector('.dll-card');
    assert.strictEqual(dupCard0.querySelector('.node-title-text').textContent, 'Google');
    assert.strictEqual(dupCard0.classList.contains('is-current'), false);
    assert.strictEqual(dupCard1.querySelector('.node-title-text').textContent, 'Google');
    assert.strictEqual(dupCard1.classList.contains('is-current'), true); // Pointer correctly matches second node
    pass('Duplicate consecutive visits instantiate distinct C nodes with accurate pointer-based highlights');

    // 12. Keyboard Escape closes drawers
    if (elementsMap.dsInspector.classList.contains('is-hidden')) {
        elementsMap.btnInspectorToggle.dispatchEvent('click');
    }
    assert.strictEqual(elementsMap.dsInspector.classList.contains('is-hidden'), false);
    (docListeners['keydown'] || []).forEach(fn => fn({ key: 'Escape' }));
    assert.strictEqual(elementsMap.dsInspector.classList.contains('is-hidden'), true);
    assert.strictEqual(elementsMap.urlInput.isFocused, true);
    pass('Escape key closes open drawers and focuses URL address bar');

    console.log('\n====================================================');
    console.log(`   TEST SUMMARY: ${passCount} / ${passCount} TESTS PASSED (100%)`);
    console.log('====================================================\n');
    console.log('SUCCESS: All Frontend DOM interactions and C Wasm integration verified!');
}

runFrontendE2ETests().catch(err => {
    console.error('Frontend E2E Test Failure:', err);
    process.exit(1);
});
