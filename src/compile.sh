#!/bin/sh

OUT_DIR="sketch"

IN_FILE="../scale.con"
OUT_FILE="$OUT_DIR/con_program.c"

rm -r "$OUT_DIR"
mkdir "$OUT_DIR"

runhaskell Main.hs "$IN_FILE" "$OUT_FILE"
cp runtime/* "$OUT_DIR"
