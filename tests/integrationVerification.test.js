/**
 * Phase 7: Comprehensive Integration & Invariant Verification Test Suite
 * 
 * Verifies all 11 functional scenarios and Data Structure invariants for Trace.
 * Uses strict assertions without external dependencies.
 */

const assert = require('assert');
const BrowserHistoryController = require('../src/BrowserHistoryController');
const { normalizeAddress, isValidHostname } = require('../src/app');

// Helper to assert all architectural invariants for any controller state
function assertInvariants(controller, stepDescription = '') {
    const backStack = controller.backStack;
    const forwardStack = controller.forwardStack;
    const dll = controller.dll;
    const current = dll.current;

    if (dll.isEmpty()) {
        // Invariant for empty state:
        assert.strictEqual(backStack.size(), 0, `${stepDescription}: BackStack must be empty when DLL is empty`);
        assert.strictEqual(forwardStack.size(), 0, `${stepDescription}: ForwardStack must be empty when DLL is empty`);
        assert.strictEqual(current, null, `${stepDescription}: current must be null when DLL is empty`);
        assert.strictEqual(dll.head, null, `${stepDescription}: dll.head must be null when DLL is empty`);
        assert.strictEqual(dll.tail, null, `${stepDescription}: dll.tail must be null when DLL is empty`);
    } else {
        // Invariant for active populated state:
        // 1. backStack.size() + forwardStack.size() + 1 === dll.size()
        assert.strictEqual(
            backStack.size() + forwardStack.size() + 1,
            dll.size(),
            `${stepDescription}: Invariant violated: backStack.size(${backStack.size()}) + forwardStack.size(${forwardStack.size()}) + 1 !== dll.size(${dll.size()})`
        );

        // 2. Head boundary: head.prev must be null
        assert.strictEqual(dll.head.prev, null, `${stepDescription}: dll.head.prev must be null`);

        // 3. Tail boundary: tail.next must be null
        assert.strictEqual(dll.tail.next, null, `${stepDescription}: dll.tail.next must be null`);

        // 4. Current pointer must not be null
        assert.notStrictEqual(current, null, `${stepDescription}: current cannot be null in populated state`);

        // 5. BackStack top corresponds to current.prev
        if (!backStack.isEmpty()) {
            assert.strictEqual(backStack.peek(), current.prev, `${stepDescription}: BackStack top must strictly equal current.prev`);
        } else {
            assert.strictEqual(current.prev, null, `${stepDescription}: When BackStack is empty, current must be at head (current.prev === null)`);
            assert.strictEqual(current, dll.head, `${stepDescription}: Current must be head`);
        }

        // 6. ForwardStack top corresponds to current.next
        if (!forwardStack.isEmpty()) {
            assert.strictEqual(forwardStack.peek(), current.next, `${stepDescription}: ForwardStack top must strictly equal current.next`);
        } else {
            assert.strictEqual(current.next, null, `${stepDescription}: When ForwardStack is empty, current must be at tail (current.next === null)`);
            assert.strictEqual(current, dll.tail, `${stepDescription}: Current must be tail`);
        }
    }
}

console.log('==================================================');
console.log('   RUNNING PHASE 7 FUNCTIONAL VERIFICATION TESTS  ');
console.log('==================================================\n');

let passedTests = 0;
const totalTests = 11;

// --------------------------------------------------------------------------
// TEST 1 — Initial State
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();
    assert.strictEqual(controller.getCurrentPage(), null);
    assert.strictEqual(controller.canGoBack(), false);
    assert.strictEqual(controller.canGoForward(), false);
    assert.strictEqual(controller.getHistory().length, 0);
    assert.strictEqual(controller.getBackStack().length, 0);
    assert.strictEqual(controller.getForwardStack().length, 0);
    assertInvariants(controller, 'Test 1 Initial State');
    passedTests++;
    console.log('[PASS] Scenario 1: Initial state & empty session invariants');
} catch (e) {
    console.error('[FAIL] Scenario 1: Initial state failed', e);
}

