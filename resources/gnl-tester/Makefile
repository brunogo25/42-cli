.DEFAULT_GOAL := build

GNL_PATH     ?=
BUFFER_SIZE  ?= 42
EXTRA_CFLAGS ?=
NAME         = 42_gnl_tester
CC           = cc
# AddressSanitizer instruments both the student's get_next_line and the tester
# so heap-buffer-overflows, use-after-frees and leaked-on-error states surface
# as a clear file:line diagnostic instead of slipping through as random
# "wrong content" assertions.
ASAN         = -fsanitize=address -fno-omit-frame-pointer
# Suppress two warnings that fire on *intentional* edge cases or are otherwise
# uninteresting in this tester:
#   unused-function   — the test dispatcher routes by name; some helpers are
#                       referenced via the table only and gcc misses it.
# We forward BUFFER_SIZE via -D so the student's source picks it up the same
# way the subject's eval command does (cc -D BUFFER_SIZE=42 <files>.c).
CFLAGS       = -Wall -Wextra -Werror -O0 -g -Wno-unused-function \
               -I"$(GNL_PATH)" -D BUFFER_SIZE=$(BUFFER_SIZE) $(ASAN) $(EXTRA_CFLAGS)
LDFLAGS      = $(ASAN)

# Student sources we link in directly. The gnl project does not ship a .a —
# the subject says we must compile it as `cc <files>.c`, so we do exactly
# that. Using = (not :=) so the path resolves AFTER checkpath has validated
# GNL_PATH is set.
GNL_SRCS     = "$(GNL_PATH)/get_next_line.c" "$(GNL_PATH)/get_next_line_utils.c"

build: checkpath $(NAME)

$(NAME): tester.c
	$(CC) $(CFLAGS) tester.c $(GNL_SRCS) -o $(NAME) $(LDFLAGS)

checkpath:
	@if [ -z "$(GNL_PATH)" ]; then \
		echo "ERROR: GNL_PATH is not set"; exit 1; fi
	@if [ ! -f "$(GNL_PATH)/get_next_line.h" ]; then \
		echo "ERROR: $(GNL_PATH)/get_next_line.h not found"; exit 1; fi
	@if [ ! -f "$(GNL_PATH)/get_next_line.c" ]; then \
		echo "ERROR: $(GNL_PATH)/get_next_line.c not found"; exit 1; fi
	@if [ ! -f "$(GNL_PATH)/get_next_line_utils.c" ]; then \
		echo "ERROR: $(GNL_PATH)/get_next_line_utils.c not found"; exit 1; fi

clean:
	@rm -f $(NAME)

.PHONY: build checkpath clean
