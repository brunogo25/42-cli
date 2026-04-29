#!/usr/bin/env bash
# 42-cli installer
# Usage: curl -fsSL https://raw.githubusercontent.com/brunogo25/42-cli/main/install.sh | bash

set -euo pipefail

REPO="brunogo25/42-cli"
BRANCH="main"
INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/42-cli"
# Both names point at the same script — use whichever you prefer.
BIN_NAMES=("42" "42cli")

red()    { printf '\033[31m%s\033[0m\n' "$*"; }
green()  { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
dim()    { printf '\033[2m%s\033[0m\n' "$*"; }

# 1. Node check
if ! command -v node >/dev/null 2>&1; then
  red "node is not installed."
  echo "Install Node.js 18+ first: https://nodejs.org/ (or use nvm: https://github.com/nvm-sh/nvm)"
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  red "node $NODE_MAJOR is too old — need Node 18 or newer."
  exit 1
fi

# 2. Pick a writable bin dir on PATH
pick_bin_dir() {
  local candidates=("$HOME/.local/bin" "/usr/local/bin")
  for d in "${candidates[@]}"; do
    case ":$PATH:" in *":$d:"*)
      if [ -w "$d" ] || { [ ! -e "$d" ] && mkdir -p "$d" 2>/dev/null; }; then
        echo "$d"; return 0
      fi
    ;; esac
  done
  # fall back to ~/.local/bin even if not on PATH
  mkdir -p "$HOME/.local/bin"
  echo "$HOME/.local/bin"
}

BIN_DIR="$(pick_bin_dir)"

# 3. Download tarball
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading 42-cli from github.com/$REPO ..."
curl -fsSL "https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz" -o "$TMP/src.tar.gz"

# 4. Replace install dir
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
tar -xzf "$TMP/src.tar.gz" -C "$INSTALL_DIR" --strip-components=1

# 5. Symlinks — install both `42` and `42cli` so users can launch with either.
ENTRY="$INSTALL_DIR/bin/42.js"
chmod +x "$ENTRY"
for name in "${BIN_NAMES[@]}"; do
  ln -sf "$ENTRY" "$BIN_DIR/$name"
done

green "42-cli installed."
dim   "  source:    $INSTALL_DIR"
dim   "  symlinks:  $(printf '%s ' "${BIN_NAMES[@]/#/$BIN_DIR/}")"

# 6. PATH hint if needed
case ":$PATH:" in *":$BIN_DIR:"*) ;; *)
  yellow "Note: $BIN_DIR is not on your PATH. Add this to your shell rc:"
  echo "  export PATH=\"$BIN_DIR:\$PATH\""
;; esac

echo ""
echo "Run:  ${BIN_NAMES[0]}   (or: ${BIN_NAMES[1]})"
