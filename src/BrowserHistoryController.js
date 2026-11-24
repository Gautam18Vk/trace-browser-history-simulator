/**
 * BrowserHistoryController Class
 * 
 * Part of the Browser History Simulator micro project.
 * Coordinates the two Stacks (BackStack and ForwardStack) and the active DoublyLinkedList.
 * Enforces single-active-path browser navigation and system state synchronization.
 */

// Environment-agnostic resolution of Stack and DoublyLinkedList dependencies
const StackClass = (typeof Stack !== 'undefined') 
    ? Stack 
    : (typeof require !== 'undefined' ? require('./Stack') : null);

const DoublyLinkedListClass = (typeof DoublyLinkedList !== 'undefined') 
    ? DoublyLinkedList 
    : (typeof require !== 'undefined' ? require('./DoublyLinkedList') : null);

class BrowserHistoryController {
    /**
     * Initializes the controller with BackStack, ForwardStack, and DoublyLinkedList.
     */
    constructor() {
        this.backStack = new StackClass();
        this.forwardStack = new StackClass();
        this.dll = new DoublyLinkedListClass();
    }

    /**
     * Visits a new webpage.
     * Pushes current page to BackStack, clears ForwardStack, prunes forward DLL branch,
     * appends the new page to the DLL, and updates current pointer.
     * 
     * @param {string} url - The URL of the webpage to visit.
     * @param {string} [title=''] - The human-readable title of the webpage.
     * @returns {HistoryNode|null} The newly created HistoryNode, or null if input was invalid.
     */
    visit(url, title = '') {
        // Validate URL: must be a non-empty string
        if (typeof url !== 'string' || url.trim().length === 0) {
            return null; // Reject without mutating browsing state
        }

        const cleanUrl = url.trim();
        const cleanTitle = (typeof title === 'string' && title.trim().length > 0) 
            ? title.trim() 
            : cleanUrl;

        if (this.dll.current !== null) {
            // Step 1: Push active page reference onto BackStack
            this.backStack.push(this.dll.current);

            // Step 2: Clear ForwardStack (forward history invalidated on new branch)
            this.forwardStack.clear();

            // Step 3: Prune forward DLL chain after current
            this.dll.pruneForward(this.dll.current);

            // Step 4: Append new page to DLL (updates tail and current)
            return this.dll.append(cleanUrl, cleanTitle);
        } else {
            // First visit after initialization or clear
            this.backStack.clear();
            this.forwardStack.clear();
            return this.dll.append(cleanUrl, cleanTitle);
        }
    }

    /**
     * Navigates backward to the immediate prior webpage.
     * Pushes current page onto ForwardStack, pops from BackStack, and updates current.
     * 
     * @returns {HistoryNode|null} The newly active HistoryNode, or null if back is unavailable.
     */
    back() {
        if (this.backStack.isEmpty()) {
            return null; // Backward navigation unavailable; state remains unchanged
        }

        // Push current active node onto ForwardStack
        this.forwardStack.push(this.dll.current);

        // Pop immediate prior node from BackStack
        const previousNode = this.backStack.pop();

        // Update active page pointer in DLL
        this.dll.current = previousNode;

        return this.dll.current;
    }

    /**
     * Navigates forward to the immediate next webpage.
     * Pushes current page onto BackStack, pops from ForwardStack, and updates current.
     * 
     * @returns {HistoryNode|null} The newly active HistoryNode, or null if forward is unavailable.
     */
    forward() {
        if (this.forwardStack.isEmpty()) {
            return null; // Forward navigation unavailable; state remains unchanged
        }

        // Push current active node onto BackStack
        this.backStack.push(this.dll.current);

        // Pop immediate successor node from ForwardStack
        const nextNode = this.forwardStack.pop();

        // Update active page pointer in DLL
        this.dll.current = nextNode;

        return this.dll.current;
    }

    /**
     * Clears all browsing history across Stacks and the Doubly Linked List.
     */
    clearHistory() {
        this.backStack.clear();
        this.forwardStack.clear();
        this.dll.clear();
    }

    // ==========================================
    // STATE ACCESS METHODS (Non-mutating)
    // ==========================================

    /**
     * Retrieves the currently active webpage node.
     * @returns {HistoryNode|null}
     */
    getCurrentPage() {
        return this.dll.current;
    }

    /**
     * Checks if backward navigation is currently possible.
     * @returns {boolean}
     */
    canGoBack() {
        return !this.backStack.isEmpty();
    }

    /**
     * Checks if forward navigation is currently possible.
     * @returns {boolean}
     */
    canGoForward() {
        return !this.forwardStack.isEmpty();
    }

    /**
     * Retrieves all active pages in chronological order.
     * @returns {HistoryNode[]} Array of HistoryNode references.
     */
    getHistory() {
        return this.dll.toArray();
    }

    /**
     * Retrieves a safe, display-friendly snapshot of history
     * free of circular prev/next references (JSON serializable).
     * @returns {Array<{url: string, title: string, isCurrent: boolean}>}
     */
    getHistorySnapshot() {
        return this.dll.toArray().map(node => ({
            url: node.url,
            title: node.title,
            isCurrent: node === this.dll.current
        }));
    }

    /**
     * Retrieves the items in the BackStack (bottom-to-top order).
     * @returns {HistoryNode[]}
     */
    getBackStack() {
        return this.backStack.toArray();
    }

    /**
     * Retrieves the items in the ForwardStack (bottom-to-top order).
     * @returns {HistoryNode[]}
     */
    getForwardStack() {
        return this.forwardStack.toArray();
    }
}

// Support CommonJS export for Node.js unit testing while remaining
// directly usable as a global class in standard browser <script> tags.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserHistoryController;
}

