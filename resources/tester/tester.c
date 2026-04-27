/*
 * 42 CLI — libft tester
 * Bruno Gomez (bgomez), 2026 piscine student.
 *
 * Single-process tester. Each function gets a small set of cases that include
 * the obvious happy path, edge cases (empty / NUL / boundary), and the
 * failures the moulinette is known to flag. Comparisons use libc as the
 * reference where the spec mirrors a libc function; everything else uses
 * a hand-written reference.
 *
 * On the first failure of a given test we capture a one-line description
 * (input + expected + got). Crashes in a single test are caught via
 * sigsetjmp/siglongjmp and reported as CRASH; the run continues.
 */

#include "libft.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <ctype.h>
#include <unistd.h>
#include <fcntl.h>
#include <signal.h>
#include <setjmp.h>
#include <stdarg.h>
#include <stdint.h>
#include <limits.h>
#include <stdbool.h>

#define MSG_LEN 256
#define NAME_W  18

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

/* ──────────────────────────────────────────────────────────────────
 * char classifiers
 * Subject (page 6): "the return value must be 1 if the character matches
 *  the tested class, 0 if it does not match." → strict 0/1, not just truthy.
 * ────────────────────────────────────────────────────────────────── */

static void	test_isalpha(t_test *t)
{
#ifdef HAVE_FT_isalpha
	for (int i = 0; i < 256; i++)
	{
		int exp = isalpha(i) ? 1 : 0;
		int got = ft_isalpha(i);
		EXPECT(got == exp,
			"isalpha(%d): subject requires strict %d, got %d", i, exp, got);
		if (t->fails) return;
	}
#else
	t->skipped = 1;
#endif
}

static void	test_isdigit(t_test *t)
{
#ifdef HAVE_FT_isdigit
	for (int i = 0; i < 256; i++)
	{
		int exp = isdigit(i) ? 1 : 0;
		int got = ft_isdigit(i);
		EXPECT(got == exp,
			"isdigit(%d): subject requires strict %d, got %d", i, exp, got);
		if (t->fails) return;
	}
#else
	t->skipped = 1;
#endif
}

static void	test_isalnum(t_test *t)
{
#ifdef HAVE_FT_isalnum
	for (int i = 0; i < 256; i++)
	{
		int exp = isalnum(i) ? 1 : 0;
		int got = ft_isalnum(i);
		EXPECT(got == exp,
			"isalnum(%d): subject requires strict %d, got %d", i, exp, got);
		if (t->fails) return;
	}
#else
	t->skipped = 1;
#endif
}

static void	test_isascii(t_test *t)
{
#ifdef HAVE_FT_isascii
	for (int i = -128; i < 256; i++)
	{
		int exp = isascii(i) ? 1 : 0;
		int got = ft_isascii(i);
		EXPECT(got == exp,
			"isascii(%d): subject requires strict %d, got %d", i, exp, got);
		if (t->fails) return;
	}
#else
	t->skipped = 1;
#endif
}

static void	test_isprint(t_test *t)
{
#ifdef HAVE_FT_isprint
	for (int i = 0; i < 256; i++)
	{
		int exp = isprint(i) ? 1 : 0;
		int got = ft_isprint(i);
		EXPECT(got == exp,
			"isprint(%d): subject requires strict %d, got %d", i, exp, got);
		if (t->fails) return;
	}
#else
	t->skipped = 1;
#endif
}

static void	test_toupper(t_test *t)
{
#ifdef HAVE_FT_toupper
	for (int i = 0; i < 256; i++)
	{
		EXPECT(ft_toupper(i) == toupper(i),
			"toupper(%d): expected %d, got %d", i, toupper(i), ft_toupper(i));
		if (t->fails) return;
	}
#else
	t->skipped = 1;
#endif
}

static void	test_tolower(t_test *t)
{
#ifdef HAVE_FT_tolower
	for (int i = 0; i < 256; i++)
	{
		EXPECT(ft_tolower(i) == tolower(i),
			"tolower(%d): expected %d, got %d", i, tolower(i), ft_tolower(i));
		if (t->fails) return;
	}
#else
	t->skipped = 1;
#endif
}

/* ──────────────────────────── strings (libc reference) ──────────────────────────── */

static void	test_strlen(t_test *t)
{
#ifdef HAVE_FT_strlen
	const char *cases[] = { "", "a", "hello", "with spaces and stuff", "0123456789" };
	for (size_t i = 0; i < sizeof(cases)/sizeof(cases[0]); i++)
		EXPECT(ft_strlen(cases[i]) == strlen(cases[i]),
			"strlen(\"%s\"): expected %zu, got %zu",
			cases[i], strlen(cases[i]), ft_strlen(cases[i]));
#else
	t->skipped = 1;
#endif
}

static void	test_strchr(t_test *t)
{
#ifdef HAVE_FT_strchr
	const char *s = "Hello, World!";
	for (int c = 0; c < 128; c += 5)
		EXPECT(ft_strchr(s, c) == strchr(s, c),
			"strchr(\"Hello, World!\", %d) wrong pointer", c);
	EXPECT(ft_strchr(s, 0) == s + strlen(s),
		"strchr must find the terminating NUL");
	EXPECT(ft_strchr("", 'a') == NULL,
		"strchr on empty string with no match must be NULL");
	EXPECT(ft_strchr("", 0) != NULL,
		"strchr on empty string for NUL must return the string");
#else
	t->skipped = 1;
#endif
}

