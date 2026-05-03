/*
 * 42 CLI — get_next_line tester
 * Bruno Gomez (bgomez), 2026 piscine student.
 *
 * Compiles against the student's get_next_line.c + get_next_line_utils.c
 * with the BUFFER_SIZE the JS runner picked. For each scenario we write a
 * fixture into /tmp, open it for reading, then call get_next_line() in a
 * loop and compare the returned strings to the expected lines (including
 * their trailing \n where appropriate — except for the very last line of a
 * file that does not end in \n, per the subject).
 *
 * Crashes in any test are caught via sigsetjmp/siglongjmp and reported as
 * CRASH; the run continues with the next group. Build under AddressSanitizer
 * to surface memory bugs as clear file:line diagnostics.
 */

#include "get_next_line.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <signal.h>
#include <setjmp.h>
#include <stdarg.h>
#include <errno.h>
#include <limits.h>

#ifndef BUFFER_SIZE
# define BUFFER_SIZE 42
#endif

#define MSG_LEN  512
#define NAME_W   32

typedef struct s_test
{
	const char	*name;
	int			cases;
	int			fails;
	char		first_msg[MSG_LEN];
	int			crashed;
}	t_test;

static sigjmp_buf				g_jmp;
static volatile sig_atomic_t	g_signal;
static int						g_color = 0;

static void	on_signal(int sig)
{
	g_signal = sig;
	siglongjmp(g_jmp, 1);
}

static const char	*sig_name(int sig)
{
	if (sig == SIGSEGV)	return ("SIGSEGV");
	if (sig == SIGBUS)	return ("SIGBUS");
	if (sig == SIGABRT)	return ("SIGABRT");
	if (sig == SIGFPE)	return ("SIGFPE");
	if (sig == SIGPIPE)	return ("SIGPIPE");
	return ("signal");
}

static void	expect_(t_test *t, int cond, const char *fmt, ...)
{
	t->cases++;
	if (cond)
		return;
	t->fails++;
	if (t->fails != 1)
		return;
	va_list ap;
	va_start(ap, fmt);
	vsnprintf(t->first_msg, sizeof t->first_msg, fmt, ap);
	va_end(ap);
}

#define EXPECT(cond, ...) expect_(t, (cond), __VA_ARGS__)

/* ──────────────────────────── fixture helpers ──────────────────────────── */

/* Write `content` (`len` bytes) to a fresh /tmp file, reopen it read-only and
 * return the new fd. We unlink right after the reopen so the inode is
 * reclaimed when we close — the test never has to know the path. */
static int	open_fixture(const char *content, size_t len)
{
	char	tmpl[] = "/tmp/gnl_fixture_XXXXXX";
	int		wfd;
	int		rfd;
	ssize_t	w;
	size_t	off;

	wfd = mkstemp(tmpl);
	if (wfd < 0)
		return (-1);
	off = 0;
	while (off < len)
	{
		w = write(wfd, content + off, len - off);
		if (w <= 0)
		{
			close(wfd);
			unlink(tmpl);
			return (-1);
		}
		off += (size_t)w;
	}
	close(wfd);
	rfd = open(tmpl, O_RDONLY);
	unlink(tmpl);
	return (rfd);
}

/* Drain remaining lines so the student's static state for `fd` empties out
 * before we close. If a test fails partway, we don't want the next test
 * (which may receive the same fd number) to see leftover state. The cap is
 * a safety net against pathological impls that never return NULL — without
 * it, a stub that always returns the same string would hang the tester. */
static void	drain(int fd)
{
	char	*line;
	int		i;

	i = 0;
	while (i < 10000 && (line = get_next_line(fd)) != NULL)
	{
		free(line);
		i++;
	}
}

/* Walks the (content,len) fixture against the (expected[i]) lines. Emits one
 * EXPECT per call — pass on full match, fail on first divergence. Closes fd. */
static int	check_lines(t_test *t, const char *content, size_t clen,
				const char *const *expected, size_t n_expected,
				const char *case_name)
{
	int		fd;
	char	*line;
	char	msg[MSG_LEN];
	int		ok;
	size_t	i;

	msg[0] = 0;
	ok = 1;
	fd = open_fixture(content, clen);
	if (fd < 0)
	{
		snprintf(msg, sizeof msg, "%s: open_fixture() failed (errno=%d)",
			case_name, errno);
		EXPECT(0, "%s", msg);
		return (0);
	}
	i = 0;
	while (ok && i < n_expected)
	{
		line = get_next_line(fd);
		if (!line)
		{
			snprintf(msg, sizeof msg,
				"%s: NULL on call #%zu (expected \"%s\")",
				case_name, i + 1, expected[i]);
			ok = 0;
			break ;
		}
		if (strcmp(line, expected[i]) != 0)
		{
			snprintf(msg, sizeof msg,
				"%s: call #%zu got \"%s\" want \"%s\"",
				case_name, i + 1, line, expected[i]);
			free(line);
			ok = 0;
			break ;
		}
		free(line);
		i++;
	}
	if (ok)
	{
		line = get_next_line(fd);
		if (line)
		{
			snprintf(msg, sizeof msg,
				"%s: extra line after EOF: \"%s\"", case_name, line);
			free(line);
			ok = 0;
		}
	}
	drain(fd);
	close(fd);
	if (ok)
		EXPECT(1, "%s", case_name);
	else
		EXPECT(0, "%s", msg);
	return (ok);
}

