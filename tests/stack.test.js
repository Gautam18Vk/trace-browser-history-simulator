/**
 * Unit Tests for Stack Class
 * 
 * Verifies all requirements of Phase 2 for the Browser History Simulator:
 * 1. Empty stack behavior
 * 2. Push operations
 * 3. Pop operations
 * 4. LIFO behavior
 * 5. Clear operation
 * 6. toArray() copy & immutability verification
 * 7. Independent Stack instances
 * 8. Storing and retrieving object references (Node reference simulation)
 */

const assert = require('assert');
const Stack = require('../src/Stack');

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

console.log("==========================================");
console.log("   RUNNING PHASE 2 STACK UNIT TESTS       ");
console.log("==========================================\n");

// -------------------------------------------------------------
// Test 1: Empty stack
// -------------------------------------------------------------
runTest("Empty stack state and safe underflow handling", () => {
    const stack = new Stack();
    assert.strictEqual(stack.isEmpty(), true, "New stack must report isEmpty() === true");
    assert.strictEqual(stack.size(), 0, "New stack must have size() === 0");
    assert.strictEqual(stack.peek(), null, "peek() on empty stack must return null");
    assert.strictEqual(stack.pop(), null, "pop() on empty stack must return null without throwing error");
});

// -------------------------------------------------------------
// Test 2: Push operations
// -------------------------------------------------------------
runTest("Push operations update size and top element correctly", () => {
    const stack = new Stack();
    stack.push("https://google.com");
    assert.strictEqual(stack.size(), 1, "Size should be 1 after 1st push");
    assert.strictEqual(stack.peek(), "https://google.com", "Top element should be Google");
    assert.strictEqual(stack.isEmpty(), false, "Stack should not be empty");

    stack.push("https://youtube.com");
    stack.push("https://wikipedia.org");
    assert.strictEqual(stack.size(), 3, "Size should be 3 after 3 pushes");
    assert.strictEqual(stack.peek(), "https://wikipedia.org", "Top element should be Wikipedia");
});

// -------------------------------------------------------------
// Test 3: Pop operations
// -------------------------------------------------------------
runTest("Pop operations remove elements in correct order and update top", () => {
    const stack = new Stack();
    stack.push("https://google.com");
    stack.push("https://youtube.com");
    stack.push("https://wikipedia.org");

    const popped1 = stack.pop();
    assert.strictEqual(popped1, "https://wikipedia.org", "First pop must return last pushed element (Wikipedia)");
    assert.strictEqual(stack.size(), 2, "Size must be 2 after first pop");
    assert.strictEqual(stack.peek(), "https://youtube.com", "New top element must be YouTube");

    const popped2 = stack.pop();
    assert.strictEqual(popped2, "https://youtube.com", "Second pop must return YouTube");
    assert.strictEqual(stack.size(), 1, "Size must be 1 after second pop");
    assert.strictEqual(stack.peek(), "https://google.com", "New top element must be Google");

    const popped3 = stack.pop();
    assert.strictEqual(popped3, "https://google.com", "Third pop must return Google");
    assert.strictEqual(stack.size(), 0, "Size must be 0 after popping all elements");
    assert.strictEqual(stack.isEmpty(), true, "Stack must report isEmpty() === true");
});

// -------------------------------------------------------------
// Test 4: LIFO behaviour
// -------------------------------------------------------------
runTest("LIFO behaviour (Last-In, First-Out order)", () => {
    const stack = new Stack();
    const inputSequence = ["Page A", "Page B", "Page C", "Page D"];
    
    inputSequence.forEach(item => stack.push(item));

    const expectedOrder = ["Page D", "Page C", "Page B", "Page A"];
    const actualOrder = [];

    while (!stack.isEmpty()) {
        actualOrder.push(stack.pop());
    }

    assert.deepStrictEqual(actualOrder, expectedOrder, "Elements must be popped in reverse order of insertion (LIFO)");
});

// -------------------------------------------------------------
// Test 5: Clear operation
// -------------------------------------------------------------
runTest("Clear operation empties populated stack safely", () => {
    const stack = new Stack();
    stack.push("URL 1");
    stack.push("URL 2");
    stack.push("URL 3");
    assert.strictEqual(stack.size(), 3);

    stack.clear();
    assert.strictEqual(stack.isEmpty(), true, "Stack must be empty after clear()");
    assert.strictEqual(stack.size(), 0, "Stack size must be 0 after clear()");
    assert.strictEqual(stack.peek(), null, "peek() must return null after clear()");
    assert.strictEqual(stack.pop(), null, "pop() must return null after clear()");
});

