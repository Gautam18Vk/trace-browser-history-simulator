# Final C Project Guide — Trace: Browser History Simulator

**Course:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT), Guru Gobind Singh Indraprastha University (GGSIPU)  
**Implementation Language:** Pure C (C11 / C99)  
**Web Execution Platform:** WebAssembly (Wasm via Emscripten)  
**User Interface:** HTML5, CSS3, Vanilla JavaScript (Event & Render Adapter)  

---

## 1. Introduction

When navigating the World Wide Web, web browsers provide **Back** and **Forward** buttons that feel effortless and instantaneous. In reality, modern browsers coordinate multiple fundamental Data Structures to maintain a user's browsing session, enable bidirectional traversal, and discard invalid branches when new web pages are visited.

**Trace** is a lightweight, fully functional Browser History Simulator developed for the undergraduate Data Structures laboratory. The core algorithmic engine and all underlying data structures are implemented entirely in **standard C**, while a modern web frontend visualizes state transitions in real time via **WebAssembly**. Trace also includes a native command-line interface (CLI) that runs independently on standard terminal environments.

---

## 2. Problem Statement

Simulating browser navigation history requires solving three technical challenges:
1. **Immediate State Reversibility:** Navigating backward and forward between visited pages must execute in $O(1)$ constant time.
2. **Chronological Session Tracking:** A complete, linear record of the active browsing timeline must be preserved with bidirectional navigation capabilities.
3. **Branch Pruning Invariant:** When a user navigates backward and subsequently visits a new URL, browsers do not maintain a diverging tree of tabs; rather, the forward branch must be permanently severed and all discarded nodes safely deallocated from memory to prevent leaks.

---

## 3. Project Objectives

- Implement an array-backed, fixed-capacity **LIFO Stack** in pure C with strict overflow and underflow guards.
- Implement a dynamic **Doubly Linked List** in pure C using heap-allocated nodes, supporting $O(1)$ tail appends, bidirectional traversal, and forward-branch pruning.
- Implement a coordinating **Browser History Controller** in pure C that orchestrates two stacks (`backStack` and `forwardStack`) and the active Doubly Linked List (`dll`).
- Provide dual execution modes:
  1. A standalone **native terminal CLI** compiled with standard GCC.
  2. A clean, responsive **browser frontend** executing the genuine compiled C engine through WebAssembly.
- Enforce strict memory safety, zero dangling pointers, and thorough dynamic memory deallocation (`free`).

---

## 4. Data Structures Used

Trace combines two classical Data Structures:

| Data Structure | Implementation | Role in Trace | Ownership |
| :--- | :--- | :--- | :--- |
| **Back Stack** | Fixed-capacity Array (`STACK_CAPACITY = 100`) | Stores pages available for backward navigation (LIFO). | Non-owning (borrowed pointers) |
| **Forward Stack** | Fixed-capacity Array (`STACK_CAPACITY = 100`) | Stores pages available for forward navigation (LIFO). | Non-owning (borrowed pointers) |
| **Doubly Linked List** | Bidirectional Linked Nodes (`HistoryNode*`) | Maintains chronological active session history from head to tail. | **Owner** of all heap memory |

---

## 5. Stack Implementation in C (`c_src/stack.h` & `c_src/stack.c`)

The Stack is implemented as a bounded array of pointers storing borrowed references to `HistoryNode` objects:

```c
#define STACK_CAPACITY 100

typedef struct {
    struct HistoryNode* items[STACK_CAPACITY];
    int top; /* -1 represents an empty stack */
} Stack;
```