/* ──────────────────────────── tests ──────────────────────────── */

static void	test_simple(t_test *t)
{
	const char	*expected[] = {"hello\n"};
	check_lines(t, "hello\n", 6, expected, 1, "single line w/ \\n");
}

static void	test_no_eol(t_test *t)
{
	const char	*expected[] = {"hello"};
	check_lines(t, "hello", 5, expected, 1, "single line no \\n");
}

static void	test_empty(t_test *t)
{
	int		fd;
	char	*line;

	fd = open_fixture("", 0);
	if (fd < 0)
	{
		EXPECT(0, "empty: open_fixture() failed");
		return ;
	}
	line = get_next_line(fd);
	EXPECT(line == NULL, "empty file should return NULL, got \"%s\"",
		line ? line : "(null)");
	free(line);
	close(fd);
}

static void	test_three_lines(t_test *t)
{
	const char	*expected[] = {"alpha\n", "beta\n", "gamma\n"};
	check_lines(t, "alpha\nbeta\ngamma\n", 17, expected, 3, "3 lines w/ \\n");
}

static void	test_three_lines_no_eol(t_test *t)
{
	const char	*expected[] = {"alpha\n", "beta\n", "gamma"};
	check_lines(t, "alpha\nbeta\ngamma", 16, expected, 3,
		"3 lines, last no \\n");
}

static void	test_only_newlines(t_test *t)
{
	const char	*expected[] = {"\n", "\n", "\n"};
	check_lines(t, "\n\n\n", 3, expected, 3, "3 empty lines");
}

static void	test_leading_newline(t_test *t)
{
	const char	*expected[] = {"\n", "foo\n"};
	check_lines(t, "\nfoo\n", 5, expected, 2, "leading \\n then line");
}

static void	test_consecutive_newlines(t_test *t)
{
	const char	*expected[] = {"a\n", "\n", "\n", "b\n"};
	check_lines(t, "a\n\n\nb\n", 6, expected, 4, "blank lines between");
}

static void	test_single_newline(t_test *t)
{
	const char	*expected[] = {"\n"};
	check_lines(t, "\n", 1, expected, 1, "single \\n");
}

static void	test_long_line(t_test *t)
{
	/* 4095-char line + \n. Crosses many BUFFER_SIZE reads at any sane B. */
	char	content[4097];
	char	exp[4097];
	const char	*expected[1];
	int		i;

	for (i = 0; i < 4095; i++)
	{
		content[i] = 'a' + (i % 26);
		exp[i] = content[i];
	}
	content[4095] = '\n';
	content[4096] = 0;
	exp[4095] = '\n';
	exp[4096] = 0;
	expected[0] = exp;
	check_lines(t, content, 4096, expected, 1, "4095-char line + \\n");
}

static void	test_buffer_boundary(t_test *t)
{
	/* Line whose length happens to be exactly BUFFER_SIZE — \n falls right at
	 * the read boundary. Cap allocation so a huge BUFFER_SIZE doesn't blow
	 * the stack; the 4096 cap still exercises every boundary case for
	 * BUFFER_SIZE in {1, 42, 9999} that the JS runner exercises. */
	size_t		n;
	char		*content;
	char		*exp;
	const char	*expected[1];

	n = BUFFER_SIZE;
	if (n > 4096)
		n = 4096;
	if (n == 0)
		n = 1;
	content = malloc(n + 2);
	exp = malloc(n + 2);
	if (!content || !exp)
	{
		free(content);
		free(exp);
		EXPECT(0, "boundary: malloc failed");
		return ;
	}
	memset(content, 'X', n);
	content[n] = '\n';
	content[n + 1] = 0;
	memcpy(exp, content, n + 2);
	expected[0] = exp;
	check_lines(t, content, n + 1, expected, 1, "len == BUFFER_SIZE + \\n");
	free(content);
	free(exp);
}