static void	test_strrchr(t_test *t)
{
#ifdef HAVE_FT_strrchr
	const char *s = "abcabc";
	EXPECT(ft_strrchr(s, 'a') == strrchr(s, 'a'),
		"strrchr finds last 'a'");
	EXPECT(ft_strrchr(s, 'b') == strrchr(s, 'b'),
		"strrchr finds last 'b'");
	EXPECT(ft_strrchr(s, 'z') == NULL,
		"strrchr no match must return NULL");
	EXPECT(ft_strrchr(s, 0) == s + strlen(s),
		"strrchr must find terminating NUL");
	EXPECT(ft_strrchr("", 'a') == NULL,
		"strrchr empty no-match");
	EXPECT(ft_strrchr("", 0) != NULL,
		"strrchr empty NUL");
#else
	t->skipped = 1;
#endif
}

static void	test_strncmp(t_test *t)
{
#ifdef HAVE_FT_strncmp
	EXPECT(ft_strncmp("", "", 0) == 0, "strncmp(\"\",\"\",0) must be 0");
	EXPECT(ft_strncmp("", "", 5) == 0, "strncmp(\"\",\"\",5) must be 0");
	EXPECT(ft_strncmp("abc", "abc", 3) == 0, "strncmp equal");
	EXPECT(ft_strncmp("abc", "abd", 3) < 0, "strncmp(\"abc\",\"abd\",3) must be <0");
	EXPECT(ft_strncmp("abd", "abc", 3) > 0, "strncmp(\"abd\",\"abc\",3) must be >0");
	EXPECT(ft_strncmp("abc", "abd", 2) == 0, "strncmp first 2 equal");
	EXPECT(ft_strncmp("abcd", "abc", 4) > 0, "strncmp longer-vs-shorter");
	char a[2] = { (char)0xff, 0 }, b[2] = { (char)0x01, 0 };
	EXPECT(ft_strncmp(a, b, 1) > 0,
		"strncmp must compare bytes as unsigned char (0xff > 0x01)");
#else
	t->skipped = 1;
#endif
}

static void	test_strnstr(t_test *t)
{
#ifdef HAVE_FT_strnstr
	char *r = ft_strnstr("hello world", "world", 11);
	EXPECT(r != NULL && strncmp(r, "world", 5) == 0,
		"strnstr basic must find 'world'");
	EXPECT(ft_strnstr("hello world", "world", 5) == NULL,
		"strnstr with n shorter than match must return NULL");
	{
		const char *hay = "hello";
		EXPECT(ft_strnstr(hay, "", 5) == hay,
			"strnstr empty needle must return the haystack pointer");
	}
	EXPECT(ft_strnstr("hello", "lo", 0) == NULL, "strnstr n=0 must be NULL");
	EXPECT(ft_strnstr("aabaaabaa", "aaab", 9) != NULL, "strnstr backtracking");
#else
	t->skipped = 1;
#endif
}

static void	test_strdup(t_test *t)
{
#ifdef HAVE_FT_strdup
	char *s = ft_strdup("hello");
	EXPECT(s && strcmp(s, "hello") == 0,
		"strdup(\"hello\") expected \"hello\", got \"%s\"", s ? s : "(null)");
	free(s);
	s = ft_strdup("");
	EXPECT(s && s[0] == 0, "strdup(\"\") expected empty");
	free(s);
#else
	t->skipped = 1;
#endif
}

/* ────────────────────────────── memory ────────────────────────────── */

static void	test_memset(t_test *t)
{
#ifdef HAVE_FT_memset
	char a[32], b[32];
	memset(a, 'X', 32);
	void *r = ft_memset(b, 'X', 32);
	EXPECT(r == b, "memset must return its dest pointer");
	EXPECT(memcmp(a, b, 32) == 0, "memset 32 bytes with 'X'");
	char c[4] = { 1, 2, 3, 4 };
	ft_memset(c, 'Z', 0);
	EXPECT(c[0] == 1 && c[1] == 2, "memset n=0 must not write");
	memset(a, 0, 32);
	ft_memset(b, 0, 32);
	EXPECT(memcmp(a, b, 32) == 0, "memset zero-fill");
#else
	t->skipped = 1;
#endif
}

static void	test_bzero(t_test *t)
{
#ifdef HAVE_FT_bzero
	char a[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };
	ft_bzero(a, 8);
	for (int i = 0; i < 8; i++)
	{
		EXPECT(a[i] == 0, "bzero a[%d]: expected 0, got %d", i, a[i]);
		if (t->fails) return;
	}
	char b[4] = { 1, 2, 3, 4 };
	ft_bzero(b, 0);
	EXPECT(b[0] == 1, "bzero n=0 must not write");
#else
	t->skipped = 1;
#endif
}

