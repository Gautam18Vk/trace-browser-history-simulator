# Browser History Simulator: System Architecture & Technical Planning

**Subject:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Department:** Information Technology  
**Project Name:** Browser History Simulator  
**Status:** Approved & Finalized Architectural Specification (Phase 1)

---

## 1. PROJECT OBJECTIVE & SCOPE

### 1.1 Official Project Objective
> "Simulate how a web browser handles navigation. Build a program that lets the user visit new pages, move backward and forward through the browsing history, and clear the forward history when a new page is opened."

### 1.2 Problem Definition
In standard web browsers (such as Google Chrome, Mozilla Firefox, or Apple Safari), navigation through visited URLs is exposed as a bidirectional linear flow with a branch-pruning semantic:
- Moving **backward** retrieves previously visited pages in reverse chronological order (LIFO).
- Moving **forward** restores pages that were navigated back from (LIFO).
- Visiting a **new page** while positioned anywhere behind the latest page permanently truncates and discards all forward navigation history.

This micro project models this behavior faithfully using a dual-structure hybrid approach combining **two Stacks** and an active **Doubly Linked List**.

Webpages are simulated within the application interface; the application is a simulator, not an actual web browser rendering external web traffic.

### 1.3 Functional Requirements Matrix
| Requirement ID | Operation | Description | Target Data Structures |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Visit Page** | Loads a new URL. Pushes the current page to the Back Stack, clears the Forward Stack, severs all forward nodes in the Doubly Linked List, and appends the new page. | Stack + Doubly Linked List |
| **FR-02** | **Navigate Back** | Navigates to the immediate predecessor page. Pushes the current page to the Forward Stack, pops the top page from the Back Stack, and updates the active page pointer. | Stack + Doubly Linked List |
| **FR-03** | **Navigate Forward** | Navigates to the immediate successor page. Pushes the current page to the Back Stack, pops the top page from the Forward Stack, and updates the active page pointer. | Stack + Doubly Linked List |
| **FR-04** | **Clear History** | Flushes all historical records. Empties both stacks, resets the Doubly Linked List pointers to `null`, and returns the viewport to an initial blank state. | Stack + Doubly Linked List |
| **FR-05** | **Simulated Viewport** | Displays simulated web page metadata and content (URL, Page Title, Timestamp, simulated document body) corresponding to the active node. | UI / DOM |
| **FR-06** | **Live Dual Visualizer** | Renders real-time visual states of the Doubly Linked List (displaying `head`, `tail`, `current`, `prev`, `next`) and both Stacks (displaying `top` and LIFO ordering). | UI / DOM |

### 1.4 Technology Constraints
- **Permitted Technologies:** HTML5, CSS3, Vanilla JavaScript (ES6+ classes).
- **Prohibited Technologies:** React, Vue, Angular, Next.js, Node.js backend frameworks, Express, databases, Firebase, external UI kits (Bootstrap/Tailwind via CDN), external data structure libraries.
- **Execution Model:** Completely client-side; runnable locally by opening `index.html` directly in any standard browser via the `file://` protocol without build steps, package managers (`npm`), or local server requirements.

---

## 2. SYSTEM ARCHITECTURE & COMPONENT DESIGN

### 2.1 Architecture Overview Diagram

```
+---------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER                                 |
|  +--------------------+  +----------------------------+  +-------------------------+  |
|  |  Navigation Bar    |  |     Simulated Viewport     |  |   Live DS Visualizer    |  |
|  | [Back] [Fwd] [URL] |  |  (Page Title, Body, Meta)  |  | (Stacks + Doubly List)  |  |
|  +---------+----------+  +--------------+-------------+  +------------+------------+  |
+------------|----------------------------|-----------------------------|---------------+
             | (User Actions)             | (State Updates)             | (Render Sync)
             v                            v                             v
+---------------------------------------------------------------------------------------+
|                               CONTROLLER LAYER (script.js)                            |
|                            BrowserHistoryController                                   |
|   - visit(url, title)       - goBack()        - goForward()       - clearAll()        |
+------------------------------------------+--------------------------------------------+
                                           | Coordinates & Synchronizes
                                           v
+---------------------------------------------------------------------------------------+
|                                  DATA STRUCTURE LAYER                                 |
|                                                                                       |
|   +-----------------------+   Node Object Refs   +--------------------------------+   |
|   |       BackStack       | -------------------> |       DoublyLinkedList         |   |
|   |  - items: Node[]      |                      |  - head: Node reference        |   |
|   |  - LIFO (push/pop)    |                      |  - tail: Node reference        |   |
|   +-----------------------+                      |  - current: Node reference     |   |
|                                                  |                                |   |
|   +-----------------------+   Node Object Refs   |  Node Structure:               |   |
|   |     ForwardStack      | -------------------> |  [ prev | url, title | next ]  |   |
|   |  - items: Node[]      |                      +--------------------------------+   |
|   |  - LIFO (push/pop)    |                                                           |
|   +-----------------------+                                                           |
+---------------------------------------------------------------------------------------+
```