### Core Operations
- `void stack_init(Stack* stack);`: Sets `top = -1` and nullifies all slots.
- `int stack_push(Stack* stack, struct HistoryNode* node);`: Increments `top` and inserts `node`. Returns 0 on overflow (`top >= STACK_CAPACITY - 1`).
- `struct HistoryNode* stack_pop(Stack* stack);`: Retrieves and returns `items[top]`, nullifies the slot to eliminate stale pointers, and decrements `top`. Returns `NULL` on underflow (`top == -1`).
- `struct HistoryNode* stack_peek(const Stack* stack);`: Returns `items[top]` without modifying `top`.
- `void stack_clear(Stack* stack);`: Nullifies all active slots and resets `top = -1`. Does *not* free nodes, as ownership belongs to the Doubly Linked List.

---

## 6. Doubly Linked List Implementation in C (`c_src/doubly_linked_list.h` & `c_src/doubly_linked_list.c`)

Each visited webpage is represented by a heap-allocated `HistoryNode`:

```c
#define MAX_URL_LEN   256
#define MAX_TITLE_LEN 128

typedef struct HistoryNode {
    char url[MAX_URL_LEN];
    char title[MAX_TITLE_LEN];
    struct HistoryNode* prev;
    struct HistoryNode* next;
} HistoryNode;

typedef struct {
    HistoryNode* head;    /* Earliest visited webpage in session */
    HistoryNode* tail;    /* Latest visited webpage in session */
    HistoryNode* current; /* Webpage currently active in viewport */
    int size;             /* Number of active nodes */
} DoublyLinkedList;
```

### Core Operations
- `HistoryNode* dll_create_node(const char* url, const char* title);`: Allocates `sizeof(HistoryNode)` using `malloc`. Enforces buffer bounds (`< 256` bytes for URL, `< 128` bytes for title). Guarantees null-terminated strings.
- `HistoryNode* dll_append_node(DoublyLinkedList* list, HistoryNode* node);`: Appends `node` to `tail`. If the list is empty, `node` becomes `head`, `tail`, and `current`. Runs in $O(1)$ time.
- `void dll_prune_forward(DoublyLinkedList* list, HistoryNode* fromNode);`: Severs `fromNode->next`, resets `list->tail = fromNode`, and traverses the forward sub-chain, calling `free()` on every discarded node.
- `void dll_clear(DoublyLinkedList* list);`: Traverses from `head` to `tail`, releasing all nodes via `free()`, and resets all list pointers to `NULL` and `size = 0`.

---

## 7. Browser History Controller (`c_src/browser_history.h` & `c_src/browser_history.c`)

The `BrowserHistoryController` coordinates both stacks and the Doubly Linked List to maintain the single-path browsing invariant:

```c
typedef struct {
    Stack backStack;
    Stack forwardStack;
    DoublyLinkedList dll;
} BrowserHistoryController;
```

---

## 8. Visit Algorithm (`bh_visit`)

When visiting a new URL:
1. **Validation:** Check that `url` is non-empty and within buffer limits (`< 256` bytes).
2. **Capacity Guard:** Ensure `stack_size(&bh->backStack) < STACK_CAPACITY` (100) so that `current` can be pushed without overflow.
3. **Pre-Allocation:** Call `dll_create_node(url, title)`. If `malloc` fails, return `NULL` immediately without modifying the existing session.
4. **Active Session Transition:**
   - Push `dll.current` onto `backStack`.
   - Clear `forwardStack` (invalidated forward path).
   - Call `dll_prune_forward(&bh->dll, bh->dll.current)` to deallocate severed forward nodes.
   - Append `newNode` to `dll` (`tail` and `current` now point to `newNode`).
5. **Initial Visit (Empty Session):**
   - Directly append `newNode` to `dll` (`head`, `tail`, and `current` become `newNode`). Stacks remain empty.

---

## 9. Back Navigation Algorithm (`bh_back`)

When the user clicks the Back button:
1. **Guard Condition:** If `stack_is_empty(&bh->backStack)`, return `NULL` (already at earliest page or history is empty).
2. **Transfer:**
   - Push the active page (`dll.current`) onto `forwardStack`.
   - Pop the immediate predecessor from `backStack`.
   - Set `dll.current = previousNode`.
3. **Return:** Return newly active `dll.current`.
4. **Complexity:** $O(1)$ constant time.

