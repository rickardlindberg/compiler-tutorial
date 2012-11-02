#!/bin/sh

set -e

# Go to rev to publish
git checkout master
publish_rev=$(git log -1 --oneline)

# Generate _site
./compile.sh

# Move the generated stuff out of repo
TMP_DEST=/tmp/compiler-tutorial-html-export
cp -r "html-export" $TMP_DEST
rm -r "html-export"

# Checkout pages branch and clean it
git checkout gh-pages
git rm -rf .
git clean -f -d -x

# Copy over generated and commit
cp -r $TMP_DEST/* .
git add .
git commit -m "publishing $publish_rev"

# Delete tmp dir
rm -r $TMP_DEST

# Go back to master
git checkout master
