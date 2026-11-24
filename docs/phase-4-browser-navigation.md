# Phase 4: Browser Navigation Engine & Controller Integration Report

**Subject:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Department:** Information Technology  
**Project Name:** Browser History Simulator  
**Status:** Completed & Verified (Phase 4 of 8)

---

## 1. PURPOSE OF `BrowserHistoryController`

The `BrowserHistoryController` class (located in [`src/BrowserHistoryController.js`](../src/BrowserHistoryController.js)) is the central coordinator of the simulator. It integrates:
- **`BackStack` (Stack):** Stores references to previously visited nodes for backward navigation.
- **`ForwardStack` (Stack):** Stores references to nodes navigated back from for forward restoration.
- **`DoublyLinkedList` (DLL):** Serves as the authoritative, single active browsing timeline.

The controller maintains strict synchronization between LIFO stack operations and bidirectional linked-list pointers, ensuring that the browser always maintains a single active browsing path.

---

## 2. INTERACTION BETWEEN STACKS AND THE DOUBLY LINKED LIST

In our hybrid architecture:
1. **Single Source of Truth:** The Doubly Linked List is the only structure that instantiates and holds webpage data. Its `current` reference represents the page currently open in the simulated viewport.
2. **Object Reference Sharing:** Neither `BackStack` nor `ForwardStack` stores plain string URLs or duplicate page copies. They store direct **`HistoryNode` object references** (`===`).
3. **Synchronized Traversal:**
   - When moving **Back**, the current node reference is pushed to `ForwardStack`, the prior node is popped from `BackStack`, and `dll.current` is shifted backward.
   - When moving **Forward**, the current node reference is pushed to `BackStack`, the successor node is popped from `ForwardStack`, and `dll.current` is shifted forward.
   - When **Visiting a New Page** after moving back, the forward branch in the DLL is pruned (`dll.pruneForward()`), `ForwardStack` is flushed, and the new page is appended.

```text
+-----------------------+   Node References   +----------------------------------------+   Node References   +-------------------------+
|       BackStack       | ------------------> | HistoryNode A <=====> HistoryNode B    | <------------------ |      ForwardStack       |
|  - [Ref to Node A]    |                     |   (head)              (current & tail) |                     |  - Empty []             |
+-----------------------+                     +----------------------------------------+                     +-------------------------+
```

---

## 3. CORE NAVIGATION ALGORITHMS

### 3.1 `visit(url, title)`
```text
Algorithm: visit(url, title)
Input: url (string), title (string, optional)
Output: Newly created HistoryNode or null on invalid input

1. Validate input:
     If url is not a string or trimmed url is empty:
         Return null (Safe rejection, state remains unmutated).
2. Clean inputs: cleanUrl = url.trim(), cleanTitle = title.trim() || cleanUrl.
3. If dll.current !== null (Active browsing history exists):
     a. backStack.push(dll.current)
     b. forwardStack.clear()
     c. dll.pruneForward(dll.current)
     d. newNode = dll.append(cleanUrl, cleanTitle)
     e. Return newNode
4. Else (First page visit):
     a. backStack.clear()
     b. forwardStack.clear()
     c. newNode = dll.append(cleanUrl, cleanTitle)
     d. Return newNode
```

### 3.2 `back()`
```text
Algorithm: back()
Output: Newly active HistoryNode, or null if back is unavailable

1. If backStack.isEmpty():
     Return null (Backward navigation unavailable; state unmutated).
2. forwardStack.push(dll.current)
3. previousNode = backStack.pop()
4. dll.current = previousNode
5. Return dll.current
```

### 3.3 `forward()`
```text
Algorithm: forward()
Output: Newly active HistoryNode, or null if forward is unavailable

1. If forwardStack.isEmpty():
     Return null (Forward navigation unavailable; state unmutated).
2. backStack.push(dll.current)
3. nextNode = forwardStack.pop()
4. dll.current = nextNode
5. Return dll.current
```

### 3.4 `clearHistory()`
```text
Algorithm: clearHistory()

1. backStack.clear()
2. forwardStack.clear()
3. dll.clear()
(All pointers: head, tail, current reset to null; memory unreferenced).
```

---

## 4. ROLE OF `head`, `tail`, AND `current`

- **`head`:** Points to the first page visited in the active session. Anchors forward traversal.
- **`tail`:** Points to the end of the active browsing path. When the user is at the latest page, `current === tail`.
- **`current`:** Points to the active page displayed in the viewport. When the user navigates backward, `current` moves toward `head`, leaving `tail` ahead in forward history.

