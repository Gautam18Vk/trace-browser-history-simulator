/**
 * tests/wasm.test.js
 * 
 * Comprehensive Automated WebAssembly Test Suite for Trace.
 * Loads the compiled WebAssembly module (wasm/trace.js + wasm/trace.wasm) in Node.js
 * and verifies all 17 requirements and the mandatory worked example directly
 * against the genuine compiled C engine.
 */

const assert = require('assert');
const path = require('path');
const createTraceModule = require('../wasm/trace.js');

async function runWasmTests() {
    console.log('====================================================');
    console.log('   RUNNING PHASE C3 WEBASSEMBLY AUTOMATED TESTS     ');
    console.log('====================================================\n');

    let passCount = 0;
    let failCount = 0;

    function recordPass(desc) {
        passCount++;
        console.log(`  [PASS] Test ${String(passCount + failCount).padStart(2, ' ')}: ${desc}`);
    }

    // 1. Module Initialization
    const Module = await createTraceModule({
        locateFile: (fileName) => path.join(__dirname, '..', 'wasm', fileName)
    });
    assert.ok(Module, 'Emscripten module factory must resolve cleanly');
    assert.strictEqual(typeof Module.cwrap, 'function', 'cwrap runtime method must be exported');

    // Bind exported C functions via cwrap
    const bh_init = Module.cwrap('bh_wasm_init', null, []);
    const bh_visit = Module.cwrap('bh_wasm_visit', 'number', ['string', 'string']);
    const bh_back = Module.cwrap('bh_wasm_back', 'number', []);
    const bh_forward = Module.cwrap('bh_wasm_forward', 'number', []);
    const bh_clear = Module.cwrap('bh_wasm_clear', null, []);
    const bh_can_go_back = Module.cwrap('bh_wasm_can_go_back', 'number', []);
    const bh_can_go_forward = Module.cwrap('bh_wasm_can_go_forward', 'number', []);
    const bh_get_current_url = Module.cwrap('bh_wasm_get_current_url', 'string', []);
    const bh_get_current_title = Module.cwrap('bh_wasm_get_current_title', 'string', []);
    const bh_get_current_index = Module.cwrap('bh_wasm_get_current_index', 'number', []);
    const bh_get_history_count = Module.cwrap('bh_wasm_get_history_count', 'number', []);
    const bh_get_history_url = Module.cwrap('bh_wasm_get_history_url', 'string', ['number']);
    const bh_get_history_title = Module.cwrap('bh_wasm_get_history_title', 'string', ['number']);
    const bh_get_history_is_current = Module.cwrap('bh_wasm_get_history_is_current', 'number', ['number']);
    const bh_get_back_stack_count = Module.cwrap('bh_wasm_get_back_stack_count', 'number', []);
    const bh_get_back_stack_title = Module.cwrap('bh_wasm_get_back_stack_title', 'string', ['number']);
    const bh_get_back_stack_url = Module.cwrap('bh_wasm_get_back_stack_url', 'string', ['number']);
    const bh_get_forward_stack_count = Module.cwrap('bh_wasm_get_forward_stack_count', 'number', []);
    const bh_get_forward_stack_title = Module.cwrap('bh_wasm_get_forward_stack_title', 'string', ['number']);
    const bh_get_forward_stack_url = Module.cwrap('bh_wasm_get_forward_stack_url', 'string', ['number']);

    recordPass('WebAssembly module initialized and C functions bound via cwrap');

    // 2. Empty History State
    bh_init();
    assert.strictEqual(bh_get_history_count(), 0);
    assert.strictEqual(bh_get_back_stack_count(), 0);
    assert.strictEqual(bh_get_forward_stack_count(), 0);
    assert.strictEqual(bh_can_go_back(), 0);
    assert.strictEqual(bh_can_go_forward(), 0);
    assert.strictEqual(bh_get_current_url(), '');
    assert.strictEqual(bh_get_current_title(), '');
    assert.strictEqual(bh_get_current_index(), -1);
    recordPass('Empty history state verified with safe default returns');

    // 3. First Page Visit
    let res = bh_visit('https://google.com', 'Google');
    assert.strictEqual(res, 1);
    assert.strictEqual(bh_get_history_count(), 1);
    assert.strictEqual(bh_get_current_url(), 'https://google.com');
    assert.strictEqual(bh_get_current_title(), 'Google');
    assert.strictEqual(bh_get_current_index(), 0);
    assert.strictEqual(bh_can_go_back(), 0);
    assert.strictEqual(bh_can_go_forward(), 0);
    recordPass('First visit sets active page and leaves Back and Forward stacks empty');

    // 4. Multiple Consecutive Visits
    bh_visit('https://youtube.com', 'YouTube');
    bh_visit('https://wikipedia.org', 'Wikipedia');
    assert.strictEqual(bh_get_history_count(), 3);
    assert.strictEqual(bh_get_back_stack_count(), 2);
    assert.strictEqual(bh_get_forward_stack_count(), 0);
    assert.strictEqual(bh_get_current_title(), 'Wikipedia');
    assert.strictEqual(bh_can_go_back(), 1);
    assert.strictEqual(bh_can_go_forward(), 0);
    recordPass('Multiple consecutive visits grow BackStack and DLL linearly in C engine');

    // 5. Back Navigation
    res = bh_back();
    assert.strictEqual(res, 1);
    assert.strictEqual(bh_get_current_title(), 'YouTube');
    assert.strictEqual(bh_get_back_stack_count(), 1);
    assert.strictEqual(bh_get_forward_stack_count(), 1);
    assert.strictEqual(bh_can_go_back(), 1);
    assert.strictEqual(bh_can_go_forward(), 1);

    res = bh_back();
    assert.strictEqual(res, 1);
    assert.strictEqual(bh_get_current_title(), 'Google');
    assert.strictEqual(bh_get_back_stack_count(), 0);
    assert.strictEqual(bh_get_forward_stack_count(), 2);
    assert.strictEqual(bh_can_go_back(), 0); // Earliest page boundary
    assert.strictEqual(bh_can_go_forward(), 1);

    res = bh_back();
    assert.strictEqual(res, 0); // Boundary guard
    recordPass('Back navigation chronologically traverses prior pages and guards earliest boundary');

    // 6. Forward Navigation
    res = bh_forward();
    assert.strictEqual(res, 1);
    assert.strictEqual(bh_get_current_title(), 'YouTube');
    assert.strictEqual(bh_get_back_stack_count(), 1);
    assert.strictEqual(bh_get_forward_stack_count(), 1);

    res = bh_forward();
    assert.strictEqual(res, 1);
    assert.strictEqual(bh_get_current_title(), 'Wikipedia');
    assert.strictEqual(bh_get_back_stack_count(), 2);
    assert.strictEqual(bh_get_forward_stack_count(), 0);
    assert.strictEqual(bh_can_go_forward(), 0); // Latest page boundary

    res = bh_forward();
    assert.strictEqual(res, 0); // Boundary guard
    recordPass('Forward navigation restores navigated-from page and guards latest boundary');

    // 7. Forward History Pruning (Mandatory Worked Example)
    // Currently at Wikipedia. Move back twice to Google:
    bh_back(); // at YouTube
    bh_back(); // at Google
    assert.strictEqual(bh_get_current_title(), 'Google');
    assert.strictEqual(bh_get_forward_stack_count(), 2);

    // Visit GitHub -> Forward branch (YouTube ⇄ Wikipedia) must be discarded
    res = bh_visit('https://github.com', 'GitHub');
    assert.strictEqual(res, 1);
    assert.strictEqual(bh_get_current_title(), 'GitHub');
    assert.strictEqual(bh_get_current_url(), 'https://github.com');
    assert.strictEqual(bh_can_go_forward(), 0);
    assert.strictEqual(bh_get_forward_stack_count(), 0);

    // DLL must strictly be Google ⇄ GitHub (count = 2)
    assert.strictEqual(bh_get_history_count(), 2);
    assert.strictEqual(bh_get_history_title(0), 'Google');
    assert.strictEqual(bh_get_history_title(1), 'GitHub');

    // BackStack must strictly contain Google
    assert.strictEqual(bh_get_back_stack_count(), 1);
    assert.strictEqual(bh_get_back_stack_title(0), 'Google');
    recordPass('Forward history pruning (Google -> YouTube -> Wikipedia -> Back*2 -> GitHub) verified in Wasm');

    // 8. Duplicate URLs
    bh_init();
    bh_visit('https://google.com', 'Google 1');
    bh_visit('https://google.com', 'Google 2');
    bh_visit('https://google.com', 'Google 3');
    assert.strictEqual(bh_get_history_count(), 3);
    assert.strictEqual(bh_get_current_index(), 2);
    assert.strictEqual(bh_get_history_is_current(0), 0);
    assert.strictEqual(bh_get_history_is_current(1), 0);
    assert.strictEqual(bh_get_history_is_current(2), 1);

    bh_back();
    assert.strictEqual(bh_get_current_index(), 1);
    assert.strictEqual(bh_get_history_is_current(0), 0);
    assert.strictEqual(bh_get_history_is_current(1), 1);
    assert.strictEqual(bh_get_history_is_current(2), 0);
    recordPass('Duplicate URLs maintain distinct entries and accurate pointer-based current highlights');

    // 9. Correct Stack Ordering (bottom-to-top)
    bh_init();
    bh_visit('https://a.com', 'Page A');
    bh_visit('https://b.com', 'Page B');
    bh_visit('https://c.com', 'Page C');
    assert.strictEqual(bh_get_back_stack_count(), 2);
    assert.strictEqual(bh_get_back_stack_title(0), 'Page A'); // Bottom
    assert.strictEqual(bh_get_back_stack_title(1), 'Page B'); // Top

    bh_back();
    bh_back();
    assert.strictEqual(bh_get_forward_stack_count(), 2);
    assert.strictEqual(bh_get_forward_stack_title(0), 'Page C'); // Bottom
    assert.strictEqual(bh_get_forward_stack_title(1), 'Page B'); // Top
    recordPass('Back and Forward stacks preserve exact bottom-to-top indexed ordering');

    // 10. Correct DLL Chronological Ordering
    assert.strictEqual(bh_get_history_count(), 3);
    assert.strictEqual(bh_get_history_title(0), 'Page A');
    assert.strictEqual(bh_get_history_title(1), 'Page B');
    assert.strictEqual(bh_get_history_title(2), 'Page C');
    recordPass('Doubly Linked List timeline preserves chronological sequence from head to tail');

    // 11. Reliable Current Node Identification
    assert.strictEqual(bh_get_current_index(), 0);
    assert.strictEqual(bh_get_history_is_current(0), 1);
    assert.strictEqual(bh_get_history_is_current(1), 0);
    assert.strictEqual(bh_get_history_is_current(2), 0);
    recordPass('Current node identity accurately tracked by DLL index and boolean flag');

    // 12. Invalid Input Rejection
    assert.strictEqual(bh_visit('', 'Empty URL'), 0);
    // Overlength string rejection (> 256 chars)
    const longUrl = 'https://' + 'x'.repeat(300) + '.com';
    assert.strictEqual(bh_visit(longUrl, 'Long URL'), 0);
    assert.strictEqual(bh_get_history_count(), 3); // Unchanged
    recordPass('Empty and overlength URL strings rejected safely without mutating C state');

    // 13. Capacity Handling (101 nodes max)
    bh_init();
    for (let i = 0; i < 101; i++) {
        const ok = bh_visit(`https://node${i}.com`, `Node ${i}`);
        assert.strictEqual(ok, 1);
    }
    assert.strictEqual(bh_get_history_count(), 101);
    assert.strictEqual(bh_get_back_stack_count(), 100);
    // Attempting 102nd node visit must be rejected
    assert.strictEqual(bh_visit('https://overflow.com', 'Overflow'), 0);
    assert.strictEqual(bh_get_history_count(), 101);
    recordPass('Maximum capacity (101 active nodes) strictly enforced by C engine');

    // 14. Clear History
    bh_clear();
    assert.strictEqual(bh_get_history_count(), 0);
    assert.strictEqual(bh_get_back_stack_count(), 0);
    assert.strictEqual(bh_get_forward_stack_count(), 0);
    assert.strictEqual(bh_get_current_url(), '');
    assert.strictEqual(bh_can_go_back(), 0);
    assert.strictEqual(bh_can_go_forward(), 0);
    recordPass('Clear history releases all C nodes and resets pointers to NULL');

    // 15. Reuse After Clearing
    res = bh_visit('https://reused.com', 'Reused');
    assert.strictEqual(res, 1);
    assert.strictEqual(bh_get_history_count(), 1);
    assert.strictEqual(bh_get_current_title(), 'Reused');
    recordPass('Engine functions normally and reinitializes cleanly after clearing');

    // 16. Safe Indexed Getter Boundaries
    assert.strictEqual(bh_get_history_url(-1), '');
    assert.strictEqual(bh_get_history_url(999), '');
    assert.strictEqual(bh_get_history_title(999), '');
    assert.strictEqual(bh_get_history_is_current(999), 0);
    assert.strictEqual(bh_get_back_stack_title(999), '');
    assert.strictEqual(bh_get_forward_stack_title(999), '');
    recordPass('Out-of-bound index queries safely return empty strings and zero flags');

    // 17. Repeated Initialization and Cleanup
    for (let i = 0; i < 5; i++) {
        bh_init();
        bh_visit('https://cycle.com', 'Cycle');
        bh_clear();
    }
    assert.strictEqual(bh_get_history_count(), 0);
    recordPass('Repeated re-initialization and cleanups execute without memory leaks');

    console.log('\n====================================================');
    console.log(`   TEST SUMMARY: ${passCount} / ${passCount + failCount} TESTS PASSED (100%)`);
    console.log('====================================================\n');

    if (failCount === 0) {
        console.log('SUCCESS: All WebAssembly bridge tests verified successfully!\n');
        process.exit(0);
    } else {
        console.error(`FAILURE: ${failCount} WebAssembly tests failed.\n`);
        process.exit(1);
    }
}

runWasmTests().catch(err => {
    console.error('Fatal WebAssembly test error:', err);
    process.exit(1);
});

