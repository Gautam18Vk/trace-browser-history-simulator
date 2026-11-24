/**
 * Unit Tests for DoublyLinkedList Class
 * 
 * Part of Phase 3 for the Browser History Simulator project.
 * Verifies all 18 test cases specified in the requirements.
 */

const assert = require('assert');
const DoublyLinkedList = require('../src/DoublyLinkedList');
const Node = require('../src/Node');
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
console.log(" RUNNING PHASE 3 DOUBLY LINKED LIST TESTS ");
console.log("==========================================\n");

// -------------------------------------------------------------
// Test 1: Empty List
// -------------------------------------------------------------
runTest("Empty List: Initial head, tail and current are null", () => {
    const list = new DoublyLinkedList();
    assert.strictEqual(list.head, null, "head should be null initially");
    assert.strictEqual(list.tail, null, "tail should be null initially");
    assert.strictEqual(list.current, null, "current should be null initially");
    assert.strictEqual(list.isEmpty(), true, "isEmpty() should be true");
    assert.strictEqual(list.size(), 0, "size() should be 0");
    assert.deepStrictEqual(list.toArray(), [], "toArray() should be empty array");
});

// -------------------------------------------------------------
// Test 2: Single Node
// -------------------------------------------------------------
runTest("Single Node: Append Google, head/tail/current refer to same Node", () => {
    const list = new DoublyLinkedList();
    const googleNode = list.append("https://google.com", "Google");

    assert.strictEqual(list.head, googleNode, "head must be the appended node");
    assert.strictEqual(list.tail, googleNode, "tail must be the appended node");
    assert.strictEqual(list.current, googleNode, "current must be the appended node");
    assert.strictEqual(list.head.prev, null, "head.prev must be null");
    assert.strictEqual(list.tail.next, null, "tail.next must be null");
    assert.strictEqual(list.size(), 1, "size must be 1");
});

// -------------------------------------------------------------
// Test 3: Multiple Nodes
// -------------------------------------------------------------
runTest("Multiple Nodes: Chronological order preserved across multiple appends", () => {
    const list = new DoublyLinkedList();
    list.append("https://google.com", "Google");
    list.append("https://youtube.com", "YouTube");
    list.append("https://wikipedia.org", "Wikipedia");

    assert.strictEqual(list.size(), 3, "size should be 3");
    assert.strictEqual(list.head.url, "https://google.com", "head should be Google");
    assert.strictEqual(list.head.next.url, "https://youtube.com", "second node should be YouTube");
    assert.strictEqual(list.tail.url, "https://wikipedia.org", "tail should be Wikipedia");
    assert.strictEqual(list.current.url, "https://wikipedia.org", "current should point to latest node");
});

// -------------------------------------------------------------
// Test 4: Forward References
// -------------------------------------------------------------
runTest("Forward References: Every next reference links correctly to successor", () => {
    const list = new DoublyLinkedList();
    const n1 = list.append("https://google.com", "Google");
    const n2 = list.append("https://youtube.com", "YouTube");
    const n3 = list.append("https://wikipedia.org", "Wikipedia");

    assert.strictEqual(n1.next, n2, "Google.next must point to YouTube");
    assert.strictEqual(n2.next, n3, "YouTube.next must point to Wikipedia");
    assert.strictEqual(n3.next, null, "Wikipedia.next must be null (tail boundary)");
});

// -------------------------------------------------------------
// Test 5: Backward References
// -------------------------------------------------------------
runTest("Backward References: Every prev reference links correctly to predecessor", () => {
    const list = new DoublyLinkedList();
    const n1 = list.append("https://google.com", "Google");
    const n2 = list.append("https://youtube.com", "YouTube");
    const n3 = list.append("https://wikipedia.org", "Wikipedia");

    assert.strictEqual(n3.prev, n2, "Wikipedia.prev must point to YouTube");
    assert.strictEqual(n2.prev, n1, "YouTube.prev must point to Google");
    assert.strictEqual(n1.prev, null, "Google.prev must be null (head boundary)");
    
    // Bidirectional consistency: node.next.prev === node
    assert.strictEqual(n1.next.prev, n1, "n1.next.prev must link back to n1");
    assert.strictEqual(n2.next.prev, n2, "n2.next.prev must link back to n2");
});

// -------------------------------------------------------------
// Test 6: Head and Tail Boundaries
// -------------------------------------------------------------
runTest("Head and Tail Boundaries: head.prev is null and tail.next is null", () => {
    const list = new DoublyLinkedList();
    list.append("https://google.com", "Google");
    list.append("https://youtube.com", "YouTube");

    assert.strictEqual(list.head.prev, null, "head.prev must strictly be null");
    assert.strictEqual(list.tail.next, null, "tail.next must strictly be null");
});

