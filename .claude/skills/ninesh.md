# ninesh

Help developers work with the ninesh CLI tool for Obsidian template generation, shell configuration, and repository management.

## Trigger

TRIGGER when: user asks about Obsidian templates, daily/weekly notes, shell configuration, zsh/bash/fish plugins, repository management, or when code references `ninesh`, `obsidian-run`, `zsh-run`, `project-run`, or `shell-run`.

DO NOT TRIGGER when: user asks about other note-taking apps, other shell tools, or unrelated topics.

## Description

Ninesh is a CLI tool (`ninesh`) that provides four main functionalities:

### 1. Obsidian Template Generation
Generate templates for Obsidian note-taking:
- `ninesh obsidian -d` - Generate daily plan template
- `ninesh obsidian -w` - Generate weekly plan template
- `ninesh obsidian -e` - Generate empty template
- `ninesh obsidian -t weekly|yearly` - Generate task template
- `ninesh obsidian -n` - Generate template for next day/week

Configuration stored at `~/.ninesh/.obsidian/config.json` with template and target paths.

### 2. Shell Detection & Configuration
Auto-detect system default shell and configure:
- `ninesh shell` - Show current shell info
- `ninesh shell list` - List installed shells
- `ninesh shell switch <name>` - Switch default shell
- `ninesh shell install <name>` - Install a new shell
- `ninesh shell config` - Configure current shell with plugins

Supported shells: bash, zsh, fish, dash, sh

### 3. Zsh Configuration
Manage zsh plugins and configuration:
- `ninesh init -z` - Add custom zsh plugins
- `ninesh init -o` - Add oh-my-zsh plugins (zsh-autosuggestions, zsh-completions, fast-syntax-highlighting)
- `ninesh init -s` - Add starship theme
- `ninesh init -n` - Add ninesh aliases (n, na, no, ni)

### 4. Repository Management
Clone and organize repositories:
- `ninesh add <repo-url>` - Clone repo to organized directory structure
- Supports aliases like `github://ajiu9/ninesh` → `https://github.com/ajiu9/ninesh.git`
- Creates structured paths: `$BASE/github.com/owner/repo`

Configuration stored at `~/.ninesh/config.json`.

## Key Files

- `src/cli/index.ts` - Main CLI entry point with yargs commands
- `src/app/shell/index.ts` - Shell detection and configuration
- `src/app/shell/detect.ts` - Shell detection logic
- `src/app/shell/plugins/bash.ts` - Bash plugin configuration
- `src/app/shell/plugins/fish.ts` - Fish plugin configuration
- `src/app/obsidian/run.ts` - Obsidian template generation logic
- `src/app/zsh/run.ts` - Zsh configuration management
- `src/app/project/run.ts` - Repository cloning and management
- `src/constants.ts` - Shared constants (paths, package info)

## Development

```bash
# Build
pnpm build

# Development (build + global link)
pnpm dev

# Run directly
pnpm start

# Lint
pnpm lint

# Type check
pnpm check
```

## Configuration

- Base config: `~/.ninesh/config.json`
- Shell config: `~/.ninesh/shell.json`
- Obsidian config: `~/.ninesh/.obsidian/config.json`

Config includes:
- `base`: Array of base directories for repos
- `hooks`: Custom hooks
- `alias`: URL aliases for repos
- `shell`: Shell configuration (defaultShell, installedShells, lastChecked)
