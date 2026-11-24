/**
 * stack.c
 * 
 * Implementation of fixed-capacity array-backed Stack for Trace.
 * All push, pop, and peek operations run in O(1) constant time.
 */

#include "stack.h"
#include <stddef.h>

void stack_init(Stack* stack) {
    if (stack == NULL) return;
    stack->top = -1;
    for (int i = 0; i < STACK_CAPACITY; i++) {
        stack->items[i] = NULL;
    }
}

int stack_push(Stack* stack, struct HistoryNode* node) {
    if (stack == NULL || node == NULL) {
        return 0; /* Invalid argument */
    }
    if (stack_is_full(stack)) {
        return 0; /* Overflow: cannot push beyond capacity */
    }
    stack->top++;
    stack->items[stack->top] = node;
    return 1; /* Success */
}

struct HistoryNode* stack_pop(Stack* stack) {
    if (stack == NULL || stack_is_empty(stack)) {
        return NULL; /* Underflow: stack is empty */
    }
    struct HistoryNode* popped = stack->items[stack->top];
    stack->items[stack->top] = NULL; /* Nullify to avoid stale references */
    stack->top--;
    return popped;
}

struct HistoryNode* stack_peek(const Stack* stack) {
    if (stack == NULL || stack_is_empty(stack)) {
        return NULL; /* Empty stack */
    }
    return stack->items[stack->top];
}

int stack_is_empty(const Stack* stack) {
    if (stack == NULL) return 1;
    return (stack->top == -1);
}

int stack_is_full(const Stack* stack) {
    if (stack == NULL) return 0;
    return (stack->top >= STACK_CAPACITY - 1);
}

int stack_size(const Stack* stack) {
    if (stack == NULL || stack->top == -1) return 0;
    return stack->top + 1;
}

void stack_clear(Stack* stack) {
    if (stack == NULL) return;
    for (int i = 0; i <= stack->top; i++) {
        stack->items[i] = NULL;
    }
    stack->top = -1;
}

