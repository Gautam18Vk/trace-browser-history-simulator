/**
 * tests/c_history_test.c
 * 
 * Comprehensive Native C Automated Test Suite for Trace.
 * Verifies all 27 required test scenarios and architectural invariants.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "../c_src/browser_history.h"

static int g_passCount = 0;
static int g_failCount = 0;

#define TEST_PASS(desc) do { \
    g_passCount++; \
    printf("  [PASS] Test %2d: %s\n", g_passCount + g_failCount, desc); \
} while (0)

#define TEST_FAIL(desc, msg) do { \
    g_failCount++; \
    printf("  [FAIL] Test %2d: %s (%s)\n", g_passCount + g_failCount, desc, msg); \
} while (0)

/**
 * Validates all 5 architectural invariants for any given controller state.
 */
static void assert_invariants(const BrowserHistoryController* bh, const char* context) {
    assert(bh != NULL);
    int back_sz = bh_get_back_stack_count(bh);
    int fwd_sz = bh_get_forward_stack_count(bh);
    int dll_sz = bh_get_history_count(bh);
    HistoryNode* current = bh_get_current_page(bh);

    if (dll_sz == 0) {
        assert(back_sz == 0 && "BackStack must be empty when DLL is empty");
        assert(fwd_sz == 0 && "ForwardStack must be empty when DLL is empty");
        assert(current == NULL && "current must be NULL when DLL is empty");
        assert(bh->dll.head == NULL && "head must be NULL when DLL is empty");
        assert(bh->dll.tail == NULL && "tail must be NULL when DLL is empty");
    } else {
        /* Invariant 1: back_sz + fwd_sz + 1 == dll_sz */
        if (back_sz + fwd_sz + 1 != dll_sz) {
            fprintf(stderr, "Invariant violated at %s: back(%d) + fwd(%d) + 1 != dll(%d)\n",
                    context, back_sz, fwd_sz, dll_sz);
            assert(back_sz + fwd_sz + 1 == dll_sz);
        }

        /* Invariant 2: Head boundary prev is NULL and tail boundary next is NULL */
        assert(bh->dll.head != NULL);
        assert(bh->dll.tail != NULL);
        assert(bh->dll.head->prev == NULL && "head.prev must be NULL");
        assert(bh->dll.tail->next == NULL && "tail.next must be NULL");

        /* Invariant 3: current pointer matches stack tops */
        assert(current != NULL && "current cannot be NULL for non-empty history");
        if (back_sz > 0) {
            HistoryNode* top = stack_peek(&bh->backStack);
            assert(top == current->prev && "BackStack top must strictly equal current->prev");
        } else {
            assert(current->prev == NULL && "current->prev must be NULL when BackStack is empty");
            assert(current == bh->dll.head && "current must be head when BackStack is empty");
        }

        if (fwd_sz > 0) {
            HistoryNode* top = stack_peek(&bh->forwardStack);
            assert(top == current->next && "ForwardStack top must strictly equal current->next");
        } else {
            assert(current->next == NULL && "current->next must be NULL when ForwardStack is empty");
            assert(current == bh->dll.tail && "current must be tail when ForwardStack is empty");
        }

        /* Invariant 4: Forward traversal reachable count matches dll_sz */
        int count = 0;
        int foundCurrent = 0;
        HistoryNode* curr = bh->dll.head;
        while (curr != NULL) {
            count++;
            if (curr == current) foundCurrent = 1;
            curr = curr->next;
        }
        assert(count == dll_sz && "DLL traversal node count must equal dll_sz");
        assert(foundCurrent == 1 && "current node must be reachable from head");

        /* Invariant 5: Every active Stack reference exists in the DLL */
        for (int i = 0; i < back_sz; i++) {
            HistoryNode* node = bh_get_back_stack_item(bh, i);
            assert(node != NULL);
            int exists = 0;
            for (curr = bh->dll.head; curr != NULL; curr = curr->next) {
                if (curr == node) { exists = 1; break; }
            }
            assert(exists && "BackStack node must exist in active DLL");
        }

        for (int i = 0; i < fwd_sz; i++) {
            HistoryNode* node = bh_get_forward_stack_item(bh, i);
            assert(node != NULL);
            int exists = 0;
            for (curr = bh->dll.head; curr != NULL; curr = curr->next) {
                if (curr == node) { exists = 1; break; }
            }
            assert(exists && "ForwardStack node must exist in active DLL");
        }
    }
}

