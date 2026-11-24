/**
 * stack.h
 * 
 * Part of the Trace Browser History Simulator micro project.
 * Implements a fixed-capacity, array-backed LIFO stack in standard C.
 * Stores non-owning HistoryNode pointers managed by DoublyLinkedList.
 */

#ifndef STACK_H
#define STACK_H

#define STACK_CAPACITY 100

/* Forward declaration of HistoryNode to prevent circular dependencies */
struct HistoryNode;

typedef struct {
    struct HistoryNode* items[STACK_CAPACITY];
    int top; /* Index of top element; -1 represents an empty stack */
} Stack;

/**
 * Initializes the stack to an empty state.
 * @param stack Pointer to the Stack structure.
 */
void stack_init(Stack* stack);

/**
 * Pushes a HistoryNode pointer onto the top of the stack.
 * @param stack Pointer to the Stack structure.
 * @param node Pointer to the HistoryNode to push.
 * @return 1 on success, 0 on overflow (capacity exceeded) or invalid arguments.
 */
int stack_push(Stack* stack, struct HistoryNode* node);

/**
 * Removes and returns the top HistoryNode pointer from the stack.
 * @param stack Pointer to the Stack structure.
 * @return Popped HistoryNode pointer, or NULL on underflow (empty stack).
 */
struct HistoryNode* stack_pop(Stack* stack);

/**
 * Returns the top HistoryNode pointer without removing it.
 * @param stack Pointer to the Stack structure.
 * @return Top HistoryNode pointer, or NULL if stack is empty.
 */
struct HistoryNode* stack_peek(const Stack* stack);

/**
 * Checks whether the stack is empty.
 * @param stack Pointer to the Stack structure.
 * @return 1 if empty, 0 otherwise.
 */
int stack_is_empty(const Stack* stack);

/**
 * Checks whether the stack has reached its maximum capacity.
 * @param stack Pointer to the Stack structure.
 * @return 1 if full, 0 otherwise.
 */
int stack_is_full(const Stack* stack);

/**
 * Returns the current number of elements in the stack.
 * @param stack Pointer to the Stack structure.
 * @return Total element count (0 to STACK_CAPACITY).
 */
int stack_size(const Stack* stack);

/**
 * Clears all logical entries from the stack.
 * Note: Does NOT free the underlying HistoryNodes, as ownership belongs to the DoublyLinkedList.
 * Clears internal pointer slots to prevent stale pointer retention.
 * @param stack Pointer to the Stack structure.
 */
void stack_clear(Stack* stack);

#endif /* STACK_H */