static void	test_memcpy(t_test *t)
{
#ifdef HAVE_FT_memcpy
	char src[16] = "0123456789ABCDE", dst[16] = { 0 }, ref[16] = { 0 };
	void *r = ft_memcpy(dst, src, 16);
	memcpy(ref, src, 16);
	EXPECT(r == dst, "memcpy must return its dest pointer");
	EXPECT(memcmp(dst, ref, 16) == 0, "memcpy 16 bytes");
	char d2[4] = { 9, 9, 9, 9 };
	ft_memcpy(d2, "abc", 0);
	EXPECT(d2[0] == 9, "memcpy n=0 must not write");
#else
	t->skipped = 1;
#endif
}

static void	test_memmove(t_test *t)
{
#ifdef HAVE_FT_memmove
	char a[16] = "0123456789ABCDE";
	char ref[16] = "0123456789ABCDE";
	void *r = ft_memmove(a + 2, a, 5);
	memmove(ref + 2, ref, 5);
	EXPECT(r == a + 2, "memmove must return its dest pointer");
	EXPECT(memcmp(a, ref, 16) == 0, "memmove forward overlap");

	char a2[16] = "0123456789ABCDE";
	char r2[16] = "0123456789ABCDE";
	ft_memmove(a2, a2 + 2, 5);
	memmove(r2, r2 + 2, 5);
	EXPECT(memcmp(a2, r2, 16) == 0, "memmove backward overlap");

	char a3[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };
	ft_memmove(a3, a3 + 1, 0);
	EXPECT(a3[0] == 1, "memmove n=0 must not write");
#else
	t->skipped = 1;
#endif
}

static void	test_memchr(t_test *t)
{
#ifdef HAVE_FT_memchr
	const char *s = "Hello\0World";
	EXPECT(ft_memchr(s, 'o', 11) == strchr(s, 'o'), "memchr basic");
	EXPECT(ft_memchr(s, 'W', 6) == NULL, "memchr too-short n must be NULL");
	EXPECT(ft_memchr(s, 'W', 11) == s + 6,
		"memchr must keep searching past embedded NULs");
	EXPECT(ft_memchr(s, 0, 11) == s + 5, "memchr must find embedded NUL");
	EXPECT(ft_memchr(s, 'x', 0) == NULL, "memchr n=0 must be NULL");
#else
	t->skipped = 1;
#endif
}

static void	test_memcmp(t_test *t)
{
#ifdef HAVE_FT_memcmp
	EXPECT(ft_memcmp("abc", "abc", 3) == 0, "memcmp equal");
	EXPECT(ft_memcmp("abc", "abd", 3) < 0, "memcmp must be <0 for abc < abd");
	EXPECT(ft_memcmp("abd", "abc", 3) > 0, "memcmp must be >0 for abd > abc");
	EXPECT(ft_memcmp("a\0b", "a\0c", 3) < 0, "memcmp must read past NUL");
	EXPECT(ft_memcmp("xyz", "abc", 0) == 0, "memcmp n=0");
	char a[2] = { (char)0xff, 0 }, b[2] = { (char)0x01, 0 };
	EXPECT(ft_memcmp(a, b, 1) > 0,
		"memcmp must compare bytes as unsigned char (0xff > 0x01)");
#else
	t->skipped = 1;
#endif
}

/* ───────────────────────── strlcpy / strlcat ───────────────────────── */

static void	test_strlcpy(t_test *t)
{
#ifdef HAVE_FT_strlcpy
	char dst[16];
	size_t r;

	memset(dst, (char)0xAA, 16);
	r = ft_strlcpy(dst, "hello", 16);
	EXPECT(r == 5, "strlcpy must return src len 5, got %zu", r);
	EXPECT(strcmp(dst, "hello") == 0, "strlcpy basic content");

	memset(dst, (char)0xAA, 16);
	r = ft_strlcpy(dst, "hello", 3);
	EXPECT(r == 5, "strlcpy small dst still returns src len 5, got %zu", r);
	EXPECT(strcmp(dst, "he") == 0, "strlcpy small dst must NUL-terminate");

	memset(dst, (char)0xAA, 16);
	r = ft_strlcpy(dst, "hello", 0);
	EXPECT(r == 5, "strlcpy size=0 must return src len 5, got %zu", r);
	EXPECT((unsigned char)dst[0] == 0xAA, "strlcpy size=0 must not write");

	memset(dst, (char)0xAA, 16);
	r = ft_strlcpy(dst, "", 16);
	EXPECT(r == 0, "strlcpy empty src returns 0");
	EXPECT(dst[0] == 0, "strlcpy empty src must write NUL");
#else
	t->skipped = 1;
#endif
}

static void	test_strlcat(t_test *t)
{
#ifdef HAVE_FT_strlcat
	char dst[16];
	size_t r;

	strcpy(dst, "abc");
	r = ft_strlcat(dst, "def", 16);
	EXPECT(r == 6, "strlcat 3+3 must return 6, got %zu", r);
	EXPECT(strcmp(dst, "abcdef") == 0, "strlcat basic content");

	strcpy(dst, "abc");
	r = ft_strlcat(dst, "def", 5);
	EXPECT(r == 6, "strlcat truncated must still return 6, got %zu", r);
	EXPECT(strcmp(dst, "abcd") == 0, "strlcat truncated content");

	memset(dst, (char)0xAA, 16);
	strcpy(dst, "abc");
	r = ft_strlcat(dst, "def", 2);
	EXPECT(r == 5,
		"strlcat with size<=dstlen must return size+srclen=2+3=5, got %zu", r);

	strcpy(dst, "abc");
	r = ft_strlcat(dst, "", 16);
	EXPECT(r == 3, "strlcat empty src must return dst len");
	EXPECT(strcmp(dst, "abc") == 0, "strlcat empty src must not modify dst");
#else
	t->skipped = 1;
#endif
}