### 2.2 Component Specifications

#### Component A: `Stack` Class
- **Purpose:** Manages the LIFO navigation buffers (`backStack` and `forwardStack`).
- **Internal Storage:** Encapsulated JavaScript Array (`this.items = []`).
- **Public Methods:**
  - `push(element)`: Appends an element to the top of the stack ($O(1)$).
  - `pop()`: Removes and returns the top element; safely returns `null` on underflow ($O(1)$).
  - `peek()`: Returns the top element without removal; returns `null` if empty ($O(1)$).
  - `isEmpty()`: Returns `true` if element count is 0, otherwise `false` ($O(1)$).
  - `size()`: Returns total number of elements ($O(1)$).
  - `clear()`: Reinitializes internal storage to an empty array ($O(1)$).
  - `toArray()`: Returns a shallow copy of items in bottom-to-top order for visualization ($O(N)$).

#### Component B: `Node` Class
- **Purpose:** Represents an individual page entry in the Doubly Linked List.
- **Attributes:**
  - `url` (*String*): The simulated web address (e.g., `https://google.com`).
  - `title` (*String*): Human-readable page title (e.g., `Google Search`).
  - `timestamp` (*String*): Timestamp of the visit for recordkeeping.
  - `prev` (*Node | null*): Pointer to the preceding page in history.
  - `next` (*Node | null*): Pointer to the succeeding page in history.

#### Component C: `DoublyLinkedList` Class
- **Purpose:** Represents the persistent, chronologically ordered sequence of the active browsing path.
- **Pointers:**
  - `head`: Points to the earliest visited active page.
  - `tail`: Points to the most recently appended page in the active chain.
  - `current`: Points to the page currently active in the browser viewport.
- **Public Methods:**
  - `append(url, title)`: Instantiates a new `Node`, links it to `tail`, and updates `tail`.
  - `pruneForward(fromNode)`: Severes forward links (`fromNode.next = null`), resets `tail = fromNode`, discarding orphaned nodes.
  - `clear()`: Sets `head = null`, `tail = null`, `current = null`.
  - `toArray()`: Traverses from `head` to `tail`, returning an ordered array for rendering ($O(N)$).

#### Component D: `BrowserHistoryController`
- **Purpose:** Coordinates the two Stacks and the Doubly Linked List, enforcing system invariants and state synchronization.
- **Public Operations:**
  - `visit(url, title)`: Handles new page visits and branch pruning.
  - `back()`: Handles backward navigation.
  - `forward()`: Handles forward navigation.
  - `clearAll()`: Handles global history reset.
  - `getCurrentPage()`: Returns the currently active `Node`.

#### Component E: Presentation Layer (UI)
- **Navigation Bar:** Back button, Forward button, Address Bar input, Go button, Clear History button.
- **Simulated Viewport:** Renders the page title, simulated URL bar, visit timestamp, and page body.
- **History & Data Structure Visualizer:**
  - Vertical representation of `Back Stack` (top highlighted).
  - Horizontal chain representation of `Doubly Linked List` (showing `prev`, `next`, `head`, `tail`, and `current` marker).
  - Vertical representation of `Forward Stack` (top highlighted).

---

## 3. DATA FLOW & SYSTEM INVARIANTS

### 3.1 Reference Sharing Architecture
A fundamental architectural decision is that **the stacks do not store detached strings or duplicate copies of history items**. 

Instead, both `BackStack` and `ForwardStack` hold direct Node object references to the existing `Node` objects within the `DoublyLinkedList`.

```
Back Stack (References)          Doubly Linked List (Nodes in Memory)          Forward Stack (References)
+-----------------------+     +----------------------------------------+     +-------------------------+
| [Ref to Node B] (Top) | --> | Node A <=======> Node B <=======> Node C | <-- | [Ref to Node C] (Top)   |
| [Ref to Node A]       |     | (head)          (current)        (tail)|     +-------------------------+
+-----------------------+     +----------------------------------------+
```