static void	test_many_short_lines(t_test *t)
{
	/* 200 numbered lines — exercises many close-EOF transitions and verifies
	 * the static state is reused correctly across many reads on one fd. */
	enum { N = 200 };
	char		*content;
	const char	*expected[N];
	char		*exp_storage[N];
	size_t		clen;
	int			i;
	char		buf[32];
	int			ok;

	content = malloc(N * 16);
	if (!content)
	{
		EXPECT(0, "many: malloc failed");
		return ;
	}
	clen = 0;
	for (i = 0; i < N; i++)
	{
		int n = snprintf(buf, sizeof buf, "line-%03d\n", i);
		memcpy(content + clen, buf, n);
		clen += n;
		exp_storage[i] = strdup(buf);
		expected[i] = exp_storage[i];
	}
	ok = check_lines(t, content, clen, expected, N, "200 short lines");
	(void)ok;
	for (i = 0; i < N; i++)
		free(exp_storage[i]);
	free(content);
}

static void	test_bad_fd(t_test *t)
{
	char	*line;

	line = get_next_line(-1);
	EXPECT(line == NULL, "bad fd -1 must return NULL, got \"%s\"",
		line ? line : "(null)");
	free(line);
}

static void	test_stdin(t_test *t)
{
	const char	*payload = "from stdin\nsecond\n";
	int			p[2];
	int			sv;
	char		*line;
	int			ok;

	if (pipe(p) < 0)
	{
		EXPECT(0, "stdin: pipe() failed");
		return ;
	}
	if (write(p[1], payload, strlen(payload)) != (ssize_t)strlen(payload))
	{
		close(p[0]);
		close(p[1]);
		EXPECT(0, "stdin: write() short");
		return ;
	}
	close(p[1]);
	sv = dup(STDIN_FILENO);
	dup2(p[0], STDIN_FILENO);
	close(p[0]);
	line = get_next_line(STDIN_FILENO);
	ok = line && strcmp(line, "from stdin\n") == 0;
	EXPECT(ok, "stdin: 1st got \"%s\" want \"from stdin\\n\"",
		line ? line : "(null)");
	free(line);
	line = get_next_line(STDIN_FILENO);
	ok = line && strcmp(line, "second\n") == 0;
	EXPECT(ok, "stdin: 2nd got \"%s\" want \"second\\n\"",
		line ? line : "(null)");
	free(line);
	line = get_next_line(STDIN_FILENO);
	EXPECT(line == NULL, "stdin: EOF got \"%s\"", line ? line : "(null)");
	free(line);
	drain(STDIN_FILENO);
	dup2(sv, STDIN_FILENO);
	close(sv);
}

static void	test_no_trailing_then_short(t_test *t)
{
	/* The "last line w/o \n" case must not bleed a phantom \n. Pair it with
	 * a final-call-returns-NULL check inside check_lines. */
	const char	*expected[] = {"x\n", "y"};
	check_lines(t, "x\ny", 3, expected, 2, "2 lines, last no \\n");
}

static void	test_returned_line_includes_newline(t_test *t)
{
	/* The subject is explicit: "the returned line should include the
	 * terminating \n character, except if the end of file was reached and
	 * does not end with a \n character." Hammer that contract. */
	int		fd;
	char	*line;

	fd = open_fixture("kept\n", 5);
	if (fd < 0)
	{
		EXPECT(0, "newline-included: open_fixture failed");
		return ;
	}
	line = get_next_line(fd);
	EXPECT(line && strcmp(line, "kept\n") == 0,
		"newline-included: got \"%s\" want \"kept\\n\"",
		line ? line : "(null)");
	free(line);
	drain(fd);
	close(fd);
}

/* ──────────────────────────── dispatch ──────────────────────────── */

typedef void	(*test_fn_t)(t_test *);

typedef struct s_entry
{
	const char	*name;
	test_fn_t	fn;
}	t_entry;

static const t_entry	TESTS[] = {
	{ "simple line",        test_simple },
	{ "no trailing \\n",    test_no_eol },
	{ "empty file",         test_empty },
	{ "3 lines",            test_three_lines },
	{ "3 lines no \\n",     test_three_lines_no_eol },
	{ "only newlines",      test_only_newlines },
	{ "leading newline",    test_leading_newline },
	{ "blank between",      test_consecutive_newlines },
	{ "single \\n",         test_single_newline },
	{ "long line (4095)",   test_long_line },
	{ "buffer boundary",    test_buffer_boundary },
	{ "200 short lines",    test_many_short_lines },
	{ "bad fd (-1)",        test_bad_fd },
	{ "stdin",              test_stdin },
	{ "last line no \\n",   test_no_trailing_then_short },
	{ "\\n in returned",    test_returned_line_includes_newline },
};

#define N_TESTS (sizeof(TESTS) / sizeof(TESTS[0]))