---

## 10. Forward Navigation Algorithm (`bh_forward`)

When the user clicks the Forward button:
1. **Guard Condition:** If `stack_is_empty(&bh->forwardStack)`, return `NULL` (already at latest page or branch was pruned).
2. **Transfer:**
   - Push the active page (`dll.current`) onto `backStack`.
   - Pop the immediate successor from `forwardStack`.
   - Set `dll.current = nextNode`.
3. **Return:** Return newly active `dll.current`.
4. **Complexity:** $O(1)$ constant time.

---

## 11. Clear History Algorithm (`bh_clear`)

When the user clears browsing history:
1. Call `stack_clear(&bh->backStack)` to nullify references.
2. Call `stack_clear(&bh->forwardStack)` to nullify references.
3. Call `dll_clear(&bh->dll)`:
   - Iterates through all nodes starting from `head`.
   - Deallocates each node via `free()`.
   - Sets `head = NULL`, `tail = NULL`, `current = NULL`, and `size = 0`.
4. Session returns safely to a blank initial state with zero memory leaks.

---

## 12. Forward History Pruning

Forward history pruning is the signature behavior of web browsers. Consider visiting three pages, moving backward twice, and then visiting a new page:

```
Initial:      [Google] ⇄ [YouTube] ⇄ [Wikipedia (Current)]
After Back*2: [Google (Current)] ⇄ [YouTube] ⇄ [Wikipedia]
              BackStack: []   ForwardStack: [Wikipedia, YouTube]

New Visit (GitHub):
1. Clear ForwardStack: []
2. Sever Google.next: detach YouTube and Wikipedia
3. Free YouTube and Wikipedia nodes from heap memory
4. Append GitHub to Google:
              [Google] ⇄ [GitHub (Current)]
              BackStack: [Google]   ForwardStack: []
```

---

## 13. Memory Allocation and Deallocation

### Memory Ownership Rule
- **The Doubly Linked List is the sole owner** of dynamically allocated `HistoryNode` memory.
- Every node allocated via `malloc` in `dll_create_node` is guaranteed to be freed either by:
  - `dll_prune_forward` (when a forward branch is abandoned).
  - `dll_clear` (when history is cleared or the application exits).
- **The Stacks are non-owning.** They store borrowed pointers. A stack pop or stack clear nullifies its internal array slots without freeing the underlying node.

---

## 14. Worked Example: Step-by-Step State Evolution

| Step | Operation | Viewport (Current) | Back Stack (Top on Right) | Forward Stack (Top on Right) | Doubly Linked List Timeline |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **0** | Initial State | `NULL` (Start Screen) | `[ ]` | `[ ]` | `NULL` |
| **1** | Visit `Google` | `Google` | `[ ]` | `[ ]` | `[Google*]` |
| **2** | Visit `YouTube` | `YouTube` | `[Google]` | `[ ]` | `Google ⇄ [YouTube*]` |
| **3** | Visit `Wikipedia`| `Wikipedia` | `[Google, YouTube]` | `[ ]` | `Google ⇄ YouTube ⇄ [Wikipedia*]` |
| **4** | Back | `YouTube` | `[Google]` | `[Wikipedia]` | `Google ⇄ [YouTube*] ⇄ Wikipedia` |
| **5** | Back | `Google` | `[ ]` | `[Wikipedia, YouTube]` | `[Google*] ⇄ YouTube ⇄ Wikipedia` |
| **6** | Visit `GitHub` | `GitHub` | `[Google]` | `[ ]` *(Pruned)* | `Google ⇄ [GitHub*]` |
| **7** | Clear History | `NULL` (Start Screen) | `[ ]` | `[ ]` | `NULL` *(All freed)* |

*\* Denotes `dll.current` node.*

---

## 15. Time and Space Complexity Analysis

### Time Complexity

