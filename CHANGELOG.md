# Changelog

## 0.1.7 — 2026-04-29

### Added
- Subject compliance now flags `.o` and `.a` build artifacts at the submission root with a clear *"run `make fclean` before submitting"* hint. Previously these were silently ignored even though they shouldn't be pushed.

## 0.1.6 — 2026-04-29

### Added
- `ft_split` (and the rest of the libft tester) now compiles with **AddressSanitizer**. Heap-buffer-overflows, use-after-frees and similar memory bugs surface as a clear `file:line` diagnostic instead of silently passing on macOS or producing misleading "wrong content" failures on Linux.
- New "memory error" banner in the test summary that pulls the violation type, function and source location out of the ASan report.

### Changed
- The student's libft is rebuilt from scratch under ASan whenever the tester runs, so memory bugs are caught at the original allocation/write site.

## 0.1.5 — 2026-04-28

### Added
- Subject compliance now checks that the **first paragraph of the README is in italic** (the student presentation paragraph). Submissions without a README, or with a plain/bold intro, are flagged. Wrap the intro in `*…*` or `_…_` to pass.
