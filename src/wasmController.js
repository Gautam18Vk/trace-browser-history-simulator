/**
 * src/wasmController.js
 * 
 * Part of the Trace Browser History Simulator micro project.
 * Thin JavaScript adapter interfacing the browser frontend with the pure C
 * WebAssembly navigation engine (wasm/trace.js + wasm/trace.wasm).
 * 
 * Maintains NO independent Data Structures.
 * Every navigation operation and state inspection delegates directly to compiled C.
 */

// Helper to determine string UTF-8 byte length
function getUtf8ByteLength(str) {
    if (!str || typeof str !== 'string') return 0;
    if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(str).length;
    }
    return unescape(encodeURIComponent(str)).length;
}

// Resolve Emscripten factory across browser and Node.js environments
let defaultFactory = null;
if (typeof createTraceModule !== 'undefined') {
    defaultFactory = createTraceModule;
} else if (typeof require !== 'undefined') {
    try {
        defaultFactory = require('../wasm/trace.js');
    } catch (e) {
        defaultFactory = null;
    }
}

class WasmBrowserHistoryController {
    /**
     * @param {Function} [moduleFactory] Optional custom module factory.
     */
    constructor(moduleFactory = defaultFactory) {
        this.factory = moduleFactory;
        this.module = null;
        this.ready = false;
        this.c_funcs = {};
    }

    /**
     * Initializes the WebAssembly module asynchronously and binds exported C functions.
     * @param {Object} [customOptions] Optional Emscripten configuration options.
     * @returns {Promise<boolean>} Resolves to true when C engine is initialized and ready.
     */
    async init(customOptions = {}) {
        if (this.ready) return true;

        if (!this.factory && typeof createTraceModule !== 'undefined') {
            this.factory = createTraceModule;
        }

        if (!this.factory) {
            throw new Error('WebAssembly factory createTraceModule is not available.');
        }

        const defaultOptions = {
            locateFile: (fileName, scriptDir) => {
                if (fileName.endsWith('.wasm')) {
                    return (scriptDir || 'wasm/') + fileName;
                }
                return (scriptDir || '') + fileName;
            }
        };

        const options = Object.assign({}, defaultOptions, customOptions);
        this.module = await this.factory(options);

        // Bind exported C functions via cwrap
        this.c_funcs = {
            init: this.module.cwrap('bh_wasm_init', null, []),
            visit: this.module.cwrap('bh_wasm_visit', 'number', ['string', 'string']),
            back: this.module.cwrap('bh_wasm_back', 'number', []),
            forward: this.module.cwrap('bh_wasm_forward', 'number', []),
            clear: this.module.cwrap('bh_wasm_clear', null, []),
            canGoBack: this.module.cwrap('bh_wasm_can_go_back', 'number', []),
            canGoForward: this.module.cwrap('bh_wasm_can_go_forward', 'number', []),
            getCurrentUrl: this.module.cwrap('bh_wasm_get_current_url', 'string', []),
            getCurrentTitle: this.module.cwrap('bh_wasm_get_current_title', 'string', []),
            getCurrentIndex: this.module.cwrap('bh_wasm_get_current_index', 'number', []),
            getHistoryCount: this.module.cwrap('bh_wasm_get_history_count', 'number', []),
            getHistoryUrl: this.module.cwrap('bh_wasm_get_history_url', 'string', ['number']),
            getHistoryTitle: this.module.cwrap('bh_wasm_get_history_title', 'string', ['number']),
            getHistoryIsCurrent: this.module.cwrap('bh_wasm_get_history_is_current', 'number', ['number']),
            getBackStackCount: this.module.cwrap('bh_wasm_get_back_stack_count', 'number', []),
            getBackStackTitle: this.module.cwrap('bh_wasm_get_back_stack_title', 'string', ['number']),
            getBackStackUrl: this.module.cwrap('bh_wasm_get_back_stack_url', 'string', ['number']),
            getForwardStackCount: this.module.cwrap('bh_wasm_get_forward_stack_count', 'number', []),
            getForwardStackTitle: this.module.cwrap('bh_wasm_get_forward_stack_title', 'string', ['number']),
            getForwardStackUrl: this.module.cwrap('bh_wasm_get_forward_stack_url', 'string', ['number'])
        };

        // Initialize pure C controller state
        this.c_funcs.init();
        this.ready = true;
        return true;
    }

    /**
     * Checks whether the WebAssembly engine is loaded and initialized.
     * @returns {boolean}
     */
    isReady() {
        return this.ready;
    }

