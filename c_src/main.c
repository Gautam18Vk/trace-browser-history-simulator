/**
 * main.c
 * 
 * Interactive Menu-Driven Terminal Application for Trace.
 * Demonstrates Stack and Doubly Linked List browser history simulation natively.
 * Suitable for undergraduate Data Structures viva and console demonstration.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "browser_history.h"

#define INPUT_BUFFER_SIZE 512

/**
 * Safely reads a line from standard input and removes the trailing newline character.
 */
static void safe_read_line(char* buffer, size_t size) {
    if (fgets(buffer, (int)size, stdin) != NULL) {
        size_t len = strlen(buffer);
        if (len > 0 && buffer[len - 1] == '\n') {
            buffer[len - 1] = '\0';
        }
    } else {
        buffer[0] = '\0';
    }
}

static void display_menu(void) {
    printf("\n==================================================\n");
    printf("        TRACE — Browser History Simulator         \n");
    printf("==================================================\n");
    printf(" 1. Visit a new page\n");
    printf(" 2. Go Back\n");
    printf(" 3. Go Forward\n");
    printf(" 4. Display Current Page\n");
    printf(" 5. Display Browsing History (Chronological)\n");
    printf(" 6. Display Back Stack (LIFO)\n");
    printf(" 7. Display Forward Stack (LIFO)\n");
    printf(" 8. Display Doubly Linked List (Timeline)\n");
    printf(" 9. Clear History\n");
    printf(" 0. Exit\n");
    printf("==================================================\n");
    printf("Enter choice (0-9): ");
}

static void handle_visit(BrowserHistoryController* bh) {
    char url[INPUT_BUFFER_SIZE];
    char title[INPUT_BUFFER_SIZE];

    printf("\nEnter URL (e.g. https://google.com): ");
    safe_read_line(url, sizeof(url));

    if (strlen(url) == 0) {
        printf("[ERROR] URL cannot be empty.\n");
        return;
    }

    printf("Enter Page Title (optional, press Enter to default to URL): ");
    safe_read_line(title, sizeof(title));

    int hadForward = bh_can_go_forward(bh);
    HistoryNode* node = bh_visit(bh, url, (strlen(title) > 0) ? title : NULL);

    if (node != NULL) {
        if (hadForward) {
            printf("[SUCCESS] Visited '%s' (%s) [Forward history was pruned]\n", node->title, node->url);
        } else {
            printf("[SUCCESS] Visited '%s' (%s)\n", node->title, node->url);
        }
    } else {
        printf("[ERROR] Failed to visit page. Check URL/Title length or capacity limits.\n");
    }
}

static void handle_back(BrowserHistoryController* bh) {
    if (!bh_can_go_back(bh)) {
        printf("\n[INFO] Cannot navigate back. Back Stack is empty (already at earliest page or history is empty).\n");
        return;
    }

    HistoryNode* node = bh_back(bh);
    if (node != NULL) {
        printf("\n[SUCCESS] Moved back to: %s (%s)\n", node->title, node->url);
    }
}

static void handle_forward(BrowserHistoryController* bh) {
    if (!bh_can_go_forward(bh)) {
        printf("\n[INFO] Cannot navigate forward. Forward Stack is empty (already at latest page or branch was pruned).\n");
        return;
    }

    HistoryNode* node = bh_forward(bh);
    if (node != NULL) {
        printf("\n[SUCCESS] Moved forward to: %s (%s)\n", node->title, node->url);
    }
}

static void handle_display_current(const BrowserHistoryController* bh) {
    HistoryNode* curr = bh_get_current_page(bh);
    if (curr == NULL) {
        printf("\n[STATUS] No active page. Browsing history is empty.\n");
    } else {
        printf("\n--------------------------------------------------\n");
        printf(" ACTIVE WEBPAGE (VIEWPORT)                        \n");
        printf("--------------------------------------------------\n");
        printf(" Title: %s\n", curr->title);
        printf(" URL:   %s\n", curr->url);
        printf(" Can go Back:    %s\n", bh_can_go_back(bh) ? "YES" : "NO");
        printf(" Can go Forward: %s\n", bh_can_go_forward(bh) ? "YES" : "NO");
        printf("--------------------------------------------------\n");
    }
}

static void handle_display_history(const BrowserHistoryController* bh) {
    int count = bh_get_history_count(bh);
    if (count == 0) {
        printf("\n[HISTORY] Browsing history is empty.\n");
        return;
    }

    HistoryNode* current = bh_get_current_page(bh);
    printf("\n--------------------------------------------------\n");
    printf(" CHRONOLOGICAL BROWSING HISTORY (%d pages)        \n", count);
    printf("--------------------------------------------------\n");

    for (int i = 0; i < count; i++) {
        HistoryNode* node = bh_get_history_node_at(bh, i);
        if (node != NULL) {
            const char* marker = (node == current) ? " <--- [CURRENT]" : "";
            printf(" %2d. %-20s (%s)%s\n", i + 1, node->title, node->url, marker);
        }
    }
    printf("--------------------------------------------------\n");
}

