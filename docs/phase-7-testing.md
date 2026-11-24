# Phase 7: Functional Verification, Debugging & Quality Review Report — Trace

**Project Name:** Trace (Browser History Simulator)  
**Subject:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Department:** Information Technology  
**Status:** Completed & Verified (Phase 7 of 8)  
**Test Suite:** 51 Baseline Unit Tests + 11 Functional & Invariant Verification Tests (62 Total Passing)

---

## 1. EXECUTIVE SUMMARY

In Phase 7, we performed an exhaustive functional verification, architectural invariant audit, code quality review, and edge-case hardening of **Trace**. All 11 prescribed functional scenarios were validated, core invariants were strictly verified, keyboard accessibility was enhanced, and drawer stacking was optimized.

---

## 2. FUNCTIONAL TEST SCENARIOS MATRIX

| # | Scenario | Expected Behavior | Actual Behavior | Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **Initial State** | Start screen visible, address bar empty, Back/Forward disabled, Stacks and DLL empty, drawers closed, status: "Ready · New session". | Viewport shows `#startScreen`, buttons disabled, Stacks size = 0, DLL size = 0, invariant `empty` holds. | **PASS** |
| **2** | **Visiting Pages** | Sequential visits (Google, YouTube, Wikipedia, GitHub) append to DLL, update BackStack, and leave ForwardStack empty. | Chronological DLL created, BackStack contains bottom-to-top `[Google, YouTube, Wikipedia]`, ForwardStack empty. | **PASS** |
| **3** | **Back Navigation** | Moving backward moves top of BackStack to current, pushes prior current to ForwardStack, preserves DLL order, disables Back at earliest page. | Correct chronological reversal; earliest boundary disabled when at Google; Back button returns `null` at head. | **PASS** |
| **4** | **Forward Navigation** | Moving forward pops from ForwardStack, pushes current to BackStack, advances current in DLL, disables Forward at latest page. | Correct chronological advance; latest boundary disabled when at Wikipedia; Forward button returns `null` at tail. | **PASS** |
| **5** | **Forward History Pruning** | Google $\to$ YouTube $\to$ Wikipedia $\to$ Back $\to$ Back $\to$ GitHub. YouTube and Wikipedia must be discarded. | ForwardStack cleared; forward branch pruned; active DLL is `Google ⇄ GitHub`; Forward button disabled. | **PASS** |
| **6** | **Duplicate URLs** | Repeated visits to same URL create distinct `HistoryNode` instances; only current node is highlighted via reference equality. | Separate Node instances created; DLL size grows linearly; `node === current` highlights only active visit. | **PASS** |
| **7** | **Invalid Input Handling** | Empty strings, whitespace, malformed hostnames (`foo..bar`), unsupported schemes (`ftp:`, `javascript:`, `file:`), HTML tags (`<script>`), and arbitrary text rejected without altering history. | Rejections enforced via strict `isValidHostname` and `normalizeAddress`; zero state corruption or history alteration. | **PASS** |
| **8** | **Clear History** | Resets all data structures across empty, populated, branched, and inspector-active states. | `clearHistory()` resets Stacks and DLL to null/empty; UI restores start screen; address bar clears. | **PASS** |
| **9** | **Keyboard Interaction** | Enter submits address form once; Tab cycles logically; focus indicators visible; Escape dismisses open drawers. | Enter submits address cleanly; global `Escape` key listener dismisses open History/Inspector drawers. | **PASS** |
| **10** | **Panel Non-Interference** | Opening/closing drawers does not alter browsing state; reopening displays fresh data snapshot without stale cache. | Inspection methods (`getHistory`, `getBackStack`, `getForwardStack`) are read-only; zero mutation of state. | **PASS** |
| **11** | **Stress Testing & Invariants** | 50 rapid visits, 25 backs, 10 forwards, and branch switch without memory leaks or invariant violations. | Invariants held across all 86 rapid operations; zero stale references; zero errors. | **PASS** |

---

## 3. ARCHITECTURAL INVARIANTS AUDIT

The following mathematical and structural invariants were asserted and verified after every single state mutation:

1. **Populated State Relation:**
   $$\text{BackStack.size}() + \text{ForwardStack.size}() + 1 = \text{activeDLL.size}()$$
2. **Back Stack Top Agreement:**
   $$\text{BackStack.peek}() \equiv \text{current.prev} \quad (\text{or } \text{current.prev} = \text{null} \text{ if BackStack is empty})$$
3. **Forward Stack Top Agreement:**
   $$\text{ForwardStack.peek}() \equiv \text{current.next} \quad (\text{or } \text{current.next} = \text{null} \text{ if ForwardStack is empty})$$
4. **Boundary Termination:**
   $$\text{head.prev} = \text{null} \quad \text{and} \quad \text{tail.next} = \text{null}$$
5. **Empty History Invariant:**
   $$\text{BackStack.size}() = 0, \quad \text{ForwardStack.size}() = 0, \quad \text{dll.size}() = 0, \quad \text{current} = \text{null}, \quad \text{head} = \text{null}, \quad \text{tail} = \text{null}$$

---

## 4. BUGS DISCOVERED & CORRECTIONS MADE

