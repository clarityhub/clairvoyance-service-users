#!/bin/bash

set -e

yarn install --no-progress > /dev/null

if [ -z "$SKIP_MIGRATIONS" ]; then
  yarn run migrate:up > /dev/null
  yarn run migrate:up:test > /dev/null
fi

yarn start