| Operation | Complexity | Explanation |
| :--- | :---: | :--- |
| `stack_push`, `stack_pop`, `stack_peek` | $O(1)$ | Direct array index manipulation using `top`. |
| `dll_append_node` | $O(1)$ | Direct pointer updates on `list->tail`. |
| `bh_back` | $O(1)$ | One stack push, one stack pop, pointer assignment. |
| `bh_forward` | $O(1)$ | One stack push, one stack pop, pointer assignment. |
| `bh_visit` (no forward history) | $O(1)$ | One node allocation, one stack push, one DLL append. |
| `bh_visit` (with $f$ forward nodes) | $O(f)$ | Traverses and deallocates $f$ forward nodes during branch pruning. |
| `bh_clear` ($n$ active nodes) | $O(n)$ | Traverses and frees all $n$ active nodes in the Doubly Linked List. |
| Single Node Lookup (`bh_get_history_node_at(i)`) | $O(i)$ | Linear pointer traversal from `head`. |
| Full UI Snapshot Sync via Indexed Getters | $O(n^2)$ | Repeatedly querying index $0$ to $n-1$ through the WebAssembly bridge. For $n \le 101$, this takes $<0.1\text{ ms}$. |

### Space Complexity

- **Stack Storage:** $O(C)$ where $C = \text{STACK\_CAPACITY} = 100$ pointers per stack ($2 \times 100 \times 4\text{ bytes} \approx 800\text{ bytes}$).
- **Doubly Linked List Storage:** $O(n)$ where $n$ is the number of active nodes ($n \le 101$). Each `HistoryNode` occupies $\approx 392\text{ bytes}$.
- **Total Memory Footprint:** $\approx 45\text{ KB}$ maximum in C memory, completely lightweight and deterministic.

---

## 16. Advantages of the C Implementation

1. **Academic Rigor:** Satisfies the curricular requirements of CIC-209 by genuinely implementing pointers, structs, and dynamic memory management in C.
2. **Deterministic Memory Footprint:** Bounded buffer lengths prevent memory bloat and stack overflow.
3. **Single Authoritative State:** WebAssembly ensures identical navigation logic between terminal and web interfaces.
4. **Zero JavaScript Re-implementation:** JavaScript does not duplicate navigation logic; it purely renders DOM views.

---

## 17. Limitations

1. **Fixed Maximum History Capacity:** The session timeline supports up to 101 active pages (100 in Back Stack + 1 active). Exceeding this boundary safely rejects new visits until history is cleared.
2. **Local HTTP Server for WebAssembly:** Modern browsers disallow loading `.wasm` over `file:///` due to CORS; a local static server (`python -m http.server`) or GitHub Pages is required.
3. **Simulation Scope:** Trace models navigation mechanics and metadata; it does not embed a full web rendering engine (like WebKit or Blink).

---

## 18. Testing Results

| Test Suite | Scope | Tests Run | Result |
| :--- | :--- | :---: | :---: |
| `tests/c_history_test.c` | Native C Compilation & Unit Verification | 27 | **27 / 27 PASS (100%)** |
| `tests/wasm.test.js` | WebAssembly Bridge Functions | 17 | **17 / 17 PASS (100%)** |
| `tests/wasmController.test.js` | JavaScript Wasm Adapter & Buffer Validation | 8 | **8 / 8 PASS (100%)** |
| `tests/frontendE2E.test.js` | Frontend DOM Event Handling & UI Synchronization | 15 | **15 / 15 PASS (100%)** |
| Legacy Regression Suite | Stack, DLL, Controller & Invariant Baselines | 62 | **62 / 62 PASS (100%)** |
| **Total Automated Tests** | **Full Multi-Engine Verification** | **129** | **129 / 129 PASS (100%)** |

---

## 19. Conclusion

Trace demonstrates that classical Data Structures—Stacks and Doubly Linked Lists—provide the optimal foundation for web browser navigation. By implementing the algorithms in pure C and bridging them to the web using WebAssembly, the project balances academic depth, clean architecture, and modern demonstration capability.