### 3.2 System Invariants
The system maintains the following mathematical invariants:
1. **Count Invariant:**  
   - **When active history exists (`current !== null`):**  
     $$\text{backStack.size()} + \text{forwardStack.size()} + 1 = \text{totalNodesInActiveDLL}$$
   - **When history is empty (`current === null`):**  
     $$\text{backStack.size()} = 0, \quad \text{forwardStack.size()} = 0, \quad \text{totalNodesInActiveDLL} = 0$$
2. **Backward Pointer Invariant:**  
   When `backStack.isEmpty() === false`, `backStack.peek() === current.prev`.
3. **Forward Pointer Invariant:**  
   When `forwardStack.isEmpty() === false`, `forwardStack.peek() === current.next`.

---

## 4. DETAILED OPERATION WORKFLOWS

### 4.1 VISIT Operation
```
Algorithm: VISIT(url, title)
Input: url (string), title (string)

1. If current !== null:
     a. Push current onto backStack.
     b. Clear forwardStack.
     c. If current.next !== null:
          Call dll.pruneForward(current)
          (Sets current.next = null, tail = current, isolates severed forward nodes)
     d. Create newNode = new Node(url, title)
     e. Link newNode to DLL:
          current.next = newNode
          newNode.prev = current
          tail = newNode
          current = newNode
2. Else (First visit after initialization or clear):
     a. Create newNode = new Node(url, title)
     b. Set head = newNode
     c. Set tail = newNode
     d. Set current = newNode
     e. backStack.clear()
     f. forwardStack.clear()
3. Notify UI to re-render viewport and data structure visualizers.
```

### 4.2 BACK Operation
```
Algorithm: BACK()
Output: Boolean indicating success

1. If backStack.isEmpty():
     Return false (Navigation disabled / no-op)
2. Push current onto forwardStack.
3. Set current = backStack.pop().
4. Notify UI to re-render viewport and data structure visualizers.
5. Return true.
```

### 4.3 FORWARD Operation
```
Algorithm: FORWARD()
Output: Boolean indicating success

1. If forwardStack.isEmpty():
     Return false (Navigation disabled / no-op)
2. Push current onto backStack.
3. Set current = forwardStack.pop().
4. Notify UI to re-render viewport and data structure visualizers.
5. Return true.
```

### 4.4 CLEAR HISTORY Operation
```
Algorithm: CLEAR_HISTORY()

1. backStack.clear()
2. forwardStack.clear()
3. dll.clear() (Sets head = null, tail = null, current = null)
4. Reset UI viewport to initial empty welcome state.
5. Disable both Back and Forward buttons.
6. Re-render visualizer canvases to empty states.
```

### 4.5 Forward-History Deletion & Branch Pruning
When a user goes backward in history and subsequently visits a new URL, the forward path is permanently pruned:
1. `forwardStack.clear()` immediately releases all references to forward nodes.
2. `current.next = null` severs the list connection.
3. In JavaScript, because all references from both the DLL and the Forward Stack are dropped, the JavaScript engine's Garbage Collector automatically reclaims the memory occupied by the orphaned nodes.
4. `tail` is reassigned to `current`, and the new node is appended directly after `current`.

---

## 5. EDGE-CASE ANALYSIS

