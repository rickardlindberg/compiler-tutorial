#!/bin/sh
mkdir -p html-export
cp -r static html-export
cd ~/projects/markdown-wiki/
./run ~/projects/compiler-tutorial/main ~/projects/compiler-tutorial/html-export
