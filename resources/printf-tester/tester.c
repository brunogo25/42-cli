/*
 * 42 CLI — ft_printf tester
 * Bruno Gomez (bgomez), 2026 piscine student.
 *
 * Compares ft_printf() against the libc printf() for every conversion the
 * subject mandates: c s p d i u x X %. Captures ft_printf's stdout via a
 * pipe + dup2 so we can verify (a) the bytes written match libc's output
 * exactly, AND (b) the reported return value equals the bytes actually
 * written. Reference output is produced by snprintf — same vfprintf engine
 * as printf, no FILE* buffering games to worry about, and the snprintf
 * return tells us the canonical length.
 *
 * Crashes in any test are caught via sigsetjmp/siglongjmp and reported as
 * CRASH; the run continues with the next group.
 */

#include "ft_printf.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <signal.h>
#include <setjmp.h>
#include <stdarg.h>
#include <stdint.h>
#include <limits.h>

#define MSG_LEN 384
#define NAME_W  18
#define BUF     8192

typedef struct s_test
{
	const char	*name;
	int			cases;
	int			fails;
	char		first_msg[MSG_LEN];
	int			crashed;
	int			skipped;
}	t_test;

static sigjmp_buf		g_jmp;
static volatile sig_atomic_t	g_signal;
static int			g_color = 0;
/* Saved real stdout fd. CMP redirects STDOUT_FILENO to a capture pipe, and
 * normally restores it before returning. If ft_printf crashes mid-CMP, the
 * signal handler longjmps out without running the restore — leaving stdout
 * pointing at a dead pipe, so the CRASH report and every subsequent group's
 * output disappears silently. We snapshot the real stdout once at startup
 * and the handler dup2's it back before longjmp (dup2 is async-signal-safe
 * per POSIX). */
static int			g_real_stdout = -1;