/* ────────────────────────── conversions ────────────────────────── */

static void	test_atoi(t_test *t)
{
#ifdef HAVE_FT_atoi
	EXPECT(ft_atoi("0") == 0, "atoi(\"0\")");
	EXPECT(ft_atoi("42") == 42, "atoi(\"42\")");
	EXPECT(ft_atoi("-42") == -42, "atoi(\"-42\")");
	EXPECT(ft_atoi("+42") == 42, "atoi(\"+42\")");
	EXPECT(ft_atoi("   42") == 42, "atoi must skip leading spaces");
	EXPECT(ft_atoi("\t\v\f\r\n 42") == 42,
		"atoi must skip all 6 whitespace classes");
	EXPECT(ft_atoi("42abc") == 42, "atoi must stop at first non-digit");
	EXPECT(ft_atoi("2147483647") == INT_MAX, "atoi(INT_MAX)");
	EXPECT(ft_atoi("-2147483648") == INT_MIN, "atoi(INT_MIN)");
	EXPECT(ft_atoi("") == 0, "atoi empty string -> 0");
	EXPECT(ft_atoi("--1") == 0, "atoi(\"--1\") -> 0");
	EXPECT(ft_atoi("+-1") == 0, "atoi(\"+-1\") -> 0");
#else
	t->skipped = 1;
#endif
}

static void	test_calloc(t_test *t)
{
#ifdef HAVE_FT_calloc
	char *p = ft_calloc(16, 1);
	EXPECT(p != NULL, "calloc(16,1) must not be NULL");
	if (p)
	{
		for (int i = 0; i < 16; i++)
		{
			EXPECT(p[i] == 0, "calloc must zero-init [%d], got %d", i, p[i]);
			if (t->fails) break;
		}
		free(p);
	}
	/* Subject (page 7): "If nmemb or size is 0, then calloc() returns a
	 * unique pointer value that can later be successfully passed to free()."
	 * This supersedes the man page — it must be non-NULL and freeable. */
	void *q = ft_calloc(0, 0);
	EXPECT(q != NULL,
		"calloc(0,0) must return a non-NULL freeable pointer (subject p.7)");
	free(q);
	void *o = ft_calloc(SIZE_MAX, SIZE_MAX);
	EXPECT(o == NULL, "calloc(SIZE_MAX,SIZE_MAX) must detect overflow and return NULL");
	free(o);
#else
	t->skipped = 1;
#endif
}

static void	test_itoa(t_test *t)
{
#ifdef HAVE_FT_itoa
	int cases[] = { 0, 1, -1, 42, -42, INT_MAX, INT_MIN, 100, -100, 999999 };
	for (size_t i = 0; i < sizeof(cases) / sizeof(cases[0]); i++)
	{
		char ref[16];
		snprintf(ref, sizeof ref, "%d", cases[i]);
		char *r = ft_itoa(cases[i]);
		EXPECT(r && strcmp(r, ref) == 0,
			"itoa(%d): expected \"%s\", got \"%s\"",
			cases[i], ref, r ? r : "(null)");
		free(r);
	}
#else
	t->skipped = 1;
#endif
}

/* ─────────────────────── 42-specific string utils ─────────────────────── */

static void	test_substr(t_test *t)
{
#ifdef HAVE_FT_substr
	char *r;
	r = ft_substr("hello world", 6, 5);
	EXPECT(r && strcmp(r, "world") == 0,
		"substr(\"hello world\",6,5) expected \"world\", got \"%s\"",
		r ? r : "(null)");
	free(r);
	r = ft_substr("hello", 0, 100);
	EXPECT(r && strcmp(r, "hello") == 0, "substr len > rest copies to end");
	free(r);
	r = ft_substr("hello", 100, 5);
	EXPECT(r && strcmp(r, "") == 0, "substr start > len returns empty string");
	free(r);
	r = ft_substr("hello", 0, 0);
	EXPECT(r && strcmp(r, "") == 0, "substr len=0 returns empty string");
	free(r);
	r = ft_substr("", 0, 5);
	EXPECT(r && strcmp(r, "") == 0, "substr empty source returns empty");
	free(r);
#else
	t->skipped = 1;
#endif
}

static void	test_strjoin(t_test *t)
{
#ifdef HAVE_FT_strjoin
	char *r;
	r = ft_strjoin("hello ", "world");
	EXPECT(r && strcmp(r, "hello world") == 0, "strjoin basic");
	free(r);
	r = ft_strjoin("", "");
	EXPECT(r && strcmp(r, "") == 0, "strjoin empty + empty");
	free(r);
	r = ft_strjoin("a", "");
	EXPECT(r && strcmp(r, "a") == 0, "strjoin a + empty");
	free(r);
	r = ft_strjoin("", "b");
	EXPECT(r && strcmp(r, "b") == 0, "strjoin empty + b");
	free(r);
#else
	t->skipped = 1;
#endif
}