static const char	*c_pass(void) { return g_color ? "\x1b[32m" : ""; }
static const char	*c_fail(void) { return g_color ? "\x1b[31m" : ""; }
static const char	*c_warn(void) { return g_color ? "\x1b[33m" : ""; }
static const char	*c_dim(void)  { return g_color ? "\x1b[2m"  : ""; }
static const char	*c_bold(void) { return g_color ? "\x1b[1m"  : ""; }
static const char	*c_off(void)  { return g_color ? "\x1b[0m"  : ""; }

static void	print_result(const t_test *t)
{
	if (t->crashed)
	{
		printf("  %-*s %sCRASH%s  %s%s%s\n",
			NAME_W, t->name, c_warn(), c_off(),
			c_warn(), sig_name(t->crashed), c_off());
	}
	else if (t->fails == 0)
	{
		printf("  %-*s %sPASS%s   %s%d cases%s\n",
			NAME_W, t->name, c_pass(), c_off(),
			c_dim(), t->cases, c_off());
	}
	else
	{
		printf("  %-*s %sFAIL%s   %s%d%s/%s%d%s  %s→ %s%s\n",
			NAME_W, t->name, c_fail(), c_off(),
			c_pass(), t->cases - t->fails, c_off(),
			c_dim(), t->cases, c_off(),
			c_warn(), t->first_msg, c_off());
	}
	fflush(stdout);
}

static void	usage(const char *p)
{
	fprintf(stderr, "usage: %s [--color|--no-color] [--list]\n", p);
}

int	main(int argc, char **argv)
{
	int	list_only;
	int	groups_passed;
	int	groups_total;
	int	cases_passed;
	int	cases_total;
	int	ok;
	int	group_fails;
	int	case_fails;

	list_only = 0;
	g_color = isatty(STDOUT_FILENO);
	setvbuf(stdout, NULL, _IONBF, 0);
	signal(SIGSEGV, on_signal);
	signal(SIGBUS,  on_signal);
	signal(SIGABRT, on_signal);
	signal(SIGFPE,  on_signal);
	signal(SIGPIPE, SIG_IGN);

	for (int i = 1; i < argc; i++)
	{
		if (strcmp(argv[i], "--no-color") == 0) g_color = 0;
		else if (strcmp(argv[i], "--color") == 0) g_color = 1;
		else if (strcmp(argv[i], "--list") == 0) list_only = 1;
		else if (strcmp(argv[i], "--help") == 0 || strcmp(argv[i], "-h") == 0)
		{ usage(argv[0]); return (0); }
		else { usage(argv[0]); return (2); }
	}

	if (list_only)
	{
		for (size_t i = 0; i < N_TESTS; i++) printf("%s\n", TESTS[i].name);
		return (0);
	}

	printf("%s  BUFFER_SIZE = %d%s\n", c_dim(), BUFFER_SIZE, c_off());
	groups_passed = 0;
	groups_total = 0;
	cases_passed = 0;
	cases_total = 0;

	for (size_t i = 0; i < N_TESTS; i++)
	{
		t_test t = { TESTS[i].name, 0, 0, "", 0 };
		g_signal = 0;
		if (sigsetjmp(g_jmp, 1) == 0)
			TESTS[i].fn(&t);
		else
			t.crashed = g_signal;
		print_result(&t);

		groups_total++;
		if (t.fails == 0 && !t.crashed) groups_passed++;
		cases_total += t.cases;
		cases_passed += t.cases - t.fails;
	}

	ok = (groups_passed == groups_total);
	group_fails = groups_total - groups_passed;
	case_fails = cases_total - cases_passed;
	printf("\n%s────────────────────────────────────────%s\n", c_dim(), c_off());
	if (group_fails > 0)
		printf("  %sGroups:%s      %s%d%s / %s%d%s passed   %s(%d failed)%s\n",
			c_bold(), c_off(),
			c_pass(), groups_passed, c_off(),
			c_dim(), groups_total, c_off(),
			c_fail(), group_fails, c_off());
	else
		printf("  %sGroups:%s      %s%d / %d passed%s\n",
			c_bold(), c_off(), c_pass(), groups_passed, groups_total, c_off());
	if (case_fails > 0)
		printf("  %sAssertions:%s  %s%d%s / %s%d%s passed   %s(%d failed)%s\n",
			c_bold(), c_off(),
			c_pass(), cases_passed, c_off(),
			c_dim(), cases_total, c_off(),
			c_fail(), case_fails, c_off());
	else
		printf("  %sAssertions:%s  %s%d / %d passed%s\n",
			c_bold(), c_off(), c_pass(), cases_passed, cases_total, c_off());
	printf("  %sResult:%s      %s%s%s\n",
		c_bold(), c_off(),
		ok ? c_pass() : c_fail(),
		ok ? "PASS" : "FAIL",
		c_off());
	return (ok ? 0 : 1);
}