// --------------------------------------------------------------------------
// TEST 2 — Visiting Pages (Google, YouTube, Wikipedia, GitHub)
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();
    const g = controller.visit('https://google.com/', 'Google');
    assertInvariants(controller, 'After Google');
    const y = controller.visit('https://youtube.com/', 'YouTube');
    assertInvariants(controller, 'After YouTube');
    const w = controller.visit('https://wikipedia.org/', 'Wikipedia');
    assertInvariants(controller, 'After Wikipedia');
    const gh = controller.visit('https://github.com/', 'GitHub');
    assertInvariants(controller, 'After GitHub');

    assert.strictEqual(controller.getCurrentPage().title, 'GitHub');
    assert.strictEqual(controller.canGoBack(), true);
    assert.strictEqual(controller.canGoForward(), false);

    const history = controller.getHistory();
    assert.strictEqual(history.length, 4);
    assert.deepStrictEqual(history.map(n => n.title), ['Google', 'YouTube', 'Wikipedia', 'GitHub']);

    // BackStack should contain [Google, YouTube, Wikipedia] (bottom to top)
    const backItems = controller.getBackStack();
    assert.strictEqual(backItems.length, 3);
    assert.deepStrictEqual(backItems.map(n => n.title), ['Google', 'YouTube', 'Wikipedia']);
    assert.strictEqual(controller.getForwardStack().length, 0);

    passedTests++;
    console.log('[PASS] Scenario 2: Visiting multiple pages with correct titles and DLL chronology');
} catch (e) {
    console.error('[FAIL] Scenario 2: Visiting pages failed', e);
}

// --------------------------------------------------------------------------
// TEST 3 — Back Navigation
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();
    controller.visit('https://google.com/', 'Google');
    controller.visit('https://youtube.com/', 'YouTube');
    controller.visit('https://wikipedia.org/', 'Wikipedia');

    // Move back to YouTube
    const page1 = controller.back();
    assert.strictEqual(page1.title, 'YouTube');
    assert.strictEqual(controller.canGoBack(), true);
    assert.strictEqual(controller.canGoForward(), true);
    assertInvariants(controller, 'Back to YouTube');

    // Move back to Google
    const page2 = controller.back();
    assert.strictEqual(page2.title, 'Google');
    assert.strictEqual(controller.canGoBack(), false); // Earliest page!
    assert.strictEqual(controller.canGoForward(), true);
    assertInvariants(controller, 'Back to Google');

    // Attempt back at boundary
    const page3 = controller.back();
    assert.strictEqual(page3, null);
    assert.strictEqual(controller.getCurrentPage().title, 'Google');
    assertInvariants(controller, 'Boundary back at Google');

    passedTests++;
    console.log('[PASS] Scenario 3: Back navigation and boundary check at earliest page');
} catch (e) {
    console.error('[FAIL] Scenario 3: Back navigation failed', e);
}

// --------------------------------------------------------------------------
// TEST 4 — Forward Navigation
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();
    controller.visit('https://google.com/', 'Google');
    controller.visit('https://youtube.com/', 'YouTube');
    controller.visit('https://wikipedia.org/', 'Wikipedia');
    controller.back(); // at YouTube
    controller.back(); // at Google

    // Move forward to YouTube
    const f1 = controller.forward();
    assert.strictEqual(f1.title, 'YouTube');
    assertInvariants(controller, 'Forward to YouTube');

    // Move forward to Wikipedia
    const f2 = controller.forward();
    assert.strictEqual(f2.title, 'Wikipedia');
    assert.strictEqual(controller.canGoForward(), false); // Latest page!
    assertInvariants(controller, 'Forward to Wikipedia');

    // Attempt forward at boundary
    const f3 = controller.forward();
    assert.strictEqual(f3, null);
    assert.strictEqual(controller.getCurrentPage().title, 'Wikipedia');
    assertInvariants(controller, 'Boundary forward at Wikipedia');

    passedTests++;
    console.log('[PASS] Scenario 4: Forward navigation and boundary check at latest page');
} catch (e) {
    console.error('[FAIL] Scenario 4: Forward navigation failed', e);
}

// --------------------------------------------------------------------------
// TEST 5 — Forward History Pruning (Google -> YouTube -> Wikipedia -> Back -> Back -> GitHub)
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();
    controller.visit('https://google.com/', 'Google');
    controller.visit('https://youtube.com/', 'YouTube');
    controller.visit('https://wikipedia.org/', 'Wikipedia');
    controller.back(); // at YouTube
    controller.back(); // at Google

    // Now branch to GitHub
    const gh = controller.visit('https://github.com/', 'GitHub');
    assert.strictEqual(controller.getCurrentPage().title, 'GitHub');
    assert.strictEqual(controller.canGoForward(), false);
    assert.strictEqual(controller.getForwardStack().length, 0);

    // DLL must only contain Google <-> GitHub
    const activeHistory = controller.getHistory();
    assert.strictEqual(activeHistory.length, 2);
    assert.strictEqual(activeHistory[0].title, 'Google');
    assert.strictEqual(activeHistory[1].title, 'GitHub');
    assert.strictEqual(activeHistory[0].next, activeHistory[1]);
    assert.strictEqual(activeHistory[1].prev, activeHistory[0]);

    // BackStack must contain only Google
    const backItems = controller.getBackStack();
    assert.strictEqual(backItems.length, 1);
    assert.strictEqual(backItems[0].title, 'Google');

    assertInvariants(controller, 'After Pruning to GitHub');
    passedTests++;
    console.log('[PASS] Scenario 5: Forward history pruning (Google -> YouTube -> Wikipedia -> Back*2 -> GitHub)');
} catch (e) {
    console.error('[FAIL] Scenario 5: Pruning failed', e);
}

