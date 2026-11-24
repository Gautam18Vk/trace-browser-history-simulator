/**
 * doubly_linked_list.h
 * 
 * Part of the Trace Browser History Simulator micro project.
 * Implements a bidirectional Doubly Linked List in standard C.
 * Maintains chronological session history and owns HistoryNode memory allocations.
 */

#ifndef DOUBLY_LINKED_LIST_H
#define DOUBLY_LINKED_LIST_H

#include <stddef.h>

#define MAX_URL_LEN   256
#define MAX_TITLE_LEN 128

typedef struct HistoryNode {
    char url[MAX_URL_LEN];
    char title[MAX_TITLE_LEN];
    struct HistoryNode* prev;
    struct HistoryNode* next;
} HistoryNode;

typedef struct {
    HistoryNode* head;    /* Earliest visited webpage in active timeline */
    HistoryNode* tail;    /* Most recently visited webpage in active timeline */
    HistoryNode* current; /* Webpage currently active in viewport */
    int size;             /* Count of nodes currently in the list */
} DoublyLinkedList;

/**
 * Initializes a DoublyLinkedList to an empty state with NULL pointers and size 0.
 * @param list Pointer to the DoublyLinkedList structure.
 */
void dll_init(DoublyLinkedList* list);

/**
 * Dynamically allocates a new HistoryNode and initializes its URL and title.
 * Validates string lengths strictly; rejects overlength strings without truncation.
 * 
 * @param url Null-terminated URL string (must be < MAX_URL_LEN).
 * @param title Null-terminated title string (must be < MAX_TITLE_LEN, or NULL/empty to use URL).
 * @return Pointer to the allocated HistoryNode, or NULL on validation or allocation failure.
 */
HistoryNode* dll_create_node(const char* url, const char* title);

/**
 * Deallocates a single HistoryNode using free().
 * @param node Pointer to the HistoryNode to free.
 */
void dll_free_node(HistoryNode* node);

/**
 * Appends an already-allocated HistoryNode to the tail of the list.
 * Updates head (if list was empty), tail, current, and size.
 * Does not perform additional memory allocation.
 * 
 * @param list Pointer to the DoublyLinkedList structure.
 * @param node Pointer to the HistoryNode to append.
 * @return Appended HistoryNode pointer, or NULL on error.
 */
HistoryNode* dll_append_node(DoublyLinkedList* list, HistoryNode* node);

/**
 * Prunes and deallocates all nodes following fromNode up to tail.
 * Severs bidirectional links cleanly and updates tail to fromNode.
 * Used during forward history pruning when visiting a new page after moving backward.
 * 
 * @param list Pointer to the DoublyLinkedList structure.
 * @param fromNode Pointer to the node after which all forward nodes are pruned and freed.
 */
void dll_prune_forward(DoublyLinkedList* list, HistoryNode* fromNode);

/**
 * Clears all nodes from the list and releases their memory via free().
 * Resets head, tail, current to NULL, and size to 0. Safe to call on an empty list.
 * 
 * @param list Pointer to the DoublyLinkedList structure.
 */
void dll_clear(DoublyLinkedList* list);

/**
 * Checks whether the Doubly Linked List is empty.
 * @param list Pointer to the DoublyLinkedList structure.
 * @return 1 if empty, 0 otherwise.
 */
int dll_is_empty(const DoublyLinkedList* list);

/**
 * Returns the number of nodes in the list.
 * @param list Pointer to the DoublyLinkedList structure.
 * @return Node count.
 */
int dll_size(const DoublyLinkedList* list);

#endif /* DOUBLY_LINKED_LIST_H */

