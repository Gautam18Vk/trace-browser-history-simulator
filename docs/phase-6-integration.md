# Phase 6: Frontend & Navigation Engine Integration Report — Trace

**Project Name:** Trace (Browser History Simulator)  
**Subject:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Department:** Information Technology  
**Status:** Completed & Verified (Phase 6 of 8)

---

## 1. ARCHITECTURE & ROLE OF `app.js`

In Phase 6, we implemented [`src/app.js`](../src/app.js), the central integration layer connecting the HTML5/CSS3 frontend to the underlying `BrowserHistoryController`.

### Architectural Principles:
1. **Single Authoritative Controller:** Exactly one `BrowserHistoryController` instance (`const controller = new BrowserHistoryController()`) manages all browsing operations.
2. **Strict Separation of Concerns:**
   - Data Structures & Algorithms logic resides exclusively within `Stack.js`, `Node.js`, `DoublyLinkedList.js`, and `BrowserHistoryController.js`.
   - UI rendering, DOM event handling, and input normalization reside within `app.js`.
   - The UI never mutates Stack or DLL nodes directly.
3. **Safe DOM Manipulation:** Avoids raw `innerHTML` for user-entered titles/URLs. Uses `document.createElement()`, `textContent`, `classList`, and `appendChild()`.
4. **Offline Zero-Dependency Operation:** Loads via standard `<script>` tags, running seamlessly over `file://` directly in any web browser.

---

## 2. MAIN EVENT HANDLERS & WORKFLOWS

| Control / Action | Event | Handler Logic |
| :--- | :--- | :--- |
| **Address Bar Form** (`#addressBarForm`) | `submit` / Enter key | Normalizes URL (prepends `https://` if protocol omitted, validates `http:`/`https:`), derives readable title from domain, checks if forward history exists, calls `controller.visit(url, title)`, and triggers `updateUI()`. |
| **Quick Access Shortcuts** (`.quick-card`) | `click` | Reads `data-quick-url` and `data-quick-title` from shortcut card and invokes `handleVisit(url, title)`. |
| **Back Button** (`#btnBack`) | `click` | Guards via `controller.canGoBack()`, calls `controller.back()`, reports status (`Moved back to [Title]`), and triggers `updateUI()`. |
| **Forward Button** (`#btnForward`) | `click` | Guards via `controller.canGoForward()`, calls `controller.forward()`, reports status (`Moved forward to [Title]`), and triggers `updateUI()`. |
| **Clear History** (`#btnClearHistory`) | `click` | Calls `controller.clearHistory()`, resets UI to start screen, clears input, reports status (`History cleared`), and triggers `updateUI()`. |
| **History Toggle** (`#btnHistoryToggle`) | `click` | Toggles `#historyPanel.is-hidden` and refreshes history rows. |
| **Inspector Toggle** (`#btnInspectorToggle`)| `click` | Toggles `#dsInspector.is-hidden` and refreshes inspector panes. |
| **Viewport URL Link** (`#pageUrl`) | `click` | `e.preventDefault()` ensures clicking the simulated URL never navigates away from the simulator. |

---

## 3. CENTRAL UI UPDATE WORKFLOW (`updateUI()`)

The `updateUI()` function acts as the single source of truth for the presentation layer. Called after every state change, it synchronizes:

1. **Navigation Button Availability:**
   - `elements.btnBack.disabled = !controller.canGoBack();`
   - `elements.btnForward.disabled = !controller.canGoForward();`
2. **Viewport Screen Switching:**
   - If `controller.getCurrentPage() === null`: Shows `#startScreen`, hides `#activePageScreen`, clears `#urlInput`.
   - If active page exists: Hides `#startScreen`, shows `#activePageScreen`, populates `#pageTitle`, `#pageUrl`, `#urlInput`, and renders matching website avatar icon.
3. **History Panel:**
   - Renders chronological rows using `controller.getHistory()`.
   - Uses **object reference equality** (`node === controller.getCurrentPage()`) to apply `.is-current` highlight.
4. **Data Structure Inspector:**
   - **Back Stack:** Renders LIFO stack from top to bottom; top element receives `.is-top` marker.
   - **Forward Stack:** Renders LIFO stack from top to bottom; top element receives `.is-top` marker.
   - **Doubly Linked List:** Renders node cards connected by `⇄` bidirectional arrow dividers. Dynamically applies combined or distinct badges (`HEAD`, `CURRENT`, `TAIL`) so single-node lists render without label overlap.

---

## 4. FUNCTIONAL DEMONSTRATION & VERIFICATION

### Section 14 Complete Sequence Verification:
1. **Initial State:** Empty session. Start screen active, Back/Forward disabled, stacks empty, DLL empty.
2. **Visit Google:** Back: `[]`, Fwd: `[]`, DLL: `Google`. Active page: Google. Back/Fwd disabled.
3. **Visit YouTube:** Back: `[Google]`, Fwd: `[]`, DLL: `Google <-> YouTube`. Back enabled, Fwd disabled.
4. **Visit Wikipedia:** Back: `[Google, YouTube]`, Fwd: `[]`, DLL: `Google <-> YouTube <-> Wikipedia`.
5. **Click Back:** Current moves to YouTube. Back: `[Google]`, Fwd: `[Wikipedia]`. Both Back and Fwd enabled.
6. **Click Back again:** Current moves to Google. Back: `[]`, Fwd: `[Wikipedia, YouTube]`. Back disabled, Fwd enabled.
7. **Open Inspector:** Back Stack shows empty, Forward Stack shows YouTube on top and Wikipedia at bottom. DLL shows all 3 nodes with Google as CURRENT.
8. **Visit GitHub:**
   - Forward Stack is immediately cleared.
   - Forward DLL branch (`YouTube <-> Wikipedia`) is severed and pruned.
   - `GitHub` is appended after `Google`.
   - State: Back Stack: `[Google]`, Forward Stack: `[]`, DLL: `Google <-> GitHub`.
   - YouTube and Wikipedia disappear completely from active history and visual inspector.
   - Forward button is disabled. Status reports: `Forward history cleared · Visited github.com`.
9. **Clear History:** Controller resets all structures. Start screen is restored, address bar cleared, buttons disabled, status reports `History cleared`.

All steps were executed and programmatically verified with 100% assertion success.

---

## 5. REGRESSION TEST STATUS

All 51 unit tests continue to pass with zero regressions:
- `tests/stack.test.js`: **8 / 8 Passed**
- `tests/doublyLinkedList.test.js`: **18 / 18 Passed**
- `tests/browserHistoryController.test.js`: **25 / 25 Passed**
- **Total:** **51 / 51 Passed (100% Success Rate)**

---

## 6. REMAINING LIMITATIONS

1. **Simulated Navigation:** The application simulates browser navigation semantics for academic demonstration; it intentionally does not perform real HTTP network requests or embed third-party website iframes.
2. **Session Persistence:** History is maintained in volatile memory during the browser tab session, consistent with college Data Structures micro project requirements.

