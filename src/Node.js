/**
 * HistoryNode Class for Doubly Linked List
 * 
 * Part of the Browser History Simulator micro project.
 * Represents an individual webpage entry in the active browsing history timeline.
 * 
 * Named 'HistoryNode' to avoid collisions with the browser's native DOM 'Node' interface.
 */
class HistoryNode {
    /**
     * Initializes a new history node.
     * @param {string} url - The URL of the webpage.
     * @param {string} [title=''] - The human-readable title of the webpage.
     */
    constructor(url, title = '') {
        this.url = url;
        this.title = title || url;
        this.prev = null;
        this.next = null;
    }
}

// Support CommonJS export for Node.js unit testing while remaining
// directly usable as a global class in standard browser <script> tags.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryNode;
    module.exports.HistoryNode = HistoryNode;
    module.exports.Node = HistoryNode; // Backward compatibility alias
}
