#!/bin/bash

if [ -z "$1" ]; then
  export VITE_PARAM1=$(realpath .)
else
  export VITE_PARAM1=$(realpath $1)
fi

if [ -n "$2" ]; then
  export VITE_PARAM2=$(realpath $2)
fi

PORT=5840 node build/server.js