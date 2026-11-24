/**
 * doubly_linked_list.c
 * 
 * Implementation of Doubly Linked List for Trace.
 * Manages dynamically allocated HistoryNode elements and chronological ordering.
 */

#include "doubly_linked_list.h"
#include <stdlib.h>
#include <string.h>

void dll_init(DoublyLinkedList* list) {
    if (list == NULL) return;
    list->head = NULL;
    list->tail = NULL;
    list->current = NULL;
    list->size = 0;
}

HistoryNode* dll_create_node(const char* url, const char* title) {
    if (url == NULL) {
        return NULL;
    }

    size_t urlLen = strlen(url);
    if (urlLen == 0 || urlLen >= MAX_URL_LEN) {
        return NULL; /* Empty or exceeds buffer capacity */
    }

    const char* effectiveTitle = (title != NULL && strlen(title) > 0) ? title : url;
    size_t titleLen = strlen(effectiveTitle);
    if (titleLen >= MAX_TITLE_LEN) {
        return NULL; /* Title exceeds buffer capacity */
    }

    HistoryNode* node = (HistoryNode*)malloc(sizeof(HistoryNode));
    if (node == NULL) {
        return NULL; /* Heap allocation failed */
    }

    /* Safe string copying with guaranteed null termination */
    memcpy(node->url, url, urlLen);
    node->url[urlLen] = '\0';

    memcpy(node->title, effectiveTitle, titleLen);
    node->title[titleLen] = '\0';

    node->prev = NULL;
    node->next = NULL;

    return node;
}

void dll_free_node(HistoryNode* node) {
    if (node != NULL) {
        free(node);
    }
}

HistoryNode* dll_append_node(DoublyLinkedList* list, HistoryNode* node) {
    if (list == NULL || node == NULL) {
        return NULL;
    }

    node->prev = NULL;
    node->next = NULL;

    if (list->head == NULL) {
        /* Empty list: node becomes head, tail, and current */
        list->head = node;
        list->tail = node;
        list->current = node;
    } else {
        /* Non-empty list: link tail to node */
        list->tail->next = node;
        node->prev = list->tail;
        list->tail = node;
        list->current = node;
    }

    list->size++;
    return node;
}

void dll_prune_forward(DoublyLinkedList* list, HistoryNode* fromNode) {
    if (list == NULL || list->head == NULL || fromNode == NULL) {
        return;
    }

    if (fromNode->next == NULL) {
        return; /* fromNode is already tail; no forward nodes to prune */
    }

    HistoryNode* curr = fromNode->next;
    fromNode->next = NULL; /* Sever forward link from current node */
    list->tail = fromNode; /* Update tail to fromNode */

    /* Traverse forward sub-chain and deallocate every severed node */
    while (curr != NULL) {
        HistoryNode* nextNode = curr->next;
        curr->prev = NULL;
        curr->next = NULL;
        dll_free_node(curr);
        list->size--;
        curr = nextNode;
    }
}

void dll_clear(DoublyLinkedList* list) {
    if (list == NULL) return;

    HistoryNode* curr = list->head;
    while (curr != NULL) {
        HistoryNode* nextNode = curr->next;
        curr->prev = NULL;
        curr->next = NULL;
        dll_free_node(curr);
        curr = nextNode;
    }

    list->head = NULL;
    list->tail = NULL;
    list->current = NULL;
    list->size = 0;
}

int dll_is_empty(const DoublyLinkedList* list) {
    if (list == NULL) return 1;
    return (list->head == NULL || list->size == 0);
}

int dll_size(const DoublyLinkedList* list) {
    if (list == NULL) return 0;
    return list->size;
}