---

## 5. WHY TWO STACKS ARE REQUIRED

1. **`BackStack` (Backward LIFO):** When a user navigates backward, they expect to retrace their steps in reverse order (most recent first). A stack naturally provides the immediate prior page at its top in $O(1)$ time.
2. **`ForwardStack` (Forward LIFO):** When a user moves backward, the page they left becomes the immediate next page if they decide to go forward. Pushing retreating pages onto `ForwardStack` ensures that forward navigation restores pages in the exact order they were retreated from in $O(1)$ time.
3. **Independent Lifecycles:** When a new page is visited after navigating backward, the forward history must be permanently discarded (`forwardStack.clear()`), while the backward history is preserved. Two independent stacks allow isolating these lifecycles cleanly.

---

## 6. WORKED EXAMPLE WITH DETAILED STATE TABLES

Sequence: `Visit Google` $\rightarrow$ `Visit YouTube` $\rightarrow$ `Visit Wikipedia` $\rightarrow$ `Back` $\rightarrow$ `Back` $\rightarrow$ `Visit Instagram`.

| Step | Action | Active Page (`current`) | BackStack `[bottom ... top]` | ForwardStack `[bottom ... top]` | Active Doubly Linked List | Notes |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| **1** | Visit Google | `Google` | `[]` | `[]` | `[Google]` | 1st page. Stacks empty. `head = tail = current = Google`. |
| **2** | Visit YouTube | `YouTube` | `[Google]` | `[]` | `[Google] <-> [YouTube]` | `Google` pushed to BackStack. `YouTube` appended. |
| **3** | Visit Wikipedia | `Wikipedia` | `[Google, YouTube]` | `[]` | `[Google] <-> [YouTube] <-> [Wikipedia]` | `YouTube` pushed to BackStack. `Wikipedia` appended. |
| **4** | Back | `YouTube` | `[Google]` | `[Wikipedia]` | `[Google] <-> [YouTube] <-> [Wikipedia]` | `Wikipedia` pushed to ForwardStack. `current` moves to `YouTube`. |
| **5** | Back | `Google` | `[]` | `[Wikipedia, YouTube]` | `[Google] <-> [YouTube] <-> [Wikipedia]` | `YouTube` pushed to ForwardStack (top). `current` moves to `Google`. |
| **6** | Visit Instagram | `Instagram` | `[Google]` | `[]` | `[Google] <-> [Instagram]` | `Google` pushed to Back. ForwardStack cleared. `YouTube <-> Wikipedia` pruned. `Instagram` appended. |

### Final State:
- **Current Page:** `Instagram`
- **BackStack:** `[Google]` (Top: `Google`)
- **ForwardStack:** `[]` (Empty, forward navigation unavailable)
- **Active Doubly Linked List:** `[Google] <-> [Instagram]`
- **Unreachable Nodes:** `YouTube` and `Wikipedia` are completely severed from `head` and reclaimed by the garbage collector.

---

## 7. SYSTEM INVARIANTS

At all times, the controller guarantees the following mathematical invariants:

1. **Count Invariant:**
   - When history exists (`current !== null`):  
     $$\text{backStack.size()} + \text{forwardStack.size()} + 1 = \text{totalNodesInActiveDLL}$$
   - When history is empty (`current === null`):  
     $$\text{backStack.size()} = 0, \quad \text{forwardStack.size()} = 0, \quad \text{dll.size()} = 0$$
2. **Backward Relationship:**
   - If `!backStack.isEmpty()`, then `backStack.peek() === current.prev`.
   - If `backStack.isEmpty()`, then `current.prev === null`.
3. **Forward Relationship:**
   - If `!forwardStack.isEmpty()`, then `forwardStack.peek() === current.next`.
   - If `forwardStack.isEmpty()`, then `current.next === null`.
4. **Boundary Integrity:** `head.prev === null` and `tail.next === null`.
5. **Bidirectional Symmetry:** For every node $X$ in the active list, $X.\text{next}.\text{prev} === X$ and $X.\text{prev}.\text{next} === X$.
6. **Set Inclusion:** Every node stored in either Stack belongs strictly to the active Doubly Linked List.

---

## 8. TIME AND SPACE COMPLEXITY