static void	test_strtrim(t_test *t)
{
#ifdef HAVE_FT_strtrim
	char *r;
	r = ft_strtrim("  hello  ", " ");
	EXPECT(r && strcmp(r, "hello") == 0,
		"strtrim spaces: expected \"hello\", got \"%s\"", r ? r : "(null)");
	free(r);
	r = ft_strtrim("xxhelloxx", "x");
	EXPECT(r && strcmp(r, "hello") == 0, "strtrim 'x'");
	free(r);
	r = ft_strtrim("abc", "xyz");
	EXPECT(r && strcmp(r, "abc") == 0,
		"strtrim with no match must return a copy of the input");
	free(r);
	r = ft_strtrim("xxxx", "x");
	EXPECT(r && strcmp(r, "") == 0, "strtrim entire string trimmed");
	free(r);
	r = ft_strtrim("", "x");
	EXPECT(r && strcmp(r, "") == 0, "strtrim empty source");
	free(r);
#else
	t->skipped = 1;
#endif
}

static void	free_split(char **r)
{
	if (!r) return;
	for (size_t i = 0; r[i]; i++) free(r[i]);
	free(r);
}

static void	test_split(t_test *t)
{
#ifdef HAVE_FT_split
	char **r = ft_split("hello world foo", ' ');
	EXPECT(r != NULL, "split must not return NULL");
	if (r)
	{
		EXPECT(r[0] && strcmp(r[0], "hello") == 0, "split[0] expected \"hello\"");
		EXPECT(r[1] && strcmp(r[1], "world") == 0, "split[1] expected \"world\"");
		EXPECT(r[2] && strcmp(r[2], "foo") == 0, "split[2] expected \"foo\"");
		EXPECT(r[3] == NULL, "split must terminate the array with NULL");
	}
	free_split(r);

	r = ft_split("", ' ');
	EXPECT(r && r[0] == NULL, "split(\"\",' ') -> {NULL}");
	free_split(r);

	r = ft_split("   ", ' ');
	EXPECT(r && r[0] == NULL, "split with only separators -> {NULL}");
	free_split(r);

	r = ft_split("  hi  there  ", ' ');
	EXPECT(r && r[0] && strcmp(r[0], "hi") == 0,
		"split must skip leading separators");
	if (r)
		EXPECT(r[1] && strcmp(r[1], "there") == 0,
			"split must collapse runs of separators");
	if (r)
		EXPECT(r[2] == NULL, "split must skip trailing separators");
	free_split(r);
#else
	t->skipped = 1;
#endif
}

static char	map_upper(unsigned int i, char c)
{
	(void)i;
	return (char)toupper((unsigned char)c);
}

static char	map_indexor(unsigned int i, char c)
{
	return c + (char)i;
}

static void	test_strmapi(t_test *t)
{
#ifdef HAVE_FT_strmapi
	char *r;
	r = ft_strmapi("hello", map_upper);
	EXPECT(r && strcmp(r, "HELLO") == 0, "strmapi upper-case");
	free(r);
	r = ft_strmapi("aaaa", map_indexor);
	EXPECT(r && strcmp(r, "abcd") == 0,
		"strmapi must pass the index to the callback");
	free(r);
	r = ft_strmapi("", map_upper);
	EXPECT(r && strcmp(r, "") == 0, "strmapi empty");
	free(r);
#else
	t->skipped = 1;
#endif
}

static void	iter_upper(unsigned int i, char *c)
{
	(void)i;
	*c = (char)toupper((unsigned char)*c);
}

static void	test_striteri(t_test *t)
{
#ifdef HAVE_FT_striteri
	char buf[] = "hello";
	ft_striteri(buf, iter_upper);
	EXPECT(strcmp(buf, "HELLO") == 0,
		"striteri upper-cases in place: expected \"HELLO\", got \"%s\"", buf);
#else
	t->skipped = 1;
#endif
}

/* ──────────────────────────── fd writers ──────────────────────────── */

static int	pipe_capture(void (*emit)(int), int fd_arg, char *buf, size_t cap)
{
	int p[2];
	if (pipe(p) < 0) return -1;
	emit(p[1]);
	close(p[1]);
	int n = read(p[0], buf, cap - 1);
	close(p[0]);
	if (n < 0) n = 0;
	buf[n] = 0;
	(void)fd_arg;
	return n;
}

__attribute__((unused)) static char	g_emit_char;
__attribute__((unused)) static const char *g_emit_str;
__attribute__((unused)) static int	g_emit_int;

#ifdef HAVE_FT_putchar_fd
static void	emit_char(int fd) { ft_putchar_fd(g_emit_char, fd); }
#else
static void	emit_char(int fd) { (void)fd; }
#endif
#ifdef HAVE_FT_putstr_fd
static void	emit_str(int fd)  { ft_putstr_fd((char *)g_emit_str, fd); }
#else
static void	emit_str(int fd)  { (void)fd; }
#endif
#ifdef HAVE_FT_putendl_fd
static void	emit_endl(int fd) { ft_putendl_fd((char *)g_emit_str, fd); }
#else
static void	emit_endl(int fd) { (void)fd; }
#endif
#ifdef HAVE_FT_putnbr_fd
static void	emit_nbr(int fd)  { ft_putnbr_fd(g_emit_int, fd); }
#else
static void	emit_nbr(int fd)  { (void)fd; }
#endif

