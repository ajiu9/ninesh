# Ninesh

[![NPM version][npm-image]][npm-url]

## Features

- Generate daily/weekly/empty template for [Obsidian](https://obsidian.md)
- Statistical weekly tasks or year tasks
- Add common zsh plugins

## Install
```shell
npm install -g ninesh
```

## Shell
Usage: ninesh [-v | --version] [-h | --help] <command> [<args>]

Commands:

  - `ninesh obsidian [options]`  Obsidian plugin, Genarate Obsidian template(see also: ninesh obsidian help)
  - `ninesh init [options]`      Add common zsh plugins, customize zsh config
  - `ninesh add [options]`  Manage repository easily

Init zsh plugin (see also:  ninesh init help)
  - `init`          Add common zsh plugins, customize zsh config

For more information on a specific command, run:
  - `ninesh help <command>`

## Manage repository
$ ninesh add [options]

- Add repository to $BASE/[github.com|gitlab.com|...]/you-project

provide a structure making it easy
```
$BASE
|- github.com
|  `- popomore
|     `- ninesh
`- gitlab.com
   `- popomore
      `- ninesh
```

## Generate Obsidian template

$ ninesh obsidian [options]

  - -v, --version            Display version number
  - -d, --daily              Generate daily plan template
  - -w, --weekly             Generate weekly plan template
  - -e, --empty              Generate empty template
  - -t, --task               Generate daily plan template
  - -n, --next               Generate daily plan template
  - -q, --quiet              Quiet mode
  - -v, --version <version>  Target version

$ ninesh obsidian -d

![obsiflow-daily.png](https://raw.githubusercontent.com/ajiu9/shell/main/static/img/obsiflow-daily.png)

$ ninesh obsidian -w
![obsiflow-weekly.png](https://raw.githubusercontent.com/ajiu9/shell/main/static/img/obsiflow-weekly.png)

$ ninesh obsidian -t -w
![obsiflow-task-weekly.png](https://raw.githubusercontent.com/ajiu9/shell/main/static/img/obsiflow-task-weekly.png)

[npm-image]: https://img.shields.io/npm/v/ninesh.svg?style=flat-square
[npm-url]: https://npmjs.com/package/ninesh
