/**
 * browser_history.h
 * 
 * Part of the Trace Browser History Simulator micro project.
 * Implements the coordinating BrowserHistoryController in standard C.
 * Enforces single-active-path navigation across BackStack, ForwardStack, and active DLL.
 */

#ifndef BROWSER_HISTORY_H
#define BROWSER_HISTORY_H

#include "doubly_linked_list.h"
#include "stack.h"

#define MAX_HISTORY_NODES 101 /* 100 in stack + 1 active current node */

typedef struct {
    Stack backStack;
    Stack forwardStack;
    DoublyLinkedList dll;
} BrowserHistoryController;

/**
 * Initializes the controller with empty stacks and an empty Doubly Linked List.
 * @param bh Pointer to BrowserHistoryController structure.
 */
void bh_init(BrowserHistoryController* bh);

/**
 * Visits a new webpage.
 * Validates inputs and capacity, pushes current page to BackStack, clears ForwardStack,
 * prunes forward DLL branch, appends new node, and updates current pointer.
 * 
 * @param bh Pointer to BrowserHistoryController structure.
 * @param url Null-terminated URL string.
 * @param title Null-terminated title string (or NULL/empty to use URL).
 * @return Pointer to newly appended HistoryNode, or NULL if validation/allocation fails.
 */
HistoryNode* bh_visit(BrowserHistoryController* bh, const char* url, const char* title);

/**
 * Navigates backward to the immediate prior webpage.
 * Pushes current page to ForwardStack, pops from BackStack, and updates current pointer.
 * 
 * @param bh Pointer to BrowserHistoryController structure.
 * @return Pointer to newly active HistoryNode, or NULL if back navigation is unavailable.
 */
HistoryNode* bh_back(BrowserHistoryController* bh);

/**
 * Navigates forward to the immediate next webpage.
 * Pushes current page to BackStack, pops from ForwardStack, and updates current pointer.
 * 
 * @param bh Pointer to BrowserHistoryController structure.
 * @return Pointer to newly active HistoryNode, or NULL if forward navigation is unavailable.
 */
HistoryNode* bh_forward(BrowserHistoryController* bh);

/**
 * Clears all browsing history across both stacks and the Doubly Linked List.
 * Frees all allocated HistoryNodes cleanly. Safe to call repeatedly.
 * 
 * @param bh Pointer to BrowserHistoryController structure.
 */
void bh_clear(BrowserHistoryController* bh);

/* ========================================================================= */
/* READ-ONLY STATE ACCESS FUNCTIONS (for CLI and WebAssembly bridge)         */
/* ========================================================================= */

/**
 * Returns the currently active HistoryNode.
 */
HistoryNode* bh_get_current_page(const BrowserHistoryController* bh);

/**
 * Checks if backward navigation is currently possible.
 * @return 1 if Back is available, 0 otherwise.
 */
int bh_can_go_back(const BrowserHistoryController* bh);

/**
 * Checks if forward navigation is currently possible.
 * @return 1 if Forward is available, 0 otherwise.
 */
int bh_can_go_forward(const BrowserHistoryController* bh);

/**
 * Returns the total number of nodes in the active history timeline.
 */
int bh_get_history_count(const BrowserHistoryController* bh);

/**
 * Retrieves the HistoryNode at a 0-based chronological index (from head to tail).
 * @return Pointer to HistoryNode, or NULL if index is out of bounds.
 */
HistoryNode* bh_get_history_node_at(const BrowserHistoryController* bh, int index);

/**
 * Returns the number of items in the Back Stack.
 */
int bh_get_back_stack_count(const BrowserHistoryController* bh);

/**
 * Retrieves a HistoryNode pointer from the Back Stack at a given index (0 = bottom, top = count - 1).
 * @return Pointer to HistoryNode, or NULL if index is out of bounds.
 */
HistoryNode* bh_get_back_stack_item(const BrowserHistoryController* bh, int index);

/**
 * Returns the number of items in the Forward Stack.
 */
int bh_get_forward_stack_count(const BrowserHistoryController* bh);

/**
 * Retrieves a HistoryNode pointer from the Forward Stack at a given index (0 = bottom, top = count - 1).
 * @return Pointer to HistoryNode, or NULL if index is out of bounds.
 */
HistoryNode* bh_get_forward_stack_item(const BrowserHistoryController* bh, int index);

#endif /* BROWSER_HISTORY_H */