static void	test_putchar_fd(t_test *t)
{
#ifdef HAVE_FT_putchar_fd
	char buf[8];
	g_emit_char = 'A';
	int n = pipe_capture(emit_char, 0, buf, sizeof buf);
	EXPECT(n == 1 && buf[0] == 'A',
		"putchar_fd('A',fd) must write exactly 'A' (got %d bytes \"%s\")", n, buf);
#else
	t->skipped = 1;
#endif
}

static void	test_putstr_fd(t_test *t)
{
#ifdef HAVE_FT_putstr_fd
	char buf[64];
	g_emit_str = "hello";
	int n = pipe_capture(emit_str, 0, buf, sizeof buf);
	EXPECT(n == 5 && strcmp(buf, "hello") == 0,
		"putstr_fd(\"hello\",fd) expected \"hello\", got \"%s\"", buf);
	g_emit_str = "";
	n = pipe_capture(emit_str, 0, buf, sizeof buf);
	EXPECT(n == 0, "putstr_fd(\"\",fd) must write nothing");
#else
	t->skipped = 1;
#endif
}

static void	test_putendl_fd(t_test *t)
{
#ifdef HAVE_FT_putendl_fd
	char buf[64];
	g_emit_str = "hi";
	int n = pipe_capture(emit_endl, 0, buf, sizeof buf);
	EXPECT(n == 3 && strcmp(buf, "hi\n") == 0,
		"putendl_fd(\"hi\",fd) expected \"hi\\n\", got \"%s\"", buf);
#else
	t->skipped = 1;
#endif
}

static void	test_putnbr_fd(t_test *t)
{
#ifdef HAVE_FT_putnbr_fd
	struct {
		int n;
		const char *s;
	} cases[] = {
		{ 0, "0" }, { 42, "42" }, { -42, "-42" },
		{ INT_MAX, "2147483647" },
		{ INT_MIN, "-2147483648" },
	};
	char buf[32];
	for (size_t i = 0; i < sizeof(cases)/sizeof(cases[0]); i++)
	{
		g_emit_int = cases[i].n;
		pipe_capture(emit_nbr, 0, buf, sizeof buf);
		EXPECT(strcmp(buf, cases[i].s) == 0,
			"putnbr_fd(%d): expected \"%s\", got \"%s\"",
			cases[i].n, cases[i].s, buf);
	}
#else
	t->skipped = 1;
#endif
}

/* ──────────────────────────── linked list ──────────────────────────── */

static int	g_del_count;
static int	g_iter_sum;

static void	track_del(void *p) { (void)p; g_del_count++; }
static void	iter_add(void *p) { g_iter_sum += *(int *)p; }
static void	*map_double(void *p)
{
	int *r = (int *)malloc(sizeof(int));
	if (r) *r = *(int *)p * 2;
	return r;
}
static void	free_int(void *p) { free(p); }

#ifdef HAVE_FT_lstnew
static t_list	*build3(int *a, int *b, int *c)
{
	t_list *l = ft_lstnew(a);
	if (!l) return NULL;
	l->next = ft_lstnew(b);
	if (l->next) l->next->next = ft_lstnew(c);
	return l;
}
#else
static t_list	*build3(int *a, int *b, int *c) { (void)a; (void)b; (void)c; return NULL; }
#endif

static void	test_lstnew(t_test *t)
{
#ifdef HAVE_FT_lstnew
	int x = 42;
	t_list *n = ft_lstnew(&x);
	EXPECT(n != NULL, "lstnew must not return NULL");
	if (n)
	{
		EXPECT(n->content == &x, "lstnew must store content pointer as-is");
		EXPECT(n->next == NULL, "lstnew->next must be NULL");
		free(n);
	}
	n = ft_lstnew(NULL);
	EXPECT(n != NULL, "lstnew(NULL) must not return NULL");
	if (n)
	{
		EXPECT(n->content == NULL, "lstnew(NULL)->content must be NULL");
		free(n);
	}
#else
	t->skipped = 1;
#endif
}

static void	test_lstadd_front(t_test *t)
{
#ifdef HAVE_FT_lstadd_front
	t_list *l = NULL;
	int a = 1, b = 2;
	ft_lstadd_front(&l, ft_lstnew(&a));
	EXPECT(l && l->content == &a, "lstadd_front first element");
	ft_lstadd_front(&l, ft_lstnew(&b));
	EXPECT(l && l->content == &b, "lstadd_front must put new node at head");
	EXPECT(l && l->next && l->next->content == &a,
		"lstadd_front must keep old head as next");
	if (l) { free(l->next); free(l); }
#else
	t->skipped = 1;
#endif
}

static void	test_lstsize(t_test *t)
{
#ifdef HAVE_FT_lstsize
	EXPECT(ft_lstsize(NULL) == 0, "lstsize(NULL) must be 0");
	int a = 0, b = 0, c = 0;
	t_list *l = build3(&a, &b, &c);
	EXPECT(ft_lstsize(l) == 3, "lstsize 3-node list");
	ft_lstclear(&l, NULL); /* NULL del — only frees nodes */
	for (t_list *p = l; p;) { t_list *n = p->next; free(p); p = n; }
#else
	t->skipped = 1;
#endif
}