static void handle_display_back_stack(const BrowserHistoryController* bh) {
    int count = bh_get_back_stack_count(bh);
    printf("\n--------------------------------------------------\n");
    printf(" BACK STACK (Size: %d / %d)                       \n", count, STACK_CAPACITY);
    printf("--------------------------------------------------\n");

    if (count == 0) {
        printf(" [EMPTY]\n");
    } else {
        /* Display from TOP down to BOTTOM */
        for (int i = count - 1; i >= 0; i--) {
            HistoryNode* node = bh_get_back_stack_item(bh, i);
            const char* tag = (i == count - 1) ? " [TOP]" : "";
            printf(" | %-25s |%s\n", node ? node->title : "(null)", tag);
        }
        printf(" +---------------------------+\n");
        printf("             BOTTOM           \n");
    }
    printf("--------------------------------------------------\n");
}

static void handle_display_forward_stack(const BrowserHistoryController* bh) {
    int count = bh_get_forward_stack_count(bh);
    printf("\n--------------------------------------------------\n");
    printf(" FORWARD STACK (Size: %d / %d)                    \n", count, STACK_CAPACITY);
    printf("--------------------------------------------------\n");

    if (count == 0) {
        printf(" [EMPTY]\n");
    } else {
        /* Display from TOP down to BOTTOM */
        for (int i = count - 1; i >= 0; i--) {
            HistoryNode* node = bh_get_forward_stack_item(bh, i);
            const char* tag = (i == count - 1) ? " [TOP]" : "";
            printf(" | %-25s |%s\n", node ? node->title : "(null)", tag);
        }
        printf(" +---------------------------+\n");
        printf("             BOTTOM           \n");
    }
    printf("--------------------------------------------------\n");
}

static void handle_display_dll(const BrowserHistoryController* bh) {
    int count = bh_get_history_count(bh);
    printf("\n--------------------------------------------------\n");
    printf(" DOUBLY LINKED LIST TIMELINE (%d nodes)           \n", count);
    printf("--------------------------------------------------\n");

    if (count == 0) {
        printf(" [EMPTY LIST]\n");
    } else {
        HistoryNode* current = bh_get_current_page(bh);
        HistoryNode* curr = bh->dll.head;
        int idx = 0;

        while (curr != NULL) {
            char badge[64] = "";
            int isHead = (curr == bh->dll.head);
            int isCurrent = (curr == current);
            int isTail = (curr == bh->dll.tail);

            if (isHead && isCurrent && isTail) {
                strcpy(badge, " [HEAD · CURRENT · TAIL]");
            } else if (isHead && isCurrent) {
                strcpy(badge, " [HEAD · CURRENT]");
            } else if (isCurrent && isTail) {
                strcpy(badge, " [CURRENT · TAIL]");
            } else if (isHead) {
                strcpy(badge, " [HEAD]");
            } else if (isTail) {
                strcpy(badge, " [TAIL]");
            } else if (isCurrent) {
                strcpy(badge, " [CURRENT]");
            }

            printf("[%d] \"%s\"%s\n", idx + 1, curr->title, badge);
            printf("    URL: %s\n", curr->url);

            if (curr->next != NULL) {
                printf("          ||\n");
                printf("          || (prev ^ | v next)\n");
                printf("          \\/\n");
            }
            curr = curr->next;
            idx++;
        }
    }
    printf("--------------------------------------------------\n");
}

static void handle_clear(BrowserHistoryController* bh) {
    bh_clear(bh);
    printf("\n[SUCCESS] History cleared. All nodes freed and stacks reset.\n");
}

int main(void) {
    BrowserHistoryController controller;
    bh_init(&controller);

    printf("==================================================\n");
    printf(" Welcome to Trace Browser History Simulator (C)   \n");
    printf(" Academic Data Structures Implementation          \n");
    printf("==================================================\n");

    char input[INPUT_BUFFER_SIZE];
    int running = 1;

    while (running) {
        display_menu();
        safe_read_line(input, sizeof(input));

        if (strlen(input) == 0) {
            continue;
        }

        char choice = input[0];
        switch (choice) {
            case '1':
                handle_visit(&controller);
                break;
            case '2':
                handle_back(&controller);
                break;
            case '3':
                handle_forward(&controller);
                break;
            case '4':
                handle_display_current(&controller);
                break;
            case '5':
                handle_display_history(&controller);
                break;
            case '6':
                handle_display_back_stack(&controller);
                break;
            case '7':
                handle_display_forward_stack(&controller);
                break;
            case '8':
                handle_display_dll(&controller);
                break;
            case '9':
                handle_clear(&controller);
                break;
            case '0':
                printf("\nExiting Trace. Releasing all allocated memory...\n");
                bh_clear(&controller);
                printf("Goodbye!\n");
                running = 0;
                break;
            default:
                printf("\n[ERROR] Invalid choice '%c'. Please enter a number between 0 and 9.\n", choice);
                break;
        }
    }

    return 0;
}