| Edge Case ID | Scenario | Initial State | Trigger Action | Expected Handling & State Transformation |
| :---: | :--- | :--- | :--- | :--- |
| **EC-01** | **Back when Back Stack is empty** | Single page visited or at earliest page (`head === current`). `backStack.isEmpty() === true`. | User clicks Back. | **No-op.** Back button is disabled in UI. Controller returns `false`. Pointers and stacks remain unchanged. Zero errors. |
| **EC-02** | **Forward when Forward Stack is empty** | At latest page (`tail === current`). `forwardStack.isEmpty() === true`. | User clicks Forward. | **No-op.** Forward button is disabled in UI. Controller returns `false`. Pointers and stacks remain unchanged. Zero errors. |
| **EC-03** | **Visiting the first webpage** | Fresh start or post-clear. `head = tail = current = null`. Both stacks empty. | Visit URL 1. | Creates Node 1. `head = tail = current = Node 1`. Both stacks remain empty. Back/Forward buttons remain disabled. |
| **EC-04** | **Visiting multiple pages consecutively** | Active page A. | Visit B, then visit C. | Linear append: `A <-> B <-> C`. `current = C`. `backStack = [A, B]` (B on top). `forwardStack = []`. Back enabled, Forward disabled. |
| **EC-05** | **Going backward multiple times** | Active page C. `backStack = [A, B]`. | Click Back twice. | 1st Back: `current = B`, `backStack = [A]`, `forwardStack = [C]`.<br>2nd Back: `current = A`, `backStack = []`, `forwardStack = [C, B]` (B on top). Back becomes disabled; Forward remains enabled. |
| **EC-06** | **Going forward multiple times** | Active page A. `forwardStack = [C, B]` (B on top). | Click Forward twice. | 1st Forward: `current = B`, `backStack = [A]`, `forwardStack = [C]`.<br>2nd Forward: `current = C`, `backStack = [A, B]`, `forwardStack = []`. Forward becomes disabled; Back remains enabled. |
| **EC-07** | **Visiting a new page after going backward** | History: `A <-> B <-> C`. `current = B`. `backStack = [A]`, `forwardStack = [C]`. | Visit new Page D. | Node C is pruned (`B.next = null`, `tail = B`). `forwardStack` cleared. Page D appended. State: `A <-> B <-> D`. `current = D`. `backStack = [A, B]`. `forwardStack = []`. |
| **EC-08** | **Backward, Forward, then visit new page** | History: `A <-> B <-> C`. Back to A, Forward to B. `current = B`. `backStack = [A]`, `forwardStack = [C]`. | Visit new Page X. | Node C is pruned. Page X appended after B. State: `A <-> B <-> X`. `current = X`. `backStack = [A, B]`. `forwardStack = []`. |
| **EC-09** | **Visiting duplicate URLs** | Current page is Google. | User inputs Google URL again. | Treated as a distinct session navigation. A new `Node` instance with identical URL but fresh timestamp is created and appended. No nodes are collapsed. |
| **EC-10** | **Clearing history when empty** | `head = tail = current = null`, stacks empty. | Click Clear History. | Safe execution / graceful return. No null-pointer exceptions. UI remains in clean blank state. |
| **EC-11** | **Clearing history with multiple pages** | Multiple nodes in DLL, both stacks populated. | Click Clear History. | Both stacks flushed. `head = tail = current = null`. All DOM visualizers reset to empty. Buttons disabled. |

---

## 6. WORKED NAVIGATION DRY RUNS

### 6.1 Worked Example 1
**Input Sequence:**  
`Visit Google` $\rightarrow$ `Visit YouTube` $\rightarrow$ `Visit Wikipedia` $\rightarrow$ `Back` $\rightarrow$ `Back` $\rightarrow$ `Visit Instagram`

| Step | Action | Doubly Linked List (`head` ... `tail`) | `current` | Back Stack `[bot ... top]` | Forward Stack `[bot ... top]` | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **0** | Initial State | `null` | `null` | `[]` | `[]` | Browser initialized. |
| **1** | Visit Google | `[Google]` | `Google` | `[]` | `[]` | First node; `head = tail = current`. |
| **2** | Visit YouTube | `[Google] <-> [YouTube]` | `YouTube` | `[Google]` | `[]` | `Google` pushed to Back Stack. |
| **3** | Visit Wikipedia | `[Google] <-> [YouTube] <-> [Wikipedia]` | `Wikipedia` | `[Google, YouTube]` | `[]` | `YouTube` pushed to Back Stack. |
| **4** | Click Back | `[Google] <-> [YouTube] <-> [Wikipedia]` | `YouTube` | `[Google]` | `[Wikipedia]` | `Wikipedia` pushed to Forward; `YouTube` popped from Back. |
| **5** | Click Back | `[Google] <-> [YouTube] <-> [Wikipedia]` | `Google` | `[]` | `[Wikipedia, YouTube]` | `YouTube` pushed to Forward; `Google` popped from Back. |
| **6** | Visit Instagram | `[Google] <-> [Instagram]` | `Instagram` | `[Google]` | `[]` | `Google` pushed to Back; Forward cleared; `YouTube` & `Wikipedia` pruned; `Instagram` appended. |

**Final State:**
- **Current Page:** `Instagram`
- **Back Stack:** `[Google]`
- **Forward Stack:** `[]` (Empty)
- **Active Doubly Linked List:** `[Google] <-> [Instagram]` (`head: Google`, `tail: Instagram`, `current: Instagram`)

---