// -------------------------------------------------------------
// Test 7: Forward Traversal
// -------------------------------------------------------------
runTest("Forward Traversal: Traversal from head yields chronological sequence", () => {
    const list = new DoublyLinkedList();
    list.append("https://google.com", "Google");
    list.append("https://youtube.com", "YouTube");
    list.append("https://wikipedia.org", "Wikipedia");

    const nodes = list.toArray();
    assert.strictEqual(nodes.length, 3, "Traversed array length should be 3");
    assert.strictEqual(nodes[0].title, "Google", "First element must be Google");
    assert.strictEqual(nodes[1].title, "YouTube", "Second element must be YouTube");
    assert.strictEqual(nodes[2].title, "Wikipedia", "Third element must be Wikipedia");
});

// -------------------------------------------------------------
// Test 8: Backward Traversal
// -------------------------------------------------------------
runTest("Backward Traversal: Starting at tail and following prev yields reverse order", () => {
    const list = new DoublyLinkedList();
    list.append("https://google.com", "Google");
    list.append("https://youtube.com", "YouTube");
    list.append("https://wikipedia.org", "Wikipedia");

    const reverseTitles = [];
    let curr = list.tail;
    while (curr !== null) {
        reverseTitles.push(curr.title);
        curr = curr.prev;
    }

    assert.deepStrictEqual(
        reverseTitles, 
        ["Wikipedia", "YouTube", "Google"], 
        "Reverse traversal from tail must follow prev pointers to head"
    );
});

// -------------------------------------------------------------
// Test 9: Remove Forward Nodes
// -------------------------------------------------------------
runTest("Remove Forward Nodes: Set current to YouTube and prune Wikipedia", () => {
    const list = new DoublyLinkedList();
    const google = list.append("https://google.com", "Google");
    const youtube = list.append("https://youtube.com", "YouTube");
    const wikipedia = list.append("https://wikipedia.org", "Wikipedia");

    // Simulate navigating back to YouTube
    list.current = youtube;
    list.pruneForward();

    assert.strictEqual(list.tail, youtube, "tail must now be YouTube");
    assert.strictEqual(youtube.next, null, "youtube.next must be null");
    assert.strictEqual(wikipedia.prev, null, "severed wikipedia.prev must be null");
    assert.strictEqual(list.size(), 2, "List size should now be 2");

    const remaining = list.toArray();
    assert.strictEqual(remaining.length, 2);
    assert.strictEqual(remaining[0], google);
    assert.strictEqual(remaining[1], youtube);
});

// -------------------------------------------------------------
// Test 10: Remove Multiple Forward Nodes
// -------------------------------------------------------------
runTest("Remove Multiple Forward Nodes: Pruning removes all subsequent nodes", () => {
    const list = new DoublyLinkedList();
    const google = list.append("https://google.com", "Google");
    const youtube = list.append("https://youtube.com", "YouTube");
    list.append("https://wikipedia.org", "Wikipedia");
    list.append("https://instagram.com", "Instagram");
    assert.strictEqual(list.size(), 4, "Initial size must be 4");

    // Position current at YouTube and prune all forward nodes
    list.current = youtube;
    list.pruneForward();

    assert.strictEqual(list.tail, youtube, "tail must be YouTube");
    assert.strictEqual(youtube.next, null, "youtube.next must be null");
    assert.strictEqual(list.size(), 2, "Size must now be 2 (Wikipedia & Instagram pruned)");

    const titles = list.toArray().map(n => n.title);
    assert.deepStrictEqual(titles, ["Google", "YouTube"], "Only Google and YouTube should remain");
});

// -------------------------------------------------------------
// Test 11: Remove Forward Nodes at Tail
// -------------------------------------------------------------
runTest("Remove Forward Nodes at Tail: List remains unchanged when current is tail", () => {
    const list = new DoublyLinkedList();
    list.append("https://google.com", "Google");
    const youtube = list.append("https://youtube.com", "YouTube");

    list.current = youtube;
    list.pruneForward(); // Already at tail

    assert.strictEqual(list.tail, youtube, "tail must remain unchanged");
    assert.strictEqual(list.size(), 2, "size must remain 2");
    assert.strictEqual(youtube.next, null, "tail.next must remain null");
});

// -------------------------------------------------------------
// Test 12: Remove Forward Nodes from Empty List
// -------------------------------------------------------------
runTest("Remove Forward Nodes from Empty List: Handles empty list safely without errors", () => {
    const list = new DoublyLinkedList();
    assert.doesNotThrow(() => {
        list.pruneForward();
    }, "pruneForward on empty list must not throw error");

    assert.strictEqual(list.head, null);
    assert.strictEqual(list.tail, null);
    assert.strictEqual(list.current, null);
});

