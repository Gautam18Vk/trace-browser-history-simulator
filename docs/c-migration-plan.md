# Phase C1: Technical Migration Plan — JavaScript to Pure C Engine

**Project:** Trace (Browser History Simulator)  
**Course:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Active Branch:** `c-migration`  
**Status:** Phase C1 Completed (Planning & Architecture Approval)

---

## 1. Executive Summary & Objective

Trace is a browser history simulator built to demonstrate Stack (LIFO) and Doubly Linked List (DLL) operations. Currently, the application logic is implemented in Vanilla JavaScript (ES6+ classes). 

To fulfill academic curriculum requirements, the core Data Structures and navigation algorithms will be migrated to **pure C**. 
- The **presentation layer** (HTML5, CSS3, DOM handling) will be retained.
- The **navigation engine** will genuinely run in **pure C**, compiled to **WebAssembly (Wasm)** for the web browser, and compiled natively to an **executable CLI** via **GCC** for console demonstrations and viva defense.
- JavaScript will be reduced strictly to an event listener and DOM rendering bridge.

---

## 2. Current Architecture vs. Revised Architecture

```
CURRENT ARCHITECTURE (Pure JavaScript):
[Browser UI (HTML/CSS)]
         │
    (DOM Events)
         ▼
[app.js (UI Logic)] ───► [BrowserHistoryController.js]
                                ├──► [Stack.js (BackStack)]
                                ├──► [Stack.js (ForwardStack)]
                                └──► [DoublyLinkedList.js + Node.js]

REVISED ARCHITECTURE (C + WebAssembly Dual Mode):
[Browser UI (HTML/CSS)]                 [Terminal Console (Viva/CLI)]
         │                                            │
    (DOM Events)                                      │
         ▼                                            ▼
[app.js (Bridge & Render)]                   [main.c (CLI Menu Runner)]
         │                                            │
    (Wasm Calls)                                      │
         ▼                                            │
[trace.wasm (WebAssembly Module)]                     │
         └──────────────────────┬─────────────────────┘
                                │
                                ▼
            [Pure C Engine (c_src/)]
            ├── browser_history.c / .h (Controller)
            ├── stack.c / .h           (LIFO Stack)
            └── doubly_linked_list.c / .h (DLL)
```

---

## 3. Functionality to Preserve

All existing user-facing features and behavioral guarantees will remain 100% intact:
1. **Light-Themed Trace Interface:** Unchanged visual design, layout, SVG icons, and typography.
2. **Page Navigation:** Visiting URLs, moving Back, moving Forward, and Clearing history.
3. **Forward History Pruning:** Discarding forward history when a new URL is opened after navigating backward.
4. **Data Structure Inspector:** Real-time visibility into the Back Stack, Forward Stack, and Doubly Linked List nodes with accurate `HEAD`, `CURRENT`, `TAIL` badges.
5. **Architectural Invariants:**
   - $\text{BackStack.size}() + \text{ForwardStack.size}() + 1 = \text{DLL.size}()$ (for non-empty history).
   - $\text{BackStack.top} \equiv \text{current.prev}$.
   - $\text{ForwardStack.top} \equiv \text{current.next}$.
   - Boundary pointers: $\text{head.prev} = \text{null}$, $\text{tail.next} = \text{null}$.

---

## 4. C Data Structure Design (Syllabus-Level)

The implementation adheres strictly to standard, academic C (C99): structs, pointers, static arrays, dynamic memory allocation (`malloc`, `free`), and clean procedural functions.

### 4.1 History Node Structure (`doubly_linked_list.h`)
```c
#define MAX_URL_LEN   256
#define MAX_TITLE_LEN 128

typedef struct HistoryNode {
    char url[MAX_URL_LEN];
    char title[MAX_TITLE_LEN];
    struct HistoryNode* prev;
    struct HistoryNode* next;
} HistoryNode;
```