| Operation | Time Complexity | Auxiliary Space Complexity | Theoretical Undergraduate Explanation |
| :--- | :---: | :---: | :--- |
| `visit(url, title)` | **$O(1)$** (Amortized) | $O(1)$ | Array push to BackStack is $O(1)$ amortized; `pruneForward()` executes in $O(1)$ pointer operations; DLL tail append is $O(1)$. |
| `back()` | **$O(1)$** | $O(1)$ | One push to ForwardStack, one pop from BackStack, and one pointer reassignment. Strictly constant time. |
| `forward()` | **$O(1)$** | $O(1)$ | One push to BackStack, one pop from ForwardStack, and one pointer reassignment. Strictly constant time. |
| `clearHistory()` | **$O(1)$** | $O(1)$ | Reassigns stack arrays and DLL pointers to empty/null. |
| `getCurrentPage()` | **$O(1)$** | $O(1)$ | Direct scalar reference access (`this.dll.current`). |
| `canGoBack()` / `canGoForward()` | **$O(1)$** | $O(1)$ | Evaluates `length > 0` on internal stack array. |
| `getHistory()` (Traversal) | **$O(N)$** | $O(N)$ | Iterates from `head` to `tail` visiting all $N$ nodes to construct the ordered array for rendering. |
| `getHistorySnapshot()` | **$O(N)$** | $O(N)$ | Iterates over $N$ nodes creating lightweight `{ url, title, isCurrent }` objects free of circular references. |
| `getBackStack()` / `getForwardStack()` | **$O(B)$** / **$O(F)$** | $O(B)$ / $O(F)$ | Copies stack items to array ($B, F < N$). |

---

## 9. PHASE 3 ISSUES RESOLVED

1. **Browser DOM `Node` Collision:**
   - *Problem:* Web browsers natively define `window.Node` for DOM elements. Declaring `class Node` globally can overwrite or collide with the DOM interface.
   - *Resolution:* Renamed the class to `HistoryNode` in [`src/Node.js`](../src/Node.js) while maintaining an alias for backwards compatibility in Node.js test environments.
2. **Forward History Pruning Contract:**
   - *Clarification:* `dll.pruneForward(fromNode = this.current)` strictly operates on the active page node. It cleanly breaks both `fromNode.next = null` and `forwardNode.prev = null`, advances `tail = fromNode`, and maintains $O(1)$ time complexity without traversing the list.
3. **Complexity Consistency:**
   - *Clarification:* Explicitly documented that pointer disconnection runs in constant time $O(1)$, while the reclamation of discarded memory is managed asynchronously by the JavaScript engine's garbage collector.

---

## 10. ACTUAL TEST EXECUTION OUTPUT

All 3 test suites were executed sequentially:

```text
==========================================
   RUNNING PHASE 2 STACK UNIT TESTS       
==========================================

[PASS] Test 1: Empty stack state and safe underflow handling
[PASS] Test 2: Push operations update size and top element correctly
[PASS] Test 3: Pop operations remove elements in correct order and update top
[PASS] Test 4: LIFO behaviour (Last-In, First-Out order)
[PASS] Test 5: Clear operation empties populated stack safely
[PASS] Test 6: toArray() returns bottom-to-top copy and defends against mutation
[PASS] Test 7: Multiple Stack instances operate independently without state leakage
[PASS] Test 8: Stack stores and returns object references identically (Node simulation)

==========================================
 RESULTS: 8 / 8 TESTS PASSED
==========================================
SUCCESS: All Stack unit tests passed without errors.

==========================================
 RUNNING PHASE 3 DOUBLY LINKED LIST TESTS 
==========================================

[PASS] Test 1: Empty List: Initial head, tail and current are null
[PASS] Test 2: Single Node: Append Google, head/tail/current refer to same Node
[PASS] Test 3: Multiple Nodes: Chronological order preserved across multiple appends
[PASS] Test 4: Forward References: Every next reference links correctly to successor
[PASS] Test 5: Backward References: Every prev reference links correctly to predecessor
[PASS] Test 6: Head and Tail Boundaries: head.prev is null and tail.next is null
[PASS] Test 7: Forward Traversal: Traversal from head yields chronological sequence
[PASS] Test 8: Backward Traversal: Starting at tail and following prev yields reverse order
[PASS] Test 9: Remove Forward Nodes: Set current to YouTube and prune Wikipedia
[PASS] Test 10: Remove Multiple Forward Nodes: Pruning removes all subsequent nodes
[PASS] Test 11: Remove Forward Nodes at Tail: List remains unchanged when current is tail
[PASS] Test 12: Remove Forward Nodes from Empty List: Handles empty list safely without errors
[PASS] Test 13: Append After Forward Removal: Newly appended node connects correctly
[PASS] Test 14: Duplicate URLs: Consecutive visits to same URL create distinct Node objects
[PASS] Test 15: Clear Populated List: All references reset to null
[PASS] Test 16: Clear Empty List: Safely handles clearing an already empty list
[PASS] Test 17: Reuse After Clear: List functions normally after clearing
[PASS] Test 18: Stack Compatibility: Pushing and popping DLL Node preserves exact object reference

==========================================
 RESULTS: 18 / 18 TESTS PASSED
==========================================
SUCCESS: All DoublyLinkedList unit tests passed without errors.

==================================================
 RUNNING PHASE 4 BROWSER HISTORY CONTROLLER TESTS 
==================================================

[PASS] Test 1: Initial empty browser state
[PASS] Test 2: Back navigation on empty history safely returns null
[PASS] Test 3: Forward navigation on empty history safely returns null
[PASS] Test 4: First page visit sets active page and leaves stacks empty
[PASS] Test 5: Multiple consecutive visits grow BackStack and DLL linearly
[PASS] Test 6: Single Back operation moves to immediate previous page
[PASS] Test 7: Multiple Back operations navigate backwards chronologically
[PASS] Test 8: Back operation at earliest page safely returns null
[PASS] Test 9: Single Forward operation restores the navigated-from page
[PASS] Test 10: Multiple Forward operations advance through forward history
[PASS] Test 11: Forward operation at latest page safely returns null
[PASS] Test 12: Visiting new page after Back prunes forward history
[PASS] Test 13: Visiting new page after multiple Backs prunes all forward nodes
[PASS] Test 14: Back, then Forward, then new visit preserves correct path
[PASS] Test 15: Repeated visits to same URL create distinct Node objects
[PASS] Test 16: Clearing populated history resets all data structures
[PASS] Test 17: Clearing empty history executes safely without errors
[PASS] Test 18: Visiting new page after clearing reinitializes cleanly
[PASS] Test 19: Invalid URL inputs safely reject without corrupting state
[PASS] Test 20: Two controller instances operate completely independently
[PASS] Test 21: Exact Node reference equality holds across Stacks and DLL
[PASS] Test 22: getHistory() and getHistorySnapshot() return correct order and active marker
[PASS] Test 23: Back and Forward Stack arrays are in bottom-to-top order
[PASS] Test 24: Navigation availability flags accurately reflect state
[PASS] Test 25: Complete Worked Example: Google -> YouTube -> Wikipedia -> Back -> Back -> Instagram

==================================================
 RESULTS: 25 / 25 TESTS PASSED
==================================================
SUCCESS: All BrowserHistoryController unit tests passed without errors.
```

**Grand Total:** **51 / 51 Unit Tests Passing (100% Success Rate)**.

---

## 11. VIVA EXAMINATION PREPARATION

### Q1: What does the BrowserHistoryController do?
> **Answer:** It acts as the central engine that orchestrates the Back Stack, Forward Stack, and Doubly Linked List. It ensures that whenever a user visits a page, goes back, or goes forward, the Stacks and Linked List pointers remain strictly synchronized.

### Q2: What happens internally when `visit()` is called after clicking `back()`?
> **Answer:**
> 1. The current active page is pushed onto `BackStack`.
> 2. `ForwardStack` is cleared because all forward navigation history is invalidated on a new branch.
> 3. `dll.pruneForward(current)` severs all forward nodes in the Doubly Linked List, and sets `tail = current`.
> 4. The new page node is appended to the tail of the Doubly Linked List.
> 5. `current` is updated to point to the new page.

### Q3: Why does `back()` or `forward()` not delete or add any nodes in the Doubly Linked List?
> **Answer:** Navigating backward or forward is simply moving the viewport's position (`current` pointer) along an already established historical timeline. The timeline itself does not change; only the viewer's current location within it shifts.

### Q4: How is memory reclaimed when forward history is pruned?
> **Answer:** In JavaScript, the forward chain is severed by setting `current.next = null`, and `forwardStack.clear()` drops all references. With no reachable references from the root, the JavaScript garbage collector reclaims the orphaned nodes automatically.