static void	test_lstlast(t_test *t)
{
#ifdef HAVE_FT_lstlast
	EXPECT(ft_lstlast(NULL) == NULL, "lstlast(NULL) must be NULL");
	int a = 0, b = 0, c = 0;
	t_list *l = build3(&a, &b, &c);
	EXPECT(ft_lstlast(l) == l->next->next, "lstlast must return tail");
	if (l) { free(l->next->next); free(l->next); free(l); }
#else
	t->skipped = 1;
#endif
}

static void	test_lstadd_back(t_test *t)
{
#ifdef HAVE_FT_lstadd_back
	t_list *l = NULL;
	int a = 1, b = 2, c = 3;
	ft_lstadd_back(&l, ft_lstnew(&a));
	EXPECT(l && l->content == &a, "lstadd_back to empty list");
	ft_lstadd_back(&l, ft_lstnew(&b));
	EXPECT(l && l->next && l->next->content == &b, "lstadd_back appends");
	ft_lstadd_back(&l, ft_lstnew(&c));
	EXPECT(l && l->next && l->next->next && l->next->next->content == &c,
		"lstadd_back appends third node at the tail");
	EXPECT(l && l->next && l->next->next && l->next->next->next == NULL,
		"lstadd_back must terminate list");
	if (l) { free(l->next->next); free(l->next); free(l); }
#else
	t->skipped = 1;
#endif
}

static void	test_lstdelone(t_test *t)
{
#ifdef HAVE_FT_lstdelone
	int x = 42;
	t_list *n = ft_lstnew(&x);
	g_del_count = 0;
	ft_lstdelone(n, track_del);
	EXPECT(g_del_count == 1, "lstdelone must call del exactly once");
#else
	t->skipped = 1;
#endif
}

static void	test_lstclear(t_test *t)
{
#ifdef HAVE_FT_lstclear
	int a = 1, b = 2, c = 3;
	t_list *l = build3(&a, &b, &c);
	g_del_count = 0;
	ft_lstclear(&l, track_del);
	EXPECT(g_del_count == 3, "lstclear must call del once per node (got %d)", g_del_count);
	EXPECT(l == NULL, "lstclear must set the head pointer to NULL");
#else
	t->skipped = 1;
#endif
}

static void	test_lstiter(t_test *t)
{
#ifdef HAVE_FT_lstiter
	int a = 1, b = 2, c = 3;
	t_list *l = build3(&a, &b, &c);
	g_iter_sum = 0;
	ft_lstiter(l, iter_add);
	EXPECT(g_iter_sum == 6, "lstiter must visit every node (sum 1+2+3=6, got %d)", g_iter_sum);
	if (l) { free(l->next->next); free(l->next); free(l); }
#else
	t->skipped = 1;
#endif
}