### 4.2 Doubly Linked List Structure (`doubly_linked_list.h`)
```c
typedef struct {
    HistoryNode* head;
    HistoryNode* tail;
    HistoryNode* current;
    int size;
} DoublyLinkedList;

void dll_init(DoublyLinkedList* list);
HistoryNode* dll_append(DoublyLinkedList* list, const char* url, const char* title);
void dll_prune_forward(DoublyLinkedList* list, HistoryNode* fromNode);
void dll_clear(DoublyLinkedList* list);
int dll_is_empty(const DoublyLinkedList* list);
```

### 4.3 Stack Structure (`stack.h`)
```c
#define STACK_CAPACITY 100

typedef struct {
    HistoryNode* items[STACK_CAPACITY];
    int top; /* -1 represents an empty stack */
} Stack;

void stack_init(Stack* stack);
int stack_push(Stack* stack, HistoryNode* node);
HistoryNode* stack_pop(Stack* stack);
HistoryNode* stack_peek(const Stack* stack);
int stack_is_empty(const Stack* stack);
int stack_size(const Stack* stack);
void stack_clear(Stack* stack);
```

### 4.4 Browser History Controller (`browser_history.h`)
```c
typedef struct {
    Stack backStack;
    Stack forwardStack;
    DoublyLinkedList dll;
} BrowserHistoryController;

void bh_init(BrowserHistoryController* controller);
HistoryNode* bh_visit(BrowserHistoryController* controller, const char* url, const char* title);
HistoryNode* bh_back(BrowserHistoryController* controller);
HistoryNode* bh_forward(BrowserHistoryController* controller);
void bh_clear(BrowserHistoryController* controller);

/* Non-mutating Query Functions */
HistoryNode* bh_get_current_page(const BrowserHistoryController* controller);
int bh_can_go_back(const BrowserHistoryController* controller);
int bh_can_go_forward(const BrowserHistoryController* controller);
```

---

## 5. Memory Management & Ownership Model

In C, rigorous memory ownership avoids memory leaks, double-frees, and dangling pointers:

1. **Clear Ownership Hierarchy:**
   - The **Doubly Linked List (DLL)** is the **sole owner** of dynamically allocated `HistoryNode` memory (`malloc`).
   - The **Back Stack** and **Forward Stack** hold non-owning, borrowed pointers (`HistoryNode*`).
2. **Safe Forward Branch Pruning:**
   - When visiting a new page while `current != tail`:
     1. Discard all entries in `forwardStack` by resetting `top = -1`.
     2. Traverse the forward linked chain starting from `current->next` to `tail`.
     3. Call `free()` on each discarded node.
     4. Set `current->next = NULL` and `tail = current`.
     5. Allocate and append the new page to `tail`.
   - Because all pointers in `forwardStack` belonged exclusively to the pruned forward sub-chain, resetting `forwardStack` guarantees zero dangling pointers.
3. **Safe Clear Operation:**
   - Resets `backStack.top = -1` and `forwardStack.top = -1`.
   - Traverses the entire DLL from `head` to `tail`, safely calling `free()` on each node.
   - Resets `head = NULL`, `tail = NULL`, `current = NULL`, and `size = 0`.
4. **Defensive Guards:**
   - Stack operations check boundaries (`top < STACK_CAPACITY - 1` on push, `top >= 0` on pop).
   - `malloc()` return values are checked for `NULL` before dereferencing.

---

## 6. Dual Execution Strategy

### 6.1 Native Mode (GCC Compilation)
- **Target:** Standalone native CLI binary (`trace_cli.exe`).
- **Purpose:** Interactive terminal demonstration for academic evaluation and viva defense.
- **Entry point:** `c_src/main.c` offering an interactive numerical menu (Visit, Back, Forward, View Timeline, View Stacks, Clear, Exit).
- **Compile command:**
  ```bash
  gcc -Wall -Wextra -O2 c_src/stack.c c_src/doubly_linked_list.c c_src/browser_history.c c_src/main.c -o trace_cli.exe
  ```

