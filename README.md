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

Init zsh plugin (see also:  ninesh init help)
  - `init`          Add common zsh plugins, customize zsh config

For more information on a specific command, run:
  - `ninesh help <command>`

## Generate Obsidian template

$ ninesh obsiflow [options]

  - -v, --version            Display version number
  - -d, --daily              Generate daily plan template
  - -w, --weekly             Generate weekly plan template
  - -e, --empty              Generate empty template
  - -t, --task               Generate daily plan template
  - -n, --next               Generate daily plan template
  - -q, --quiet              Quiet mode
  - -v, --version <version>  Target version

$ ninesh obsiflow -d

![obsiflow-daily.png](https://raw.githubusercontent.com/ajiu9/shell/main/static/img/obsiflow-daily.png)

$ ninesh obsiflow -w
![obsiflow-weekly.png](https://raw.githubusercontent.com/ajiu9/shell/main/static/img/obsiflow-weekly.png)

$ ninesh obsiflow -t -w
![obsiflow-task-weekly.png](https://raw.githubusercontent.com/ajiu9/shell/main/static/img/obsiflow-task-weekly.png)

[npm-image]: https://img.shields.io/npm/v/ninesh.svg?style=flat-square
[npm-url]: https://npmjs.com/package/ninesh