static void	test_lstmap(t_test *t)
{
#ifdef HAVE_FT_lstmap
	int a = 1, b = 2, c = 3;
	t_list *l = build3(&a, &b, &c);
	t_list *m = ft_lstmap(l, map_double, free_int);
	EXPECT(m != NULL, "lstmap must not return NULL");
	if (m && m->next && m->next->next)
	{
		EXPECT(*(int *)m->content == 2, "lstmap[0] expected 2");
		EXPECT(*(int *)m->next->content == 4, "lstmap[1] expected 4");
		EXPECT(*(int *)m->next->next->content == 6, "lstmap[2] expected 6");
		EXPECT(m->next->next->next == NULL, "lstmap must terminate the list");
	}
	if (m) ft_lstclear(&m, free_int);
	if (l) { free(l->next->next); free(l->next); free(l); }
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
	{ "ft_isalpha",      test_isalpha },
	{ "ft_isdigit",      test_isdigit },
	{ "ft_isalnum",      test_isalnum },
	{ "ft_isascii",      test_isascii },
	{ "ft_isprint",      test_isprint },
	{ "ft_toupper",      test_toupper },
	{ "ft_tolower",      test_tolower },
	{ "ft_strlen",       test_strlen },
	{ "ft_strchr",       test_strchr },
	{ "ft_strrchr",      test_strrchr },
	{ "ft_strncmp",      test_strncmp },
	{ "ft_strnstr",      test_strnstr },
	{ "ft_strdup",       test_strdup },
	{ "ft_memset",       test_memset },
	{ "ft_bzero",        test_bzero },
	{ "ft_memcpy",       test_memcpy },
	{ "ft_memmove",      test_memmove },
	{ "ft_memchr",       test_memchr },
	{ "ft_memcmp",       test_memcmp },
	{ "ft_strlcpy",      test_strlcpy },
	{ "ft_strlcat",      test_strlcat },
	{ "ft_atoi",         test_atoi },
	{ "ft_calloc",       test_calloc },
	{ "ft_itoa",         test_itoa },
	{ "ft_substr",       test_substr },
	{ "ft_strjoin",      test_strjoin },
	{ "ft_strtrim",      test_strtrim },
	{ "ft_split",        test_split },
	{ "ft_strmapi",      test_strmapi },
	{ "ft_striteri",     test_striteri },
	{ "ft_putchar_fd",   test_putchar_fd },
	{ "ft_putstr_fd",    test_putstr_fd },
	{ "ft_putendl_fd",   test_putendl_fd },
	{ "ft_putnbr_fd",    test_putnbr_fd },
	{ "ft_lstnew",       test_lstnew },
	{ "ft_lstadd_front", test_lstadd_front },
	{ "ft_lstsize",      test_lstsize },
	{ "ft_lstlast",      test_lstlast },
	{ "ft_lstadd_back",  test_lstadd_back },
	{ "ft_lstdelone",    test_lstdelone },
	{ "ft_lstclear",     test_lstclear },
	{ "ft_lstiter",      test_lstiter },
	{ "ft_lstmap",       test_lstmap },
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
		printf("  %-*s %sSKIP%s   %s(not implemented yet)%s\n",
			NAME_W, t->name, c_fail(), c_off(),
			c_dim(), c_off());
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

static int	name_matches(const char *want, const char *full)
{
	if (strcmp(want, full) == 0) return 1;
	if (strncmp(full, "ft_", 3) == 0 && strcmp(want, full + 3) == 0) return 1;
	return 0;
}

static void	usage(const char *p)
{
	fprintf(stderr,
		"usage: %s [--color|--no-color] [--list] [<function>...]\n"
		"  <function> can be 'strlen' or 'ft_strlen'\n"
		"  multiple names run only those tests, in the order listed below\n", p);
}

static int	any_match(const char *full, char **wanted, int n)
{
	for (int i = 0; i < n; i++)
		if (name_matches(wanted[i], full))
			return (1);
	return (0);
}

int	main(int argc, char **argv)
{
	char	*wanted[64];
	int	n_wanted = 0;
	int	list_only = 0;

	g_color = isatty(STDOUT_FILENO);
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
		{ usage(argv[0]); return 0; }
		else if (argv[i][0] == '-')
		{ usage(argv[0]); return 2; }
		else if (n_wanted < (int)(sizeof(wanted) / sizeof(wanted[0])))
			wanted[n_wanted++] = argv[i];
	}

	if (list_only)
	{
		for (size_t i = 0; i < N_TESTS; i++) printf("%s\n", TESTS[i].name);
		return 0;
	}

	int functions_passed = 0, functions_total = 0;
	int functions_skipped = 0;
	int cases_passed = 0, cases_total = 0;

	for (size_t i = 0; i < N_TESTS; i++)
	{
		if (n_wanted > 0 && !any_match(TESTS[i].name, wanted, n_wanted))
			continue;

		t_test t = { TESTS[i].name, 0, 0, "", 0, 0 };
		g_signal = 0;
		if (sigsetjmp(g_jmp, 1) == 0)
			TESTS[i].fn(&t);
		else
			t.crashed = g_signal;
		print_result(&t);

		if (t.skipped) { functions_skipped++; continue; }
		functions_total++;
		if (t.fails == 0 && !t.crashed) functions_passed++;
		cases_total += t.cases;
		cases_passed += t.cases - t.fails;
	}

	if (functions_total == 0)
	{
		if (n_wanted > 0)
			fprintf(stderr, "no tests matched: '%s'%s\n",
				wanted[0], n_wanted > 1 ? " (and others)" : "");
		else if (functions_skipped > 0)
			fprintf(stderr,
				"no functions ready to test — %d skipped (declare prototype in libft.h and add ft_*.c)\n",
				functions_skipped);
		else
			fprintf(stderr, "no tests registered\n");
		return 2;
	}

	int ok = (functions_passed == functions_total);
	int func_fails = functions_total - functions_passed;
	int case_fails = cases_total - cases_passed;
	printf("\n%s────────────────────────────────────────%s\n", c_dim(), c_off());
	if (func_fails > 0)
		printf("  %sFunctions:%s   %s%d%s / %s%d%s passed   %s(%d failed)%s\n",
			c_bold(), c_off(),
			c_pass(), functions_passed, c_off(),
			c_dim(), functions_total, c_off(),
			c_fail(), func_fails, c_off());
	else
		printf("  %sFunctions:%s   %s%d / %d passed%s\n",
			c_bold(), c_off(), c_pass(), functions_passed, functions_total, c_off());
	if (case_fails > 0)
		printf("  %sAssertions:%s  %s%d%s / %s%d%s passed   %s(%d failed)%s\n",
			c_bold(), c_off(),
			c_pass(), cases_passed, c_off(),
			c_dim(), cases_total, c_off(),
			c_fail(), case_fails, c_off());
	else
		printf("  %sAssertions:%s  %s%d / %d passed%s\n",
			c_bold(), c_off(), c_pass(), cases_passed, cases_total, c_off());
	if (functions_skipped > 0)
		printf("  %sSkipped:%s     %s%d%s %s(not implemented yet — declare prototype + add ft_*.c)%s\n",
			c_bold(), c_off(),
			c_fail(), functions_skipped, c_off(),
			c_dim(), c_off());
	printf("  %sResult:%s      %s%s%s\n",
		c_bold(), c_off(),
		ok ? c_pass() : c_fail(),
		ok ? "PASS" : "FAIL",
		c_off());
	return ok ? 0 : 1;
}