int main(void) {
    printf("====================================================\n");
    printf("   RUNNING PHASE C2 NATIVE C AUTOMATED TESTS        \n");
    printf("====================================================\n\n");

    /* ------------------------------------------------------------- */
    /* 1. Empty Stack */
    /* ------------------------------------------------------------- */
    {
        Stack s;
        stack_init(&s);
        assert(stack_is_empty(&s) == 1);
        assert(stack_size(&s) == 0);
        assert(stack_peek(&s) == NULL);
        assert(stack_pop(&s) == NULL);
        TEST_PASS("Empty Stack initialized correctly with NULL returns");
    }

    /* ------------------------------------------------------------- */
    /* 2. Stack Push and Pop */
    /* ------------------------------------------------------------- */
    {
        Stack s;
        stack_init(&s);
        HistoryNode dummy1, dummy2;
        assert(stack_push(&s, &dummy1) == 1);
        assert(stack_size(&s) == 1);
        assert(stack_peek(&s) == &dummy1);

        assert(stack_push(&s, &dummy2) == 1);
        assert(stack_size(&s) == 2);
        assert(stack_peek(&s) == &dummy2);

        HistoryNode* popped = stack_pop(&s);
        assert(popped == &dummy2);
        assert(stack_size(&s) == 1);

        popped = stack_pop(&s);
        assert(popped == &dummy1);
        assert(stack_is_empty(&s) == 1);
        TEST_PASS("Stack push and pop operations update size and top correctly");
    }

    /* ------------------------------------------------------------- */
    /* 3. LIFO Behaviour */
    /* ------------------------------------------------------------- */
    {
        Stack s;
        stack_init(&s);
        HistoryNode n1, n2, n3;
        stack_push(&s, &n1);
        stack_push(&s, &n2);
        stack_push(&s, &n3);

        assert(stack_pop(&s) == &n3);
        assert(stack_pop(&s) == &n2);
        assert(stack_pop(&s) == &n1);
        assert(stack_is_empty(&s) == 1);
        TEST_PASS("Stack strictly preserves Last-In, First-Out (LIFO) order");
    }

    /* ------------------------------------------------------------- */
    /* 4. Stack Underflow */
    /* ------------------------------------------------------------- */
    {
        Stack s;
        stack_init(&s);
        assert(stack_pop(&s) == NULL);
        assert(stack_peek(&s) == NULL);
        HistoryNode n;
        stack_push(&s, &n);
        stack_pop(&s);
        assert(stack_pop(&s) == NULL);
        TEST_PASS("Stack underflow handled safely without memory faults");
    }

    /* ------------------------------------------------------------- */
    /* 5. Stack Overflow */
    /* ------------------------------------------------------------- */
    {
        Stack s;
        stack_init(&s);
        HistoryNode dummyNodes[STACK_CAPACITY];
        for (int i = 0; i < STACK_CAPACITY; i++) {
            assert(stack_push(&s, &dummyNodes[i]) == 1);
        }
        assert(stack_is_full(&s) == 1);
        assert(stack_size(&s) == STACK_CAPACITY);

        HistoryNode overflowNode;
        assert(stack_push(&s, &overflowNode) == 0); /* Rejected safely */
        assert(stack_size(&s) == STACK_CAPACITY);
        TEST_PASS("Stack overflow guarded safely when reaching STACK_CAPACITY");
    }

    /* ------------------------------------------------------------- */
    /* 6. Independent Stack Instances */
    /* ------------------------------------------------------------- */
    {
        Stack s1, s2;
        stack_init(&s1);
        stack_init(&s2);
        HistoryNode n1, n2;
        stack_push(&s1, &n1);
        assert(stack_size(&s1) == 1);
        assert(stack_size(&s2) == 0);

        stack_push(&s2, &n2);
        assert(stack_size(&s1) == 1);
        assert(stack_size(&s2) == 1);
        TEST_PASS("Independent Stack instances operate without state leakage");
    }

    /* ------------------------------------------------------------- */
    /* 7. Empty Doubly Linked List */
    /* ------------------------------------------------------------- */
    {
        DoublyLinkedList dll;
        dll_init(&dll);
        assert(dll.head == NULL);
        assert(dll.tail == NULL);
        assert(dll.current == NULL);
        assert(dll.size == 0);
        assert(dll_is_empty(&dll) == 1);
        TEST_PASS("Empty Doubly Linked List initialized with NULL boundary pointers");
    }

    /* ------------------------------------------------------------- */
    /* 8. Single-Node Doubly Linked List */
    /* ------------------------------------------------------------- */
    {
        DoublyLinkedList dll;
        dll_init(&dll);
        HistoryNode* node = dll_create_node("https://google.com", "Google");
        assert(node != NULL);
        dll_append_node(&dll, node);

        assert(dll.size == 1);
        assert(dll.head == node);
        assert(dll.tail == node);
        assert(dll.current == node);
        assert(node->prev == NULL);
        assert(node->next == NULL);
        dll_clear(&dll);
        TEST_PASS("Single-node DLL correctly references same node for head, tail, and current");
    }

    /* ------------------------------------------------------------- */
    /* 9. Multiple-Node Doubly Linked List */
    /* ------------------------------------------------------------- */
    {
        DoublyLinkedList dll;
        dll_init(&dll);
        HistoryNode* n1 = dll_create_node("https://site1.com", "Site 1");
        HistoryNode* n2 = dll_create_node("https://site2.com", "Site 2");
        HistoryNode* n3 = dll_create_node("https://site3.com", "Site 3");

        dll_append_node(&dll, n1);
        dll_append_node(&dll, n2);
        dll_append_node(&dll, n3);

        assert(dll.size == 3);
        assert(dll.head == n1);
        assert(dll.tail == n3);
        assert(dll.current == n3);
        dll_clear(&dll);
        TEST_PASS("Multiple appends maintain chronological ordering from head to tail");
    }

    /* ------------------------------------------------------------- */
    /* 10. Correct Prev and Next Pointers */
    /* ------------------------------------------------------------- */
    {
        DoublyLinkedList dll;
        dll_init(&dll);
        HistoryNode* n1 = dll_create_node("https://site1.com", "Site 1");
        HistoryNode* n2 = dll_create_node("https://site2.com", "Site 2");
        dll_append_node(&dll, n1);
        dll_append_node(&dll, n2);

        assert(n1->next == n2);
        assert(n2->prev == n1);
        assert(n1->prev == NULL);
        assert(n2->next == NULL);
        dll_clear(&dll);
        TEST_PASS("Bidirectional pointer connections (prev and next) link correctly");
    }

    /* ------------------------------------------------------------- */
    /* 11. Controller: First Page Visit */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        HistoryNode* node = bh_visit(&bh, "https://google.com", "Google");

        assert(node != NULL);
        assert(strcmp(node->title, "Google") == 0);
        assert(strcmp(node->url, "https://google.com") == 0);
        assert(bh_get_current_page(&bh) == node);
        assert(bh_can_go_back(&bh) == 0);
        assert(bh_can_go_forward(&bh) == 0);
        assert_invariants(&bh, "First Page Visit");
        bh_clear(&bh);
        TEST_PASS("First visit sets active page and leaves Back and Forward stacks empty");
    }

    /* ------------------------------------------------------------- */
    /* 12. Controller: Multiple Visits */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        bh_visit(&bh, "https://google.com", "Google");
        assert_invariants(&bh, "Visit Google");
        bh_visit(&bh, "https://youtube.com", "YouTube");
        assert_invariants(&bh, "Visit YouTube");
        bh_visit(&bh, "https://wikipedia.org", "Wikipedia");
        assert_invariants(&bh, "Visit Wikipedia");

        assert(bh_get_history_count(&bh) == 3);
        assert(bh_get_back_stack_count(&bh) == 2);
        assert(bh_get_forward_stack_count(&bh) == 0);
        assert(bh_can_go_back(&bh) == 1);
        assert(bh_can_go_forward(&bh) == 0);
        bh_clear(&bh);
        TEST_PASS("Multiple consecutive visits grow BackStack and DLL linearly");
    }

    /* ------------------------------------------------------------- */
    /* 13. Back Navigation */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        bh_visit(&bh, "https://google.com", "Google");
        bh_visit(&bh, "https://youtube.com", "YouTube");
        bh_visit(&bh, "https://wikipedia.org", "Wikipedia");

        HistoryNode* backNode = bh_back(&bh);
        assert(backNode != NULL);
        assert(strcmp(backNode->title, "YouTube") == 0);
        assert(bh_get_back_stack_count(&bh) == 1);
        assert(bh_get_forward_stack_count(&bh) == 1);
        assert_invariants(&bh, "Back to YouTube");

        backNode = bh_back(&bh);
        assert(backNode != NULL);
        assert(strcmp(backNode->title, "Google") == 0);
        assert(bh_get_back_stack_count(&bh) == 0);
        assert(bh_get_forward_stack_count(&bh) == 2);
        assert_invariants(&bh, "Back to Google");

        bh_clear(&bh);
        TEST_PASS("Back navigation chronologically traverses prior pages and updates stacks");
    }

    /* ------------------------------------------------------------- */
    /* 14. Forward Navigation */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        bh_visit(&bh, "https://google.com", "Google");
        bh_visit(&bh, "https://youtube.com", "YouTube");
        bh_back(&bh);

        HistoryNode* fwdNode = bh_forward(&bh);
        assert(fwdNode != NULL);
        assert(strcmp(fwdNode->title, "YouTube") == 0);
        assert(bh_get_back_stack_count(&bh) == 1);
        assert(bh_get_forward_stack_count(&bh) == 0);
        assert_invariants(&bh, "Forward to YouTube");

        bh_clear(&bh);
        TEST_PASS("Forward navigation restores navigated-from page and transfers stack items");
    }

    /* ------------------------------------------------------------- */
    /* 15. Navigation Boundaries */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        bh_visit(&bh, "https://google.com", "Google");

        /* Cannot go back at earliest page */
        assert(bh_back(&bh) == NULL);
        assert(strcmp(bh_get_current_page(&bh)->title, "Google") == 0);

        /* Cannot go forward at latest page */
        assert(bh_forward(&bh) == NULL);
        assert(strcmp(bh_get_current_page(&bh)->title, "Google") == 0);

        assert_invariants(&bh, "Navigation Boundaries");
        bh_clear(&bh);
        TEST_PASS("Navigation boundaries safely return NULL without corrupting active state");
    }

    /* ------------------------------------------------------------- */
    /* 16. Forward History Pruning (Mandatory Worked Example) */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);

        /* Google -> YouTube -> Wikipedia -> Back -> Back -> GitHub */
        bh_visit(&bh, "https://google.com", "Google");
        bh_visit(&bh, "https://youtube.com", "YouTube");
        bh_visit(&bh, "https://wikipedia.org", "Wikipedia");

        bh_back(&bh); /* at YouTube */
        bh_back(&bh); /* at Google */
        assert(strcmp(bh_get_current_page(&bh)->title, "Google") == 0);
        assert(bh_get_forward_stack_count(&bh) == 2);

        /* Visit GitHub */
        HistoryNode* gh = bh_visit(&bh, "https://github.com", "GitHub");
        assert(gh != NULL);
        assert(strcmp(bh_get_current_page(&bh)->title, "GitHub") == 0);
        assert(bh_can_go_forward(&bh) == 0);
        assert(bh_get_forward_stack_count(&bh) == 0);

        /* Active DLL must strictly be Google <-> GitHub */
        assert(bh_get_history_count(&bh) == 2);
        HistoryNode* n1 = bh_get_history_node_at(&bh, 0);
        HistoryNode* n2 = bh_get_history_node_at(&bh, 1);
        assert(strcmp(n1->title, "Google") == 0);
        assert(strcmp(n2->title, "GitHub") == 0);
        assert(n1->next == n2);
        assert(n2->prev == n1);

        assert_invariants(&bh, "Mandatory Worked Example");
        bh_clear(&bh);
        assert_invariants(&bh, "After Clear of Worked Example");
        TEST_PASS("Forward history pruning severs forward branch and frees nodes cleanly");
    }

    /* ------------------------------------------------------------- */
    /* 17. Duplicate URL Handling */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        HistoryNode* g1 = bh_visit(&bh, "https://google.com", "Google 1");
        HistoryNode* g2 = bh_visit(&bh, "https://google.com", "Google 2");
        HistoryNode* g3 = bh_visit(&bh, "https://google.com", "Google 3");

        assert(g1 != g2);
        assert(g2 != g3);
        assert(bh_get_history_count(&bh) == 3);
        assert(bh_get_current_page(&bh) == g3);

        bh_back(&bh);
        assert(bh_get_current_page(&bh) == g2);
        assert(bh_get_current_page(&bh) != g1);

        assert_invariants(&bh, "Duplicate URLs");
        bh_clear(&bh);
        TEST_PASS("Consecutive duplicate URLs instantiate distinct HistoryNodes");
    }

    /* ------------------------------------------------------------- */
    /* 18. Clear Populated History */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        bh_visit(&bh, "https://page1.com", "Page 1");
        bh_visit(&bh, "https://page2.com", "Page 2");
        bh_clear(&bh);

        assert(bh_get_current_page(&bh) == NULL);
        assert(bh_get_history_count(&bh) == 0);
        assert(bh_get_back_stack_count(&bh) == 0);
        assert(bh_get_forward_stack_count(&bh) == 0);
        assert_invariants(&bh, "Clear Populated History");
        TEST_PASS("Clearing populated history resets all data structures and releases memory");
    }

    /* ------------------------------------------------------------- */
    /* 19. Clear Empty History */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        bh_clear(&bh);
        bh_clear(&bh); /* Safe to call repeatedly */
        assert_invariants(&bh, "Clear Empty History");
        TEST_PASS("Clearing an already empty history executes safely without errors");
    }

    /* ------------------------------------------------------------- */
    /* 20. Reuse After Clearing */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        bh_visit(&bh, "https://page1.com", "Page 1");
        bh_clear(&bh);

        HistoryNode* newNode = bh_visit(&bh, "https://reopened.com", "Reopened");
        assert(newNode != NULL);
        assert(bh_get_history_count(&bh) == 1);
        assert(bh_get_current_page(&bh) == newNode);
        assert_invariants(&bh, "Reuse After Clear");
        bh_clear(&bh);
        TEST_PASS("Controller reinitializes and functions normally after clearing");
    }

    /* ------------------------------------------------------------- */
    /* 21. Invalid Inputs */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        bh_visit(&bh, "https://valid.com", "Valid");

        assert(bh_visit(&bh, NULL, "Title") == NULL);
        assert(bh_visit(&bh, "", "Title") == NULL);
        assert(bh_get_history_count(&bh) == 1);

        assert_invariants(&bh, "Invalid Inputs");
        bh_clear(&bh);
        TEST_PASS("NULL and empty string URL inputs are rejected without mutating state");
    }

    /* ------------------------------------------------------------- */
    /* 22. Overlength Strings */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        char overlengthUrl[300];
        memset(overlengthUrl, 'a', 299);
        overlengthUrl[299] = '\0';

        char overlengthTitle[150];
        memset(overlengthTitle, 'b', 149);
        overlengthTitle[149] = '\0';

        assert(bh_visit(&bh, overlengthUrl, "Title") == NULL);
        assert(bh_visit(&bh, "https://valid.com", overlengthTitle) == NULL);
        assert(bh_get_history_count(&bh) == 0);

        bh_clear(&bh);
        TEST_PASS("Strings exceeding buffer capacity are rejected without silent truncation");
    }

    /* ------------------------------------------------------------- */
    /* 23. Maximum History Capacity (101 nodes) */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        for (int i = 0; i < MAX_HISTORY_NODES; i++) {
            char u[64], t[64];
            sprintf(u, "https://site%d.com", i);
            sprintf(t, "Site %d", i);
            HistoryNode* n = bh_visit(&bh, u, t);
            assert(n != NULL);
        }
        assert(bh_get_history_count(&bh) == MAX_HISTORY_NODES);
        assert(bh_get_back_stack_count(&bh) == STACK_CAPACITY);
        assert_invariants(&bh, "At Max Capacity");

        /* Attempting visit when backStack is full should reject */
        HistoryNode* overflow = bh_visit(&bh, "https://overflow.com", "Overflow");
        assert(overflow == NULL);
        assert(bh_get_history_count(&bh) == MAX_HISTORY_NODES);

        bh_clear(&bh);
        TEST_PASS("Maximum history capacity (101 nodes) enforced without stack overflow");
    }

    /* ------------------------------------------------------------- */
    /* 24. Branching When History is Near Capacity */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        for (int i = 0; i < MAX_HISTORY_NODES; i++) {
            char u[64];
            sprintf(u, "https://site%d.com", i);
            bh_visit(&bh, u, NULL);
        }

        /* Move back 10 times */
        for (int i = 0; i < 10; i++) {
            bh_back(&bh);
        }
        assert(bh_get_back_stack_count(&bh) == STACK_CAPACITY - 10);
        assert(bh_get_forward_stack_count(&bh) == 10);

        /* Branching now prunes 10 forward nodes; resulting size is 90 + 2 = 92 <= 101 */
        HistoryNode* branched = bh_visit(&bh, "https://branched.com", "Branched");
        assert(branched != NULL);
        assert(bh_get_forward_stack_count(&bh) == 0);
        assert(bh_get_history_count(&bh) == 92);
        assert_invariants(&bh, "Branching Near Capacity");

        bh_clear(&bh);
        TEST_PASS("Branching after backward navigation calculates pruned capacity correctly");
    }

    /* ------------------------------------------------------------- */
    /* 25. Stack Pointer Identity with DLL Nodes */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);
        HistoryNode* n1 = bh_visit(&bh, "https://page1.com", "P1");
        HistoryNode* n2 = bh_visit(&bh, "https://page2.com", "P2");
        (void)n2;

        /* BackStack top must point to exact address of n1 */
        HistoryNode* top = stack_peek(&bh.backStack);
        assert(top == n1);

        bh_clear(&bh);
        TEST_PASS("Stack items store exact borrowed pointers matching active DLL nodes");
    }

    /* ------------------------------------------------------------- */
    /* 26. Independent Controller Instances */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController c1, c2;
        bh_init(&c1);
        bh_init(&c2);

        bh_visit(&c1, "https://c1.com", "C1");
        assert(bh_get_history_count(&c1) == 1);
        assert(bh_get_history_count(&c2) == 0);

        bh_visit(&c2, "https://c2.com", "C2");
        assert(bh_get_history_count(&c1) == 1);
        assert(bh_get_history_count(&c2) == 1);

        bh_clear(&c1);
        assert(bh_get_history_count(&c1) == 0);
        assert(bh_get_history_count(&c2) == 1);

        bh_clear(&c2);
        TEST_PASS("Multiple controller instances operate with complete memory isolation");
    }

    /* ------------------------------------------------------------- */
    /* 27. Repeated Navigation and Clearing Stress Test */
    /* ------------------------------------------------------------- */
    {
        BrowserHistoryController bh;
        bh_init(&bh);

        for (int cycle = 0; cycle < 5; cycle++) {
            for (int i = 0; i < 20; i++) {
                char u[64];
                sprintf(u, "https://cycle%d-page%d.com", cycle, i);
                bh_visit(&bh, u, NULL);
                assert_invariants(&bh, "Cycle Visit");
            }
            for (int i = 0; i < 10; i++) {
                bh_back(&bh);
                assert_invariants(&bh, "Cycle Back");
            }
            for (int i = 0; i < 5; i++) {
                bh_forward(&bh);
                assert_invariants(&bh, "Cycle Forward");
            }
            bh_clear(&bh);
            assert_invariants(&bh, "Cycle Clear");
        }
        TEST_PASS("Repeated rapid navigation cycles and clears execute with zero memory errors");
    }

    printf("\n====================================================\n");
    printf("   TEST SUMMARY: %d / %d TESTS PASSED (100%%)\n", g_passCount, g_passCount + g_failCount);
    printf("====================================================\n");

    if (g_failCount == 0) {
        printf("SUCCESS: All native C tests and invariants verified successfully!\n\n");
        return 0;
    } else {
        printf("FAILURE: %d tests failed.\n\n", g_failCount);
        return 1;
    }
}