// --------------------------------------------------------------------------
// TEST 6 — Duplicate URLs
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();
    const g1 = controller.visit('https://google.com/', 'Google 1');
    const g2 = controller.visit('https://google.com/', 'Google 2');
    const g3 = controller.visit('https://google.com/', 'Google 3');

    // Distinct Node objects
    assert.notStrictEqual(g1, g2);
    assert.notStrictEqual(g2, g3);
    assert.strictEqual(controller.dll.size(), 3);

    // Current page is g3
    assert.strictEqual(controller.getCurrentPage(), g3);

    controller.back(); // moves to g2
    assert.strictEqual(controller.getCurrentPage(), g2);
    assert.notStrictEqual(controller.getCurrentPage(), g1);
    assert.notStrictEqual(controller.getCurrentPage(), g3);

    assertInvariants(controller, 'Duplicate URLs');
    passedTests++;
    console.log('[PASS] Scenario 6: Duplicate URLs maintain distinct Node identity & accurate highlights');
} catch (e) {
    console.error('[FAIL] Scenario 6: Duplicate URLs failed', e);
}

// --------------------------------------------------------------------------
// TEST 7 — Invalid Input Handling
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();
    controller.visit('https://google.com/', 'Google');
    const baselineCurrent = controller.getCurrentPage();
    const baselineSize = controller.dll.size();

    // Test rejection of invalid inputs
    const invalidInputs = [
        '',
        '   ',
        null,
        undefined,
        12345,
        'ftp://files.example.org',
        'file:///path/to/file',
        'javascript:alert(1)',
        '<script>alert(1)</script>',
        'foo..bar',
        'test.',
        '.test',
        'not a valid url',
        'arbitrary text without domain'
    ];

    for (const bad of invalidInputs) {
        const norm = normalizeAddress(bad);
        assert.strictEqual(norm, null, `normalizeAddress should reject: ${bad}`);
        // Ensure controller visit rejects non-strings or empty strings
        if (typeof bad !== 'string' || bad.trim().length === 0) {
            const res = controller.visit(bad);
            assert.strictEqual(res, null);
        }
    }

    // Browsing state must remain 100% unaltered
    assert.strictEqual(controller.getCurrentPage(), baselineCurrent);
    assert.strictEqual(controller.dll.size(), baselineSize);
    assertInvariants(controller, 'After Invalid Input attempts');

    passedTests++;
    console.log('[PASS] Scenario 7: Malformed, unsupported & malicious inputs safely rejected without corrupting state');
} catch (e) {
    console.error('[FAIL] Scenario 7: Invalid input failed', e);
}

// --------------------------------------------------------------------------
// TEST 8 — Clear History (empty, populated, after back, while inspector open)
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();

    // Clear empty history
    controller.clearHistory();
    assertInvariants(controller, 'Clear empty');

    // Populate and clear
    controller.visit('https://google.com/', 'Google');
    controller.visit('https://youtube.com/', 'YouTube');
    controller.clearHistory();
    assert.strictEqual(controller.getCurrentPage(), null);
    assert.strictEqual(controller.dll.size(), 0);
    assertInvariants(controller, 'Clear populated');

    // Populate, move back, then clear
    controller.visit('https://google.com/', 'Google');
    controller.visit('https://youtube.com/', 'YouTube');
    controller.visit('https://wikipedia.org/', 'Wikipedia');
    controller.back(); // at YouTube
    assert.strictEqual(controller.canGoBack(), true);
    assert.strictEqual(controller.canGoForward(), true);
    controller.clearHistory();
    assert.strictEqual(controller.getCurrentPage(), null);
    assert.strictEqual(controller.canGoBack(), false);
    assert.strictEqual(controller.canGoForward(), false);
    assertInvariants(controller, 'Clear after back');

    // Reuse after clear
    controller.visit('https://github.com/', 'GitHub');
    assert.strictEqual(controller.getCurrentPage().title, 'GitHub');
    assert.strictEqual(controller.dll.size(), 1);
    assertInvariants(controller, 'Reuse after clear');

    passedTests++;
    console.log('[PASS] Scenario 8: Clear history across empty, populated, and branched states');
} catch (e) {
    console.error('[FAIL] Scenario 8: Clear history failed', e);
}

