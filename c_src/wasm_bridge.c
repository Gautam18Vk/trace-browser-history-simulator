/**
 * wasm_bridge.c
 * 
 * Part of the Trace Browser History Simulator micro project.
 * Thin WebAssembly bridge exposing the pure C navigation engine to JavaScript.
 * 
 * Provides a clean, safe indexed-getter API with Emscripten exports.
 * Maintains a single BrowserHistoryController instance for the browser session.
 */

#include "browser_history.h"
#include <stddef.h>
#include <string.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

/* Single authoritative controller instance for the session */
static BrowserHistoryController g_controller;
static int g_initialized = 0;

/**
 * Initializes the C browser history engine.
 * Safely cleans up any prior allocated history if re-initialized.
 */
EMSCRIPTEN_KEEPALIVE
void bh_wasm_init(void) {
    if (g_initialized) {
        bh_clear(&g_controller);
    }
    bh_init(&g_controller);
    g_initialized = 1;
}

/**
 * Visits a new webpage.
 * 
 * @param url Null-terminated URL string.
 * @param title Null-terminated title string (or NULL/empty).
 * @return 1 on success, 0 on validation, capacity, or allocation failure.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_visit(const char* url, const char* title) {
    if (!g_initialized) {
        bh_wasm_init();
    }
    HistoryNode* node = bh_visit(&g_controller, url, title);
    return (node != NULL) ? 1 : 0;
}

/**
 * Navigates backward to the immediate prior webpage.
 * @return 1 on success, 0 if backward navigation is unavailable.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_back(void) {
    if (!g_initialized) return 0;
    HistoryNode* node = bh_back(&g_controller);
    return (node != NULL) ? 1 : 0;
}

/**
 * Navigates forward to the immediate next webpage.
 * @return 1 on success, 0 if forward navigation is unavailable.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_forward(void) {
    if (!g_initialized) return 0;
    HistoryNode* node = bh_forward(&g_controller);
    return (node != NULL) ? 1 : 0;
}

/**
 * Clears all browsing history across stacks and the Doubly Linked List.
 * Frees all allocated HistoryNode memory cleanly.
 */
EMSCRIPTEN_KEEPALIVE
void bh_wasm_clear(void) {
    if (!g_initialized) return;
    bh_clear(&g_controller);
}

/**
 * Checks whether backward navigation is available.
 * @return 1 if Back is available, 0 otherwise.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_can_go_back(void) {
    if (!g_initialized) return 0;
    return bh_can_go_back(&g_controller);
}

/**
 * Checks whether forward navigation is available.
 * @return 1 if Forward is available, 0 otherwise.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_can_go_forward(void) {
    if (!g_initialized) return 0;
    return bh_can_go_forward(&g_controller);
}

/**
 * Returns the URL of the active webpage, or "" if history is empty.
 */
EMSCRIPTEN_KEEPALIVE
const char* bh_wasm_get_current_url(void) {
    if (!g_initialized) return "";
    HistoryNode* curr = bh_get_current_page(&g_controller);
    return (curr != NULL) ? curr->url : "";
}

/**
 * Returns the Title of the active webpage, or "" if history is empty.
 */
EMSCRIPTEN_KEEPALIVE
const char* bh_wasm_get_current_title(void) {
    if (!g_initialized) return "";
    HistoryNode* curr = bh_get_current_page(&g_controller);
    return (curr != NULL) ? curr->title : "";
}

/**
 * Returns the 0-based chronological index of the current node in the DLL,
 * or -1 if the history is empty.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_get_current_index(void) {
    if (!g_initialized) return -1;
    HistoryNode* current = bh_get_current_page(&g_controller);
    if (current == NULL) return -1;

    HistoryNode* curr = g_controller.dll.head;
    int index = 0;
    while (curr != NULL) {
        if (curr == current) {
            return index;
        }
        curr = curr->next;
        index++;
    }
    return -1;
}

/**
 * Returns the total count of active nodes in the Doubly Linked List timeline.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_get_history_count(void) {
    if (!g_initialized) return 0;
    return bh_get_history_count(&g_controller);
}

/**
 * Returns the URL of the HistoryNode at index (0 = head / earliest).
 */
EMSCRIPTEN_KEEPALIVE
const char* bh_wasm_get_history_url(int index) {
    if (!g_initialized) return "";
    HistoryNode* node = bh_get_history_node_at(&g_controller, index);
    return (node != NULL) ? node->url : "";
}

/**
 * Returns the Title of the HistoryNode at index (0 = head / earliest).
 */
EMSCRIPTEN_KEEPALIVE
const char* bh_wasm_get_history_title(int index) {
    if (!g_initialized) return "";
    HistoryNode* node = bh_get_history_node_at(&g_controller, index);
    return (node != NULL) ? node->title : "";
}

/**
 * Returns whether the node at index is the active (current) page.
 * Uses exact pointer identity rather than URL comparison to distinguish duplicate URLs.
 * 
 * @param index Chronological index (0-based from head).
 * @return 1 if node is current, 0 otherwise.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_get_history_is_current(int index) {
    if (!g_initialized) return 0;
    HistoryNode* node = bh_get_history_node_at(&g_controller, index);
    HistoryNode* current = bh_get_current_page(&g_controller);
    if (node == NULL || current == NULL) return 0;
    return (node == current) ? 1 : 0;
}

/**
 * Returns the number of items currently in the Back Stack.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_get_back_stack_count(void) {
    if (!g_initialized) return 0;
    return bh_get_back_stack_count(&g_controller);
}

/**
 * Returns the Title of the Back Stack item at index (0 = bottom, count - 1 = top).
 */
EMSCRIPTEN_KEEPALIVE
const char* bh_wasm_get_back_stack_title(int index) {
    if (!g_initialized) return "";
    HistoryNode* node = bh_get_back_stack_item(&g_controller, index);
    return (node != NULL) ? node->title : "";
}

/**
 * Returns the URL of the Back Stack item at index (0 = bottom, count - 1 = top).
 */
EMSCRIPTEN_KEEPALIVE
const char* bh_wasm_get_back_stack_url(int index) {
    if (!g_initialized) return "";
    HistoryNode* node = bh_get_back_stack_item(&g_controller, index);
    return (node != NULL) ? node->url : "";
}

/**
 * Returns the number of items currently in the Forward Stack.
 */
EMSCRIPTEN_KEEPALIVE
int bh_wasm_get_forward_stack_count(void) {
    if (!g_initialized) return 0;
    return bh_get_forward_stack_count(&g_controller);
}

/**
 * Returns the Title of the Forward Stack item at index (0 = bottom, count - 1 = top).
 */
EMSCRIPTEN_KEEPALIVE
const char* bh_wasm_get_forward_stack_title(int index) {
    if (!g_initialized) return "";
    HistoryNode* node = bh_get_forward_stack_item(&g_controller, index);
    return (node != NULL) ? node->title : "";
}

/**
 * Returns the URL of the Forward Stack item at index (0 = bottom, count - 1 = top).
 */
EMSCRIPTEN_KEEPALIVE
const char* bh_wasm_get_forward_stack_url(int index) {
    if (!g_initialized) return "";
    HistoryNode* node = bh_get_forward_stack_item(&g_controller, index);
    return (node != NULL) ? node->url : "";
}

