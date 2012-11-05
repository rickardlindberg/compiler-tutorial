#!/bin/sh

OUT_DIR="sketch"

IN_FILE="../scale.con"
OUT_FILE="$OUT_DIR/con_program.cpp"

rm -rf "$OUT_DIR"
mkdir "$OUT_DIR"

runhaskell Main.hs "$IN_FILE" "$OUT_FILE"
cp runtime/* "$OUT_DIR"

abspath() {
    cd "$1" 2>&1 > /dev/null
    pwd
}

arduino $(abspath "$OUT_DIR")/sketch.pde
