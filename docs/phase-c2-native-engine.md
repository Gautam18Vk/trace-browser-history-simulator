# Phase C2: Native C Data Structures & Navigation Engine Report — Trace

**Project Name:** Trace (Browser History Simulator)  
**Subject:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Active Branch:** `c-migration`  
**Compiler:** MinGW GCC 6.3.0 (`-std=c11 -Wall -Wextra -pedantic`)  
**Status:** Completed & Verified (Phase C2 of C5)

---

## 1. Executive Summary

In Phase C2, we completed the pure C implementation of the browser history navigation engine. The entire core data structure suite—comprising a fixed-capacity LIFO **Stack**, a dynamic **Doubly Linked List**, and an authoritative **BrowserHistoryController**—was implemented entirely in standard C11 without external dependencies. 

The implementation was compiled with zero compiler warnings, validated with **27 automated native C tests** (including 5 mathematical invariants), verified against an interactive menu-driven CLI demonstration, and cross-checked against all **62 original JavaScript regression tests** to ensure complete behavioral parity.

---

## 2. Implemented C Data Structures & Components

All C source code resides in the [`c_src/`](../c_src/) directory:

| Header / Source | Component | Responsibility |
| :--- | :--- | :--- |
| [`c_src/stack.h`](../c_src/stack.h)<br/>[`c_src/stack.c`](../c_src/stack.c) | **`Stack`** | Fixed-capacity array of 100 `HistoryNode*` pointers. Provides $O(1)$ `stack_push`, `stack_pop`, `stack_peek`, `stack_is_empty`, `stack_is_full`, `stack_size`, and `stack_clear`. |
| [`c_src/doubly_linked_list.h`](../c_src/doubly_linked_list.h)<br/>[`c_src/doubly_linked_list.c`](../c_src/doubly_linked_list.c) | **`HistoryNode`**<br/>**`DoublyLinkedList`** | `HistoryNode` stores `url[256]`, `title[128]`, `prev`, and `next`. `DoublyLinkedList` maintains `head`, `tail`, `current`, and `size`. Owns all heap allocations. Provides node creation, appending, forward branch pruning, clearing, and traversal. |
| [`c_src/browser_history.h`](../c_src/browser_history.h)<br/>[`c_src/browser_history.c`](../c_src/browser_history.c) | **`BrowserHistoryController`** | Single authoritative controller encapsulating `backStack`, `forwardStack`, and `dll`. Coordinates page visits, backward navigation, forward navigation, boundary guards, and read-only state query functions for future WebAssembly export. |
| [`c_src/main.c`](../c_src/main.c) | **Interactive CLI Runner** | Menu-driven terminal application (`trace_cli.exe`) providing options to visit pages, navigate backward/forward, inspect stack tracks (top-to-bottom), display bidirectional DLL chains, and clear history. |
| [`tests/c_history_test.c`](../tests/c_history_test.c) | **Automated C Test Suite** | 27 rigorous unit test scenarios validating edge cases, memory invariants, capacity limits, string overflow rejection, and the mandatory worked example. |

---

## 3. Structure Definitions

```c
/* HistoryNode: Individual entry in chronological timeline */
typedef struct HistoryNode {
    char url[256];
    char title[128];
    struct HistoryNode* prev;
    struct HistoryNode* next;
} HistoryNode;

/* Stack: Fixed-capacity LIFO structure storing borrowed node pointers */
#define STACK_CAPACITY 100

typedef struct {
    HistoryNode* items[STACK_CAPACITY];
    int top; /* -1 represents an empty stack */
} Stack;

/* DoublyLinkedList: Bidirectional active browsing timeline */
typedef struct {
    HistoryNode* head;
    HistoryNode* tail;
    HistoryNode* current;
    int size;
} DoublyLinkedList;

/* BrowserHistoryController: Coordinating engine */
#define MAX_HISTORY_NODES 101

typedef struct {
    Stack backStack;
    Stack forwardStack;
    DoublyLinkedList dll;
} BrowserHistoryController;
```

---

## 4. Memory Management & Ownership Model

Unlike JavaScript where unreferenced objects are reclaimed by an automatic garbage collector, standard C requires explicit manual memory management:

1. **Strict Ownership Hierarchy:**
   - The **Doubly Linked List** is the **sole owner** of every allocated `HistoryNode` on the heap (`malloc`).
   - The **Back Stack** and **Forward Stack** store non-owning, borrowed pointers (`HistoryNode*`). Stack functions never call `free()` or `malloc()`.
