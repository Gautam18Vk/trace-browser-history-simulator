# Phase 3: Doubly Linked List Implementation & Unit Testing Report

**Subject:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Department:** Information Technology  
**Project Name:** Browser History Simulator  
**Status:** Completed & Verified (Phase 3 of 8)

---

## 1. PURPOSE OF THE DOUBLY LINKED LIST IN THIS PROJECT

In the Browser History Simulator, the **Doubly Linked List (DLL)** acts as the **master chronological timeline** of all active visited pages.

While the two Stacks (`BackStack` and `ForwardStack`) handle LIFO operational buffers for user clicks, the Doubly Linked List maintains:
1. The global bidirectional chain of pages in the exact sequence they were visited.
2. The current browsing position via the `current` pointer.
3. The ability to prune disconnected forward paths in $O(1)$ time when a user visits a new URL after navigating backward.
4. An intact, traversable structure for rendering the history bar visualizer in the user interface.

---

## 2. THE `Node` CLASS

The `Node` class (defined in [`src/Node.js`](../src/Node.js)) represents an individual webpage in memory.

### Node Structure Diagram
```text
+-------------------------------------------------------------+
|                            NODE                             |
+---------------------+-----------------+---------------------+
|        prev         |   url & title   |        next         |
| (Node ref | null)   |  (String data)  | (Node ref | null)   |
+---------------------+-----------------+---------------------+
```

### Attributes
- `url` (*String*): The simulated web address (e.g., `https://google.com`).
- `title` (*String*): The human-readable title (e.g., `Google Search`).
- `prev` (*Node reference | null*): Pointer/reference to the preceding page in history. Initialized to `null`.
- `next` (*Node reference | null*): Pointer/reference to the succeeding page in history. Initialized to `null`.

---

## 3. DOUBLY LINKED LIST CORE POINTERS

The `DoublyLinkedList` class (defined in [`src/DoublyLinkedList.js`](../src/DoublyLinkedList.js)) maintains three primary pointers:

| Pointer | Role in Browsing History | Initial Value |
| :--- | :--- | :---: |
| `head` | References the **earliest visited webpage** in the active history timeline. | `null` |
| `tail` | References the **most recently appended webpage** in the active timeline. | `null` |
| `current` | References the **currently active webpage** displayed in the simulated viewport. | `null` |

### Invariants Maintained
- In an empty list: `head === null`, `tail === null`, and `current === null`.
- Whenever `head` exists, `head.prev === null`.
- Whenever `tail` exists, `tail.next === null`.
- For every adjacent pair of nodes $A$ and $B$ where $A.\text{next} === B$, $B.\text{prev} === A$ strictly holds.

---

## 4. METHOD DESCRIPTIONS & ALGORITHMS

### 4.1 `append(url, title)`
- **Purpose:** Adds a new page to the end of the history timeline.
- **Algorithm:**
  1. Instantiate `newNode = new Node(url, title)`.
  2. If the list is empty (`head === null`):
     - Set `head = newNode`, `tail = newNode`, `current = newNode`.
  3. If the list is non-empty:
     - Set `tail.next = newNode`.
     - Set `newNode.prev = tail`.
     - Set `tail = newNode`.
     - Set `current = newNode`.
  4. Return `newNode`.
- **Time Complexity:** $O(1)$. Direct pointer linkage via `tail`; no traversal required.

#### Appending Nodes Diagram
```text
Step 1: Empty List
head = null, tail = null, current = null

Step 2: Append Google
+---------------------+
| null <- Google -> null |
+---------------------+
  ^       ^       ^
 head   current  tail

Step 3: Append YouTube
+---------------------+      +----------------------+
| null <- Google <===========> YouTube -> null      |
+---------------------+      +----------------------+
  ^                            ^         ^
 head                       current     tail
```

---

### 4.2 `pruneForward(fromNode = this.current)`
- **Purpose:** Removes and disconnects all nodes following `fromNode` (typically `current`). This is invoked when visiting a new webpage after going backward.
- **Algorithm:**
  1. If list is empty (`head === null`) or `fromNode` is `null`, return safely.
  2. If `fromNode.next === null`, `fromNode` is already the `tail`; no forward nodes exist, return safely.
  3. Let `forwardNode = fromNode.next`.
  4. Sever the backward link: `forwardNode.prev = null`.
  5. Sever the forward link: `fromNode.next = null`.
  6. Update the tail: `tail = fromNode`.
- **Time Complexity:** $O(1)$. Modifies a fixed number of pointer references; orphaned nodes are subsequently reclaimed by JavaScript garbage collection.

