/**
 * Unit Tests for BrowserHistoryController
 * 
 * Part of Phase 4 for the Browser History Simulator project.
 * Verifies all 25 test scenarios and architectural invariants.
 */

const assert = require('assert');
const BrowserHistoryController = require('../src/BrowserHistoryController');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, testFn) {
    totalTests++;
    try {
        testFn();
        console.log(`[PASS] Test ${totalTests}: ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`[FAIL] Test ${totalTests}: ${testName}`);
        console.error(`       Error: ${err.message}`);
        process.exitCode = 1;
    }
}

/**
 * Helper to rigorously verify system invariants after operations.
 */
function verifyInvariants(ctrl) {
    const { backStack, forwardStack, dll } = ctrl;

    if (dll.current === null) {
        assert.strictEqual(backStack.size(), 0, "Invariant: backStack must be empty when history is empty");
        assert.strictEqual(forwardStack.size(), 0, "Invariant: forwardStack must be empty when history is empty");
        assert.strictEqual(dll.head, null, "Invariant: dll.head must be null");
        assert.strictEqual(dll.tail, null, "Invariant: dll.tail must be null");
    } else {
        // Invariant 1: backStack.size() + forwardStack.size() + 1 === dll.size()
        assert.strictEqual(
            backStack.size() + forwardStack.size() + 1,
            dll.size(),
            "Invariant: backStack.size() + forwardStack.size() + 1 === dll.size()"
        );

        // Invariant 2 & 4: BackStack top vs current.prev
        if (!backStack.isEmpty()) {
            assert.strictEqual(backStack.peek(), dll.current.prev, "Invariant: backStack.peek() === current.prev");
        } else {
            assert.strictEqual(dll.current.prev, null, "Invariant: current.prev must be null when backStack is empty");
        }

        // Invariant 3 & 5: ForwardStack top vs current.next
        if (!forwardStack.isEmpty()) {
            assert.strictEqual(forwardStack.peek(), dll.current.next, "Invariant: forwardStack.peek() === current.next");
        } else {
            assert.strictEqual(dll.current.next, null, "Invariant: current.next must be null when forwardStack is empty");
        }

        // Invariant 6 & 7: Boundaries
        assert.strictEqual(dll.head.prev, null, "Invariant: dll.head.prev must be null");
        assert.strictEqual(dll.tail.next, null, "Invariant: dll.tail.next must be null");

        // Invariant 8: Bidirectional consistency
        let curr = dll.head;
        while (curr !== null) {
            if (curr.next) {
                assert.strictEqual(curr.next.prev, curr, "Invariant: curr.next.prev === curr");
            }
            if (curr.prev) {
                assert.strictEqual(curr.prev.next, curr, "Invariant: curr.prev.next === curr");
            }
            curr = curr.next;
        }

        // Invariant 9: Stack nodes belong to active DLL
        const activeNodes = new Set(dll.toArray());
        backStack.toArray().forEach(node => {
            assert.ok(activeNodes.has(node), "Invariant: backStack node must belong to active DLL");
        });
        forwardStack.toArray().forEach(node => {
            assert.ok(activeNodes.has(node), "Invariant: forwardStack node must belong to active DLL");
        });
    }
}

console.log("==================================================");
console.log(" RUNNING PHASE 4 BROWSER HISTORY CONTROLLER TESTS ");
console.log("==================================================\n");

// -------------------------------------------------------------
// Test 1: Initial empty browser state
// -------------------------------------------------------------
runTest("Initial empty browser state", () => {
    const ctrl = new BrowserHistoryController();
    assert.strictEqual(ctrl.getCurrentPage(), null);
    assert.strictEqual(ctrl.canGoBack(), false);
    assert.strictEqual(ctrl.canGoForward(), false);
    assert.deepStrictEqual(ctrl.getHistory(), []);
    assert.deepStrictEqual(ctrl.getBackStack(), []);
    assert.deepStrictEqual(ctrl.getForwardStack(), []);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 2: Back navigation on empty history
// -------------------------------------------------------------
runTest("Back navigation on empty history safely returns null", () => {
    const ctrl = new BrowserHistoryController();
    const result = ctrl.back();
    assert.strictEqual(result, null);
    assert.strictEqual(ctrl.getCurrentPage(), null);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 3: Forward navigation on empty history
// -------------------------------------------------------------
runTest("Forward navigation on empty history safely returns null", () => {
    const ctrl = new BrowserHistoryController();
    const result = ctrl.forward();
    assert.strictEqual(result, null);
    assert.strictEqual(ctrl.getCurrentPage(), null);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 4: First page visit
// -------------------------------------------------------------
runTest("First page visit sets active page and leaves stacks empty", () => {
    const ctrl = new BrowserHistoryController();
    const node = ctrl.visit("https://google.com", "Google");

    assert.notStrictEqual(node, null);
    assert.strictEqual(ctrl.getCurrentPage(), node);
    assert.strictEqual(ctrl.getCurrentPage().url, "https://google.com");
    assert.strictEqual(ctrl.canGoBack(), false);
    assert.strictEqual(ctrl.canGoForward(), false);
    assert.strictEqual(ctrl.getHistory().length, 1);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 5: Multiple consecutive page visits
// -------------------------------------------------------------
runTest("Multiple consecutive visits grow BackStack and DLL linearly", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");
    ctrl.visit("https://wikipedia.org", "Wikipedia");

    assert.strictEqual(ctrl.getCurrentPage().title, "Wikipedia");
    assert.strictEqual(ctrl.canGoBack(), true);
    assert.strictEqual(ctrl.canGoForward(), false);
    assert.strictEqual(ctrl.getBackStack().length, 2);
    assert.strictEqual(ctrl.getForwardStack().length, 0);
    assert.strictEqual(ctrl.getHistory().length, 3);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 6: Single Back operation
// -------------------------------------------------------------
runTest("Single Back operation moves to immediate previous page", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");

    const activeNode = ctrl.back();
    assert.strictEqual(activeNode.title, "Google");
    assert.strictEqual(ctrl.getCurrentPage().title, "Google");
    assert.strictEqual(ctrl.canGoBack(), false);
    assert.strictEqual(ctrl.canGoForward(), true);
    assert.strictEqual(ctrl.getForwardStack()[0].title, "YouTube");
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 7: Multiple Back operations
// -------------------------------------------------------------
runTest("Multiple Back operations navigate backwards chronologically", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");
    ctrl.visit("https://wikipedia.org", "Wikipedia");

    ctrl.back(); // to YouTube
    ctrl.back(); // to Google

    assert.strictEqual(ctrl.getCurrentPage().title, "Google");
    assert.strictEqual(ctrl.canGoBack(), false);
    assert.strictEqual(ctrl.canGoForward(), true);
    assert.strictEqual(ctrl.getForwardStack().length, 2);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 8: Back operation at the earliest page
// -------------------------------------------------------------
runTest("Back operation at earliest page safely returns null", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");

    const result = ctrl.back();
    assert.strictEqual(result, null);
    assert.strictEqual(ctrl.getCurrentPage().title, "Google");
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 9: Single Forward operation
// -------------------------------------------------------------
runTest("Single Forward operation restores the navigated-from page", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");

    ctrl.back();
    const activeNode = ctrl.forward();

    assert.strictEqual(activeNode.title, "YouTube");
    assert.strictEqual(ctrl.getCurrentPage().title, "YouTube");
    assert.strictEqual(ctrl.canGoBack(), true);
    assert.strictEqual(ctrl.canGoForward(), false);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 10: Multiple Forward operations
// -------------------------------------------------------------
runTest("Multiple Forward operations advance through forward history", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");
    ctrl.visit("https://wikipedia.org", "Wikipedia");

    ctrl.back();
    ctrl.back();
    assert.strictEqual(ctrl.getCurrentPage().title, "Google");

    ctrl.forward(); // to YouTube
    assert.strictEqual(ctrl.getCurrentPage().title, "YouTube");

    ctrl.forward(); // to Wikipedia
    assert.strictEqual(ctrl.getCurrentPage().title, "Wikipedia");
    assert.strictEqual(ctrl.canGoForward(), false);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 11: Forward operation at the latest page
// -------------------------------------------------------------
runTest("Forward operation at latest page safely returns null", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");

    const result = ctrl.forward();
    assert.strictEqual(result, null);
    assert.strictEqual(ctrl.getCurrentPage().title, "Google");
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 12: Visiting a new page after one Back operation
// -------------------------------------------------------------
runTest("Visiting new page after Back prunes forward history", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");

    ctrl.back(); // at Google
    ctrl.visit("https://github.com", "GitHub"); // branches to GitHub

    assert.strictEqual(ctrl.getCurrentPage().title, "GitHub");
    assert.strictEqual(ctrl.canGoForward(), false);
    assert.strictEqual(ctrl.getForwardStack().length, 0);

    const historyTitles = ctrl.getHistory().map(n => n.title);
    assert.deepStrictEqual(historyTitles, ["Google", "GitHub"]);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 13: Visiting a new page after multiple Back operations
// -------------------------------------------------------------
runTest("Visiting new page after multiple Backs prunes all forward nodes", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");
    ctrl.visit("https://wikipedia.org", "Wikipedia");
    ctrl.visit("https://reddit.com", "Reddit");

    ctrl.back(); // Wikipedia
    ctrl.back(); // YouTube
    ctrl.back(); // Google

    ctrl.visit("https://instagram.com", "Instagram");

    const historyTitles = ctrl.getHistory().map(n => n.title);
    assert.deepStrictEqual(historyTitles, ["Google", "Instagram"]);
    assert.strictEqual(ctrl.canGoForward(), false);
    assert.strictEqual(ctrl.getBackStack().length, 1);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 14: Back followed by Forward followed by a new visit
// -------------------------------------------------------------
runTest("Back, then Forward, then new visit preserves correct path", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");
    ctrl.visit("https://wikipedia.org", "Wikipedia");

    ctrl.back(); // YouTube
    ctrl.back(); // Google
    ctrl.forward(); // YouTube

    ctrl.visit("https://instagram.com", "Instagram"); // Prunes Wikipedia

    const historyTitles = ctrl.getHistory().map(n => n.title);
    assert.deepStrictEqual(historyTitles, ["Google", "YouTube", "Instagram"]);
    assert.strictEqual(ctrl.getCurrentPage().title, "Instagram");
    assert.strictEqual(ctrl.canGoForward(), false);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 15: Repeated visits to the same URL
// -------------------------------------------------------------
runTest("Repeated visits to same URL create distinct Node objects", () => {
    const ctrl = new BrowserHistoryController();
    const v1 = ctrl.visit("https://google.com", "Google");
    const v2 = ctrl.visit("https://google.com", "Google");

    assert.notStrictEqual(v1, v2, "Identical URLs must create separate Node instances");
    assert.strictEqual(ctrl.getHistory().length, 2);
    assert.strictEqual(ctrl.getBackStack().length, 1);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 16: Clearing populated history
// -------------------------------------------------------------
runTest("Clearing populated history resets all data structures", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");

    ctrl.clearHistory();

    assert.strictEqual(ctrl.getCurrentPage(), null);
    assert.strictEqual(ctrl.canGoBack(), false);
    assert.strictEqual(ctrl.canGoForward(), false);
    assert.strictEqual(ctrl.getHistory().length, 0);
    assert.strictEqual(ctrl.getBackStack().length, 0);
    assert.strictEqual(ctrl.getForwardStack().length, 0);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 17: Clearing empty history
// -------------------------------------------------------------
runTest("Clearing empty history executes safely without errors", () => {
    const ctrl = new BrowserHistoryController();
    assert.doesNotThrow(() => {
        ctrl.clearHistory();
    });
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 18: Visiting a new page after clearing history
// -------------------------------------------------------------
runTest("Visiting new page after clearing reinitializes cleanly", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.clearHistory();

    const node = ctrl.visit("https://github.com", "GitHub");
    assert.strictEqual(ctrl.getCurrentPage(), node);
    assert.strictEqual(ctrl.getHistory().length, 1);
    assert.strictEqual(ctrl.canGoBack(), false);
    assert.strictEqual(ctrl.canGoForward(), false);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 19: Invalid or empty URL input without state corruption
// -------------------------------------------------------------
runTest("Invalid URL inputs safely reject without corrupting state", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");

    // Attempt invalid visits
    assert.strictEqual(ctrl.visit(""), null);
    assert.strictEqual(ctrl.visit("   "), null);
    assert.strictEqual(ctrl.visit(null), null);
    assert.strictEqual(ctrl.visit(12345), null);

    // State must remain completely untouched
    assert.strictEqual(ctrl.getCurrentPage().title, "Google");
    assert.strictEqual(ctrl.getHistory().length, 1);
    assert.strictEqual(ctrl.canGoBack(), false);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 20: Two independent BrowserHistoryController instances
// -------------------------------------------------------------
runTest("Two controller instances operate completely independently", () => {
    const c1 = new BrowserHistoryController();
    const c2 = new BrowserHistoryController();

    c1.visit("https://tab1.com", "Tab 1");
    c2.visit("https://tab2.com", "Tab 2");

    assert.strictEqual(c1.getCurrentPage().title, "Tab 1");
    assert.strictEqual(c2.getCurrentPage().title, "Tab 2");
    assert.strictEqual(c1.getHistory().length, 1);
    assert.strictEqual(c2.getHistory().length, 1);

    c1.clearHistory();
    assert.strictEqual(c1.getCurrentPage(), null);
    assert.strictEqual(c2.getCurrentPage().title, "Tab 2");
    verifyInvariants(c1);
    verifyInvariants(c2);
});

// -------------------------------------------------------------
// Test 21: Exact Node reference equality across Stack and DLL
// -------------------------------------------------------------
runTest("Exact Node reference equality holds across Stacks and DLL", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");

    // The node in BackStack must be the exact same object reference as DLL head
    const backNode = ctrl.getBackStack()[0];
    const dllHead = ctrl.getHistory()[0];
    assert.strictEqual(backNode, dllHead, "BackStack must hold exact DLL Node object reference (===)");

    ctrl.back();
    // The node in ForwardStack must be the exact same object reference as DLL tail
    const forwardNode = ctrl.getForwardStack()[0];
    const dllTail = ctrl.getHistory()[1];
    assert.strictEqual(forwardNode, dllTail, "ForwardStack must hold exact DLL Node object reference (===)");
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Test 22: Correct chronological history retrieval
// -------------------------------------------------------------
runTest("getHistory() and getHistorySnapshot() return correct order and active marker", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://google.com", "Google");
    ctrl.visit("https://youtube.com", "YouTube");
    ctrl.visit("https://wikipedia.org", "Wikipedia");

    ctrl.back(); // current is YouTube

    const history = ctrl.getHistory();
    assert.strictEqual(history[0].title, "Google");
    assert.strictEqual(history[1].title, "YouTube");
    assert.strictEqual(history[2].title, "Wikipedia");

    const snapshot = ctrl.getHistorySnapshot();
    assert.strictEqual(snapshot[0].isCurrent, false);
    assert.strictEqual(snapshot[1].isCurrent, true);
    assert.strictEqual(snapshot[2].isCurrent, false);
});

// -------------------------------------------------------------
// Test 23: Correct Back and Forward Stack ordering
// -------------------------------------------------------------
runTest("Back and Forward Stack arrays are in bottom-to-top order", () => {
    const ctrl = new BrowserHistoryController();
    ctrl.visit("https://page1.com", "Page 1");
    ctrl.visit("https://page2.com", "Page 2");
    ctrl.visit("https://page3.com", "Page 3");

    // BackStack: bottom=Page 1, top=Page 2
    const back = ctrl.getBackStack();
    assert.strictEqual(back[0].title, "Page 1");
    assert.strictEqual(back[1].title, "Page 2");

    ctrl.back(); // current=Page 2. Fwd=[Page 3]
    ctrl.back(); // current=Page 1. Fwd=[Page 3, Page 2] (top is Page 2)
    const fwd = ctrl.getForwardStack();
    assert.strictEqual(fwd[0].title, "Page 3"); // pushed first
    assert.strictEqual(fwd[1].title, "Page 2"); // pushed second (top)
});

// -------------------------------------------------------------
// Test 24: Navigation availability state
// -------------------------------------------------------------
runTest("Navigation availability flags accurately reflect state", () => {
    const ctrl = new BrowserHistoryController();
    assert.strictEqual(ctrl.canGoBack(), false);
    assert.strictEqual(ctrl.canGoForward(), false);

    ctrl.visit("https://google.com", "Google");
    assert.strictEqual(ctrl.canGoBack(), false);
    assert.strictEqual(ctrl.canGoForward(), false);

    ctrl.visit("https://youtube.com", "YouTube");
    assert.strictEqual(ctrl.canGoBack(), true);
    assert.strictEqual(ctrl.canGoForward(), false);

    ctrl.back();
    assert.strictEqual(ctrl.canGoBack(), false);
    assert.strictEqual(ctrl.canGoForward(), true);

    ctrl.forward();
    assert.strictEqual(ctrl.canGoBack(), true);
    assert.strictEqual(ctrl.canGoForward(), false);
});

// -------------------------------------------------------------
// Test 25: Complete worked example from Section 8
// -------------------------------------------------------------
runTest("Complete Worked Example: Google -> YouTube -> Wikipedia -> Back -> Back -> Instagram", () => {
    const ctrl = new BrowserHistoryController();

    // Step 1: Visit Google
    ctrl.visit("https://google.com", "Google");
    assert.strictEqual(ctrl.getCurrentPage().title, "Google");
    assert.deepStrictEqual(ctrl.getBackStack().map(n => n.title), []);
    assert.deepStrictEqual(ctrl.getForwardStack().map(n => n.title), []);
    assert.deepStrictEqual(ctrl.getHistory().map(n => n.title), ["Google"]);
    verifyInvariants(ctrl);

    // Step 2: Visit YouTube
    ctrl.visit("https://youtube.com", "YouTube");
    assert.strictEqual(ctrl.getCurrentPage().title, "YouTube");
    assert.deepStrictEqual(ctrl.getBackStack().map(n => n.title), ["Google"]);
    assert.deepStrictEqual(ctrl.getForwardStack().map(n => n.title), []);
    assert.deepStrictEqual(ctrl.getHistory().map(n => n.title), ["Google", "YouTube"]);
    verifyInvariants(ctrl);

    // Step 3: Visit Wikipedia
    ctrl.visit("https://wikipedia.org", "Wikipedia");
    assert.strictEqual(ctrl.getCurrentPage().title, "Wikipedia");
    assert.deepStrictEqual(ctrl.getBackStack().map(n => n.title), ["Google", "YouTube"]);
    assert.deepStrictEqual(ctrl.getForwardStack().map(n => n.title), []);
    assert.deepStrictEqual(ctrl.getHistory().map(n => n.title), ["Google", "YouTube", "Wikipedia"]);
    verifyInvariants(ctrl);

    // Step 4: Back
    ctrl.back();
    assert.strictEqual(ctrl.getCurrentPage().title, "YouTube");
    assert.deepStrictEqual(ctrl.getBackStack().map(n => n.title), ["Google"]);
    assert.deepStrictEqual(ctrl.getForwardStack().map(n => n.title), ["Wikipedia"]);
    assert.deepStrictEqual(ctrl.getHistory().map(n => n.title), ["Google", "YouTube", "Wikipedia"]);
    verifyInvariants(ctrl);

    // Step 5: Back
    ctrl.back();
    assert.strictEqual(ctrl.getCurrentPage().title, "Google");
    assert.deepStrictEqual(ctrl.getBackStack().map(n => n.title), []);
    assert.deepStrictEqual(ctrl.getForwardStack().map(n => n.title), ["Wikipedia", "YouTube"]);
    assert.deepStrictEqual(ctrl.getHistory().map(n => n.title), ["Google", "YouTube", "Wikipedia"]);
    verifyInvariants(ctrl);

    // Step 6: Visit Instagram
    ctrl.visit("https://instagram.com", "Instagram");
    assert.strictEqual(ctrl.getCurrentPage().title, "Instagram");
    assert.deepStrictEqual(ctrl.getBackStack().map(n => n.title), ["Google"]);
    assert.deepStrictEqual(ctrl.getForwardStack().map(n => n.title), []);
    assert.deepStrictEqual(ctrl.getHistory().map(n => n.title), ["Google", "Instagram"]);
    assert.strictEqual(ctrl.canGoForward(), false);
    verifyInvariants(ctrl);
});

// -------------------------------------------------------------
// Summary Report
// -------------------------------------------------------------
console.log("\n==================================================");
console.log(` RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log("==================================================");

if (passedTests !== totalTests) {
    console.error("FAILURE: Some BrowserHistoryController unit tests failed!");
    process.exit(1);
} else {
    console.log("SUCCESS: All BrowserHistoryController unit tests passed without errors.");
}