// -------------------------------------------------------------
// Test 6: toArray() and copy verification
// -------------------------------------------------------------
runTest("toArray() returns bottom-to-top copy and defends against mutation", () => {
    const stack = new Stack();
    stack.push("Alpha");
    stack.push("Beta");
    stack.push("Gamma");

    const arr = stack.toArray();
    assert.strictEqual(Array.isArray(arr), true, "toArray() must return an Array");
    assert.strictEqual(arr.length, 3, "Array must have length 3");
    assert.strictEqual(arr[0], "Alpha", "Index 0 must be bottom element (Alpha)");
    assert.strictEqual(arr[1], "Beta", "Index 1 must be middle element (Beta)");
    assert.strictEqual(arr[2], "Gamma", "Index 2 must be top element (Gamma)");

    // Mutation test: modifying returned array must NOT affect internal stack
    arr.push("Delta");
    arr[0] = "Corrupted";

    assert.strictEqual(stack.size(), 3, "Original stack size must remain 3 despite array mutation");
    assert.strictEqual(stack.peek(), "Gamma", "Original stack top must remain Gamma");
    assert.strictEqual(stack.toArray()[0], "Alpha", "Original stack bottom must remain Alpha");
});

// -------------------------------------------------------------
// Test 7: Independent Stack instances
// -------------------------------------------------------------
runTest("Multiple Stack instances operate independently without state leakage", () => {
    const backStack = new Stack();
    const forwardStack = new Stack();

    backStack.push("Page 1");
    backStack.push("Page 2");

    assert.strictEqual(backStack.size(), 2, "backStack must have size 2");
    assert.strictEqual(forwardStack.size(), 0, "forwardStack must remain empty when backStack is modified");
    assert.strictEqual(forwardStack.isEmpty(), true, "forwardStack must be empty");

    forwardStack.push("Page X");
    assert.strictEqual(forwardStack.size(), 1, "forwardStack must have size 1");
    assert.strictEqual(backStack.size(), 2, "backStack size must remain 2");

    backStack.clear();
    assert.strictEqual(backStack.size(), 0, "backStack cleared");
    assert.strictEqual(forwardStack.size(), 1, "forwardStack must retain its element when backStack is cleared");
    assert.strictEqual(forwardStack.peek(), "Page X", "forwardStack peek must be Page X");
});

// -------------------------------------------------------------
// Test 8: Storing and retrieving object references
// -------------------------------------------------------------
runTest("Stack stores and returns object references identically (Node simulation)", () => {
    const stack = new Stack();
    
    // Simulating Node objects as will be used in Phase 3 & 4
    const nodeA = { url: "https://google.com", title: "Google", prev: null, next: null };
    const nodeB = { url: "https://github.com", title: "GitHub", prev: nodeA, next: null };
    nodeA.next = nodeB;

    stack.push(nodeA);
    stack.push(nodeB);

    assert.strictEqual(stack.peek(), nodeB, "peek() must return the exact object reference of nodeB");
    assert.strictEqual(stack.peek() === nodeB, true, "Reference equality must hold true (===)");

    // Mutate the object outside the stack
    nodeB.title = "GitHub - Where the world builds software";
    assert.strictEqual(
        stack.peek().title, 
        "GitHub - Where the world builds software", 
        "Mutating the object outside must be reflected via stack reference"
    );

    const popped = stack.pop();
    assert.strictEqual(popped, nodeB, "Popped object must be exact nodeB reference");
    assert.strictEqual(popped.prev, nodeA, "Node bidirectional reference must be preserved");

    const poppedSecond = stack.pop();
    assert.strictEqual(poppedSecond, nodeA, "Popped object must be exact nodeA reference");
});

// -------------------------------------------------------------
// Summary Report
// -------------------------------------------------------------
console.log("\n==========================================");
console.log(` RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log("==========================================");

if (passedTests !== totalTests) {
    console.error("FAILURE: Some unit tests failed!");
    process.exit(1);
} else {
    console.log("SUCCESS: All Stack unit tests passed without errors.");
}

