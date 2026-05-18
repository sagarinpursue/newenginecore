#!/bin/bash

SOURCE_DIR="../lambda-functions" 
TARGET_DIR="./lambda-dist"

CHANGED_FILES=$(rsync -av --delete --exclude-from='exclude.txt' --itemize-changes "$SOURCE_DIR"/* "$TARGET_DIR"/ | awk '{print $NF}')

for file in $CHANGED_FILES; do
  if [[ "$(basename "$file")" == "package.json" ]]; then
    dir=$(dirname "$file")
    echo "📦 package.json changed → Run npm install in $dir"
    (cd "$TARGET_DIR/$dir" && npm i --omit=dev --silent)
  fi
done