// -------------------------------------------------------------
// Test 13: Append After Forward Removal
// -------------------------------------------------------------
runTest("Append After Forward Removal: Newly appended node connects correctly", () => {
    const list = new DoublyLinkedList();
    list.append("https://google.com", "Google");
    const youtube = list.append("https://youtube.com", "YouTube");
    list.append("https://wikipedia.org", "Wikipedia");

    // Navigate back to YouTube and prune Wikipedia
    list.current = youtube;
    list.pruneForward();

    // Now visit Instagram
    const instagram = list.append("https://instagram.com", "Instagram");

    assert.strictEqual(list.tail, instagram, "tail must be Instagram");
    assert.strictEqual(list.current, instagram, "current must be Instagram");
    assert.strictEqual(youtube.next, instagram, "YouTube.next must link to Instagram");
    assert.strictEqual(instagram.prev, youtube, "Instagram.prev must link back to YouTube");
    assert.strictEqual(instagram.next, null, "Instagram.next must be null");
    assert.strictEqual(list.size(), 3, "Size must be 3 (Google, YouTube, Instagram)");

    const titles = list.toArray().map(n => n.title);
    assert.deepStrictEqual(titles, ["Google", "YouTube", "Instagram"]);
});

// -------------------------------------------------------------
// Test 14: Duplicate URLs
// -------------------------------------------------------------
runTest("Duplicate URLs: Consecutive visits to same URL create distinct Node objects", () => {
    const list = new DoublyLinkedList();
    const visit1 = list.append("https://google.com", "Google");
    const visit2 = list.append("https://google.com", "Google");

    assert.notStrictEqual(visit1, visit2, "Two visits must create distinct Node instances");
    assert.strictEqual(list.head, visit1, "head must be visit1");
    assert.strictEqual(list.tail, visit2, "tail must be visit2");
    assert.strictEqual(visit1.next, visit2, "visit1.next must link to visit2");
    assert.strictEqual(visit2.prev, visit1, "visit2.prev must link to visit1");
    assert.strictEqual(list.size(), 2, "Size must be 2");
});

// -------------------------------------------------------------
// Test 15: Clear Populated List
// -------------------------------------------------------------
runTest("Clear Populated List: All references reset to null", () => {
    const list = new DoublyLinkedList();
    list.append("https://google.com", "Google");
    list.append("https://youtube.com", "YouTube");

    list.clear();
    assert.strictEqual(list.head, null, "head must be null after clear()");
    assert.strictEqual(list.tail, null, "tail must be null after clear()");
    assert.strictEqual(list.current, null, "current must be null after clear()");
    assert.strictEqual(list.isEmpty(), true, "isEmpty() must be true after clear()");
    assert.strictEqual(list.size(), 0, "size() must be 0 after clear()");
});

// -------------------------------------------------------------
// Test 16: Clear Empty List
// -------------------------------------------------------------
runTest("Clear Empty List: Safely handles clearing an already empty list", () => {
    const list = new DoublyLinkedList();
    assert.doesNotThrow(() => {
        list.clear();
    }, "clear() on empty list must not throw error");

    assert.strictEqual(list.head, null);
    assert.strictEqual(list.tail, null);
    assert.strictEqual(list.current, null);
});

// -------------------------------------------------------------
// Test 17: Reuse After Clear
// -------------------------------------------------------------
runTest("Reuse After Clear: List functions normally after clearing", () => {
    const list = new DoublyLinkedList();
    list.append("https://google.com", "Google");
    list.clear();

    const newNode = list.append("https://github.com", "GitHub");
    assert.strictEqual(list.head, newNode, "head must point to newly appended node");
    assert.strictEqual(list.tail, newNode, "tail must point to newly appended node");
    assert.strictEqual(list.current, newNode, "current must point to newly appended node");
    assert.strictEqual(list.size(), 1, "size must be 1");
});

// -------------------------------------------------------------
// Test 18: Stack Compatibility
// -------------------------------------------------------------
runTest("Stack Compatibility: Pushing and popping DLL Node preserves exact object reference", () => {
    const stack = new Stack();
    const list = new DoublyLinkedList();

    const node1 = list.append("https://google.com", "Google");
    const node2 = list.append("https://youtube.com", "YouTube");

    // Push DLL Node object references onto stack
    stack.push(node1);
    stack.push(node2);

    assert.strictEqual(stack.size(), 2, "Stack size should be 2");
    
    // Pop from stack and verify reference equality
    const poppedNode = stack.pop();
    assert.strictEqual(poppedNode, node2, "Popped item must be the exact same object reference as node2 (===)");
    assert.strictEqual(poppedNode.prev, node1, "Popped node's prev pointer to node1 must be intact");
    assert.strictEqual(poppedNode.title, "YouTube", "Popped node data must match");

    const poppedFirst = stack.pop();
    assert.strictEqual(poppedFirst, node1, "Popped item must be the exact same object reference as node1 (===)");
    assert.strictEqual(poppedFirst.next, node2, "Node forward pointer remains intact");
});

// -------------------------------------------------------------
// Summary Report
// -------------------------------------------------------------
console.log("\n==========================================");
console.log(` RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log("==========================================");

if (passedTests !== totalTests) {
    console.error("FAILURE: Some DoublyLinkedList unit tests failed!");
    process.exit(1);
} else {
    console.log("SUCCESS: All DoublyLinkedList unit tests passed without errors.");
}