static void	on_signal(int sig)
{
	g_signal = sig;
	if (g_real_stdout >= 0)
		dup2(g_real_stdout, STDOUT_FILENO);
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

/* Drain a pipe fully — read() can return short on a single call. */
static int	drain_pipe(int fd, char *buf, size_t cap)
{
	size_t	got = 0;
	ssize_t	r;

	while (got + 1 < cap)
	{
		r = read(fd, buf + got, cap - 1 - got);
		if (r <= 0)
			break;
		got += (size_t)r;
	}
	buf[got] = 0;
	return ((int)got);
}

/* Run ft_printf with the given format+args, capturing stdout into got_,
 * the return value into rgot_, and the byte count into n_. ##__VA_ARGS__
 * is a GCC/clang extension that elides the comma when args is empty;
 * lets us call CMP("hello") with no extra args. */

#define CMP(fmt_, ...) do { \
	char	ref_[BUF]; \
	char	got_[BUF]; \
	int		rref_; \
	int		rgot_ = -1; \
	int		n_ = 0; \
	int		p_[2]; \
	rref_ = snprintf(ref_, sizeof ref_, (fmt_), ##__VA_ARGS__); \
	if (pipe(p_) == 0) \
	{ \
		int sv_ = dup(STDOUT_FILENO); \
		fflush(stdout); \
		dup2(p_[1], STDOUT_FILENO); \
		close(p_[1]); \
		rgot_ = ft_printf((fmt_), ##__VA_ARGS__); \
		fflush(stdout); \
		dup2(sv_, STDOUT_FILENO); \
		close(sv_); \
		n_ = drain_pipe(p_[0], got_, sizeof got_); \
		close(p_[0]); \
	} \
	size_t cmpn_ = (rref_ < 0 || rref_ > (int)sizeof ref_) ? 0 : (size_t)rref_; \
	EXPECT(rref_ == rgot_ && rgot_ == n_ && memcmp(ref_, got_, cmpn_) == 0, \
		"fmt=<%s> ref={\"%s\",ret=%d} got={\"%s\",ret=%d,bytes=%d}", \
		(fmt_), ref_, rref_, got_, rgot_, n_); \
} while (0)

/* ──────────────────────────── per-conversion tests ──────────────────────────── */

static void	test_pf_char(t_test *t)
{
#ifdef HAVE_FT_printf
	CMP("%c", 'A');
	CMP("%c", 'z');
	CMP("%c", '0');
	CMP("%c", ' ');
	CMP("%c", '\t');
	CMP("[%c]", '!');
	CMP("[%c][%c][%c]", 'a', 'b', 'c');
	/* '\0' as %c: libc writes a single NUL byte and returns 1; the captured
	 * buffer compares byte-for-byte via memcmp. */
	CMP("%c", '\0');
#else
	t->skipped = 1;
#endif
}

static void	test_pf_string(t_test *t)
{
#ifdef HAVE_FT_printf
	CMP("%s", "hello");
	CMP("%s", "");
	CMP("%s", "with spaces and tabs\t!");
	CMP("[%s]", "world");
	CMP("[%s][%s]", "foo", "bar");
	CMP("%s", "0123456789012345678901234567890123456789");
	/* NULL string — libc convention prints "(null)"; ft_printf must match. */
	CMP("%s", (char *)NULL);
#else
	t->skipped = 1;
#endif
}

static void	test_pf_pointer(t_test *t)
{
#ifdef HAVE_FT_printf
	int x = 42;
	CMP("%p", &x);
	CMP("%p", (void *)0xdeadbeef);
	CMP("%p", (void *)NULL);
	CMP("%p", (void *)0x1);
	CMP("%p", (void *)0xff);
	CMP("[%p]", (void *)0x42);
	CMP("%p %p", (void *)0xa, (void *)0xb);
#else
	t->skipped = 1;
#endif
}

static void	test_pf_d(t_test *t)
{
#ifdef HAVE_FT_printf
	CMP("%d", 0);
	CMP("%d", 1);
	CMP("%d", -1);
	CMP("%d", 42);
	CMP("%d", -42);
	CMP("%d", 100);
	CMP("%d", -100);
	CMP("%d", INT_MAX);
	CMP("%d", INT_MIN);
	CMP("%d %d", 1, 2);
	CMP("[%d]", -100);
#else
	t->skipped = 1;
#endif
}

static void	test_pf_i(t_test *t)
{
#ifdef HAVE_FT_printf
	CMP("%i", 0);
	CMP("%i", 1);
	CMP("%i", -1);
	CMP("%i", 999);
	CMP("%i", INT_MAX);
	CMP("%i", INT_MIN);
#else
	t->skipped = 1;
#endif
}

static void	test_pf_u(t_test *t)
{
#ifdef HAVE_FT_printf
	CMP("%u", 0u);
	CMP("%u", 1u);
	CMP("%u", 42u);
	CMP("%u", (unsigned)INT_MAX);
	CMP("%u", UINT_MAX);
	CMP("%u %u", 1u, 2u);
	/* negative passed as %u: classic moulinette case. Reinterpreted as
	 * (unsigned int)-1 == UINT_MAX → "4294967295". */
	CMP("%u", (unsigned)-1);
#else
	t->skipped = 1;
#endif
}

static void	test_pf_x(t_test *t)
{
#ifdef HAVE_FT_printf
	CMP("%x", 0u);
	CMP("%x", 1u);
	CMP("%x", 0xau);
	CMP("%x", 0xffu);
	CMP("%x", 0x100u);
	CMP("%x", 0xdeadbeefu);
	CMP("%x", UINT_MAX);
	CMP("[%x]", 0x42u);
#else
	t->skipped = 1;
#endif
}

static void	test_pf_X(t_test *t)
{
#ifdef HAVE_FT_printf
	CMP("%X", 0u);
	CMP("%X", 1u);
	CMP("%X", 0xau);
	CMP("%X", 0xffu);
	CMP("%X", 0x100u);
	CMP("%X", 0xDEADBEEFu);
	CMP("%X", UINT_MAX);
	CMP("[%X]", 0x42u);
#else
	t->skipped = 1;
#endif
}

static void	test_pf_percent(t_test *t)
{
#ifdef HAVE_FT_printf
	CMP("%%");
	CMP("%%%%");
	CMP("[%%]");
	CMP("100%%");
	CMP("a%%b%%c");
#else
	t->skipped = 1;
#endif
}

static void	test_pf_mixed(t_test *t)
{
#ifdef HAVE_FT_printf
	CMP("plain text no specifiers");
	CMP("");
	CMP("Hello, %s! You are %d years old.", "Bruno", 26);
	CMP("c=%c s=%s d=%d i=%i u=%u x=%x X=%X percent=%%",
		'A', "ok", -1, 1, 5u, 0xabu, 0xCDu);
	CMP("ptr=%p int=%d", (void *)0xdead, 42);
	CMP("%c%c%c", 'a', 'b', 'c');
	CMP("a%db%dc%d", 1, 2, 3);
	CMP("trailing newline\n");
	CMP("embedded\nnewline\nhere");
#else
	t->skipped = 1;
#endif
}

static void	test_pf_return(t_test *t)
{
#ifdef HAVE_FT_printf
	/* The CMP macro already verifies return value matches captured bytes
	 * for every test, but pin a few obvious cases here so a regression in
	 * just the return-value path is easy to spot. */
	CMP("hello");
	CMP("%d", 12345);
	CMP("%s", "abc");
	CMP("%c", 'X');
	CMP("");
	CMP("%%");
#else
	t->skipped = 1;
#endif
}

/* ──────────────────────────── dispatch ──────────────────────────── */

typedef void (*test_fn_t)(t_test *);

typedef struct {
	const char	*name;
	test_fn_t	fn;
}	t_entry;

static const t_entry TESTS[] = {
	{ "%c (char)",      test_pf_char },
	{ "%s (string)",    test_pf_string },
	{ "%p (pointer)",   test_pf_pointer },
	{ "%d (decimal)",   test_pf_d },
	{ "%i (integer)",   test_pf_i },
	{ "%u (unsigned)",  test_pf_u },
	{ "%x (hex lower)", test_pf_x },
	{ "%X (hex upper)", test_pf_X },
	{ "%% (percent)",   test_pf_percent },
	{ "mixed",          test_pf_mixed },
	{ "return value",   test_pf_return },
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
	if (t->skipped)
	{
		printf("  %-*s %sSKIP%s   %s(ft_printf prototype not declared in ft_printf.h)%s\n",
			NAME_W, t->name, c_fail(), c_off(), c_dim(), c_off());
	}
	else if (t->crashed)
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
	fprintf(stderr,
		"usage: %s [--color|--no-color] [--list]\n", p);
}

int	main(int argc, char **argv)
{
	int	list_only = 0;

	g_color = isatty(STDOUT_FILENO);
	/* Unbuffered stdout — our pipe-redirect dance assumes libc never holds
	 * bytes back across the dup2 boundary. */
	setvbuf(stdout, NULL, _IONBF, 0);
	signal(SIGSEGV, on_signal);
	signal(SIGBUS,  on_signal);
	signal(SIGABRT, on_signal);
	signal(SIGFPE,  on_signal);
	signal(SIGPIPE, SIG_IGN);
	g_real_stdout = dup(STDOUT_FILENO);

	for (int i = 1; i < argc; i++)
	{
		if (strcmp(argv[i], "--no-color") == 0) g_color = 0;
		else if (strcmp(argv[i], "--color") == 0) g_color = 1;
		else if (strcmp(argv[i], "--list") == 0) list_only = 1;
		else if (strcmp(argv[i], "--help") == 0 || strcmp(argv[i], "-h") == 0)
		{ usage(argv[0]); return 0; }
		else { usage(argv[0]); return 2; }
	}

	if (list_only)
	{
		for (size_t i = 0; i < N_TESTS; i++) printf("%s\n", TESTS[i].name);
		return 0;
	}

	int groups_passed = 0, groups_total = 0, groups_skipped = 0;
	int cases_passed = 0, cases_total = 0;

	for (size_t i = 0; i < N_TESTS; i++)
	{
		t_test t = { TESTS[i].name, 0, 0, "", 0, 0 };
		g_signal = 0;
		if (sigsetjmp(g_jmp, 1) == 0)
			TESTS[i].fn(&t);
		else
			t.crashed = g_signal;
		print_result(&t);

		if (t.skipped) { groups_skipped++; continue; }
		groups_total++;
		if (t.fails == 0 && !t.crashed) groups_passed++;
		cases_total += t.cases;
		cases_passed += t.cases - t.fails;
	}

	if (groups_total == 0)
	{
		if (groups_skipped > 0)
			fprintf(stderr,
				"ft_printf prototype not found — declare `int ft_printf(const char *, ...);` in ft_printf.h\n");
		else
			fprintf(stderr, "no tests registered\n");
		return 2;
	}

	int ok = (groups_passed == groups_total);
	int group_fails = groups_total - groups_passed;
	int case_fails = cases_total - cases_passed;
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
	if (groups_skipped > 0)
		printf("  %sSkipped:%s     %s%d%s %s(ft_printf prototype missing)%s\n",
			c_bold(), c_off(),
			c_fail(), groups_skipped, c_off(),
			c_dim(), c_off());
	printf("  %sResult:%s      %s%s%s\n",
		c_bold(), c_off(),
		ok ? c_pass() : c_fail(),
		ok ? "PASS" : "FAIL",
		c_off());
	return ok ? 0 : 1;
}
