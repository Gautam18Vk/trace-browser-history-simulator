/**
 * browser_history.c
 * 
 * Implementation of BrowserHistoryController for Trace.
 * Coordinates Stacks and Doubly Linked List with strict invariant guarantees.
 */

#include "browser_history.h"
#include <string.h>

void bh_init(BrowserHistoryController* bh) {
    if (bh == NULL) return;
    stack_init(&bh->backStack);
    stack_init(&bh->forwardStack);
    dll_init(&bh->dll);
}

HistoryNode* bh_visit(BrowserHistoryController* bh, const char* url, const char* title) {
    if (bh == NULL || url == NULL) {
        return NULL;
    }

    size_t urlLen = strlen(url);
    if (urlLen == 0 || urlLen >= MAX_URL_LEN) {
        return NULL; /* Empty or exceeds URL buffer */
    }

    if (title != NULL && strlen(title) >= MAX_TITLE_LEN) {
        return NULL; /* Title exceeds buffer */
    }

    /* Capacity check:
     * If current page exists, visiting adds 1 new page after current.
     * The nodes before and including current are: stack_size(&bh->backStack) + 1.
     * Adding the new page makes resulting active history size: stack_size(&bh->backStack) + 2.
     * This cannot exceed MAX_HISTORY_NODES (101).
     * In addition, backStack must have room to push current: stack_size(&bh->backStack) < STACK_CAPACITY.
     */
    if (bh->dll.current != NULL) {
        if (stack_is_full(&bh->backStack)) {
            return NULL; /* Capacity exceeded */
        }
    }

    /* Allocate and initialize new node BEFORE mutating existing history */
    HistoryNode* newNode = dll_create_node(url, title);
    if (newNode == NULL) {
        return NULL; /* Allocation failed; browsing state remains 100% unaltered */
    }

    if (bh->dll.current != NULL) {
        /* Step 1: Push active page reference onto BackStack */
        stack_push(&bh->backStack, bh->dll.current);

        /* Step 2: Clear ForwardStack (forward branch invalidated) */
        stack_clear(&bh->forwardStack);

        /* Step 3: Prune and deallocate forward DLL chain after current */
        dll_prune_forward(&bh->dll, bh->dll.current);

        /* Step 4: Append new page to DLL (updates tail and current) */
        dll_append_node(&bh->dll, newNode);
    } else {
        /* First visit after initialization or clear */
        stack_clear(&bh->backStack);
        stack_clear(&bh->forwardStack);
        dll_append_node(&bh->dll, newNode);
    }

    return newNode;
}

HistoryNode* bh_back(BrowserHistoryController* bh) {
    if (bh == NULL || stack_is_empty(&bh->backStack)) {
        return NULL; /* Backward navigation unavailable */
    }

    if (stack_is_full(&bh->forwardStack)) {
        return NULL; /* Forward stack full */
    }

    /* Push current active node onto ForwardStack */
    stack_push(&bh->forwardStack, bh->dll.current);

    /* Pop immediate predecessor from BackStack */
    HistoryNode* previousNode = stack_pop(&bh->backStack);

    /* Update active page pointer in DLL */
    bh->dll.current = previousNode;

    return bh->dll.current;
}

HistoryNode* bh_forward(BrowserHistoryController* bh) {
    if (bh == NULL || stack_is_empty(&bh->forwardStack)) {
        return NULL; /* Forward navigation unavailable */
    }

    if (stack_is_full(&bh->backStack)) {
        return NULL; /* Back stack full */
    }

    /* Push current active node onto BackStack */
    stack_push(&bh->backStack, bh->dll.current);

    /* Pop immediate successor from ForwardStack */
    HistoryNode* nextNode = stack_pop(&bh->forwardStack);

    /* Update active page pointer in DLL */
    bh->dll.current = nextNode;

    return bh->dll.current;
}

void bh_clear(BrowserHistoryController* bh) {
    if (bh == NULL) return;
    stack_clear(&bh->backStack);
    stack_clear(&bh->forwardStack);
    dll_clear(&bh->dll);
}

HistoryNode* bh_get_current_page(const BrowserHistoryController* bh) {
    if (bh == NULL) return NULL;
    return bh->dll.current;
}

int bh_can_go_back(const BrowserHistoryController* bh) {
    if (bh == NULL) return 0;
    return !stack_is_empty(&bh->backStack);
}

int bh_can_go_forward(const BrowserHistoryController* bh) {
    if (bh == NULL) return 0;
    return !stack_is_empty(&bh->forwardStack);
}

int bh_get_history_count(const BrowserHistoryController* bh) {
    if (bh == NULL) return 0;
    return dll_size(&bh->dll);
}

HistoryNode* bh_get_history_node_at(const BrowserHistoryController* bh, int index) {
    if (bh == NULL || index < 0 || index >= bh->dll.size) {
        return NULL;
    }
    HistoryNode* curr = bh->dll.head;
    for (int i = 0; i < index && curr != NULL; i++) {
        curr = curr->next;
    }
    return curr;
}

int bh_get_back_stack_count(const BrowserHistoryController* bh) {
    if (bh == NULL) return 0;
    return stack_size(&bh->backStack);
}

HistoryNode* bh_get_back_stack_item(const BrowserHistoryController* bh, int index) {
    if (bh == NULL || index < 0 || index > bh->backStack.top) {
        return NULL;
    }
    return bh->backStack.items[index];
}

int bh_get_forward_stack_count(const BrowserHistoryController* bh) {
    if (bh == NULL) return 0;
    return stack_size(&bh->forwardStack);
}

HistoryNode* bh_get_forward_stack_item(const BrowserHistoryController* bh, int index) {
    if (bh == NULL || index < 0 || index > bh->forwardStack.top) {
        return NULL;
    }
    return bh->forwardStack.items[index];
}