#### Removing Forward History (Branch Pruning) Diagram
```text
Before Pruning (User navigated Back to YouTube):
+--------+       +---------+       +-----------+
| Google | <===> | YouTube | <===> | Wikipedia |
+--------+       +---------+       +-----------+
    ^                 ^                  ^
  head             current              tail

Action: dll.pruneForward(current)
1. Sever forward link: YouTube.next = null
2. Sever backward link: Wikipedia.prev = null
3. Update tail = YouTube

After Pruning:
+--------+       +---------+         [ Wikipedia ] (Orphaned / Discarded)
| Google | <===> | YouTube | -> null
+--------+       +---------+
    ^                 ^
  head          current & tail
```

---

### 4.3 `toArray()`
- **Purpose:** Traverses from `head` to `tail` along `.next` references, collecting all active `Node` references into a JavaScript array for frontend visualizer rendering.
- **Time Complexity:** $O(N)$, where $N$ is the number of active nodes.

### 4.4 `clear()`
- **Purpose:** Resets the list to initial empty state (`head = null`, `tail = null`, `current = null`).
- **Time Complexity:** $O(1)$.

### 4.5 `isEmpty()` and `size()`
- `isEmpty()`: Evaluates `this.head === null` ($O(1)$).
- `size()`: Traverses the list counting nodes ($O(N)$).

---

## 5. TIME AND SPACE COMPLEXITY SUMMARY

| Operation | Time Complexity | Space Complexity | Explanation |
| :--- | :---: | :---: | :--- |
| `append()` | **$O(1)$** | $O(1)$ | Direct pointer assignment using `tail`. |
| `pruneForward()` | **$O(1)$** | $O(1)$ | Direct pointer disconnect (`fromNode.next = null; tail = fromNode`). |
| `toArray()` (Traversal) | **$O(N)$** | $O(N)$ | Visits each node from `head` to `tail` to populate visual array. |
| `clear()` | **$O(1)$** | $O(1)$ | Scalar pointer reassignments to `null`. |
| `isEmpty()` | **$O(1)$** | $O(1)$ | Single comparison (`head === null`). |
| `size()` | **$O(N)$** | $O(1)$ | Iterative count from `head` to `tail`. |

---

## 6. ACTUAL UNIT TEST RESULTS

All 18 tests in [`tests/doublyLinkedList.test.js`](../tests/doublyLinkedList.test.js) passed with zero errors:

```text
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
```

Combined baseline run alongside `tests/stack.test.js`:
- Stack Tests: **8 / 8 Passed**
- Doubly Linked List Tests: **18 / 18 Passed**
- Total Assertions: **26 / 26 Passed (100%)**

---

## 7. VIVA EXAMINATION PREPARATION

### Q1: What is a Doubly Linked List?
> **Answer:** A Doubly Linked List is a linear data structure composed of nodes, where each node contains data and two references: `prev` (pointing to the previous node) and `next` (pointing to the following node). This allows bidirectional traversal.

### Q2: Why is a Doubly Linked List more suitable than a Singly Linked List for browser navigation?
> **Answer:**
> In a Singly Linked List, nodes only have a `next` pointer. Moving backward from a page requires starting from `head` and traversing the entire list forward to locate the predecessor node, which takes $O(N)$ time.
> In a Doubly Linked List, every node has a direct `prev` pointer. Moving backward is an instantaneous $O(1)$ pointer access (`current = current.prev`).

### Q3: What is the role of `head`, `tail`, and `current` in our simulator?
> **Answer:**
> - `head`: Anchors the beginning of the browsing session.
> - `tail`: Tracks the most recently added page on the active branch.
> - `current`: Points to the specific page currently being viewed in the viewport.

### Q4: How does forward-history pruning work when a user visits a new page after clicking Back?
> **Answer:**
> If the user is at `current` and visits a new URL:
> 1. `current.next` is set to `null`, isolating all forward nodes from the list.
> 2. `tail` is updated to `current`.
> 3. The new page node is appended directly after `current`.
> 4. The orphaned forward nodes are automatically reclaimed by the JavaScript garbage collector.

### Q5: How do the Stacks and the Doubly Linked List collaborate?
> **Answer:**
> The Doubly Linked List stores the persistent sequence of history nodes in memory. The `BackStack` and `ForwardStack` hold references to those exact `Node` objects. When navigating, the controller pops or pushes the node reference, instantly synchronizing the LIFO stack operations with the active `current` pointer in the linked list in $O(1)$ time.

