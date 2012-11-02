#!/bin/sh
OUT_DIR="con_sketch"

IN_FILE="$1"
OUT_FILE="$OUT_DIR/$(basename $1).c"

rm -r "$OUT_DIR"
mkdir "$OUT_DIR"

runhaskell Main.hs "$IN_FILE" "$OUT_FILE"
cp runtime/* "$OUT_DIR"