### 6.2 Worked Example 2
**Input Sequence:**  
`Visit Google` $\rightarrow$ `Visit YouTube` $\rightarrow$ `Visit Wikipedia` $\rightarrow$ `Back` $\rightarrow$ `Back` $\rightarrow$ `Forward` $\rightarrow$ `Visit Instagram`

| Step | Action | Doubly Linked List (`head` ... `tail`) | `current` | Back Stack `[bot ... top]` | Forward Stack `[bot ... top]` | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **0** | Initial State | `null` | `null` | `[]` | `[]` | Initialized. |
| **1** | Visit Google | `[Google]` | `Google` | `[]` | `[]` | Node created. |
| **2** | Visit YouTube | `[Google] <-> [YouTube]` | `YouTube` | `[Google]` | `[]` | `Google` pushed to Back. |
| **3** | Visit Wikipedia | `[Google] <-> [YouTube] <-> [Wikipedia]` | `Wikipedia` | `[Google, YouTube]` | `[]` | `YouTube` pushed to Back. |
| **4** | Click Back | `[Google] <-> [YouTube] <-> [Wikipedia]` | `YouTube` | `[Google]` | `[Wikipedia]` | Top of Back (`YouTube`) becomes `current`. |
| **5** | Click Back | `[Google] <-> [YouTube] <-> [Wikipedia]` | `Google` | `[]` | `[Wikipedia, YouTube]` | `current` becomes `Google`. Top of Forward is `YouTube`. |
| **6** | Click Forward | `[Google] <-> [YouTube] <-> [Wikipedia]` | `YouTube` | `[Google]` | `[Wikipedia]` | `Google` pushed to Back; `YouTube` popped from Forward to `current`. |
| **7** | Visit Instagram | `[Google] <-> [YouTube] <-> [Instagram]` | `Instagram` | `[Google, YouTube]` | `[]` | Current `YouTube` pushed to Back; Forward cleared; `Wikipedia` pruned; `Instagram` appended. |

**Final State:**
- **Current Page:** `Instagram`
- **Back Stack:** `[Google, YouTube]` (Top: `YouTube`)
- **Forward Stack:** `[]` (Empty)
- **Active Doubly Linked List:** `[Google] <-> [YouTube] <-> [Instagram]` (`head: Google`, `tail: Instagram`, `current: Instagram`)

---

## 7. TIME AND SPACE COMPLEXITY PLANNING

| Operation | Time Complexity | Auxiliary Space Complexity | Theoretical Explanation |
| :--- | :---: | :---: | :--- |
| **Stack `push()`** | $O(1)$ | $O(1)$ | Appending an item to the end of the array requires constant amortized time. |
| **Stack `pop()`** | $O(1)$ | $O(1)$ | Removing an item from the end of the array requires constant time without shifting elements. |
| **Stack `peek()` / `isEmpty()`** | $O(1)$ | $O(1)$ | Direct index-based property access. |
| **DLL `append()` at tail** | $O(1)$ | $O(1)$ | Because `tail` pointer is maintained, appending a new node is a direct pointer update (`tail.next = node; node.prev = tail; tail = node`). |
| **DLL Forward Pruning** | $O(1)$ *(JS Engine)* <br> *$O(k)$ (Manual GC)* | $O(1)$ | Setting `current.next = null; tail = current;` takes constant time. The $k$ severed nodes are reclaimed automatically by JavaScript garbage collection. |
| **Back Navigation** | $O(1)$ | $O(1)$ | Performs one push, one pop, and scalar pointer reassignments. Strictly constant time. |
| **Forward Navigation** | $O(1)$ | $O(1)$ | Performs one push, one pop, and scalar pointer reassignments. Strictly constant time. |
| **Displaying History (UI Render)** | $O(N)$ | $O(N)$ | Traverses all $N$ active nodes from `head` to `tail` to construct DOM visual nodes. |
| **Clearing All History** | $O(1)$ *(JS Engine)* <br> *$O(N)$ (Manual GC)* | $O(1)$ | Resetting `head = tail = current = null` and clearing stacks executes in $O(1)$ pointer assignments in JavaScript. |

### Overall Space Complexity
Let $N$ be the total count of active history nodes in the Doubly Linked List:
- Memory for $N$ Doubly Linked List nodes: $O(N)$.
- Auxiliary references stored in `BackStack` ($B$) and `ForwardStack` ($F$): $B + F = N - 1 \implies O(N)$.
- **Total System Space Complexity:** $O(N)$ (Linear and optimal).

