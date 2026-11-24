/**
 * Doubly Linked List Data Structure
 * 
 * Part of the Browser History Simulator micro project.
 * Maintains the persistent, chronologically ordered active browsing history timeline.
 * 
 * Pointers:
 * - head: The earliest visited page in the active timeline.
 * - tail: The most recently added page in the active timeline.
 * - current: The webpage currently active in the browser viewport.
 */

// Resolve HistoryNode class across Node.js (CommonJS) and browser environments
const HistoryNodeClass = (typeof HistoryNode !== 'undefined') 
    ? HistoryNode 
    : (typeof require !== 'undefined' ? require('./Node') : null);

class DoublyLinkedList {
    /**
     * Initializes an empty Doubly Linked List with null pointers.
     */
    constructor() {
        this.head = null;
        this.tail = null;
        this.current = null;
    }

    /**
     * Appends a new webpage node to the tail of the list.
     * Updates head (if list was empty), tail, and current pointer.
     * 
     * @param {string|HistoryNode} url - The URL string or an existing HistoryNode instance.
     * @param {string} [title=''] - The title of the webpage.
     * @returns {HistoryNode} The newly created and appended HistoryNode reference.
     */
    append(url, title = '') {
        const newNode = (url instanceof HistoryNodeClass) ? url : new HistoryNodeClass(url, title);

        if (this.isEmpty()) {
            this.head = newNode;
            this.tail = newNode;
            this.current = newNode;
        } else {
            this.tail.next = newNode;
            newNode.prev = this.tail;
            this.tail = newNode;
            this.current = newNode;
        }

        return newNode;
    }

    /**
     * Prunes and removes all nodes following the specified node (or current).
     * Used when a user visits a new page after navigating backward.
     * 
     * Disconnects the forward chain cleanly and updates tail to fromNode.
     * Safely handles empty list or when fromNode is already at tail.
     * 
     * @param {HistoryNode} [fromNode=this.current] - The node after which forward history is pruned.
     */
    pruneForward(fromNode = this.current) {
        // Safe handling for empty list or null reference
        if (!this.head || !fromNode) {
            return;
        }

        // If fromNode is already the tail, there are no forward nodes to remove
        if (fromNode.next === null) {
            return;
        }

        // Cleanly disconnect forward chain
        const forwardNode = fromNode.next;
        forwardNode.prev = null; // Sever backward link from severed node
        fromNode.next = null;    // Sever forward link from current node

        // Update tail pointer to the current node
        this.tail = fromNode;
    }

    /**
     * Traverses the list from head to tail and returns an array of HistoryNode references.
     * Preserves chronological order without mutating the linked list.
     * 
     * @returns {HistoryNode[]} Array of HistoryNode object references in chronological order.
     */
    toArray() {
        const nodes = [];
        let curr = this.head;
        while (curr !== null) {
            nodes.push(curr);
            curr = curr.next;
        }
        return nodes;
    }

    /**
     * Resets the linked list to an empty state.
     * Sets head, tail, and current to null.
     */
    clear() {
        this.head = null;
        this.tail = null;
        this.current = null;
    }

    /**
     * Checks whether the list contains zero nodes.
     * @returns {boolean} True if empty, false otherwise.
     */
    isEmpty() {
        return this.head === null;
    }

    /**
     * Counts the total number of nodes in the active list.
     * @returns {number} Total node count.
     */
    size() {
        let count = 0;
        let curr = this.head;
        while (curr !== null) {
            count++;
            curr = curr.next;
        }
        return count;
    }
}

// Support CommonJS export for Node.js unit testing while remaining
// directly usable as a global class in standard browser <script> tags.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DoublyLinkedList;
}