    /**
     * Visits a new webpage. Validates byte length buffers and invokes C bh_wasm_visit.
     * 
     * @param {string} url The URL of the webpage.
     * @param {string} [title=''] The human-readable title.
     * @returns {{success: boolean, page?: {url: string, title: string}, error?: string}}
     */
    visit(url, title = '') {
        if (!this.ready) {
            return { success: false, error: 'Engine not initialized' };
        }

        const effectiveTitle = (typeof title === 'string' && title.trim().length > 0)
            ? title.trim()
            : url;

        // Byte length checks matching C buffer limits (including null terminator)
        const urlBytes = getUtf8ByteLength(url);
        const titleBytes = getUtf8ByteLength(effectiveTitle);

        if (urlBytes === 0 || urlBytes >= 256) {
            return { success: false, error: 'URL exceeds maximum supported length (255 bytes)' };
        }
        if (titleBytes >= 128) {
            return { success: false, error: 'Title exceeds maximum supported length (127 bytes)' };
        }

        const ok = this.c_funcs.visit(url, effectiveTitle);
        if (!ok) {
            return { success: false, error: 'Navigation rejected by C engine (capacity or allocation limit)' };
        }

        return {
            success: true,
            page: this.getCurrentPage()
        };
    }

    /**
     * Navigates backward using the C Back Stack.
     * @returns {{url: string, title: string}|null}
     */
    back() {
        if (!this.ready) return null;
        const ok = this.c_funcs.back();
        if (!ok) return null;
        return this.getCurrentPage();
    }

    /**
     * Navigates forward using the C Forward Stack.
     * @returns {{url: string, title: string}|null}
     */
    forward() {
        if (!this.ready) return null;
        const ok = this.c_funcs.forward();
        if (!ok) return null;
        return this.getCurrentPage();
    }

    /**
     * Clears all history in the C engine and frees allocated nodes.
     */
    clearHistory() {
        if (!this.ready) return;
        this.c_funcs.clear();
    }

    /**
     * Checks if backward navigation is currently available.
     * @returns {boolean}
     */
    canGoBack() {
        if (!this.ready) return false;
        return Boolean(this.c_funcs.canGoBack());
    }

    /**
     * Checks if forward navigation is currently available.
     * @returns {boolean}
     */
    canGoForward() {
        if (!this.ready) return false;
        return Boolean(this.c_funcs.canGoForward());
    }

    /**
     * Retrieves the active page from the C engine.
     * @returns {{url: string, title: string}|null}
     */
    getCurrentPage() {
        if (!this.ready) return null;
        const url = this.c_funcs.getCurrentUrl();
        if (!url || url.length === 0) return null;
        return {
            url: url,
            title: this.c_funcs.getCurrentTitle()
        };
    }

    /**
     * Retrieves the 0-based index of the active page in the DLL timeline.
     * @returns {number} -1 if empty.
     */
    getCurrentIndex() {
        if (!this.ready) return -1;
        return this.c_funcs.getCurrentIndex();
    }

    /**
     * Retrieves a chronological snapshot of the active DLL timeline from C.
     * Uses C pointer equality to determine isCurrent reliably.
     * 
     * @returns {Array<{url: string, title: string, isCurrent: boolean, index: number}>}
     */
    getHistory() {
        if (!this.ready) return [];
        const count = this.c_funcs.getHistoryCount();
        const list = [];
        for (let i = 0; i < count; i++) {
            list.push({
                url: this.c_funcs.getHistoryUrl(i),
                title: this.c_funcs.getHistoryTitle(i),
                isCurrent: Boolean(this.c_funcs.getHistoryIsCurrent(i)),
                index: i
            });
        }
        return list;
    }

    /**
     * Returns the total count of active nodes in the DLL timeline.
     * @returns {number}
     */
    getHistoryLength() {
        if (!this.ready) return 0;
        return this.c_funcs.getHistoryCount();
    }

    /**
     * Retrieves the Back Stack contents from C ordered bottom-to-top.
     * Index 0 is bottom; index (count - 1) is top.
     * 
     * @returns {Array<{url: string, title: string}>}
     */
    getBackStack() {
        if (!this.ready) return [];
        const count = this.c_funcs.getBackStackCount();
        const list = [];
        for (let i = 0; i < count; i++) {
            list.push({
                url: this.c_funcs.getBackStackUrl(i),
                title: this.c_funcs.getBackStackTitle(i)
            });
        }
        return list;
    }

    /**
     * Retrieves the Forward Stack contents from C ordered bottom-to-top.
     * Index 0 is bottom; index (count - 1) is top.
     * 
     * @returns {Array<{url: string, title: string}>}
     */
    getForwardStack() {
        if (!this.ready) return [];
        const count = this.c_funcs.getForwardStackCount();
        const list = [];
        for (let i = 0; i < count; i++) {
            list.push({
                url: this.c_funcs.getForwardStackUrl(i),
                title: this.c_funcs.getForwardStackTitle(i)
            });
        }
        return list;
    }
}

// Global browser instance
let wasmController = null;
if (typeof window !== 'undefined') {
    wasmController = new WasmBrowserHistoryController();
    window.wasmController = wasmController;
    window.WasmBrowserHistoryController = WasmBrowserHistoryController;
}

// Export for Node.js test environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WasmBrowserHistoryController,
        getUtf8ByteLength
    };
}