---

## 8. PROJECT FOLDER STRUCTURE

The project is structured according to the clean 3-tier client architecture with modular source files:

```
DS_project/
├── docs/
│   ├── phase-1-architecture.md        # Comprehensive architectural specification
│   ├── phase-2-stack.md               # Stack implementation report
│   └── phase-3-doubly-linked-list.md  # Doubly Linked List implementation report
├── src/
│   ├── Stack.js                       # Encapsulated array-backed Stack implementation
│   ├── Node.js                        # Doubly Linked List Node class
│   └── DoublyLinkedList.js            # Doubly Linked List implementation
├── tests/
│   ├── stack.test.js                  # Stack unit test suite
│   └── doublyLinkedList.test.js       # Doubly Linked List unit test suite
├── index.html                         # Semantic HTML5 UI layout (Navbar, Viewport, DS Visualizers)
├── style.css                          # Modern, clean CSS3 styling (Flexbox/Grid, Animations)
└── README.md                          # Project overview and test instructions
```

### Architectural Rationale
- **Direct HTML `<script>` Loading:** Each modular file in `src/` is structured with dual-compatibility: it runs directly in standard browser `<script>` tags without build steps, while exporting cleanly via CommonJS (`module.exports`) for isolated testing in Node.js.
- **No External CDN Dependencies:** Guarantees reliable execution even in offline college labs without internet connectivity.

---

## 9. EIGHT-PHASE DEVELOPMENT ROADMAP

```
+-----------------------------------------------------------------------------------+
|                           DEVELOPMENT ROADMAP PHASES                              |
+-----------------------------------------------------------------------------------+
|  [PHASE 1] Requirement Analysis, Architecture & Planning (Complete & Approved)     |
|                                       │                                           |
|                                       ▼                                           |
|  [PHASE 2] Stack Implementation & Unit Testing (Complete & Verified)              |
|                                       │                                           |
|                                       ▼                                           |
|  [PHASE 3] Doubly Linked List Implementation & Unit Testing                        |
|                                       │                                           |
|                                       ▼                                           |
|  [PHASE 4] Browser Navigation Engine & Controller Integration                     |
|                                       │                                           |
|                                       ▼                                           |
|  [PHASE 5] Frontend Structure & Visual Styling (index.html & style.css)          |
|                                       │                                           |
|                                       ▼                                           |
|  [PHASE 6] UI-to-Engine Synchronization (DOM Events & Live Visualizers)           |
|                                       │                                           |
|                                       ▼                                           |
|  [PHASE 7] Rigorous Functional Testing, Edge-Case Verification & Polish           |
|                                       │                                           |
|                                       ▼                                           |
|  [PHASE 8] Documentation, Complexity Analysis & Examiner Viva Preparation         |
+-----------------------------------------------------------------------------------+
```

### Summary of Phases
1. **Phase 1: Architecture & Technical Planning** *(Completed)*: System requirements, mathematical invariants, edge cases, complexity analysis, and roadmap.
2. **Phase 2: Stack Implementation & Unit Testing** *(Completed)*: Array-backed `Stack` class with underflow guards and comprehensive unit tests.
3. **Phase 3: Doubly Linked List Implementation & Unit Testing**: Implement `Node` and `DoublyLinkedList` classes (`append`, `pruneForward`, `clear`) with pointer integrity verification.
4. **Phase 4: Navigation Engine & Controller**: Implement `BrowserHistoryController` coordinating Stacks and DLL, maintaining reference consistency.
5. **Phase 5: Frontend Layout & Visual Styling**: Build semantic HTML5 chrome, simulated viewport, and CSS layouts for Stack and DLL visualization panels.
6. **Phase 6: UI & Engine Integration**: Wire DOM event listeners to controller actions and implement dynamic visual rendering of nodes and pointer badges.
7. **Phase 7: Functional Verification & Debugging**: End-to-end testing of all 11 edge cases, button state validation (enabling/disabling), and UI polish.
8. **Phase 8: Project Report, Viva Prep & Final Documentation**: Author comprehensive `README.md` with project diagrams, complexity tables, and a 20-question viva exam defense guide.

---

## 10. ARCHITECTURAL SIGN-OFF & STATUS

- **Approved By:** Academic Project Mentor / Senior Software Architect
- **Next Step:** Proceed to **Phase 3 (Doubly Linked List Implementation & Unit Testing)** upon user approval.

