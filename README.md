# obsiflow

This package is a generate template for [Obsidian](https://obsidian.md)

[![NPM version][npm-image]][npm-url]

## Features

- Generate daily/weekly/empty template for Obsidian
- Statistical weekly tasks or year tasks

## Install
```shell
npm install -g ninesh
```

## shell
 $ ninesh obsiflow [options]

-v, --version            Display version number
-d, --daily              Generate daily plan template
-w, --weekly             Generate weekly plan template
-e, --empty              Generate empty template
-t, --task               Generate daily plan template
-n, --next               Generate daily plan template
-q, --quiet              Quiet mode
-v, --version <version>  Target version
-h, --help               Display this message

## Demo
$ ninesh obsiflow -d

![obsiflow-daily.png](https://raw.githubusercontent.com/ajiu9/shell/main/static/img/obsiflow-daily.png)

$ ninesh obsiflow -w
![obsiflow-weekly.png](https://raw.githubusercontent.com/ajiu9/shell/main/static/img/obsiflow-weekly.png)

$ ninesh obsiflow -t -w
![obsiflow-task-weekly.png](https://raw.githubusercontent.com/ajiu9/shell/main/static/img/obsiflow-task-weekly.png)

[npm-image]: https://img.shields.io/npm/v/obsiflow.svg?style=flat-square
[npm-url]: https://npmjs.com/package/obsiflow
