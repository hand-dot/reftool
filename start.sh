#!/bin/bash

# TODO ここから
# 起動できない
echo "Start refactoring2"

echo $(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
echo "-----"

if [ -z "$1" ]; then
  export VITE_PARAM1=$(realpath .)
else
  export VITE_PARAM1=$(realpath $1)
fi

if [ -n "$2" ]; then
  export VITE_PARAM2=$(realpath $2)
fi

node_modules/.bin/vite --open