1. **Permissive Hostname Parsing in `normalizeAddress`:**
   - *Discovery:* Standard `new URL('https://' + trimmed)` accepted consecutive dot inputs (such as `foo..bar`) and trailing dot inputs (such as `test.`), which are malformed domain names.
   - *Correction:* Implemented `isValidHostname(host)` in [`src/app.js`](../src/app.js) with strict DNS label checks, hyphen rules, consecutive dot rejection, and TLD alphabetic length enforcement.
2. **Panel Layer Overlap (Clear History while Inspector Open):**
   - *Discovery:* In `style.css`, `.ds-inspector` had `z-index: 25` while `.history-panel` had `z-index: 20`. When both drawers were opened, the inspector overlay partially occluded the History panel footer where `#btnClearHistory` resides.
   - *Correction:* Updated `.history-panel` to `z-index: 30` in [`style.css`](../style.css), ensuring the History footer is accessible and clear history can be triggered while watching the inspector update in real time.
3. **Keyboard Dismissal for Drawers:**
   - *Discovery:* Users could open History and Inspector drawers with buttons, but dismissing required mouse clicks on close buttons.
   - *Correction:* Implemented a global `Escape` key event listener in `src/app.js` that dismisses any open drawer and returns focus to the address bar.
4. **History Row Cursor Affordance:**
   - *Discovery:* History rows had `cursor: pointer` which suggested they were clickable navigation hyperlinks, whereas history in Trace is an informative chronological session log.
   - *Correction:* Changed `.history-row-item` to `cursor: default` in `style.css`.
5. **Modular Node.js Testability of `app.js`:**
   - *Discovery:* `src/app.js` was previously tightly coupled to browser globals (`document`, `window`), preventing automated testing of normalization logic in Node.js.
   - *Correction:* Added `isBrowser` environment gating and CommonJS exports for `isValidHostname` and `normalizeAddress`.

---

## 5. TIME & SPACE COMPLEXITY ANALYSIS

| Operation | Algorithm / Mechanism | Time Complexity | Viva Explanation |
| :--- | :--- | :---: | :--- |
| **Visit New Page** | Push to BackStack, clear ForwardStack, prune forward DLL, append to DLL | **$O(1)$ amortized** | Array push is $O(1)$ amortized; resetting stack array is $O(1)$; severing DLL link is $O(1)$; appending to tail is $O(1)$. |
| **Back Navigation** | Pop BackStack, push ForwardStack, update current pointer | **$O(1)$** | Array pop and push are $O(1)$; updating node reference is $O(1)$. |
| **Forward Navigation**| Pop ForwardStack, push BackStack, update current pointer | **$O(1)$** | Array pop and push are $O(1)$; updating node reference is $O(1)$. |
| **Clear History** | Reset BackStack, reset ForwardStack, reset DLL pointers | **$O(1)$** | Reinitializing internal arrays and setting head/tail/current to null is $O(1)$. |
| **History Snapshot** | Traverse DLL from head to tail | **$O(N)$** | Must visit each of the $N$ active nodes once to generate the chronological array. |
| **UI Render / Sync** | DOM creation for stacks and DLL list | **$O(N)$** | Rendering $N$ nodes in the DLL and $S$ elements in stacks requires $O(N)$ DOM operations. |

---

## 6. BROWSER MANUAL TESTING CHECKLIST

To verify the application in a live browser without network access or build tooling:

1. Double-click [`index.html`](../index.html) or run `Start-Process index.html` in PowerShell.
2. Confirm the start screen renders cleanly with the Trace logo, empty address bar, and disabled Back/Forward buttons.
3. Click the **Google** quick access card; verify page renders as Google with Google avatar and Back button remains disabled.
4. Enter `youtube.com` in the address bar and press **Enter**; verify Back button enables and status reports `Visited youtube.com`.
5. Click **Inspect data structures** at the bottom right; verify Back Stack shows Google, Forward Stack is empty, and DLL shows `Google ⇄ YouTube`.
6. Click **Back**; verify active page is Google, Forward Stack shows YouTube, Back Stack is empty, and Back button disables.
7. Type `github.com` and click **Visit**; verify Forward Stack becomes empty, Forward button disables, and YouTube disappears from the DLL.
8. Click **History** in the top right; verify only Google and GitHub are listed.
9. Press **Escape** on the keyboard; verify the History drawer closes smoothly.
10. Click **Clear history**; verify all structures reset and start screen reappears.
11. Press `F12` to inspect the browser console; verify **zero console errors or warnings**.

---

## 7. FINAL REGRESSION TEST SUMMARY

```text
============================================================
              AUTOMATED REGRESSION TEST SUMMARY             
============================================================
  tests/stack.test.js                          8 /  8 PASSED
  tests/doublyLinkedList.test.js              18 / 18 PASSED
  tests/browserHistoryController.test.js       25 / 25 PASSED
  tests/integrationVerification.test.js       11 / 11 PASSED
============================================================
  GRAND TOTAL                                 62 / 62 PASSED (100%)
============================================================
```

---

## 8. REMAINING LIMITATIONS

1. **Volatile Session Memory:** As an undergraduate Data Structures micro project, session history is stored purely in client-side memory and resets upon refreshing or closing the browser tab (no `localStorage` or backend database).
2. **Simulated Navigation:** Webpages are simulated representations with domain identity, authentic brand avatars, and titles; real HTTP requests or iframes are intentionally not loaded to maintain zero external dependencies and offline safety.

