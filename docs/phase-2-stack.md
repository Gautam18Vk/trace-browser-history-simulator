# Phase 2: Stack Implementation & Unit Testing Report

**Subject:** CIC-209 – Data Structures  
**Institution:** Bhagwan Parshuram Institute of Technology (BPIT)  
**Department:** Information Technology  
**Project Name:** Browser History Simulator  
**Status:** Completed & Verified (Phase 2 of 8)

---

## 1. IMPLEMENTATION EXPLANATION

In Phase 2, we implemented the foundational `Stack` class located at [`src/Stack.js`](../src/Stack.js).

The Stack is an array-backed, linear data structure following the strict **LIFO (Last-In, First-Out)** principle:
- It serves as the core operational container for both the **Back Stack** and the **Forward Stack** in the Browser History Simulator.
- In our hybrid architecture, the stack instances do not store duplicate page data; they store direct **Node object references** from the active Doubly Linked List.
- Dual compatibility is built-in: it is usable as an ES6 global class in plain browser `<script>` tags (zero bundlers, zero build steps, runnable over `file://`), while providing CommonJS `module.exports` for offline unit testing in Node.js.

---

## 2. METHOD PURPOSE & BEHAVIOR

| Method | Purpose | Implementation Details | Underflow Handling |
| :--- | :--- | :--- | :--- |
| `constructor()` | Initializes an empty stack. | Sets `this.items = []`. | N/A |
| `push(element)` | Inserts an element or Node object reference onto the top of the stack. | Calls `this.items.push(element)`. Appends to the end of the array. | N/A |
| `pop()` | Removes and returns the top element of the stack. | Checks `isEmpty()`. If empty, returns `null`. Otherwise calls `this.items.pop()`. | Safely returns `null`. Prevents runtime errors. |
| `peek()` | Returns the top element without removing it. | Checks `isEmpty()`. If empty, returns `null`. Otherwise accesses `this.items[this.items.length - 1]`. | Safely returns `null`. |
| `isEmpty()` | Checks whether the stack contains zero elements. | Returns `this.items.length === 0`. | Always safe ($O(1)$ property lookup). |
| `size()` | Returns the total count of elements currently in the stack. | Returns `this.items.length`. | Always safe ($O(1)$ property lookup). |
| `clear()` | Flushes all elements from the stack. | Reassigns `this.items = []`, releasing all stored references for garbage collection. | Safe on empty or populated stack. |
| `toArray()` | Returns a shallow copy of items from bottom to top for visual rendering. | Uses ES6 spread operator `[...this.items]`. Defends internal storage against external mutation. | Safe on empty or populated stack. |

---

## 3. TIME AND SPACE COMPLEXITY

| Operation | Time Complexity | Auxiliary Space Complexity | Theoretical Undergraduate Explanation |
| :--- | :---: | :---: | :--- |
| `push(element)` | **$O(1)$** (Amortized) | $O(1)$ | Elements are inserted at the end of the internal array. No shifting of existing elements in memory is required. |
| `pop()` | **$O(1)$** | $O(1)$ | Elements are removed from the end of the array. No elements need to be shifted. |
| `peek()` | **$O(1)$** | $O(1)$ | Direct index access (`length - 1`) in memory. |
| `isEmpty()` | **$O(1)$** | $O(1)$ | Single integer comparison with 0. |
| `size()` | **$O(1)$** | $O(1)$ | Reading the cached array length property. |
| `clear()` | **$O(1)$** | $O(1)$ | Pointer reassignment to a new empty array literal `[]`. |
| `toArray()` | **$O(N)$** | $O(N)$ | Shallow copies $N$ references into a new array for visualization rendering. |

---

## 4. UNIT TEST EXECUTION RESULTS

All 8 comprehensive tests in [`tests/stack.test.js`](../tests/stack.test.js) were executed using Node.js.

### Actual Terminal Output:
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
```

---

## 5. VIVA EXAMINATION QUESTIONS & ANSWERS

### Q1: What is a Stack?
> **Answer:** A Stack is a linear data structure that follows a restricted access model governed by the LIFO (Last-In, First-Out) principle. All insertions (`push`) and deletions (`pop`) occur at a single designated end, called the **Top**.

### Q2: What is LIFO?
> **Answer:** LIFO stands for **Last-In, First-Out**. It means that the element placed into the stack most recently is the first one to be removed.

### Q3: What is the difference between `push` and `pop`?
> **Answer:**
> - `push(element)` adds an item to the top of the stack and increments the size by 1.
> - `pop()` retrieves and removes the item from the top of the stack and decrements the size by 1.

### Q4: Why are `push` and `pop` $O(1)$ in an array-backed stack?
> **Answer:** In our implementation, the Top of the stack corresponds to the end of the array (`index = length - 1`). Appending or removing an element at the end of an array does not require moving or shifting any preceding elements, giving constant time $O(1)$ performance.

### Q5: Why are we using two separate Stack instances in this project?
> **Answer:**
> 1. **Back Stack:** Holds the pages visited prior to the current page. When clicking Back, the user expects the immediate predecessor (most recent past page) to open first. The LIFO nature of the Back Stack provides this in $O(1)$ time.
> 2. **Forward Stack:** Holds the pages that were navigated back from. If the user decides to go forward again, the page they just retreated from must be restored first. The Forward Stack provides this in $O(1)$ time.

### Q6: Why do our stacks store Node object references instead of plain URL strings?
> **Answer:**
> In our hybrid architecture, the Doubly Linked List is the master timeline holding page metadata and bidirectional links (`prev` and `next`). Storing direct Node object references inside the stacks ensures a **single source of truth**, avoiding data duplication and enabling instantaneous $O(1)$ access to adjacent nodes without having to search through the linked list.