### 6.2 Browser Mode (WebAssembly via Emscripten)
- **Target:** `wasm/trace.js` and `wasm/trace.wasm`.
- **Purpose:** Power the live Trace browser interface on GitHub Pages.
- **Compilation approach:** 
  Emscripten (`emcc`) compiles the same `c_src/*.c` files, exporting clean C functions marked with `EMSCRIPTEN_KEEPALIVE`.
- **Compile command:**
  ```bash
  emcc c_src/stack.c c_src/doubly_linked_list.c c_src/browser_history.c c_src/wasm_bridge.c -O2 -s WASM=1 -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap','UTF8ToString','stringToUTF8']" -s EXPORTED_FUNCTIONS="['_bh_wasm_init','_bh_wasm_visit','_bh_wasm_back','_bh_wasm_forward','_bh_wasm_clear','_bh_wasm_can_go_back','_bh_wasm_can_go_forward','_bh_wasm_get_current_url','_bh_wasm_get_current_title','_bh_wasm_get_history_count','_bh_wasm_get_history_url','_bh_wasm_get_history_title','_bh_wasm_get_history_is_current','_bh_wasm_get_back_stack_count','_bh_wasm_get_back_stack_title','_bh_wasm_get_forward_stack_count','_bh_wasm_get_forward_stack_title']" -o wasm/trace.js
  ```
- **JavaScript Bridge:**
  `app.js` calls Wasm functions using `Module.ccall()` or wrapped functions. When rendering the UI, it queries C getter functions to build the exact DOM structure without writing any navigation logic in JavaScript.

---

## 7. Development Environment Audit

Environment inspection executed on 2026-11-25:

| Tool | Status | Version Found | Role in Project |
| :--- | :---: | :--- | :--- |
| **Git** | **Available** | `git version 2.52.0.windows.1` | Version control & branch protection (`c-migration`) |
| **Node.js** | **Available** | `v24.15.0` | Running regression tests & validation scripts |
| **GCC** | **Available** | `MinGW GCC 6.3.0` | Native C compilation & CLI unit verification |
| **Clang** | *Not Found* | — | Optional secondary compiler (not required; GCC is present) |
| **Emscripten (`emcc`)** | *Not Found* | — | Required for WebAssembly compilation in Phase C3 |

### Prerequisites to Install for WebAssembly (Phase C3)
Because GCC is present, **Phase C2 (Native C Data Structures & CLI)** can begin immediately without new installations.

For **Phase C3 (Wasm)**, Emscripten can be installed on Windows via:
```powershell
# Run in PowerShell:
git clone https://github.com/emscripten-core/emsdk.git C:\emsdk
cd C:\emsdk
.\emsdk.bat install latest
.\emsdk.bat activate latest
.\emsdk_env.ps1
```

---

## 8. Migration Roadmap (Five-Phase Plan)

```
Phase C1: Technical Architecture & Migration Plan  ◄ [COMPLETED]
   │
Phase C2: Pure C Data Structures & Native CLI Runner (GCC)
   │       ├── Implement stack.h / stack.c
   │       ├── Implement doubly_linked_list.h / doubly_linked_list.c
   │       ├── Implement browser_history.h / browser_history.c
   │       └── Build native terminal menu (main.c) & verify via GCC
   │
Phase C3: WebAssembly Bridge & Compilation (Emscripten)
   │       ├── Implement wasm_bridge.c
   │       └── Compile trace.wasm and trace.js
   │
Phase C4: Frontend Integration & State Synchronization
   │       └── Connect app.js to trace.wasm, removing JS navigation logic
   │
Phase C5: End-to-End Verification, Memory Leak Check & Documentation
           ├── Run all verification sequences in browser and native CLI
           └── Update project documentation and viva defense materials
```

---

## 9. Baseline Verification Status

Prior to any C implementation, all **62 original automated tests** passed with a 100% success rate:
- `tests/stack.test.js`: 8 / 8 passed
- `tests/doublyLinkedList.test.js`: 18 / 18 passed
- `tests/browserHistoryController.test.js`: 25 / 25 passed
- `tests/integrationVerification.test.js`: 11 / 11 passed

