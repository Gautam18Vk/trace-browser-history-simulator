# Viva Preparation Guide — Trace: Browser History Simulator

**Course:** CIC-209 Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Project:** Trace — Browser History Simulator in Pure C & WebAssembly  

---

### Q1: What is the main objective of project Trace?
**Ans:** Trace simulates how modern web browsers manage navigation history using classical Data Structures—specifically two LIFO Stacks (`BackStack` and `ForwardStack`) and an active Doubly Linked List (`DLL`) implemented in standard C.

---

### Q2: Which data structures are used in Trace, and what is the role of each?
**Ans:** 
1. **Back Stack (LIFO):** Stores previous web pages available for backward navigation.
2. **Forward Stack (LIFO):** Stores web pages available for forward navigation after moving backward.
3. **Doubly Linked List:** Maintains the complete chronological timeline of active pages, enabling bidirectional traversal and branch pruning.

---

### Q3: What is a Stack, and what does LIFO mean?
**Ans:** A Stack is a linear data structure that follows the **Last-In, First-Out (LIFO)** principle. The element added most recently is the first one removed. In browser history, the last visited page is the first page visited when clicking Back.

---

### Q4: Why are two stacks needed instead of just one?
**Ans:** One stack can only track backward navigation. When a user clicks Back, the navigated-from page must be saved so the user can navigate Forward again. Two opposing stacks allow instantaneous $O(1)$ transitions in both directions.

---

### Q5: Why is a Doubly Linked List used instead of a Singly Linked List?
**Ans:** A Doubly Linked List has both `next` and `prev` pointers in every node. This enables bidirectional traversal in $O(1)$ time per step. A Singly Linked List only has `next` pointers, making backward traversal require an $O(n)$ linear search from the head.

---

### Q6: Can browser history be implemented using an array instead of a Doubly Linked List?
**Ans:** While possible, arrays require shifting elements ($O(n)$ time) when inserting or removing elements, and reallocating memory when resizing. A linked list allows $O(1)$ appends and $O(1)$ link severing during forward branch pruning without moving other nodes in memory.

---

### Q7: What are the fields of `HistoryNode` in C?
**Ans:**
```c
typedef struct HistoryNode {
    char url[256];
    char title[128];
    struct HistoryNode* prev;
    struct HistoryNode* next;
} HistoryNode;
```
It stores the page URL, title, and bidirectional pointer links.

---

### Q8: What is Stack Overflow and how is it handled in Trace?
**Ans:** Stack overflow occurs when attempting to push onto a full stack. In Trace, `STACK_CAPACITY` is fixed at 100. `stack_push()` checks `stack_is_full()` and returns `0` safely without writing past array bounds.

---

### Q9: What is Stack Underflow and how is it handled in Trace?
**Ans:** Stack underflow occurs when attempting to pop from an empty stack. `stack_pop()` checks `stack_is_empty()` and returns `NULL` safely without illegal memory access.

---

### Q10: How is dynamic memory allocated and deallocated in C?
**Ans:** Nodes are dynamically allocated on the heap using `malloc(sizeof(HistoryNode))` inside `dll_create_node()`. When nodes are pruned or cleared, they are deallocated using `free(node)` inside `dll_free_node()`.

---

### Q11: Who owns the memory of `HistoryNode` objects in Trace?
**Ans:** The **Doubly Linked List owns all node memory**. The Back and Forward stacks store non-owning, borrowed pointers. This single-ownership model prevents double-free errors.

---

### Q12: What do the `head`, `tail`, and `current` pointers represent in the DLL?
**Ans:**
- `head`: Points to the earliest visited page in the session.
- `tail`: Points to the most recently appended page in the session.
- `current`: Points to the webpage currently active in the user's viewport.

---

### Q13: Explain the Back navigation algorithm.
**Ans:**
1. Check if `backStack` is empty (if so, return `NULL`).
2. Push `current` onto `forwardStack`.
3. Pop the top node from `backStack`.
4. Set `current` to the popped node and return it.
All steps run in $O(1)$ time.

---

### Q14: Explain the Forward navigation algorithm.
**Ans:**
1. Check if `forwardStack` is empty (if so, return `NULL`).
2. Push `current` onto `backStack`.
3. Pop the top node from `forwardStack`.
4. Set `current` to the popped node and return it.
All steps run in $O(1)$ time.

---