// --------------------------------------------------------------------------
// TEST 9 — Address Parsing & Normalization Helper Invariants
// --------------------------------------------------------------------------
try {
    assert.strictEqual(isValidHostname('localhost'), true);
    assert.strictEqual(isValidHostname('google.com'), true);
    assert.strictEqual(isValidHostname('en.wikipedia.org'), true);
    assert.strictEqual(isValidHostname('sub.domain-name.co.uk'), true);
    assert.strictEqual(isValidHostname('foo..bar'), false);
    assert.strictEqual(isValidHostname('bad_domain.com'), false);
    assert.strictEqual(isValidHostname('test.'), false);
    assert.strictEqual(isValidHostname('.test'), false);

    const norm1 = normalizeAddress('google.com');
    assert.strictEqual(norm1.url, 'https://google.com/');
    assert.strictEqual(norm1.title, 'Google');

    const norm2 = normalizeAddress('https://en.wikipedia.org/wiki/Stack');
    assert.strictEqual(norm2.url, 'https://en.wikipedia.org/wiki/Stack');

    const norm3 = normalizeAddress('http://localhost:3000');
    assert.strictEqual(norm3.url, 'http://localhost:3000/');
    assert.strictEqual(norm3.title, 'localhost');

    passedTests++;
    console.log('[PASS] Scenario 9: Address normalization & hostname validation invariants');
} catch (e) {
    console.error('[FAIL] Scenario 9: Normalization failed', e);
}

// --------------------------------------------------------------------------
// TEST 10 — Panel Non-Interference & Accurate Snapshot Retrieval
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();
    controller.visit('https://google.com/', 'Google');
    controller.visit('https://youtube.com/', 'YouTube');

    // Retrieve snapshot
    const snap1 = controller.getHistorySnapshot();
    assert.strictEqual(snap1.length, 2);
    assert.strictEqual(snap1[0].isCurrent, false);
    assert.strictEqual(snap1[1].isCurrent, true);

    // Verify getting history or stacks does NOT mutate internal data structures
    const hist = controller.getHistory();
    const back = controller.getBackStack();
    const fwd = controller.getForwardStack();
    assert.strictEqual(controller.getCurrentPage().title, 'YouTube');
    assertInvariants(controller, 'After Snapshot Retrieval');

    passedTests++;
    console.log('[PASS] Scenario 10: Inspection data access does not mutate browsing state');
} catch (e) {
    console.error('[FAIL] Scenario 10: Snapshot inspection failed', e);
}

// --------------------------------------------------------------------------
// TEST 11 — Rapid & Repeated Operations Stress Test
// --------------------------------------------------------------------------
try {
    const controller = new BrowserHistoryController();
    const urls = [
        'https://google.com/',
        'https://youtube.com/',
        'https://wikipedia.org/',
        'https://github.com/',
        'https://developer.mozilla.org/'
    ];

    // Rapid visit 50 times
    for (let i = 0; i < 50; i++) {
        controller.visit(urls[i % urls.length], `Page ${i}`);
        assertInvariants(controller, `Rapid visit ${i}`);
    }
    assert.strictEqual(controller.dll.size(), 50);
    assert.strictEqual(controller.backStack.size(), 49);

    // Rapid backward 25 times
    for (let i = 0; i < 25; i++) {
        controller.back();
        assertInvariants(controller, `Rapid back ${i}`);
    }
    assert.strictEqual(controller.backStack.size(), 24);
    assert.strictEqual(controller.forwardStack.size(), 25);

    // Rapid forward 10 times
    for (let i = 0; i < 10; i++) {
        controller.forward();
        assertInvariants(controller, `Rapid forward ${i}`);
    }
    assert.strictEqual(controller.backStack.size(), 34);
    assert.strictEqual(controller.forwardStack.size(), 15);

    // Rapid branch prune
    controller.visit('https://anthropic.com/', 'Branch New');
    assert.strictEqual(controller.forwardStack.size(), 0);
    assert.strictEqual(controller.dll.size(), 36);
    assertInvariants(controller, 'After Rapid Prune');

    passedTests++;
    console.log('[PASS] Scenario 11: Stress testing rapid operations and architectural invariants');
} catch (e) {
    console.error('[FAIL] Scenario 11: Rapid stress test failed', e);
}

console.log('\n==================================================');
console.log(` RESULTS: ${passedTests} / ${totalTests} SCENARIOS PASSED`);
console.log('==================================================');

if (passedTests === totalTests) {
    console.log('SUCCESS: All Phase 7 functional scenarios and invariants verified.\n');
    process.exit(0);
} else {
    console.error(`FAILURE: ${totalTests - passedTests} scenarios failed.\n`);
    process.exit(1);
}

