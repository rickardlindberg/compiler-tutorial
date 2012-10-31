#!/bin/sh

set -e

# Go to rev to publish
git checkout master
publish_rev=$(git log -1 --oneline)

# Generate _site
./compile.sh

# Move the generated stuff out of repo
TMP_DEST=/tmp/compiler-tutorial-html-export
mv "html-export" $TMP_DEST

# Checkout pages branch and clean it
git checkout gh-pages
git rm -rf .

# Copy over generated and commit
mv $TMP_DEST/* .
git add .
git commit -m "publishing $publish_rev"

# Delete tmp dir
rmdir $TMP_DEST

# Go back to master
git checkout master