### Q15: What is Forward History Pruning?
**Ans:** When a user navigates backward and then visits a new website, the forward history is discarded. The forward stack is cleared, the forward branch in the DLL after `current` is severed and freed, and the new page is appended.

---

### Q16: In pruning, why must `forwardStack` be cleared before deallocating nodes?
**Ans:** If discarded nodes were freed while their pointers remained in `forwardStack`, those pointers would become **dangling pointers**, leading to potential use-after-free bugs. Clearing the stack first guarantees pointer safety.

---

### Q17: What happens when the user visits the same URL multiple times consecutively?
**Ans:** Trace allocates a **distinct `HistoryNode`** for each visit. In the Doubly Linked List, both nodes exist consecutively. The current page is tracked by exact pointer comparison (`curr == dll.current`), not by URL string matching.

---

### Q18: What is the Time Complexity of Back and Forward operations?
**Ans:** $O(1)$ constant time. Both operations perform a fixed number of pointer updates and stack push/pop operations.

---

### Q19: What is the Time Complexity of visiting a new page?
**Ans:**
- Without forward history: $O(1)$ constant time (push current, append new node).
- With $f$ forward nodes: $O(f)$ linear time to traverse and `free()` the discarded nodes during branch pruning.

---

### Q20: What is the Space Complexity of the C navigation engine?
**Ans:**
- Stacks: $O(C)$ where $C = 100$ pointers.
- Doubly Linked List: $O(n)$ where $n \le 101$ is the number of active nodes.
- Total memory: Bounded at approximately $45\text{ KB}$, with deterministic upper limits.

---

### Q21: What is the maximum history capacity in Trace?
**Ans:** 101 active pages (100 nodes in the Back Stack + 1 active current node). Once capacity is reached, new visits are rejected safely until history is cleared.

---

### Q22: What is a memory leak, and how does Trace prevent memory leaks?
**Ans:** A memory leak occurs when heap memory allocated with `malloc` is never released with `free`. Trace prevents leaks by freeing severed nodes during branch pruning (`dll_prune_forward`) and freeing all remaining nodes when clearing history (`dll_clear`) and on application exit.

---

### Q23: What is a dangling pointer?
**Ans:** A pointer pointing to memory that has already been deallocated. Trace prevents dangling pointers by nullifying stack slots on `pop` and clearing `forwardStack` before freeing discarded nodes.

---

### Q24: What is WebAssembly (Wasm)?
**Ans:** WebAssembly is a low-level binary code format that runs inside modern web browsers at near-native execution speed. It serves as a compilation target for C/C++ code.

---

### Q25: How does the website execute C code?
**Ans:** Emscripten compiles our C files (`stack.c`, `doubly_linked_list.c`, `browser_history.c`, `wasm_bridge.c`) into `trace.wasm`. The browser downloads and executes this compiled C binary directly in the WebAssembly virtual machine.

---

### Q26: Does JavaScript maintain its own data structures in the browser?
**Ans:** **No.** JavaScript maintains zero independent data structures. JavaScript acts purely as an adapter: it captures DOM button clicks, calls compiled C functions via WebAssembly (`cwrap`), and updates HTML elements using snapshots returned by the C engine.

---

### Q27: Why are HTML, CSS, and JavaScript used in the project?
**Ans:** C cannot natively interact with the browser's Document Object Model (DOM) or style HTML elements. HTML provides layout, CSS provides styling, and JavaScript acts as the bridge connecting user browser events to the compiled C engine.

---

### Q28: Can Trace run without a web browser?
**Ans:** **Yes.** Trace includes a native command-line interface (`c_src/main.c`) that compiles with GCC (`gcc ... -o trace_cli.exe`) and runs directly in the terminal without any web browser, Node.js, or WebAssembly dependencies.

---

### Q29: Why does the web application require a local HTTP server when running locally?
**Ans:** Modern web browsers block loading `.wasm` binary files over the `file:///` protocol due to Cross-Origin Resource Sharing (CORS) security rules. Running a local HTTP server (`python -m http.server 8000`) or deploying to GitHub Pages provides an HTTP origin that allows WebAssembly streaming instantiation.

---

### Q30: What is the mathematical invariant governing populated history states?
**Ans:**
$$\text{backStack.size}() + \text{forwardStack.size}() + 1 = \text{dll.size}()$$
The total number of nodes in the Doubly Linked List always equals the sum of the sizes of both stacks plus the one active webpage.

