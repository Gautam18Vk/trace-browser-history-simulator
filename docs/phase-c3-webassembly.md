# Phase C3: WebAssembly Compilation & C Engine Bridge Report — Trace

**Project Name:** Trace (Browser History Simulator)  
**Subject:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Active Branch:** `c-migration`  
**Compiler:** Emscripten SDK (`emcc 7.0.1`)  
**Status:** Completed & Verified (Phase C3 of C5)

---

## 1. Executive Summary

In Phase C3, we bridged the pure C browser navigation engine to the Web platform using **WebAssembly (Wasm)**. The exact same C source code implementing the Back Stack, Forward Stack, and Doubly Linked List was compiled with Emscripten into portable WebAssembly bytecode (`wasm/trace.wasm`) and a modularized JavaScript loader (`wasm/trace.js`).

A thin, memory-safe interface was implemented in [`c_src/wasm_bridge.c`](../c_src/wasm_bridge.c). The compiled WebAssembly module was verified with **17 automated tests** in [`tests/wasm.test.js`](../tests/wasm.test.js), executing genuine C functions in Node.js with 100% success. All 27 native C tests and 62 legacy JavaScript regression tests continue to pass.

---

## 2. What is WebAssembly and Why is it Used?

In simple, syllabus-friendly terms:
- **WebAssembly (Wasm)** is a binary code format that runs in modern web browsers at near-native speed.
- It is **not** a programming language to write by hand; rather, it is a compilation target for languages like C and C++.
- In Trace, WebAssembly acts as the **bridge**: it allows our academic C Data Structures (`Stack.c`, `DoublyLinkedList.c`, `BrowserHistory.c`) to execute directly inside the browser tab without rewriting the algorithms in JavaScript.
- **JavaScript's role is strictly reduced:** JavaScript in the browser only captures user button clicks, passes strings to the compiled C engine, and renders HTML/CSS based on data returned by the C functions.

---

## 3. WebAssembly Bridge Architecture (`c_src/wasm_bridge.c`)

The bridge maintains a single static `BrowserHistoryController` instance for the user's browsing session:

```c
static BrowserHistoryController g_controller;
static int g_initialized = 0;
```

### Exported C Functions

| Function Name | Parameters | Return Type | Description |
| :--- | :--- | :---: | :--- |
| `bh_wasm_init` | `void` | `void` | Initializes engine. Frees prior history if called repeatedly. |
| `bh_wasm_visit` | `const char* url, const char* title` | `int` | Visits a URL. Returns 1 on success, 0 on error/capacity overflow. |
| `bh_wasm_back` | `void` | `int` | Navigates back. Returns 1 on success, 0 if at earliest page. |
| `bh_wasm_forward` | `void` | `int` | Navigates forward. Returns 1 on success, 0 if at latest page. |
| `bh_wasm_clear` | `void` | `void` | Clears all history and frees all dynamically allocated nodes. |
| `bh_wasm_can_go_back` | `void` | `int` | Returns 1 if Back Stack is non-empty, 0 otherwise. |
| `bh_wasm_can_go_forward` | `void` | `int` | Returns 1 if Forward Stack is non-empty, 0 otherwise. |
| `bh_wasm_get_current_url` | `void` | `const char*` | Returns URL of active webpage, or `""` if history is empty. |
| `bh_wasm_get_current_title` | `void` | `const char*` | Returns Title of active webpage, or `""` if history is empty. |
| `bh_wasm_get_current_index` | `void` | `int` | Returns 0-based index of current node in DLL, or `-1` if empty. |
| `bh_wasm_get_history_count` | `void` | `int` | Returns count of active nodes in the DLL timeline. |
| `bh_wasm_get_history_url` | `int index` | `const char*` | Returns URL at chronological index (0 = head), or `""` if invalid. |
| `bh_wasm_get_history_title` | `int index` | `const char*` | Returns Title at chronological index (0 = head), or `""` if invalid. |
| `bh_wasm_get_history_is_current`| `int index` | `int` | Returns 1 if node at index is `current` (pointer identity), 0 otherwise. |
| `bh_wasm_get_back_stack_count` | `void` | `int` | Returns count of entries in the Back Stack. |
| `bh_wasm_get_back_stack_title` | `int index` | `const char*` | Returns Title in Back Stack (0 = bottom, count - 1 = top). |
| `bh_wasm_get_back_stack_url` | `int index` | `const char*` | Returns URL in Back Stack (0 = bottom, count - 1 = top). |
| `bh_wasm_get_forward_stack_count`| `void` | `int` | Returns count of entries in the Forward Stack. |
| `bh_wasm_get_forward_stack_title`| `int index` | `const char*` | Returns Title in Forward Stack (0 = bottom, count - 1 = top). |
| `bh_wasm_get_forward_stack_url` | `int index` | `const char*` | Returns URL in Forward Stack (0 = bottom, count - 1 = top). |

---

## 4. Compilation Command & Build Script

The WebAssembly module is compiled using Emscripten with `-O2` optimization and modular factory output:

```bash
emcc c_src/stack.c c_src/doubly_linked_list.c c_src/browser_history.c c_src/wasm_bridge.c \
    -O2 \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createTraceModule" \
    -s ENVIRONMENT="web,node" \
    -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap','UTF8ToString','stringToUTF8']" \
    -s EXPORTED_FUNCTIONS="['_bh_wasm_init','_bh_wasm_visit','_bh_wasm_back','_bh_wasm_forward','_bh_wasm_clear','_bh_wasm_can_go_back','_bh_wasm_can_go_forward','_bh_wasm_get_current_url','_bh_wasm_get_current_title','_bh_wasm_get_current_index','_bh_wasm_get_history_count','_bh_wasm_get_history_url','_bh_wasm_get_history_title','_bh_wasm_get_history_is_current','_bh_wasm_get_back_stack_count','_bh_wasm_get_back_stack_title','_bh_wasm_get_back_stack_url','_bh_wasm_get_forward_stack_count','_bh_wasm_get_forward_stack_title','_bh_wasm_get_forward_stack_url']" \
    --no-entry \
    -o wasm/trace.js
```

