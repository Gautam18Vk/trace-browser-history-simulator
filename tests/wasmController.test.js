/**
 * tests/wasmController.test.js
 * 
 * Integration test suite for src/wasmController.js.
 * Verifies the JavaScript adapter against the compiled C WebAssembly engine.
 */

const assert = require('assert');
const path = require('path');
const { WasmBrowserHistoryController, getUtf8ByteLength } = require('../src/wasmController');
const createTraceModule = require('../wasm/trace.js');

async function runAdapterTests() {
    console.log('====================================================');
    console.log('   RUNNING WASM CONTROLLER ADAPTER TESTS            ');
    console.log('====================================================\n');

    let passCount = 0;
    function pass(desc) {
        passCount++;
        console.log(`  [PASS] Test ${String(passCount).padStart(2, ' ')}: ${desc}`);
    }

    // 1. Instantiation & Initialization
    const controller = new WasmBrowserHistoryController(createTraceModule);
    assert.strictEqual(controller.isReady(), false);

    await controller.init({
        locateFile: (fileName) => path.join(__dirname, '..', 'wasm', fileName)
    });
    assert.strictEqual(controller.isReady(), true);
    pass('Adapter initializes Wasm module and sets ready state');

    // 2. Initial Empty State
    controller.clearHistory();
    assert.strictEqual(controller.getCurrentPage(), null);
    assert.strictEqual(controller.canGoBack(), false);
    assert.strictEqual(controller.canGoForward(), false);
    assert.strictEqual(controller.getHistory().length, 0);
    assert.strictEqual(controller.getBackStack().length, 0);
    assert.strictEqual(controller.getForwardStack().length, 0);
    pass('Initial empty state returns expected values');

    // 3. Page Visits
    let res = controller.visit('https://google.com', 'Google');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.page.title, 'Google');
    assert.strictEqual(controller.getCurrentPage().title, 'Google');
    assert.strictEqual(controller.canGoBack(), false);

    controller.visit('https://youtube.com', 'YouTube');
    controller.visit('https://wikipedia.org', 'Wikipedia');
    assert.strictEqual(controller.getHistory().length, 3);
    assert.strictEqual(controller.getBackStack().length, 2);
    assert.strictEqual(controller.canGoBack(), true);
    assert.strictEqual(controller.canGoForward(), false);
    pass('Sequential visits grow active timeline and Back Stack in C engine');

    // 4. Back and Forward Navigation
    let p = controller.back();
    assert.strictEqual(p.title, 'YouTube');
    assert.strictEqual(controller.canGoBack(), true);
    assert.strictEqual(controller.canGoForward(), true);

    p = controller.back();
    assert.strictEqual(p.title, 'Google');
    assert.strictEqual(controller.canGoBack(), false); // Earliest page
    assert.strictEqual(controller.canGoForward(), true);

    p = controller.forward();
    assert.strictEqual(p.title, 'YouTube');

    p = controller.forward();
    assert.strictEqual(p.title, 'Wikipedia');
    assert.strictEqual(controller.canGoForward(), false); // Latest page
    pass('Back and Forward navigation transfer pages correctly through C engine');

    // 5. Forward Branch Pruning (Worked Example)
    controller.back(); // at YouTube
    controller.back(); // at Google
    res = controller.visit('https://github.com', 'GitHub');
    assert.strictEqual(res.success, true);
    assert.strictEqual(controller.getCurrentPage().title, 'GitHub');
    assert.strictEqual(controller.canGoForward(), false);
    assert.strictEqual(controller.getForwardStack().length, 0);

    const history = controller.getHistory();
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].title, 'Google');
    assert.strictEqual(history[1].title, 'GitHub');
    assert.strictEqual(history[1].isCurrent, true);
    pass('Forward history pruning (Google -> YouTube -> Wikipedia -> Back*2 -> GitHub) verified');

    // 6. Duplicate URL visits & isCurrent pointer tracking
    controller.clearHistory();
    controller.visit('https://google.com', 'Google');
    controller.visit('https://google.com', 'Google');
    assert.strictEqual(controller.getHistory().length, 2);
    const h2 = controller.getHistory();
    assert.strictEqual(h2[0].isCurrent, false);
    assert.strictEqual(h2[1].isCurrent, true);

    controller.back();
    const h1 = controller.getHistory();
    assert.strictEqual(h1[0].isCurrent, true);
    assert.strictEqual(h1[1].isCurrent, false);
    pass('Duplicate URLs tracked accurately with C pointer-based isCurrent flag');

    // 7. UTF-8 Byte Length Rejections
    const overlengthUrl = 'https://' + 'a'.repeat(300) + '.com';
    const failUrl = controller.visit(overlengthUrl, 'Valid Title');
    assert.strictEqual(failUrl.success, false);
    assert.ok(failUrl.error.includes('URL exceeds'));

    const overlengthTitle = 'b'.repeat(150);
    const failTitle = controller.visit('https://valid.com', overlengthTitle);
    assert.strictEqual(failTitle.success, false);
    assert.ok(failTitle.error.includes('Title exceeds'));
    pass('Overlength URLs and titles rejected prior to C buffer overflow');

    // 8. Clear History
    controller.clearHistory();
    assert.strictEqual(controller.getCurrentPage(), null);
    assert.strictEqual(controller.getHistory().length, 0);
    pass('Clear history resets all data structures cleanly');

    console.log('\n====================================================');
    console.log(`   TEST SUMMARY: ${passCount} / ${passCount} TESTS PASSED (100%)`);
    console.log('====================================================\n');
}

runAdapterTests().catch(err => {
    console.error('Adapter test error:', err);
    process.exit(1);
});

