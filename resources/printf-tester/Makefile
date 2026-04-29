.DEFAULT_GOAL := build

LIBFT_PATH   ?=
EXTRA_CFLAGS ?=
NAME         = 42_printf_tester
CC           = cc
ASAN         = -fsanitize=address -fno-omit-frame-pointer
# Suppress two warnings that fire on *intentional* test cases:
#   format-zero-length     — we want to verify ft_printf("") works;
#   format-truncation/-nonnull — we want to verify ft_printf("%s", NULL).
# These would otherwise trip -Werror and prevent the tester from building.
CFLAGS       = -Wall -Wextra -Werror -O0 -g -Wno-unused-function \
               -Wno-format-zero-length -Wno-format-truncation -Wno-nonnull \
               -I"$(LIBFT_PATH)" $(ASAN) $(EXTRA_CFLAGS)
LDFLAGS      = -L"$(LIBFT_PATH)" -lftprintf $(ASAN)

build: checkpath libftprintf $(NAME)

$(NAME): tester.c
	$(CC) $(CFLAGS) tester.c -o $(NAME) $(LDFLAGS)

# Rebuild the student's libftprintf with ASan instrumentation. Override CFLAGS
# on the command line so it propagates through MAKEFLAGS to any sub-make
# (e.g., the bundled libft/) regardless of what the student's Makefile defaults
# to. JS already fclean'd, so this is a fresh build.
libftprintf:
	@$(MAKE) -C "$(LIBFT_PATH)" CFLAGS="-Wall -Wextra -Werror -g $(ASAN)"

checkpath:
	@if [ -z "$(LIBFT_PATH)" ]; then \
		echo "ERROR: LIBFT_PATH is not set"; exit 1; fi
	@if [ ! -f "$(LIBFT_PATH)/Makefile" ]; then \
		echo "ERROR: $(LIBFT_PATH)/Makefile not found"; exit 1; fi
	@if [ ! -f "$(LIBFT_PATH)/ft_printf.h" ]; then \
		echo "ERROR: $(LIBFT_PATH)/ft_printf.h not found"; exit 1; fi

clean:
	@rm -f $(NAME)

.PHONY: build libftprintf checkpath clean
