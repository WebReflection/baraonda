#!/usr/bin/env bash

program () {
  local bin="$1"
  if [ -d "node_modules/$bin" ]; then
    bin="$2"
  else
    if [ "$(which $bin)" = "" ]; then
      mkdir -p node_modules
      echo "installing $1"
      npm install $bin >/dev/null 2>&1
      bin="$2"
    fi
  fi
  echo $bin
}

run () {
  local bin="$(program 'watchify' 'node_modules/watchify/bin/cmd.js')"
  $bin src/main.js -o public/js/bundle.max.js -v
}

run