### Rebuilding with `build-wasm.bat`
A standalone Windows batch script [`build-wasm.bat`](../build-wasm.bat) is provided in the root directory. It automatically checks for `C:\emsdk\emsdk_env.bat`, configures the build environment, and recompiles the WebAssembly assets with a single click or command:

```cmd
.\build-wasm.bat
```

### Generated Asset Sizes
- [`wasm/trace.js`](../wasm/trace.js): **10,558 bytes (~10.3 KB)** (Emscripten modularized JavaScript runtime)
- [`wasm/trace.wasm`](../wasm/trace.wasm): **8,228 bytes (~8.0 KB)** (Compiled C engine WebAssembly bytecode)

---

## 5. Memory Safety & Data Exchange Across Boundaries

1. **Zero Heap References Retained in JS:**
   - The JavaScript bridge calls indexed C getters (e.g. `bh_wasm_get_history_url(i)`).
   - Emscripten converts the returned null-terminated C string into a standard JavaScript UTF-8 string on the fly.
   - JavaScript never stores raw C memory addresses or pointers.
2. **Safe Forward Pruning & Memory Reclaim:**
   - When visiting a page after backward navigation, the C engine severs and calls `free()` on all discarded forward nodes.
   - Because JavaScript only retrieves fresh strings during UI rendering passes, no stale or dangling pointers can ever be referenced.
3. **Accurate Duplicate URL Identification:**
   - Instead of matching URLs by string comparison, `bh_wasm_get_history_is_current(i)` compares the active pointer `dll.current == node`. This guarantees that consecutive visits to the same URL (e.g. Google $\to$ Google) highlight only the genuine active visit in the visual inspector.

---

## 6. GitHub Pages Compatibility

1. **Relative Path Resolution:**
   The compiled module uses relative asset loading. In browser mode, Emscripten automatically locates `trace.wasm` relative to `trace.js` in the `wasm/` directory, working seamlessly when hosted on GitHub Pages under `https://<username>.github.io/<repo-name>/`.
2. **Version Control Inclusion:**
   [`wasm/trace.js`](../wasm/trace.js) and [`wasm/trace.wasm`](../wasm/trace.wasm) are committed directly to the repository so GitHub Pages can serve them statically without requiring a server-side build step.

---

## 7. WebAssembly Test Results (17 / 17 Passed)

Executed via `node tests/wasm.test.js`:

```text
====================================================
   RUNNING PHASE C3 WEBASSEMBLY AUTOMATED TESTS     
====================================================

  [PASS] Test  1: WebAssembly module initialized and C functions bound via cwrap
  [PASS] Test  2: Empty history state verified with safe default returns
  [PASS] Test  3: First visit sets active page and leaves Back and Forward stacks empty
  [PASS] Test  4: Multiple consecutive visits grow BackStack and DLL linearly in C engine
  [PASS] Test  5: Back navigation chronologically traverses prior pages and guards earliest boundary
  [PASS] Test  6: Forward navigation restores navigated-from page and guards latest boundary
  [PASS] Test  7: Forward history pruning (Google -> YouTube -> Wikipedia -> Back*2 -> GitHub) verified in Wasm
  [PASS] Test  8: Duplicate URLs maintain distinct entries and accurate pointer-based current highlights
  [PASS] Test  9: Back and Forward stacks preserve exact bottom-to-top indexed ordering
  [PASS] Test 10: Doubly Linked List timeline preserves chronological sequence from head to tail
  [PASS] Test 11: Current node identity accurately tracked by DLL index and boolean flag
  [PASS] Test 12: Empty and overlength URL strings rejected safely without mutating C state
  [PASS] Test 13: Maximum capacity (101 active nodes) strictly enforced by C engine
  [PASS] Test 14: Clear history releases all C nodes and resets pointers to NULL
  [PASS] Test 15: Engine functions normally and reinitializes cleanly after clearing
  [PASS] Test 16: Out-of-bound index queries safely return empty strings and zero flags
  [PASS] Test 17: Repeated re-initialization and cleanups execute without memory leaks

====================================================
   TEST SUMMARY: 17 / 17 TESTS PASSED (100%)
====================================================
SUCCESS: All WebAssembly bridge tests verified successfully!
```

---

## 8. Complete Multi-Engine Test Summary

```text
============================================================
              MULTI-ENGINE REGRESSION TEST SUMMARY          
============================================================
  1. Native C Tests (c_history_test.c)         27 / 27 PASSED
  2. WebAssembly Bridge Tests (wasm.test.js)   17 / 17 PASSED
  3. Legacy JavaScript Tests (stack, dll, ctrl)62 / 62 PASSED
============================================================
  GRAND TOTAL                                 106 / 106 PASSED (100%)
============================================================
```

---

## 9. Requirements for Phase C4 (Frontend Integration)

In Phase C4, [`src/app.js`](../src/app.js) will be connected to `createTraceModule`:
1. Asynchronously initialize `createTraceModule()`.
2. Replace JavaScript controller calls (`controller.visit()`, `controller.back()`, `controller.forward()`, `controller.clearHistory()`) with Wasm bridge calls.
3. Update `updateUI()` to read stack and DLL entries from `bh_wasm_get_*` getters.
4. Display an understandable loading state while WebAssembly compiles, and disable navigation if WebAssembly fails to load.