2. **Safe Forward Branch Pruning:**
   - When visiting a new page while `current != tail`:
     1. Discard all forward stack references (`forwardStack.top = -1`).
     2. Follow `current->next` to `tail`, calling `free()` on every discarded node.
     3. Sever the forward pointer: `current->next = NULL; dll.tail = current;`.
     4. Append the newly allocated page node.
   - Because all pointers in `forwardStack` pointed exclusively to the pruned forward sub-chain, clearing `forwardStack` guarantees **zero dangling pointers**.
3. **Safe Clear Operation:**
   - Resets `backStack.top = -1` and `forwardStack.top = -1`.
   - Traverses the entire DLL from `head` to `tail`, safely calling `free()` on each node.
   - Sets `head = NULL`, `tail = NULL`, `current = NULL`, and `size = 0`.
   - Safe to execute repeatedly without double-free errors.
4. **Pre-Allocation & Fault Tolerance:**
   - In `bh_visit()`, `dll_create_node()` is called **before** mutating any existing history. If allocation fails or inputs are invalid, the function returns `NULL` immediately, leaving the existing browsing history 100% unaltered.

---

## 5. Capacity Management (101 Active Nodes)

- **`STACK_CAPACITY`:** 100 pointers per stack.
- **`MAX_HISTORY_NODES`:** 101 nodes total.
- **Mathematical Rationale:**
  $$\text{BackStack.size}() + \text{ForwardStack.size}() + 1 = \text{DLL.size}()$$
  If a user visits 101 pages consecutively, `BackStack` holds 100 nodes, `ForwardStack` holds 0 nodes, and `current` is at node 101 ($100 + 0 + 1 = 101$). If the user navigates all the way back to `head`, `BackStack` holds 0 nodes, `ForwardStack` holds 100 nodes, and `current` is at node 1 ($0 + 100 + 1 = 101$).
  Thus, 101 active history nodes guarantees that neither stack can ever overflow in any reachable navigation state.
- **Pruning-Aware Capacity Check:** When branching from an earlier page (e.g. after moving backward 10 times from a 101-node history), the algorithm calculates the remaining nodes after forward pruning (`stack_size(&bh->backStack) + 1`) rather than blindly rejecting the visit based on the pre-pruned list size.

---

## 6. Time & Space Complexity Analysis

| Operation | C Implementation Mechanism | Time Complexity | Space Complexity | Viva Explanation |
| :--- | :--- | :---: | :---: | :--- |
| **`stack_push` / `stack_pop`** | Array index increment/decrement | **$O(1)$** | $O(1)$ | Direct array access at index `top`. |
| **`stack_peek`** | Read `items[top]` | **$O(1)$** | $O(1)$ | Constant-time array lookup. |
| **`dll_append_node`** | Update `tail->next` and `tail` pointers | **$O(1)$** | $O(1)$ | Direct pointer updates at the tail. |
| **`bh_back`** | Push current to ForwardStack, pop BackStack, update `current` | **$O(1)$** | $O(1)$ | Array stack operations and pointer assignment. |
| **`bh_forward`** | Push current to BackStack, pop ForwardStack, update `current` | **$O(1)$** | $O(1)$ | Array stack operations and pointer assignment. |
| **`bh_visit` (no forward history)** | Push to BackStack, append to tail | **$O(1)$** | $O(1)$ | Allocation of 1 node + constant pointer reassignments. |
| **`bh_visit` (with $f$ forward nodes)** | Free $f$ forward nodes + push to BackStack + append to tail | **$O(f)$** | $O(1)$ | In C, each discarded forward node must be explicitly visited and released with `free()`. |
| **`bh_clear` (with $n$ nodes)** | Traverse DLL and free all $n$ nodes | **$O(n)$** | $O(1)$ | Must traverse and deallocate all $n$ nodes from heap. |
| **`bh_get_history_node_at(i)`** | Traverse $i$ steps from head | **$O(i)$** | $O(1)$ | Linked lists require sequential pointer traversal. |

---

## 7. Compilation Commands & GCC Flags

Compiled with GCC 6.3.0 under `-std=c11 -Wall -Wextra -pedantic`:

```bash
# 1. Compile Native Interactive Terminal Application:
gcc -std=c11 -Wall -Wextra -pedantic c_src/stack.c c_src/doubly_linked_list.c c_src/browser_history.c c_src/main.c -o trace_cli.exe

# 2. Compile Automated Native C Test Suite:
gcc -std=c11 -Wall -Wextra -pedantic c_src/stack.c c_src/doubly_linked_list.c c_src/browser_history.c tests/c_history_test.c -o trace_tests.exe
```

