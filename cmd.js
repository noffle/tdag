#! /usr/bin/env node

var fs = require('fs')
var path = require('path')
var args = require('minimist')(process.argv)
var defined = require('defined')
var chalk = require('chalk')

if (args.h || args.help) {
  exit(0)
}

if (args._[2] === 'add' || args._[2] === 'a') {
  var parentId = Number(args._[3])
  var description = args._.slice(4).join(' ')
  if (isNaN(parentId)) {
    parentId = undefined
    description = args._.slice(3).join(' ')
  }

  var db = load()
  var idx = db.idx++
  var task = {
    description: description,
    deps: [],
    state: 'todo'
  }

  if (parentId !== undefined) {
    var parent = db.tasks[parentId]
    parent.deps.push(idx)
  }

  db.tasks[idx] = task
  save(db)

  console.log(idx + ': ' + description)
}

else if (args._[2] === 'ready' || args._[2] === 'r') {
  var db = load()
  var tasks = getTopLevel(db)

  var indent = 0
  tasks.forEach(function (id) {
    printDepTree(db, id, { hideBlocked: true })
  })
}

else if (args._.length === 4 && args._[2] === 'done') {
  var id = args._[3]
  var db = load()
  var task = db.tasks[id]
  var state = getTaskState(db, id)
  if (state === 'ready') {
    task.state = 'done'
    save(db)
  } else {
    console.log('Cannot mark DONE: task is blocked!')
  }
}

else if (args._.length === 4 && args._[2] === 'block') {
  var id = args._[3]
  var db = load()
  var task = db.tasks[id]
  var state = getTaskState(db, id)
  if (state !== 'done') {
    task.state = 'blocked'
    save(db)
  } else {
    console.log('Cannot mark BLOCKED: task is already done!')
  }
}

else if (args._.length === 4 && args._[2] === 'unblock') {
  var id = args._[3]
  var db = load()
  var task = db.tasks[id]
  var state = getTaskState(db, id)
  if (state === 'blocked') {
    task.state = 'todo'
    save(db)
  } else {
    console.log('Cannot mark UNBLOCKED: task isn\'t blocked!')
  }
}

// look up a specific task by its ID
else if (args._.length === 3) {
  var id = args._[2]
  var db = load()
  printDepTree(db, id)
}

// print top-level items
else if (args._.length === 2) {
  var db = load()
  Object.keys(db.tasks).forEach(function (id) {
    var task = db.tasks[id]
    if (getParents(db, id).length === 0) {
      printDepTree(db, id)
    }
  })
}

function exit (code) {
  fs.createReadStream(path.join(__dirname, 'USAGE')).pipe(process.stdout)
  process.stdout.on('end', function () {
    process.exit(code)
  })
}

function load () {
  var file = defined(args.f, args.file, 'todo.json')
  if (fs.existsSync(file)) {
    var db = JSON.parse(fs.readFileSync(file))
    db.index = {}
    db.index.parents = computeParents(db)
    return db
  } else {
    return {
      idx: 0,
      tasks: {}
    }
  }
}

function save (db) {
  var file = defined(args.f, args.file, 'todo.json')
  fs.writeFileSync('todo.json', JSON.stringify(db, null, 2))
}

function computeParents (db) {
  var idx = {}
  Object.keys(db.tasks).forEach(function (id) {
    var task = db.tasks[id]
    if (!idx[id]) idx[id] = []
    task.deps.forEach(function (did) {
      if (!idx[did]) idx[did] = []
      idx[did].push(id)
    })
  })
  return idx
}

function getParents (db, pid) {
  return db.index.parents[pid]
}

function getTopLevel (db) {
  var res = []
  Object.keys(db.tasks).forEach(function (id) {
    var task = db.tasks[id]
    if (getParents(db, id).length === 0) {
      res.push(id)
    }
  })
  return res
}

function whitespace (num) {
  var res = ''
  for (var i=0; i < num; i++) {
    res += ' '
  }
  return res
}

function getTaskState (db, id) {
  var task = db.tasks[id]

  function done (id) {
    return db.tasks[id].state === 'done'
  }

  function readySomewhere (id) {
    var task = db.tasks[id]
    if (task.state === 'done') return false
    else if (task.state === 'blocked') return false
    else if (task.deps.length === 0) return true
    else {
      var states = task.deps.map(function (id) {
        return getTaskState(db, id)
      })
      return states.some((state) => state === 'ready' || state === 'semi-ready')
    }
  }

  if (task.state === 'blocked') {
    return 'blocked'
  } else if (task.state === 'todo' && task.deps.every(done)) {
    return 'ready'
  } else if (readySomewhere(id)) {
    return 'semi-ready'
  } else if (task.state === 'todo' && !task.deps.every(done)) {
    return 'blocked'
  } else if (task.state === 'done') {
    return 'done'
  } else {
    oops(1)
  }
}

function getStateSymbol (state) {
  if (state === 'ready') return chalk.green('»')
  else if (state === 'semi-ready') return chalk.bold.yellow('°')
  else if (state === 'done') return chalk.gray('✓')
  else if (state === 'blocked') return chalk.red('✖')
  else oops(2)
}

function getStateTextColorFn (state) {
  if (state === 'ready') return chalk.bold.green
  else if (state === 'semi-ready') return chalk.yellow
  else if (state === 'done') return chalk.gray
  else if (state === 'blocked') return chalk.bold.red
  else oops(3)
}

function oops (id) {
  throw new Error('oops, I did not consider this case! fix me! id = ' + id)
}

function printDepTree (db, id, opts) {
  opts = opts || {}

  var indent = 0
  print(id)

  function print (id) {
    var task = db.tasks[id]
    var state = getTaskState(db, id)

    if (state === 'done') {
      return
    }
    if (opts.hideBlocked && state === 'blocked') {
      return
    }

    var sigil = getStateSymbol(state)
    var text = getStateTextColorFn(state)(task.description)
    var padding = 4 - String(id).length
    console.log(whitespace(indent) + id + whitespace(padding) + sigil + ' ' + text)
    var origIndent = indent + 2
    task.deps.forEach(function (id) {
      indent = origIndent
      print(id)
    })
  }
}

