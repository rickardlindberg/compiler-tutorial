#!/bin/sh
rm -fr html-export
mkdir html-export
cp -r static html-export
cd ~/projects/markdown-wiki/
./run ~/projects/compiler-tutorial/template.html ~/projects/compiler-tutorial/main ~/projects/compiler-tutorial/html-export
