.DEFAULT_GOAL := build

LIBFT_PATH   ?=
EXTRA_CFLAGS ?=
NAME         = 42_tester
CC           = cc
# AddressSanitizer instruments both libft and the tester so heap-buffer-overflows,
# use-after-frees, etc. surface as clear file:line diagnostics instead of leaking
# out as random "wrong content" assertions or, worse, false PASSes due to lucky
# malloc padding (macOS especially loves to over-allocate and zero-fill).
ASAN         = -fsanitize=address -fno-omit-frame-pointer
CFLAGS       = -Wall -Wextra -Werror -O0 -g -Wno-unused-function -I"$(LIBFT_PATH)" $(ASAN) $(EXTRA_CFLAGS)
LDFLAGS      = -L"$(LIBFT_PATH)" -lft $(ASAN)

build: checkpath libft $(NAME)

$(NAME): tester.c
	$(CC) $(CFLAGS) tester.c -o $(NAME) $(LDFLAGS)

# Rebuild the student's libft from scratch with ASan so memory bugs in their
# code are caught at the source. Override CFLAGS on the command line so we
# control the flags regardless of what their Makefile defaults to.
libft:
	@$(MAKE) -C "$(LIBFT_PATH)" re CFLAGS="-Wall -Wextra -Werror -g $(ASAN)"

checkpath:
	@if [ -z "$(LIBFT_PATH)" ]; then \
		echo "ERROR: LIBFT_PATH is not set"; exit 1; fi
	@if [ ! -f "$(LIBFT_PATH)/Makefile" ]; then \
		echo "ERROR: $(LIBFT_PATH)/Makefile not found"; exit 1; fi
	@if [ ! -f "$(LIBFT_PATH)/libft.h" ]; then \
		echo "ERROR: $(LIBFT_PATH)/libft.h not found"; exit 1; fi

clean:
	@rm -f $(NAME)

.PHONY: build libft checkpath clean