Both compilations completed with **zero errors and zero warnings**.

---

## 8. Automated Test Results (27 / 27 Passed)

```text
====================================================
   RUNNING PHASE C2 NATIVE C AUTOMATED TESTS        
====================================================

  [PASS] Test  1: Empty Stack initialized correctly with NULL returns
  [PASS] Test  2: Stack push and pop operations update size and top correctly
  [PASS] Test  3: Stack strictly preserves Last-In, First-Out (LIFO) order
  [PASS] Test  4: Stack underflow handled safely without memory faults
  [PASS] Test  5: Stack overflow guarded safely when reaching STACK_CAPACITY
  [PASS] Test  6: Independent Stack instances operate without state leakage
  [PASS] Test  7: Empty Doubly Linked List initialized with NULL boundary pointers
  [PASS] Test  8: Single-node DLL correctly references same node for head, tail, and current
  [PASS] Test  9: Multiple appends maintain chronological ordering from head to tail
  [PASS] Test 10: Bidirectional pointer connections (prev and next) link correctly
  [PASS] Test 11: First visit sets active page and leaves Back and Forward stacks empty
  [PASS] Test 12: Multiple consecutive visits grow BackStack and DLL linearly
  [PASS] Test 13: Back navigation chronologically traverses prior pages and updates stacks
  [PASS] Test 14: Forward navigation restores navigated-from page and transfers stack items
  [PASS] Test 15: Navigation boundaries safely return NULL without corrupting active state
  [PASS] Test 16: Forward history pruning severs forward branch and frees nodes cleanly
  [PASS] Test 17: Consecutive duplicate URLs instantiate distinct HistoryNodes
  [PASS] Test 18: Clearing populated history resets all data structures and releases memory
  [PASS] Test 19: Clearing an already empty history executes safely without errors
  [PASS] Test 20: Controller reinitializes and functions normally after clearing
  [PASS] Test 21: NULL and empty string URL inputs are rejected without mutating state
  [PASS] Test 22: Strings exceeding buffer capacity are rejected without silent truncation
  [PASS] Test 23: Maximum history capacity (101 nodes) enforced without stack overflow
  [PASS] Test 24: Branching after backward navigation calculates pruned capacity correctly
  [PASS] Test 25: Stack items store exact borrowed pointers matching active DLL nodes
  [PASS] Test 26: Multiple controller instances operate with complete memory isolation
  [PASS] Test 27: Repeated rapid navigation cycles and clears execute with zero memory errors

====================================================
   TEST SUMMARY: 27 / 27 TESTS PASSED (100%)
====================================================
SUCCESS: All native C tests and invariants verified successfully!
```

---

## 9. Mandatory Worked Example Verification

Executed sequence:
$$\text{Visit Google} \to \text{Visit YouTube} \to \text{Visit Wikipedia} \to \text{Back} \to \text{Back} \to \text{Visit GitHub}$$

**Verified Terminal Output:**
- Active Page: `GitHub` (`https://github.com`)
- Back Stack: `| Google | [TOP]` (Size: 1)
- Forward Stack: `[EMPTY]` (Size: 0)
- Doubly Linked List:
  `[1] "Google" [HEAD] <===> [2] "GitHub" [CURRENT · TAIL]`
- Nodes `YouTube` and `Wikipedia` were severed and freed from memory.
- Subsequent `Clear History` reset all pointers to `NULL` and released remaining memory.

---

## 10. Existing JavaScript Regression Verification

Executed existing test suite across all 4 JavaScript test files:
- `tests/stack.test.js`: **8 / 8 passed**
- `tests/doublyLinkedList.test.js`: **18 / 18 passed**
- `tests/browserHistoryController.test.js`: **25 / 25 passed**
- `tests/integrationVerification.test.js`: **11 / 11 passed**
- **Grand Total:** **62 / 62 passed (100% success rate)**

Zero changes were made to `index.html`, `style.css`, `src/app.js`, or the existing JavaScript data structures.

---

## 11. Remaining Limitations & Next Steps

1. **WebAssembly Bridge:** In this phase, the C engine operates as a native standalone CLI binary. In Phase C3, `wasm_bridge.c` will be created to compile the exact same C engine into WebAssembly using Emscripten (`emcc`).
2. **Phase C3 Prerequisite:** Installing Emscripten SDK (`emsdk`) on the host machine prior to compiling `wasm/trace.wasm`.

