# 42-cli

Interactive tester CLI for the 42 Common Core. Runs subject-compliance checks, the libft tester, and norminette from a single menu.

THIS TESTER IS ON BETA, IF ANY BUG IS FOUND PLEASE SEND A MESSAGE TO gomez2680 ON DISCORD IN ORDER FOR THE BUG TO BE REMOVED!!! :))))

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/brunogo25/42-cli/main/install.sh | bash
```

Re-run the same command to upgrade.

Requires Node.js 18+.

### Alternatives

```sh
npm install -g github:brunogo25/42-cli
```

Or clone and link:

```sh
git clone https://github.com/brunogo25/42-cli.git ~/.42-cli
ln -s ~/.42-cli/bin/42.js ~/.local/bin/42
```

## Usage

```sh
42
```

Pick a project from the menu. From inside a libft directory, the CLI auto-detects the project.

## Uninstall

```sh
rm -f ~/.local/bin/42
rm -rf ~/.local/share/42-cli
```

## License

MIT
