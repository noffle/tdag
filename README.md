# tdag

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Manage tasks as a directed acyclic graph. Hardcore mode!

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)

## Background

So many task management systems structure tasks as lists, or, in the better
case, as trees. However, neither accurately captures the aspect of multiple
parents. What we really need is a *directed acyclic graph* (DAG) to express the
more complex relationships that tasks tend to have.

I like modeling my problems as potentially deep graphs that capture the
top-level problem statement, all the way down to the discrete concrete tasks I
need to do to work up one level of abstraction to the next layer of tasks.
Oftentimes completing one task ought to free up multiple tasks all over my task
set, which a graph captures well.

tdag offers the `tg` command, which provides quick command line access to your
task graph. `tg` wants to be really good at understanding task blockages and
dependencies, in order to excel at answering the question, "What things can I
work on *now*?".

## Install

```
npm install -g tdag
```

## Usage

```
USAGE: tg

  tg
    lists this help

  tg add "fix hyperlog dataset issues"
    insert task at root

  tg add ID "regen waoroni log /wo corruption"
    add task that is a dependency of todo #ID

  tg ID
    print the dependency tree rooted at ID

  tg query
    print all top-level tasks

  tg ready
    print all tasks that are ready to be worked on

  tg done ID
    mark a task as done

```

## Contribute

PRs gladly accepted! [Open an issue](https://github.com/RichardLitt/standard-readme/issues/new) or submit PRs.

tdag follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

## License

MIT © Stephen Whitmore