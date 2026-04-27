.DEFAULT_GOAL := build

LIBFT_PATH ?=
NAME       = 42_tester
CC         = cc
CFLAGS     = -Wall -Wextra -Werror -O0 -g -I"$(LIBFT_PATH)"
LDFLAGS    = -L"$(LIBFT_PATH)" -lft

build: checkpath libft $(NAME)

$(NAME): tester.c
	$(CC) $(CFLAGS) tester.c -o $(NAME) $(LDFLAGS)

libft:
	@$(MAKE) -C "$(LIBFT_PATH)"

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
