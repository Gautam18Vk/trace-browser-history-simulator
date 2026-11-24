/**
 * Stack Data Structure (LIFO - Last In, First Out)
 * 
 * Part of the Browser History Simulator project.
 * Implements an array-backed stack designed to manage navigation history
 * (Back Stack and Forward Stack) by storing Node object references.
 */
class Stack {
    /**
     * Initializes an empty stack with an encapsulated array.
     */
    constructor() {
        this.items = [];
    }

    /**
     * Inserts an element at the top of the stack.
     * @param {*} element - The item or Node object reference to insert.
     */
    push(element) {
        this.items.push(element);
    }

    /**
     * Removes and returns the top element of the stack.
     * Safely returns null on underflow (when the stack is empty).
     * @returns {*|null} The popped element or null if empty.
     */
    pop() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items.pop();
    }

    /**
     * Returns the top element without removing it.
     * Safely returns null if the stack is empty.
     * @returns {*|null} The top element or null if empty.
     */
    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[this.items.length - 1];
    }

    /**
     * Checks whether the stack has zero elements.
     * @returns {boolean} True if empty, false otherwise.
     */
    isEmpty() {
        return this.items.length === 0;
    }

    /**
     * Returns the total count of elements currently in the stack.
     * @returns {number} The stack size.
     */
    size() {
        return this.items.length;
    }

    /**
     * Clears all elements from the stack by resetting internal storage.
     */
    clear() {
        this.items = [];
    }

    /**
     * Returns a shallow copy of the stack elements ordered from bottom to top.
     * Protects the internal array from external mutation.
     * @returns {Array} A shallow copy of internal elements.
     */
    toArray() {
        return [...this.items];
    }
}

// Support CommonJS export for Node.js unit testing while remaining
// directly usable as a global class in standard browser <script> tags.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Stack;
}

